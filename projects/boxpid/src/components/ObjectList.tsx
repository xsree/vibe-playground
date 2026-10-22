import { useEffect, useRef } from 'react'
import type { IdentifiedDetectionObject } from '../types/detection'
import { getEquipmentColor } from '../utils/colors'

interface ObjectListProps {
  objects: IdentifiedDetectionObject[]
  totalCount: number
  hasDetectionResult: boolean
  selectedId: string | null
  hoveredId: string | null
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}

export function ObjectList(props: ObjectListProps) {
  const itemRefs = useRef(new Map<string, HTMLButtonElement>())

  useEffect(() => {
    if (!props.selectedId) return
    itemRefs.current.get(props.selectedId)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [props.selectedId])

  let countLabel = `${props.objects.length} detected`
  if (props.objects.length !== props.totalCount) countLabel = `${props.objects.length} of ${props.totalCount} shown`

  return (
    <aside className="objects-panel" aria-labelledby="objects-heading">
      <div className="objects-header">
        <div>
          <span className="eyebrow">Results</span>
          <h2 id="objects-heading">Objects</h2>
        </div>
        <span className="object-count">{props.hasDetectionResult ? countLabel : '—'}</span>
      </div>
      <div className="object-list">
        {!props.hasDetectionResult ? (
          <div className="side-empty-state">
            <span>01</span>
            <p>Paste or upload bounding box JSON</p>
          </div>
        ) : props.totalCount === 0 ? (
          <div className="side-empty-state"><span>00</span><p>No objects detected</p></div>
        ) : props.objects.length === 0 ? (
          <div className="side-empty-state"><span>00</span><p>No objects match filters</p></div>
        ) : (
          props.objects.map((object, index) => {
            const isSelected = object.id === props.selectedId
            const isHovered = object.id === props.hoveredId
            const color = getEquipmentColor(object.equipment_type)
            return (
              <button
                key={object.id}
                ref={(node) => {
                  if (node) itemRefs.current.set(object.id, node)
                  else itemRefs.current.delete(object.id)
                }}
                type="button"
                className={`object-item ${isSelected ? 'is-selected' : ''} ${isHovered ? 'is-hovered' : ''}`}
                aria-pressed={isSelected}
                onClick={() => props.onSelect(object.id)}
                onMouseEnter={() => props.onHover(object.id)}
                onMouseLeave={() => props.onHover(null)}
              >
                <span className="object-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="object-color" style={{ backgroundColor: color }} aria-hidden="true" />
                <span className="object-main">
                  <strong>{object.equipment_type}</strong>
                  <span>{object.tag || 'Untagged'}</span>
                  <code>[{object.bbox.join(', ')}]</code>
                </span>
                <span className="object-confidence">
                  {object.confidence === undefined ? '—' : object.confidence.toFixed(2)}
                </span>
              </button>
            )
          })
        )}
      </div>
    </aside>
  )
}

