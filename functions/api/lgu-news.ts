/**
 * Local-news API seam.
 *
 * A live feed is deliberately not enabled yet. Publishing a feed requires a
 * reviewed source URL, attribution, freshness policy, and an explicit
 * promotion path for each item. Keeping the endpoint explicit prevents a
 * stale upstream template from being mistaken for Santa Cruz data.
 */
export async function onRequest(context: {
  request: Request;
}): Promise<Response> {
  if (context.request.method !== 'GET' && context.request.method !== 'OPTIONS') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  return new Response(
    JSON.stringify({
      posts: [],
      source: 'not-configured',
      cached: false,
      message: 'A reviewed Santa Cruz news source has not been configured.',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    }
  );
}
