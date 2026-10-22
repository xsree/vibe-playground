import { getEquipmentColor } from '../utils/colors'

interface FiltersProps {
  equipmentCounts: Map<string, number>
  enabledTypes: ReadonlySet<string>
  onToggleType: (type: string) => void
  onSelectAll: () => void
  onClearAll: () => void
  hasConfidence: boolean
  minConfidence: number
  onMinConfidenceChange: (value: number) => void
  showBoxes: boolean
  showLabels: boolean
  showConfidence: boolean
  onShowBoxesChange: (value: boolean) => void
  onShowLabelsChange: (value: boolean) => void
  onShowConfidenceChange: (value: boolean) => void
}

export function Filters(props: FiltersProps) {
  const types = [...props.equipmentCounts.entries()]

  return (
    <section className="panel-section filters-section" aria-labelledby="display-heading">
      <h2 id="display-heading">Display</h2>
      <div className="checkbox-stack">
        <label><input type="checkbox" checked={props.showBoxes} onChange={(event) => props.onShowBoxesChange(event.target.checked)} />Show bounding boxes</label>
        <label><input type="checkbox" checked={props.showLabels} onChange={(event) => props.onShowLabelsChange(event.target.checked)} />Show labels</label>
        <label><input type="checkbox" checked={props.showConfidence} onChange={(event) => props.onShowConfidenceChange(event.target.checked)} />Show confidence</label>
      </div>

      {types.length > 0 && (
        <div className="filter-group">
          <div className="filter-title-row">
            <h3>Equipment types</h3>
            <span>
              <button type="button" onClick={props.onSelectAll}>All</button>
              <button type="button" onClick={props.onClearAll}>None</button>
            </span>
          </div>
          <div className="type-list">
            {types.map(([type, count]) => (
              <label key={type}>
                <input type="checkbox" checked={props.enabledTypes.has(type)} onChange={() => props.onToggleType(type)} />
                <span className="color-swatch" style={{ backgroundColor: getEquipmentColor(type) }} aria-hidden="true" />
                <span className="type-name">{type}</span>
                <span className="type-count">{count}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {props.hasConfidence && (
        <div className="filter-group confidence-filter">
          <div className="filter-title-row">
            <h3>Min confidence</h3>
            <output>{props.minConfidence.toFixed(2)}</output>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={props.minConfidence}
            aria-label="Minimum confidence"
            onChange={(event) => props.onMinConfidenceChange(Number(event.target.value))}
          />
          <div className="range-labels"><span>0.00</span><span>1.00</span></div>
        </div>
      )}
    </section>
  )
}

