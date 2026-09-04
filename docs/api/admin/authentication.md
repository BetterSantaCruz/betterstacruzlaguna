# Admin authentication contract

This file documents the security contract for a future BetterSantaCruz admin review surface. It does not provide a live login URL or claim that an OAuth application is configured.

## Required flow

1. Generate a short-lived, single-use OAuth state value.
2. Validate the callback state before exchanging an authorization code.
3. Exchange the code server-side; never expose the client secret or access token to the browser.
4. Resolve the GitHub identity against an explicit server-side allowlist.
5. Store only the minimum session data in a server-side session store.
6. Set a secure, HttpOnly, SameSite cookie.
7. Require CSRF protection and role checks for every state-changing request.
8. Record review mutations in an audit log with source hash and evidence references.

## Fail-closed requirements

An unset or malformed allowlist, missing OAuth credentials, missing session store, or missing database must deny access or return an unavailable response. A local mock must never be enabled in a deployed environment.

## Local verification

Authentication tests should use synthetic identities and in-memory fixtures only. They must not request or persist real cookies, tokens, headers, or user data. Run:

~~~
npm test -- --run
npx tsc --noEmit
~~~
