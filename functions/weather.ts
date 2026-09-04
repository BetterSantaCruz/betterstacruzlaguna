import type { Env } from './types';

const LOCAL_ORIGINS = new Set([
  'http://localhost:5173',
  'http://localhost:8788',
]);

function getCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (origin && LOCAL_ORIGINS.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Max-Age'] = '86400';
  }

  return headers;
}

export async function onRequest(context: {
  request: Request;
  env: Env;
  ctx: ExecutionContext;
}): Promise<Response> {
  const origin = context.request.headers.get('Origin');

  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(origin),
    });
  }

  return new Response(
    JSON.stringify({
      code: 'FEATURE_NOT_CONFIGURED',
      error: 'Weather data is not configured for BetterSantaCruz.',
      message:
        'The read-only cache endpoint will remain unavailable until a reviewed provider and deployment binding exist.',
    }),
    {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        ...getCorsHeaders(origin),
      },
    }
  );
}
