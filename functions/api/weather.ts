import type { Env } from '../types';

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

function unavailableResponse(origin: string | null): Response {
  return new Response(
    JSON.stringify({
      code: 'FEATURE_NOT_CONFIGURED',
      error: 'Weather data is not configured for BetterSantaCruz.',
      message:
        'No weather provider, coordinates, or cache binding has been approved for publication yet.',
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

/**
 * Weather remains an intentionally disabled seam until a provider, location
 * data, freshness policy, and deployment binding are reviewed and configured.
 */
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

  return unavailableResponse(origin);
}

export async function scheduled(
  controller: ScheduledController,
  env: Env
): Promise<{ success: false; status: 'disabled'; message: string }> {
  void controller;
  void env;
  return {
    success: false,
    status: 'disabled',
    message: 'Weather refresh is not configured for BetterSantaCruz.',
  };
}
