import type { KeyboardEvent } from 'react'
import type { IdentifiedDetectionObject } from '../types/detection'
import { normalizedToPixelBBox } from '../utils/bbox'
import { getEquipmentColor } from '../utils/colors'

interface BoundingBoxOverlayProps {
  width: number
  height: number
  objects: IdentifiedDetectionObject[]
  selectedId: string | null
  hoveredId: string | null
  showBoxes: boolean
  showLabels: boolean
  showConfidence: boolean
  zoom: number
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}

export function BoundingBoxOverlay(props: BoundingBoxOverlayProps) {
  if (!props.showBoxes) return null

  function handleKeyDown(event: KeyboardEvent<SVGGElement>, id: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      props.onSelect(id)
    }
  }

  const inverseZoom = 1 / props.zoom

  return (
    <svg
      className="bbox-overlay"
      width={props.width}
      height={props.height}
      viewBox={`0 0 ${props.width} ${props.height}`}
      aria-label="Bounding box overlay"
    >
      {props.objects.map((object) => {
        const [xmin, ymin, xmax, ymax] = normalizedToPixelBBox(object.bbox, props)
        const color = getEquipmentColor(object.equipment_type)
        const isActive = object.id === props.selectedId || object.id === props.hoveredId
        const label = [
          object.equipment_type,
          object.tag,
          props.showConfidence && object.confidence !== undefined ? object.confidence.toFixed(2) : null,
        ].filter(Boolean).join(' · ')
        const labelWidth = Math.max(70, label.length * 7.1 + 14) * inverseZoom
        const labelHeight = 23 * inverseZoom
        const labelY = Math.max(ymin, labelHeight)

        return (
          <g
            key={object.id}
            className={`bbox-group ${isActive ? 'is-active' : ''}`}
            role="button"
            tabIndex={0}
            aria-label={`Select ${label}`}
            onClick={(event) => {
              event.stopPropagation()
              props.onSelect(object.id)
            }}
            onKeyDown={(event) => handleKeyDown(event, object.id)}
            onMouseEnter={() => props.onHover(object.id)}
            onMouseLeave={() => props.onHover(null)}
          >
            <rect
              className="bbox-rect"
              x={xmin}
              y={ymin}
              width={xmax - xmin}
              height={ymax - ymin}
              stroke={color}
            />
            {props.showLabels && (
              <g className="bbox-label" transform={`translate(${xmin} ${labelY - labelHeight})`}>
                <rect width={labelWidth} height={labelHeight} fill={color} />
                <text x={7 * inverseZoom} y={15.5 * inverseZoom} fontSize={11 * inverseZoom}>{label}</text>
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
}

