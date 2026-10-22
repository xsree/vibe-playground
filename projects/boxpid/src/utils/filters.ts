import type { IdentifiedDetectionObject } from '../types/detection'

export interface ObjectFilters {
  enabledEquipmentTypes: ReadonlySet<string>
  minConfidence: number
}

export function filterObjects(
  objects: IdentifiedDetectionObject[],
  filters: ObjectFilters,
): IdentifiedDetectionObject[] {
  return objects.filter((object) => {
    if (!filters.enabledEquipmentTypes.has(object.equipment_type)) return false
    return object.confidence === undefined || object.confidence >= filters.minConfidence
  })
}

