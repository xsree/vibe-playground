import {
  createRenderer,
  type RendererCallbacks,
  type ViewState,
} from './black-hole/renderer'

export type { ViewState }

export class BlackHoleRenderer {
  private readonly controller
  readonly ready: Promise<void>

  constructor(canvas: HTMLCanvasElement, callbacks: RendererCallbacks) {
    this.controller = createRenderer({ canvas, ...callbacks })
    this.ready = this.controller.ready
  }

  reset() {
    this.controller.reset()
  }

  dispose() {
    this.controller.dispose()
  }
}
