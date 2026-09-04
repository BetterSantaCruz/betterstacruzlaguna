# Contributing to BetterSantaCruz

Thank you for helping build more trustworthy public information. Contributions are welcome from developers, researchers, designers, translators, accessibility testers, and residents who can point to public sources.

## Start here

1. Read CONTEXT.md, the source policy, and SECURITY.md.
2. Create a branch for one bounded change.
3. Keep factual changes tied to a source registry entry and a retrieval/verification date.
4. Run the relevant tests, lint, data validator, and build.
5. Open a focused pull request with limitations and follow-up verification needs.

## Source and civic-data rules

- Never invent officials, office heads, addresses, phone numbers, services, fees, schedules, emergency numbers, budgets, projects, legislation, barangays, statistics, or outcomes.
- Prefer PSA, DILG, COA, PhilGEPS, DBM, DPWH, official municipal resources, and the Sangguniang Bayan over secondary sources.
- Always disambiguate Santa Cruz, Laguna from other Santa Cruz municipalities.
- Preserve the original URL and source state. A blocked, stale, or unreachable source must remain labeled as such.
- Do not copy Los Baños data from the inherited foundation into Santa Cruz.
- Do not add private contact information, credentials, cookies, tokens, session IDs, or authentication headers.
- Do not claim official ownership, endorsement, partnership, directory approval beyond the recorded PR state, or active production status.
- Do not create or submit another BetterLGU registration PR for Santa Cruz. Upstream PR #244 is the maintained registration surface.
- Do not create a competing public BetterPagsanjan project; coordinate with @rswlljms through the existing project.

## Local checks

~~~
npm ci
npm run validate:data
npm test -- --run
npm run lint
npm run build
~~~

When changing UI, check keyboard focus, semantic headings, contrast, narrow screens, reduced motion, loading/error/empty states, and external-link labeling. When changing pipeline code, keep collection, normalization, staging, validation, review, and promotion as separate steps.

## Commits and pull requests

Use Conventional Commits, for example:

~~~
feat(sources): add a dated primary-source record
fix(ui): explain unavailable civic data
chore(data): clear an unverified inherited payload
docs: record a verification gap
~~~

A pull request should say what changed, which source or evidence supports it, what remains unverified, and which commands passed. Do not include secrets or private correspondence.

## Design and code style

Use the existing Kapwa semantic tokens and component patterns. Keep components focused, use TypeScript types/Zod at data boundaries, prefer accessible semantic HTML, and avoid adding a large dependency for an unverified feature. Preserve the full architecture unless a measured, documented reason supports a bounded change.
