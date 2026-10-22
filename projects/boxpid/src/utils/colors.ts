const PALETTE = ['#14b8a6', '#f97316', '#38bdf8', '#e879f9', '#facc15', '#a78bfa', '#fb7185', '#4ade80']

export function getEquipmentColor(equipmentType: string): string {
  let hash = 2166136261
  for (let index = 0; index < equipmentType.length; index += 1) {
    hash ^= equipmentType.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

