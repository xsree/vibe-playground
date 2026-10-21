// Interactive lifecycle for the multi-pass WebGPU black-hole renderer.

import type { Frame, Gpu, Surface } from 'vgpu'

type VgpuApi = typeof import('vgpu')

import {
  createEffects,
  createTargets,
  destroyTargets,
  prewarm,
  renderChain,
  setBakeUniforms,
  setBindings,
  setPostUniforms,
  setShadeUniforms,
  type Effects,
  type Targets,
} from './pipeline'
import { defaultHeroSettings } from './settings'

const MAX_RENDER_PIXELS = 1_180_000
const MIN_PITCH = -1.535
const MAX_PITCH = 1.535
const MIN_DISTANCE = 7.2
const MAX_DISTANCE = 22
const DRAG_RADIANS_PER_PIXEL = 0.0055
const INTERACTIVE_BAKE_INTERVAL_MS = 42

export interface ViewState {
  yaw: number
  pitch: number
  distance: number
}

export interface RendererCallbacks {
  onViewChange: (state: ViewState) => void
  onInteracting: (active: boolean) => void
  onReady?: () => void
  onError?: (message: string) => void
}

interface RendererOptions extends RendererCallbacks {
  canvas: HTMLCanvasElement
}

type RenderSize = { width: number; height: number }

