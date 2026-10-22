import { detectionResultSchema } from '../schemas/detectionSchema'
import type { DetectionResult } from '../types/detection'

export interface ParsedDetectionJson {
  result: DetectionResult
  warning: string | null
  formatted: string
}

function formatPath(path: PropertyKey[]): string {
  return path.reduce<string>((current, segment) => {
    if (typeof segment === 'number') return `${current}[${segment}]`
    return current ? `${current}.${String(segment)}` : String(segment)
  }, '')
}

function formatJsonSyntaxError(error: SyntaxError, text: string): string {
  const positionMatch = error.message.match(/position\s+(\d+)/i)
  if (!positionMatch) return `Invalid JSON: ${error.message}`

  const position = Number(positionMatch[1])
  const before = text.slice(0, position)
  const line = before.split('\n').length
  const lastNewline = before.lastIndexOf('\n')
  const column = position - lastNewline
  return `Invalid JSON at line ${line}, column ${column}: ${error.message}`
}

export function parseDetectionJson(text: string): ParsedDetectionJson {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error(formatJsonSyntaxError(error, text), { cause: error })
    throw error
  }

  const parsed = detectionResultSchema.safeParse(raw)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const path = formatPath(issue.path)
    throw new Error(`${path || 'JSON'} ${issue.message}`)
  }

  return {
    result: parsed.data,
    warning:
      parsed.data.count === parsed.data.objects.length
        ? null
        : 'count does not match objects.length; rendering objects.length.',
    formatted: JSON.stringify(parsed.data, null, 2),
  }
}
