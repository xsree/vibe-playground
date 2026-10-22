interface ViewerToolbarProps {
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onFit: () => void
  onActualSize: () => void
}

export function ViewerToolbar({ zoom, onZoomIn, onZoomOut, onFit, onActualSize }: ViewerToolbarProps) {
  return (
    <div className="viewer-toolbar" aria-label="Viewer controls">
      <div className="toolbar-hint"><kbd>Space</kbd> + drag to pan · Scroll to zoom</div>
      <div className="zoom-controls">
        <button type="button" aria-label="Zoom out" onClick={onZoomOut}>−</button>
        <output aria-label="Current zoom">{Math.round(zoom * 100)}%</output>
        <button type="button" aria-label="Zoom in" onClick={onZoomIn}>+</button>
        <span className="toolbar-divider" />
        <button type="button" onClick={onActualSize}>100%</button>
        <button type="button" onClick={onFit}>Fit</button>
      </div>
    </div>
  )
}