export function createRenderer({
  canvas,
  onViewChange,
  onInteracting,
  onReady,
  onError,
}: RendererOptions) {
  const settings = defaultHeroSettings()
  const initialView: ViewState = {
    yaw: settings.cameraYaw,
    pitch: settings.cameraY,
    distance: settings.distance,
  }

  let disposed = false
  let started = false
  let visible = !document.hidden
  let intersecting = true
  let dragging = false
  let pointerId: number | null = null
  let lastPointerX = 0
  let lastPointerY = 0
  let animationTime = 0
  let lastFrameAt: number | undefined
  let lastBakeAt: number | undefined
  let forceBake = true
  let resizeFrame = 0
  let pendingSize: RenderSize | undefined

  let api: VgpuApi | undefined
  let gpu: Gpu | undefined
  let surface: Surface | undefined
  let effects: Effects | undefined
  let targets: Targets | undefined
  let raf = 0
  let resizeObserver: ResizeObserver | undefined
  let intersectionObserver: IntersectionObserver | undefined

  const currentView = (): ViewState => ({
    yaw: settings.cameraYaw,
    pitch: settings.cameraY,
    distance: settings.distance,
  })

  const reportView = () => onViewChange(currentView())

  const applyResponsiveLayout = (width: number) => {
    const compact = width < 760
    settings.centerX = compact ? 0 : 0.34
    settings.centerY = compact ? -0.08 : 0.12
    settings.cameraRoll = compact ? 0 : -0.05
    settings.centerFade = 0
  }

  const markCameraDirty = () => {
    forceBake = true
    reportView()
  }

  const setInteraction = (active: boolean) => {
    if (dragging === active) return
    dragging = active
    onInteracting(active)
  }

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return
    pointerId = event.pointerId
    lastPointerX = event.clientX
    lastPointerY = event.clientY
    canvas.setPointerCapture(event.pointerId)
    canvas.focus({ preventScroll: true })
    setInteraction(true)
  }

  const onPointerMove = (event: PointerEvent) => {
    if (!dragging || event.pointerId !== pointerId) return
    const dx = event.clientX - lastPointerX
    const dy = event.clientY - lastPointerY
    lastPointerX = event.clientX
    lastPointerY = event.clientY
    settings.cameraYaw -= dx * DRAG_RADIANS_PER_PIXEL
    settings.cameraY = clamp(
      settings.cameraY + dy * DRAG_RADIANS_PER_PIXEL,
      MIN_PITCH,
      MAX_PITCH,
    )
    markCameraDirty()
  }

  const endPointer = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) return
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
    pointerId = null
    setInteraction(false)
    forceBake = true
  }

  const onWheel = (event: WheelEvent) => {
    event.preventDefault()
    settings.distance = clamp(
      settings.distance * Math.exp(event.deltaY * 0.0008),
      MIN_DISTANCE,
      MAX_DISTANCE,
    )
    markCameraDirty()
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const angleStep = event.shiftKey ? 0.16 : 0.06
    let changed = true
    if (event.key === 'ArrowLeft') settings.cameraYaw += angleStep
    else if (event.key === 'ArrowRight') settings.cameraYaw -= angleStep
    else if (event.key === 'ArrowUp') settings.cameraY = clamp(settings.cameraY - angleStep, MIN_PITCH, MAX_PITCH)
    else if (event.key === 'ArrowDown') settings.cameraY = clamp(settings.cameraY + angleStep, MIN_PITCH, MAX_PITCH)
    else if (event.key === '+' || event.key === '=') settings.distance = clamp(settings.distance * 0.92, MIN_DISTANCE, MAX_DISTANCE)
    else if (event.key === '-' || event.key === '_') settings.distance = clamp(settings.distance * 1.08, MIN_DISTANCE, MAX_DISTANCE)
    else changed = false
    if (changed) {
      event.preventDefault()
      markCameraDirty()
    }
  }

  const onVisibilityChange = () => {
    visible = !document.hidden
    reconcileLoop()
  }

  const bindEvents = () => {
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', endPointer)
    canvas.addEventListener('pointercancel', endPointer)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('keydown', onKeyDown)
    document.addEventListener('visibilitychange', onVisibilityChange)
  }

  const unbindEvents = () => {
    canvas.removeEventListener('pointerdown', onPointerDown)
    canvas.removeEventListener('pointermove', onPointerMove)
    canvas.removeEventListener('pointerup', endPointer)
    canvas.removeEventListener('pointercancel', endPointer)
    canvas.removeEventListener('wheel', onWheel)
    canvas.removeEventListener('keydown', onKeyDown)
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }

  const renderFrame = (frame: Frame) => {
    if (disposed || !effects || !targets || !surface) return
    const now = performance.now()
    const bakeDue =
      forceBake &&
      (!dragging || lastBakeAt === undefined || now - lastBakeAt >= INTERACTIVE_BAKE_INTERVAL_MS)
    if (bakeDue) {
      forceBake = false
      lastBakeAt = now
      setBakeUniforms(effects, targets, settings)
    }
    animationTime += lastFrameAt === undefined ? 0 : Math.min((now - lastFrameAt) / 1000, 0.1)
    lastFrameAt = now
    setShadeUniforms(effects, targets, settings, animationTime, 0)
    renderChain(frame, effects, targets, surface, bakeDue)
  }

  const tick = () => {
    raf = 0
    if (disposed || !started || !visible || !intersecting || !api || !gpu) return
    try {
      api.frame(gpu, renderFrame)
    } catch (error) {
      fail(error)
      return
    }
    raf = requestAnimationFrame(tick)
  }

  const reconcileLoop = () => {
    const shouldRun = started && visible && intersecting && !disposed
    if (shouldRun && !raf) {
      lastFrameAt = undefined
      raf = requestAnimationFrame(tick)
    } else if (!shouldRun && raf) {
      cancelAnimationFrame(raf)
      raf = 0
    }
  }

  const targetSize = (size: RenderSize): readonly [number, number] => {
    const width = Math.max(1, size.width)
    const height = Math.max(1, size.height)
    const scale = Math.min(1, Math.sqrt(MAX_RENDER_PIXELS / (width * height)))
    return [Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale))]
  }

  const applyResize = () => {
    resizeFrame = 0
    const size = pendingSize
    pendingSize = undefined
    if (disposed || !size || !gpu || !api || !effects || !targets) return
    try {
      applyResponsiveLayout(size.width)
      const nextSize = targetSize(size)
      if (targets.gbuffer.size[0] === nextSize[0] && targets.gbuffer.size[1] === nextSize[1]) {
        forceBake = true
        return
      }
      const previous = targets
      const next = createTargets(api, gpu, nextSize)
      try {
        setBindings(effects, next)
        setPostUniforms(effects, next, settings)
      } catch (error) {
        destroyTargets(next)
        throw error
      }
      targets = next
      destroyTargets(previous)
      forceBake = true
    } catch (error) {
      fail(error)
    }
  }

  const resize = () => {
    const size = { width: canvas.clientWidth, height: canvas.clientHeight }
    if (size.width <= 0 || size.height <= 0) return
    pendingSize = size
    if (!resizeFrame) resizeFrame = requestAnimationFrame(applyResize)
  }

  const initialize = async () => {
    if (!('gpu' in navigator)) throw new Error('当前浏览器未启用 WebGPU，无法运行高质量黑洞渲染。')
    const vgpu = await import('vgpu')
    if (disposed) return
    const nextGpu = await vgpu.init()
    if (disposed) {
      nextGpu.dispose()
      return
    }
    api = vgpu
    gpu = nextGpu
    surface = vgpu.surface(gpu, canvas, { dpr: 1 })
    effects = createEffects(vgpu, gpu)
    applyResponsiveLayout(canvas.clientWidth)
    targets = createTargets(vgpu, gpu, targetSize({ width: canvas.clientWidth, height: canvas.clientHeight }))
    setBindings(effects, targets)
    setPostUniforms(effects, targets, settings)
    await prewarm(effects, targets, surface)
    if (disposed) return

    bindEvents()
    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    if (typeof IntersectionObserver !== 'undefined') {
      intersectionObserver = new IntersectionObserver((entries) => {
        intersecting = entries.at(-1)?.isIntersecting ?? intersecting
        reconcileLoop()
      })
      intersectionObserver.observe(canvas)
    }
    started = true
    reportView()
    onReady?.()
    resize()
    reconcileLoop()
  }

  const reset = () => {
    settings.cameraYaw = initialView.yaw
    settings.cameraY = initialView.pitch
    settings.distance = initialView.distance
    markCameraDirty()
  }

  const dispose = () => {
    if (disposed) return
    disposed = true
    if (raf) cancelAnimationFrame(raf)
    if (resizeFrame) cancelAnimationFrame(resizeFrame)
    resizeObserver?.disconnect()
    intersectionObserver?.disconnect()
    unbindEvents()
    gpu?.dispose()
  }

  const fail = (error: unknown) => {
    const message = error instanceof Error ? error.message : 'WebGPU 渲染器初始化失败。'
    onError?.(message)
    dispose()
  }

  const ready = initialize().catch(fail)
  return { ready, reset, dispose }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
