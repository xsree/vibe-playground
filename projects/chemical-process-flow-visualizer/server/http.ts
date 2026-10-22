import type { IncomingMessage, ServerResponse } from 'node:http';
import { processGeneratePayload, processModelsPayload, generateOptionsFromEnvironment } from './api';

export async function readJsonBody(request: IncomingMessage, limit = 256_000): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > limit) throw new Error('请求内容过大。');
    chunks.push(buffer);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) as unknown : {};
}

export async function handleGenerateHttp(
  request: IncomingMessage,
  response: ServerResponse,
  developmentFallback = false,
  environment: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (request.method !== 'POST') {
    response.statusCode = 405;
    response.end(JSON.stringify({ ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: '仅支持 POST 请求。' } }));
    return;
  }
  try {
    const payload = await readJsonBody(request);
    const result = await processGeneratePayload(payload, generateOptionsFromEnvironment(environment, developmentFallback));
    response.statusCode = result.status;
    response.end(JSON.stringify(result.body));
  } catch (error) {
    response.statusCode = 400;
    response.end(JSON.stringify({ ok: false, error: { code: 'INVALID_REQUEST', message: error instanceof Error ? error.message : String(error) } }));
  }
}

export async function handleModelsHttp(request: IncomingMessage, response: ServerResponse): Promise<void> {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (request.method !== 'POST') {
    response.statusCode = 405;
    response.end(JSON.stringify({ ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: '仅支持 POST 请求。' } }));
    return;
  }
  try {
    const payload = await readJsonBody(request);
    const result = await processModelsPayload(payload);
    response.statusCode = result.status;
    response.end(JSON.stringify(result.body));
  } catch (error) {
    response.statusCode = 400;
    response.end(JSON.stringify({ ok: false, error: { code: 'INVALID_REQUEST', message: error instanceof Error ? error.message : String(error) } }));
  }
}
