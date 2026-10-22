import { z } from 'zod'

export const bboxSchema = z
  .tuple([
    z.number().min(0).max(1000),
    z.number().min(0).max(1000),
    z.number().min(0).max(1000),
    z.number().min(0).max(1000),
  ])
  .superRefine(([xmin, ymin, xmax, ymax], context) => {
    if (xmin >= xmax) {
      context.addIssue({
        code: 'custom',
        path: [2],
        message: 'must be greater than xmin',
      })
    }
    if (ymin >= ymax) {
      context.addIssue({
        code: 'custom',
        path: [3],
        message: 'must be greater than ymin',
      })
    }
  })

export const detectionObjectSchema = z
  .object({
    equipment_type: z.string().trim().min(1, 'must be a non-empty string'),
    tag: z.string().nullable(),
    bbox: bboxSchema,
    confidence: z.number().min(0).max(1).optional(),
  })
  .strict()

export const detectionResultSchema = z
  .object({
    mode: z.string().optional(),
    count: z.number().int().nonnegative(),
    objects: z.array(detectionObjectSchema),
  })
  .strict()

export type DetectionSchemaResult = z.infer<typeof detectionResultSchema>

