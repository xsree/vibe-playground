import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { PointerEvent, WheelEvent } from 'react'
import type { IdentifiedDetectionObject, ImageAsset } from '../types/detection'
import { normalizedToPixelBBox } from '../utils/bbox'
import { BoundingBoxOverlay } from './BoundingBoxOverlay'
import { ViewerToolbar } from './ViewerToolbar'

const MIN_ZOOM = 0.1
const MAX_ZOOM = 8
const VIEWPORT_PADDING = 28

interface Transform {
  zoom: number
  x: number
  y: number
}

interface ImageViewerProps {
  image: ImageAsset | null
  objects: IdentifiedDetectionObject[]
  hasDetectionResult: boolean
  selectedId: string | null
  hoveredId: string | null
  showBoxes: boolean
  showLabels: boolean
  showConfidence: boolean
  resetKey: number
  focusRequestKey: number
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value))
}

export function ImageViewer(props: ImageViewerProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ pointerId: number; x: number; y: number } | null>(null)
  const spacePressedRef = useRef(false)
  const [isDragging, setIsDragging] = useState(false)
  const [transform, setTransform] = useState<Transform>({ zoom: 1, x: 0, y: 0 })

  const fitToViewport = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport || !props.image) return
    const availableWidth = Math.max(1, viewport.clientWidth - VIEWPORT_PADDING * 2)
    const availableHeight = Math.max(1, viewport.clientHeight - VIEWPORT_PADDING * 2)
    const zoom = clampZoom(Math.min(availableWidth / props.image.width, availableHeight / props.image.height))
    setTransform({
      zoom,
      x: (viewport.clientWidth - props.image.width * zoom) / 2,
      y: (viewport.clientHeight - props.image.height * zoom) / 2,
    })
  }, [props.image])

  useLayoutEffect(() => {
    if (!props.image) return
    fitToViewport()
  }, [fitToViewport, props.image, props.resetKey])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const observer = new ResizeObserver(() => {
      if (props.image) fitToViewport()
    })
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [fitToViewport, props.image])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (target?.matches('input, textarea, button, select')) return
      if (event.code === 'Space') {
        event.preventDefault()
        spacePressedRef.current = true
        viewportRef.current?.classList.add('is-pan-ready')
      }
    }
    function handleKeyUp(event: KeyboardEvent) {
      if (event.code === 'Space') {
        spacePressedRef.current = false
        viewportRef.current?.classList.remove('is-pan-ready')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useEffect(() => {
    if (!props.image || !props.selectedId || !props.focusRequestKey) return
    const selected = props.objects.find((object) => object.id === props.selectedId)
    const viewport = viewportRef.current
    if (!selected || !viewport) return
    const [xmin, ymin, xmax, ymax] = normalizedToPixelBBox(selected.bbox, props.image)
    const centerX = (xmin + xmax) / 2
    const centerY = (ymin + ymax) / 2
    setTransform((current) => ({
      ...current,
      x: viewport.clientWidth / 2 - centerX * current.zoom,
      y: viewport.clientHeight / 2 - centerY * current.zoom,
    }))
  }, [props.focusRequestKey, props.image, props.objects, props.selectedId])

  function zoomAt(nextZoomValue: number, clientX?: number, clientY?: number) {
    const viewport = viewportRef.current
    if (!viewport || !props.image) return
    const rect = viewport.getBoundingClientRect()
    const pointX = clientX === undefined ? viewport.clientWidth / 2 : clientX - rect.left
    const pointY = clientY === undefined ? viewport.clientHeight / 2 : clientY - rect.top
    setTransform((current) => {
      const nextZoom = clampZoom(nextZoomValue)
      const imageX = (pointX - current.x) / current.zoom
      const imageY = (pointY - current.y) / current.zoom
      return {
        zoom: nextZoom,
        x: pointX - imageX * nextZoom,
        y: pointY - imageY * nextZoom,
      }
    })
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    if (!props.image) return
    event.preventDefault()
    const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12
    zoomAt(transform.zoom * factor, event.clientX, event.clientY)
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    const canPan = event.button === 1 || (event.button === 0 && spacePressedRef.current)
    if (!canPan || !props.image) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY }
    setIsDragging(true)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const deltaX = event.clientX - drag.x
    const deltaY = event.clientY - drag.y
    dragRef.current = { ...drag, x: event.clientX, y: event.clientY }
    setTransform((current) => ({ ...current, x: current.x + deltaX, y: current.y + deltaY }))
  }

  function stopDragging(event: PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return
    dragRef.current = null
    setIsDragging(false)
  }

  function actualSize() {
    const viewport = viewportRef.current
    if (!viewport || !props.image) return
    setTransform({
      zoom: 1,
      x: (viewport.clientWidth - props.image.width) / 2,
      y: (viewport.clientHeight - props.image.height) / 2,
    })
  }

  return (
    <section className="viewer-shell" aria-label="Image viewer">
      <div
        ref={viewportRef}
        className={`viewer-viewport ${isDragging ? 'is-dragging' : ''}`}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
      >
        <div className="viewer-grid" aria-hidden="true" />
        {!props.image ? (
          <div className="viewer-empty-state">
            <span className="empty-icon" aria-hidden="true">⌗</span>
            <h2>Upload a P&amp;ID / PFD image to begin</h2>
            <p>Your drawing stays on this device.</p>
          </div>
        ) : (
          <>
            <div
              className="image-stage"
              style={{
                width: props.image.width,
                height: props.image.height,
                transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.zoom})`,
              }}
            >
              <img
                src={props.image.url}
                alt={`Engineering drawing ${props.image.fileName}`}
                width={props.image.width}
                height={props.image.height}
                draggable={false}
              />
              <BoundingBoxOverlay
                width={props.image.width}
                height={props.image.height}
                objects={props.objects}
                selectedId={props.selectedId}
                hoveredId={props.hoveredId}
                showBoxes={props.showBoxes}
                showLabels={props.showLabels}
                showConfidence={props.showConfidence}
                zoom={transform.zoom}
                onSelect={props.onSelect}
                onHover={props.onHover}
              />
            </div>
            {!props.hasDetectionResult && (
              <div className="viewer-notice">Paste or upload bounding box JSON</div>
            )}
          </>
        )}
      </div>
      <ViewerToolbar
        zoom={transform.zoom}
        onZoomOut={() => zoomAt(transform.zoom / 1.25)}
        onZoomIn={() => zoomAt(transform.zoom * 1.25)}
        onFit={fitToViewport}
        onActualSize={actualSize}
      />
    </section>
  )
}
