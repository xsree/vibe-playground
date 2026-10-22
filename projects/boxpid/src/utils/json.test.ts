import { describe, expect, it } from 'vitest'
import { parseDetectionJson } from './json'

describe('JSON parsing', () => {
  it('formats valid JSON and returns no warning for matching count', () => {
    const parsed = parseDetectionJson(JSON.stringify({
      count: 1,
      objects: [{ equipment_type: 'Pump', tag: null, bbox: [0, 0, 1000, 1000] }],
    }))
    expect(parsed.result.objects).toHaveLength(1)
    expect(parsed.warning).toBeNull()
    expect(parsed.formatted).toContain('\n  "count"')
  })

  it('warns but accepts a count mismatch', () => {
    const parsed = parseDetectionJson(JSON.stringify({ count: 8, objects: [] }))
    expect(parsed.warning).toContain('count does not match')
    expect(parsed.result.objects).toEqual([])
  })

  it('reports schema paths', () => {
    const text = JSON.stringify({
      count: 1,
      objects: [{ equipment_type: 'Pump', tag: null, bbox: [0, 0, 1001, 100] }],
    })
    expect(() => parseDetectionJson(text)).toThrow(/objects\[0\]\.bbox\[2\]/)
  })

  it('reports invalid JSON explicitly', () => {
    expect(() => parseDetectionJson('{"count": 1,}')).toThrow(/Invalid JSON/)
  })
})

