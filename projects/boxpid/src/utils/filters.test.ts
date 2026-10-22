import { describe, expect, it } from 'vitest'
import type { IdentifiedDetectionObject } from '../types/detection'
import { filterObjects } from './filters'

const objects: IdentifiedDetectionObject[] = [
  { id: 'object-0', equipment_type: 'Pump', tag: 'P-1', bbox: [0, 0, 100, 100], confidence: 0.9 },
  { id: 'object-1', equipment_type: 'Pump', tag: 'P-2', bbox: [100, 0, 200, 100], confidence: 0.4 },
  { id: 'object-2', equipment_type: 'Vessel', tag: null, bbox: [200, 0, 300, 100] },
]

describe('object filtering', () => {
  it('filters equipment types and low confidence objects', () => {
    const result = filterObjects(objects, {
      enabledEquipmentTypes: new Set(['Pump']),
      minConfidence: 0.5,
    })
    expect(result.map((object) => object.id)).toEqual(['object-0'])
  })

  it('keeps objects without confidence at any threshold', () => {
    const result = filterObjects(objects, {
      enabledEquipmentTypes: new Set(['Vessel']),
      minConfidence: 1,
    })
    expect(result.map((object) => object.id)).toEqual(['object-2'])
  })

  it('does not mutate the source array', () => {
    const result = filterObjects(objects, {
      enabledEquipmentTypes: new Set(['Pump', 'Vessel']),
      minConfidence: 0,
    })
    expect(result).not.toBe(objects)
    expect(objects).toHaveLength(3)
  })
})

