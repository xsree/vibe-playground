import { describe, expect, it } from 'vitest'
import { detectionResultSchema } from './detectionSchema'

const validObject = {
  equipment_type: 'Pump',
  tag: 'P-101A',
  bbox: [100, 200, 300, 400],
  confidence: 0.95,
}

describe('detection schema', () => {
  it('accepts a valid result', () => {
    expect(detectionResultSchema.safeParse({ count: 1, objects: [validObject] }).success).toBe(true)
  })

  it('allows a null tag and missing confidence', () => {
    expect(detectionResultSchema.safeParse({
      count: 1,
      objects: [{ ...validObject, tag: null, confidence: undefined }],
    }).success).toBe(true)
  })

  it('rejects coordinates outside the normalized range', () => {
    const parsed = detectionResultSchema.safeParse({
      count: 1,
      objects: [{ ...validObject, bbox: [100, 100, 1200, 200] }],
    })
    expect(parsed.success).toBe(false)
  })

  it('rejects reversed coordinate extents', () => {
    const parsed = detectionResultSchema.safeParse({
      count: 1,
      objects: [{ ...validObject, bbox: [100, 100, 50, 200] }],
    })
    expect(parsed.success).toBe(false)
  })

  it('rejects confidence above one', () => {
    const parsed = detectionResultSchema.safeParse({
      count: 1,
      objects: [{ ...validObject, confidence: 1.1 }],
    })
    expect(parsed.success).toBe(false)
  })

  it('rejects unknown object fields', () => {
    const parsed = detectionResultSchema.safeParse({
      count: 1,
      objects: [{ ...validObject, model_note: 'unexpected' }],
    })
    expect(parsed.success).toBe(false)
  })
})

