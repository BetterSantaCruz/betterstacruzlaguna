# Weather API

The weather route is retained as a future integration seam, but it is disabled in the current BetterSantaCruz configuration.

## Current response

GET /api/weather returns:

~~~
{
  "error": "FEATURE_NOT_CONFIGURED",
  "message": "Weather data is not configured for this portal."
}
~~~

The current response status is 503. No external weather provider is called, and no coordinates or weather observation is published.

## Enablement gate

Before enabling this route, contributors must:

1. verify and document the location identity and coordinates;
2. choose and document a provider, terms, retention rule, and cache policy;
3. configure the feature flag and server-side credentials without committing secrets;
4. add tests for disabled, provider-error, stale-cache, and successful responses;
5. run the data and browser gates and receive an explicit publication review.

Do not add a default city, coordinates, temperature, forecast, or provider claim merely to make the UI look complete.
