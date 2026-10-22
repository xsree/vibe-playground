import Ajv2020, { type ErrorObject } from 'ajv/dist/2020';
import schema from '../../process-flow.schema.json';
import type { ProcessFlowDocument } from '../model/types';

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validate = ajv.compile(schema);

export type ValidationResult =
  | { valid: true; document: ProcessFlowDocument; errors: [] }
  | { valid: false; errors: ErrorObject[] };

export function validateProcessFlow(input: unknown): ValidationResult {
  if (validate(input)) {
    return { valid: true, document: input as unknown as ProcessFlowDocument, errors: [] };
  }
  return { valid: false, errors: [...(validate.errors ?? [])] };
}
