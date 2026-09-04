# Security and privacy

BetterSantaCruz is a public-information project. Do not commit passwords, API keys, tokens, cookies, session IDs, authentication headers, private correspondence, or private personal information.

Report a suspected vulnerability privately through GitHub's repository security channel when it is enabled. Do not include exploit details or sensitive data in a public issue.

## Civic-data safety

- Validate all external input at the boundary and use prepared statements for future database writes.
- Keep admin and write workflows disabled until authentication, authorization, CSRF, rate limiting, audit logging, and privacy review are complete.
- Never expose Meilisearch, Discord, webhook, Cloudflare, or database credentials in client code.
- Treat source pages, PDFs, OCR, search results, and user submissions as untrusted input.
- Do not publish private phone numbers, residential addresses, or unnecessary personal identifiers.
- Review any emergency or operational contact for freshness before publication.

The inherited Functions/D1 and admin seams are retained for future work; their presence is not authorization to activate them.
