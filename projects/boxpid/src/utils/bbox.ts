import type { BBox } from '../types/detection'

export interface Dimensions {
  width: number
  height: number
}

export function validateBBox(bbox: BBox): boolean {
  const [xmin, ymin, xmax, ymax] = bbox
  return (
    bbox.every((value) => Number.isFinite(value) && value >= 0 && value <= 1000) &&
    xmin < xmax &&
    ymin < ymax
  )
}

export function normalizedToPixelBBox(bbox: BBox, dimensions: Dimensions): BBox {
  const [xmin, ymin, xmax, ymax] = bbox
  return [
    (xmin / 1000) * dimensions.width,
    (ymin / 1000) * dimensions.height,
    (xmax / 1000) * dimensions.width,
    (ymax / 1000) * dimensions.height,
  ]
}

export function pixelToNormalizedBBox(bbox: BBox, dimensions: Dimensions): BBox {
  if (dimensions.width <= 0 || dimensions.height <= 0) {
    throw new Error('Image dimensions must be positive')
  }
  const [xmin, ymin, xmax, ymax] = bbox
  return [
    (xmin / dimensions.width) * 1000,
    (ymin / dimensions.height) * 1000,
    (xmax / dimensions.width) * 1000,
    (ymax / dimensions.height) * 1000,
  ]
}

