export type BBox = [number, number, number, number]

export interface DetectionObject {
  equipment_type: string
  tag: string | null
  bbox: BBox
  confidence?: number
}

export interface DetectionResult {
  mode?: string
  count: number
  objects: DetectionObject[]
}

export interface IdentifiedDetectionObject extends DetectionObject {
  id: string
}

export interface ImageAsset {
  fileName: string
  url: string
  width: number
  height: number
}

