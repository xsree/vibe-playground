import { useEffect, useRef, useState } from 'react'
import { BlackHoleRenderer, type ViewState } from './BlackHoleRenderer'

const INITIAL_VIEW: ViewState = { yaw: -0.18, pitch: 0.16, distance: 13.5 }

function formatAngle(radians: number) {
  const degrees = ((radians * 180) / Math.PI) % 360
  return `${Math.round(degrees < 0 ? degrees + 360 : degrees)}°`
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<BlackHoleRenderer | null>(null)
  const [view, setView] = useState(INITIAL_VIEW)
  const [interacting, setInteracting] = useState(false)
  const [renderStatus, setRenderStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [renderError, setRenderError] = useState('')
  const lastUiUpdate = useRef(0)

  useEffect(() => {
    if (!canvasRef.current) return
    const renderer = new BlackHoleRenderer(canvasRef.current, {
      onViewChange: (state) => {
        const now = performance.now()
        if (now - lastUiUpdate.current > 100) {
          setView(state)
          lastUiUpdate.current = now
        }
      },
      onInteracting: setInteracting,
      onReady: () => setRenderStatus('ready'),
      onError: (message) => {
        setRenderError(message)
        setRenderStatus('error')
      },
    })
    rendererRef.current = renderer
    return () => renderer.dispose()
  }, [])

  return (
    <main className={`experience ${interacting ? 'is-interacting' : ''} is-${renderStatus}`}>
      <canvas
        ref={canvasRef}
        className="black-hole"
        aria-label="可全方位旋转观察的实时 WebGPU 黑洞"
        tabIndex={0}
      />
      <div className="grain" aria-hidden="true" />
      {renderStatus !== 'ready' && (
        <div className={`renderer-status ${renderStatus === 'error' ? 'render-error' : ''}`} role="status">
          <span />
          {renderStatus === 'loading' ? '正在烘焙弯曲光路…' : renderError}
        </div>
      )}
      <header className="topbar">
        <a className="identity" href="#observer" aria-label="返回黑洞观测视角">
          <span className="identity-mark" />
          <span>GARGANTUA</span>
        </a>
        <span className="live"><i /> REALTIME WEBGPU</span>
      </header>

      <section className="intro" id="observer" aria-labelledby="title">
        <p className="eyebrow"><span>01</span> FREE ORBIT OBSERVATORY</p>
        <h1 id="title">越过固定视角。</h1>
        <p className="lede">围绕事件视界，从任意方向观察光如何弯曲。</p>
      </section>

      <aside className="telemetry" aria-label="当前观测参数">
        <div><span>AZIMUTH</span><strong>{formatAngle(view.yaw)}</strong></div>
        <div><span>ELEVATION</span><strong>{Math.round((view.pitch * 180) / Math.PI)}°</strong></div>
        <div><span>DISTANCE</span><strong>{view.distance.toFixed(1)} Rₛ</strong></div>
      </aside>

      <div className="controls">
        <p><span className="mouse-icon" />拖动环绕 · 滚轮缩放 · 方向键微调</p>
        <button type="button" onClick={() => rendererRef.current?.reset()}>
          重置视角 <span>↗</span>
        </button>
      </div>

      <footer>
        <span>BLACK HOLE / 001</span>
        <span>自由方位 · ±88° 俯仰 · 7.2–22.0 Rₛ</span>
      </footer>
    </main>
  )
}
