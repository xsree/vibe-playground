import { describe, expect, it } from 'vitest'
import { normalizedToPixelBBox, pixelToNormalizedBBox, validateBBox } from './bbox'
import type { BBox } from '../types/detection'

describe('bbox utilities', () => {
  it('accepts the full normalized extent', () => {
    expect(validateBBox([0, 0, 1000, 1000])).toBe(true)
  })

  const invalidBoxes: BBox[] = [
    [-1, 0, 100, 100],
    [0, 0, 1001, 100],
    [100, 100, 50, 200],
    [100, 200, 200, 200],
  ]

  invalidBoxes.forEach((bbox) => {
    it(`rejects invalid bbox ${JSON.stringify(bbox)}`, () => {
      expect(validateBBox(bbox)).toBe(false)
    })
  })

  it('converts normalized coordinates to image pixels', () => {
    expect(normalizedToPixelBBox([100, 200, 300, 400], { width: 3840, height: 2160 }))
      .toEqual([384, 432, 1152, 864])
  })

  it('round-trips image pixel coordinates', () => {
    const source: BBox = [384, 432, 1152, 864]
    const normalized = pixelToNormalizedBBox(source, { width: 3840, height: 2160 })
    expect(normalized).toEqual([100, 200, 300, 400])
  })

  it('rejects non-positive image dimensions', () => {
    expect(() => pixelToNormalizedBBox([0, 0, 1, 1], { width: 0, height: 100 })).toThrow()
  })
})
