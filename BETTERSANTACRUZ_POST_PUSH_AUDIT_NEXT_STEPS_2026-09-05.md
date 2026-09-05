# BetterSantaCruz — Post-Push Audit & Rebaselined Next-Steps Plan

**Audit date:** 2026-09-05  
**Repository:** `Diannn3/betterstacruzlaguna`  
**Audited head:** `b02c35393bf7cba8ada78b175f43f89e99ddcf62` — `feat: add source ledger evidence filters`  
**Comparison baseline:** `3d433a0b765abfa110132d74914d43f29905a0c2`  
**Scope:** the latest `main` push as a whole, including the 20 commits added after the earlier planning baseline, not only the final filter commit.

> **Canonical rule for future agents:** read `CONTEXT.md`, this document, and the current source/data schemas before implementing anything. Re-verify any current-state claim that can change externally (BetterLGU PR state, government sources, CI status, Vercel state). Do not silently promote observed or inferred civic information into published facts.

---

## 1. Executive verdict

The latest push is a **large and mostly productive advance**. BetterSantaCruz is no longer just an empty BetterLB-derived shell. It now has a real verified civic baseline, stricter provenance checking, a Santa Cruz identity firewall, source-ledger UI, population/barangay data, top-executive records, a Vercel SPA configuration, expanded tests, and clean-room guards against leaked Los Baños claims.

However, the current head **must not be treated as release-ready or fully green**.

There is one immediate blocking engineering failure and several architecture/data-governance issues that should be resolved **before** moving into bulk legislation ingestion or deployment:

1. **The production build is failing in GitHub Actions.**
2. **Repository documentation says the build/QA state is green even though two main workflows are red.**
3. **The evidence model still overloads multiple concepts into one `verificationStatus`, contrary to the master plan.**
4. **The current source identity firewall is weaker at the source-record boundary than it appears because Santa Cruz source records do not themselves carry a required PSGC/province identity.**
5. **The executive records include a `2025–2028` term value that is not directly supported by the DBM source they cite.**
6. **`/admin/*` remains publicly routed even though the production backend is intentionally dormant.**
7. **Search still promises multiple civic domains while indexing only services, and the current service dataset is empty.**
8. **Citizen's Charter/service schemas remain too permissive for future ingestion.**
9. **SEO/canonical behavior remains unsafe for a blank `baseUrl`.**
10. **The repo still records BetterLGU PR #244 as `🔵 Planned` in several places even though the actual PR was already amended to `🟡 Work in Progress` with the repository link.**

**Recommendation:** freeze feature expansion for one stabilization pass. Fix CI truth, data-model semantics, public-route boundaries, and documentation before starting the Santa Cruz SB legislation collector.

---

## 2. What the latest push actually accomplished

Compared with the old `3d433a0` baseline, the repository is now **20 commits ahead** and changed roughly 60+ files across civic data, validation, docs, UI, test coverage, and hosting preparation.

### Major successful additions

#### 2.1 Repository truth was mostly reconciled
The public repository is now reflected in:

- `config/lgu.config.json`
- `package.json`
- generated crawler content
- project documentation
- contribution/public surfaces

`portal.githubUrl` now correctly points to the public BetterSantaCruz repository.

#### 2.2 Santa Cruz identity baseline is now explicit
`src/lib/municipality-identity.ts` establishes:

- Municipality: Santa Cruz
- Province: Laguna
- Region: Region IV-A / CALABARZON
- PSGC: `0403426000`
- Correspondence code: `043426000`

It also rejects explicit references to same-name Santa Cruz LGUs in:

- Davao del Sur
- Ilocos Sur
- Marinduque
- Occidental Mindoro
- Zambales

This is a strong direction and should remain a central invariant.

#### 2.3 Verified PSA baseline is published
The repo now carries:

- PSGC `0403426000`
- correspondence code `043426000`
- 2024 POPCEN population `126844`
- exactly 26 barangays
- barangay PSGC codes
- urban/rural classification
- barangay population

The population dataset is intentionally one-point rather than pretending there is a historical series. That is good evidence discipline.

#### 2.4 Top executive baseline is present
`src/data/directory/executive.json` now publishes:

- Joseph Kris Benjamin B. Agarao — Municipal Mayor
- Laarni A. Malibiran — Municipal Vice Mayor

using the 2026 DBM directory as the cited source.

This is materially more useful than the prior empty government shell, but one provenance correction is needed for the term field; see findings below.

#### 2.5 Canonical civic validation became much stronger
New/expanded code includes:

- `src/lib/canonical-data.ts`
- `src/lib/provenance.ts`
- `src/lib/municipality-identity.ts`
- `src/lib/clean-room.ts`
- source/civic registry tests
- population tests
- official tests
- same-name identity tests
- source filtering and source summaries

Important positive controls already present:

- duplicate source/fact detection
- chronology checks
- no future source dates
- source/fact provenance parity
- verified-only canonical directory requirements
- exact barangay count
- exact code relationships
- population reconciliation
- empty barangay-official gating
- runtime scans for inherited Los Baños/BetterLB factual claims

#### 2.6 Source ledger became usable
The final commit adds pure, testable:

- municipality filtering
- evidence-status filtering
- text search
- status summaries

The filter helper does not mutate source records. That part of the latest commit is well-scoped.

#### 2.7 Statistics are now evidence-gated
The population route can show the verified 2024 snapshot while unsupported statistics remain gated.

#### 2.8 Vercel SPA preparation began
`vercel.json` now rewrites client-side routes to `index.html`, which is needed because the app uses `BrowserRouter`.

This is a valid start, but release hardening is incomplete.

#### 2.9 Test coverage increased substantially
The repo currently reports 401 unit tests and the Santa Cruz browser smoke boundary is 11 tests. GitHub Actions confirms that unit tests, typecheck, lint, and the E2E workflow can pass on the current head.

---

## 3. Critical audit finding: `main` is currently red

This is the most important current fact.

For head `b02c353`:

| Workflow | Result |
|---|---|
| GitHub Actions Security Analysis / zizmor | ✅ Success |
| BetterSantaCruz E2E | ✅ Success |
| Quality Gate | ❌ Failure |
| Quality Check | ❌ Failure |

Both failed workflows fail at the **production build**.

### Exact failure

`package.json` defines:

```json
"build": "npm run validate:data && tsc && npm run generate:llms && npm run merge:services && vite build",
"generate:llms": "node scripts/generate-llms-txt.js"
```

`scripts/generate-llms-txt.js` then imports:

```js
import { buildCrawlerNote } from './llms-content.ts';
```

On GitHub Actions, plain Node 20 attempts to load that `.ts` file and fails with:

```text
TypeError [ERR_UNKNOWN_FILE_EXTENSION]:
Unknown file extension ".ts" for scripts/llms-content.ts
```

The error happens before Vite builds the app.

### Why local tests could still appear green

Vitest/tsx can understand TypeScript directly. Plain `node` cannot load the `.ts` import under the current execution mode. This explains why the helper unit tests can pass while the production build fails.

### Required resolution

Choose one deterministic approach and test it in CI:

**Preferred simple options:**

1. Run the generator through `tsx`, e.g. make `generate:llms` execute `tsx scripts/generate-llms-txt.js`; or
2. convert `llms-content.ts` to a plain `.js` module if it does not need TypeScript at runtime; or
3. convert the generator itself to TypeScript and execute it with `tsx`.

Do **not** fix this by enabling an experimental loader ad hoc in only one environment.

The chosen generator path must work identically under:

- local clean install
- GitHub Actions
- future Vercel build

### CI truth rule

Until a new commit has:

- Quality Gate ✅
- Quality Check ✅
- E2E ✅
- zizmor ✅

the repo must not claim “all release gates are green.”

---

## 4. Runtime/version mismatch that should be fixed with the CI repair

There is a second environment problem:

- `.nvmrc` says `v22.16.0`
- both main GitHub quality workflows explicitly install Node `20`
- the dependency override pins `undici@8.0.2`
- CI reports that this `undici` version requires Node `>=22.19.0`
- GitHub Actions is warning that Node 20 usage is deprecated
- `@types/node` is already on a Node 24 line

### Recommended plan

Do not patch each workflow independently.

Create one runtime decision and align:

- `.nvmrc`
- `.node-version`
- `package.json` `engines`
- all GitHub Actions setup-node steps
- local developer documentation
- future Vercel Node setting

**Preferred target to evaluate:** Node 24.x.

Why:

- it eliminates the current Node 20 deprecation path;
- it satisfies the `undici@8.0.2` engine requirement;
- the project already uses Node 24 typings;
- current Vercel guidance supports modern Node runtimes.

Before adopting it, run the complete suite. If a dependency proves incompatible, use a supported Node 22 release `>=22.19.0` instead. The important requirement is **one explicit supported runtime everywhere**.

---

## 5. Documentation is currently ahead of reality

`docs/PROJECT_STATUS.md`, `CONTEXT.md`, and verification docs claim the current feature slice has a green production build.

That is not true for the current GitHub head because the build fails in both main quality workflows.

### Required correction behavior

After fixing CI:

- update QA counts/status from the actual successful remote run;
- mention local results separately from remote CI results;
- never use “green” if only local tests passed;
- record the head SHA associated with the verified QA state.

A useful pattern:

```text
Verified head: <sha>
Local: validate/data, unit, typecheck, lint, build, E2E
GitHub: Quality Gate, Quality Check, E2E, zizmor
Verified at: <timestamp/date>
```

This reduces stale-document drift.

---

## 6. BetterLGU state is stale inside the app repo

The actual BetterLGU PR #244 has already been amended to:

- state: OPEN
- repository: `Diannn3/betterstacruzlaguna`
- status: `🟡 Work in Progress`
- maintainer: `@Diannn3`

but multiple repo files still say `🔵 Planned` and/or say the directory repository field is `-`.

Current stale Santa Cruz references appear in at least:

- `CONTEXT.md`
- `docs/VERIFICATION_REPORT.md`
- `docs/project/BETTERLGU_REGISTRATION.md`
- `docs/sources/SANTA_CRUZ_SOURCE_INVENTORY.md`

Pagsanjan references to `🔵 Planned` are separate and should not be changed merely because Santa Cruz changed.

### Required next action

Update only the Santa Cruz governance state to:

```text
PR #244: OPEN
Status in PR: 🟡 Work in Progress
Repository in PR: https://github.com/Diannn3/betterstacruzlaguna
Merged: false
```

Do not claim the directory row is live/merged until the BetterLGU maintainer merges the PR.

---

## 7. Evidence architecture: strong validation, but the semantic model still needs one important refactor

This is the biggest architectural issue remaining from the master plan.

Current `verificationStatuses` includes:

- `verified`
- `observed`
- `pending`
- `access-restricted`
- `unreachable`
- `discovery-only`
- `secondary`
- `collaboration`

These are not all the same kind of state.

Examples:

- `access-restricted` is an **access state**
- `secondary` is an **authority/source class**
- `verified` is a **fact/evidence trust state**
- `collaboration` is a **research/context category**
- `pending` may be a **review state**

Keeping them in one field makes later legislation/procurement review harder and can create accidental promotion logic.

### Target model

Keep these axes separate:

#### Source authority
```text
primary-official
secondary-reputable
community
unknown
```

#### Access state
```text
reachable
partially-rendered
blocked
auth-redirect
unreachable
```

#### Fact verification
```text
unverified
single-source
corroborated
disputed
```

#### Publication state
```text
withheld
staged
review-ready
published
superseded
retracted
```

#### Freshness
Derived from:

- source-specific review cadence
- `lastVerifiedAt`
- validity/effective dates

### Important migration rule

Do not throw away the existing registry. Write a deterministic migration that maps current records into the new dimensions, then review ambiguous mappings.

### Why this should happen **before legislation ingestion**

Once 600+ ordinance rows and thousands of resolution rows enter staging, changing evidence semantics becomes much more expensive.

---

## 8. Source-level municipality identity firewall is still weaker than the canonical-data firewall

`assertSantaCruzIdentity()` is good when a record actually carries:

- municipality
- province
- PSGC

But the current `SourceRecord` schema does not require a Santa Cruz source record to contain its own `province` or `municipalityPsgc`.

The source validator currently supplies:

```ts
province: 'Laguna'
```

when calling the identity assertion.

That means the validator is partly proving a value it injected itself.

### Required target

Every Santa Cruz source record should carry an explicit identity envelope such as:

```ts
municipality: "Santa Cruz"
province: "Laguna"
municipalityPsgc: "0403426000"
```

For source types where the upstream record itself does not expose PSGC, preserve:

- the source's observed location string;
- the BetterSantaCruz resolved identity;
- the evidence used to resolve that identity.

The source pipeline should reject or quarantine sources whose municipality identity is ambiguous.

### Keep the blacklist, but make it secondary

The current Davao del Sur / Ilocos Sur / Marinduque / Occidental Mindoro / Zambales rejection fixtures are valuable regression tests.

But exact positive identity should be the primary gate. A blacklist can never enumerate every wrong place.

---

## 9. Executive records contain an unsupported field-level inference

The DBM 2026 directory supports the identities/titles of:

- Joseph Kris Benjamin B. Agarao
- Laarni A. Malibiran

The current executive records additionally state:

```json
"term": "2025–2028"
```

while the record cites only DBM.

Even if that term is institutionally expected for elected local officials, the cited DBM row is not the source for that term value.

### Fix options

Use one of these:

**Option A — safest now**
```json
"term": null
```

until an authoritative source directly supports the term.

**Option B — preferred if source found**
Add a current authoritative COMELEC/proclamation/election/term source and record field-level provenance showing:

- DBM → person/title/current office
- election/legal source → term

### General rule

Record-level provenance is not enough once different fields come from different sources.

This is a good place to introduce field-level provenance before expanding the full elected-official roster.

---

## 10. Canonical validators are good but should become less snapshot-hardcoded

`canonical-data.ts` currently hardcodes:

- barangay count `26`
- population `126844`
- reference year `2024`
- `asOf` `2025-07-31`

For the current reviewed snapshot, this is safe and deterministic.

Long term, however, the next PSA release will require code edits instead of only a reviewed data update.

### Recommended next architecture

Retain immutable snapshot fixtures, but move baseline facts into a reviewed municipality metadata record:

```text
municipality.json / baseline metadata
  -> canonical validators read expected snapshot metadata
  -> tests freeze known snapshot fixtures
```

This lets:

- new PSA snapshot data be reviewed as data;
- validators remain generic;
- historical snapshots remain reproducible.

Do not generalize this prematurely during the CI hotfix; schedule it with the evidence-model refactor.

---

## 11. Pagsanjan research should stop being a public BetterSantaCruz source-ledger option

The public `/sources` page currently allows:

- Santa Cruz, Laguna
- Pagsanjan, Laguna
- All research context

Pagsanjan research was useful during planning and collaboration, but BetterPagsanjan is a separate project maintained by someone else.

### Risk

Public users may reasonably assume the BetterSantaCruz source ledger is authoritative for Santa Cruz content. Exposing another municipality in the same production ledger weakens that product boundary and creates unnecessary future search/indexing leakage risk.

### Recommended target

Keep Pagsanjan context in one of:

- `research/pagsanjan/`
- `docs/pagsanjan/`
- a separate non-public/research registry not imported into the production app

The BetterSantaCruz public source ledger should default to and ideally contain **Santa Cruz public-source records only**.

Do not delete Pagsanjan research. Separate it.

---

## 12. Search is still inaccurate

Current `Search.tsx`:

- builds Fuse only over `merged-services.json`;
- the services corpus is currently empty;
- placeholder text says users can search “government services, offices, and resources.”

That is misleading because those domains are not indexed.

### Target

Do not expand search until the evidence model is stable.

Then generate a static index **only from published Santa Cruz records**:

Possible first index domains:

- barangays
- mayor/vice mayor
- verified population facts
- published source-ledger records if explicitly useful
- reviewed legislation pilot later
- services only after a valid Charter exists

Each search hit should carry:

```text
type
title
summary
route
sourceIds
asOf
publicationState
freshness
```

Exclude:

- withheld
- staged
- disputed unless deliberately exposed as disputed
- Pagsanjan context
- inaccessible discovery leads
- dormant BetterLB data

Until that index exists, make search copy explicitly say what it actually searches or disable it.

---

## 13. Citizen's Charter and service schemas remain unsafe for ingestion

Two schemas remain a major blocker:

### `src/data/schema/services.schema.json`
It still allows loose fields, including permissive `quickInfo`.

### `src/data/citizens-charter/schema.json`
It effectively accepts:

```json
{
  "services": [
    {}
  ]
}
```

This is too weak for civic service data, where incorrect:

- fee
- requirement
- processing time
- responsible office
- eligibility

can mislead residents.

### Required target before importing any Charter

Strict schema with:

- dated Charter/source edition
- service ID
- responsible office
- client eligibility
- requirements
- process steps
- processing times
- fees
- responsible person/office only when source-backed
- provenance at field or structured-section level
- `additionalProperties: false` where feasible
- schema validation in CI

Keep service corpus empty until this is complete.

---

## 14. Public admin surface remains a P0 release blocker

`src/App.tsx` still always registers:

```text
/admin
/admin/documents
/admin/persons/merge
/admin/persons/deletion-queue
/admin/errors
/admin/audit-logs
/admin/review-queue
/admin/reconcile
/admin/openlgu/workbench
```

This happens even though:

- Cloudflare/D1 is dormant;
- no production admin deployment is authorized;
- the release target is a static Vercel app.

There are also many client paths that read `VITE_ADMIN_MOCK_MODE`.

### Required release behavior

For the static public build:

- admin routes must not be registered;
- ideally admin chunks should not be emitted into the public release bundle;
- production build must fail if `VITE_ADMIN_MOCK_MODE=true`;
- no client-side secret/backend assumption should survive;
- admin can remain in the repository for future work.

This should be completed **before any Vercel preview intended for public sharing**.

---

## 15. Feature flags should control routes, not only content

OpenLGU, statistics, and transparency are feature-gated in `App.tsx`, but:

- weather route exists even when weather feature is false;
- forex route exists even when forex feature is false;
- services routes exist despite no published service corpus;
- admin routes are always available.

Reconcile route registration with product availability.

Prefer:

```text
feature disabled
    -> route absent or explicit safe unavailable page
```

rather than silently shipping dormant implementation routes.

---

## 16. SEO/canonical handling must be fixed before deployment

`SEO.tsx` has several unresolved issues:

1. `canonical` exists in the prop interface but is not destructured/used.
2. `baseUrl` is currently blank.
3. it still constructs canonical and OG URLs by concatenating the blank base URL with path/image.
4. the default description says users can access services/latest news even though those are not currently supported.

### Target

Before public preview/production:

- if no reviewed absolute `baseUrl`, omit canonical/OG absolute URL fields that require it;
- use the `canonical` prop correctly;
- make the default description match the actual evidence-gated product;
- only set production `baseUrl` after a real Vercel URL/domain is deliberately approved;
- keep preview deployments `noindex`.

---

## 17. Vercel configuration is incomplete, but should remain a later gate

Current `vercel.json` adds a SPA fallback:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

That is directionally correct because the app uses `BrowserRouter`.

Still required before a meaningful preview:

- verify static asset handling under the rewrite;
- add reviewed security headers;
- disable admin routes;
- align Node runtime;
- ensure direct refresh works for all reviewed routes;
- preserve `robots.txt` `Disallow: /` for pre-production;
- verify no client secrets;
- test on Chromium, Firefox, and WebKit;
- only then connect/promote a Vercel preview.

Current `robots.txt` correctly blocks all crawling. Keep that until explicit publication approval.

---

## 18. Dependency/security workflow needs to become honest

CI currently reports:

```text
19 vulnerabilities:
1 low
8 moderate
9 high
1 critical
```

This does **not automatically mean the public static app is exploitable**. Some may be dev/transitive/inherited backend dependencies. But it must be triaged.

The current workflow has:

```yaml
npm audit --audit-level=moderate
continue-on-error: true
```

and then tries to upload `npm-audit-report.json` without actually generating that file.

### Required next step

Generate a machine-readable report:

```bash
npm audit --json > npm-audit-report.json
```

Then classify each issue:

- production dependency
- dev-only dependency
- dormant Cloudflare/admin subsystem
- false/unreachable path
- requires safe upgrade
- requires architecture removal

Do not run `npm audit fix --force` blindly.

For release policy, define which severities/path classes are blocking.

---

## 19. CI workflow duplication should be cleaned up after the immediate build fix

The repo currently has both:

- `Quality Gate`
- `Quality Check`

They overlap on:

- Node setup
- dependency install
- typechecking
- lint
- build/test

Duplication is not inherently wrong, but here it causes:

- duplicated build failures;
- different install commands (`npm ci` vs `npm install`);
- repeated dependency setup;
- inconsistent release truth.

### Target

After the current failure is fixed:

- make `npm ci` the canonical clean install;
- define one release-blocking quality workflow;
- keep separate E2E/security workflows if that separation is useful;
- avoid duplicate non-identical definitions of the same gate.

Do this only after obtaining one fully green baseline, so the refactor itself is easy to evaluate.

---

# 20. Rebaselined implementation plan from current head

The old master plan assumed the project was still at `3d433a0`. The latest push implemented much of old Passes 1–3 and pieces of 5–6.

Therefore, **do not restart the old plan from Pass 1**.

Use the following rebaselined sequence.

---

## PASS 0 — CI and state-truth stabilization

**Priority:** P0 / immediate  
**Goal:** make `main` truthfully green before new civic features.

### Tasks

1. Fix `generate:llms` so it runs in a clean Linux CI environment.
2. Select and pin one Node runtime across:
   - `.nvmrc`
   - `.node-version`
   - package engines
   - quality workflows
   - E2E workflow
   - Vercel plan
3. Re-run:
   - clean install
   - civic validation
   - all unit tests
   - TypeScript
   - lint
   - format
   - production build
   - E2E
   - zizmor
4. Fix the Quality Check artifact behavior.
5. Generate a real npm audit JSON report.
6. Update docs so QA claims exactly match remote results.
7. Update Santa Cruz BetterLGU PR references from Planned to **WIP**, while preserving:
   - PR OPEN
   - merged false
8. Record verified head SHA and test counts.

### Files likely touched

- `package.json`
- `.nvmrc`
- `.node-version`
- `.github/workflows/quality.yml`
- `.github/workflows/quality-check.yml`
- possibly `.github/workflows/e2e.yml`
- `scripts/generate-llms-txt.js`
- `scripts/llms-content.ts` or replacement
- `CONTEXT.md`
- `docs/PROJECT_STATUS.md`
- `docs/VERIFICATION_REPORT.md`
- `docs/project/BETTERLGU_REGISTRATION.md`
- `docs/sources/SANTA_CRUZ_SOURCE_INVENTORY.md`

### Exit criteria

- all intended blocking Actions checks green on the same SHA;
- clean `npm ci` works;
- `npm run build` works from clean checkout;
- docs no longer claim Planned for Santa Cruz PR #244;
- docs do not claim a merged PR;
- no feature expansion in this pass.

---

## PASS 1 — Evidence model v2 and source identity hardening

**Priority:** P0  
**Goal:** stabilize semantics before high-volume ingestion.

### Tasks

1. Split overloaded `verificationStatus` into independent dimensions.
2. Add explicit municipality identity to source records:
   - province
   - PSGC
   - resolved identity/evidence
3. Preserve current same-name rejection fixtures.
4. Migrate the current ~25 source records deterministically.
5. Separate source-level state from civic-fact publication state.
6. Introduce review/publication metadata.
7. Add field-level provenance support.
8. Correct executive term provenance:
   - remove unsupported term, or
   - add authoritative term source.
9. Consider moving hardcoded PSA snapshot expectations into reviewed metadata.
10. Separate Pagsanjan research from the production Santa Cruz source ledger.

### Tests

- source authority/access/verification/publication independently vary;
- wrong PSGC fails;
- wrong province fails;
- ambiguous Santa Cruz goes to withheld/staging;
- Pagsanjan never appears in public Santa Cruz selectors;
- field provenance can cite different sources for title vs term;
- existing PSA baseline still validates.

### Exit criteria

No bulk legislation/service/procurement intake begins until this pass is complete.

---

## PASS 2 — Public boundary and schema hardening

**Priority:** P0  
**Goal:** ensure every route/schema matches the static public-release architecture.

### Tasks

1. Build-gate/remove `/admin/*` from public production routing.
2. Fail production build if admin mock mode is enabled.
3. Reconcile weather/forex/services routes with feature/data availability.
4. Strengthen:
   - service schema
   - Citizen's Charter schema
5. Add schemas to CI.
6. Fix SEO:
   - canonical prop
   - blank base URL behavior
   - accurate default description
7. Keep `robots.txt` blocking indexing.
8. Add Vercel security-header plan/config, but do not deploy yet.
9. Make crawler `llms.txt` generation part of a deterministic tested build.

### Exit criteria

A production build contains only intended public surfaces and cannot imply unavailable civic services/backend functionality.

---

## PASS 3 — Santa Cruz SB legislation staging pilot

**Priority:** P1  
**Goal:** activate the highest-value next civic dataset without direct publication.

### Sources

- Santa Cruz SB ordinance endpoint
- Santa Cruz SB resolution endpoint
- linked PDFs / Request-a-Copy state

### Rules

- staging only;
- no direct canonical write;
- no D1 write;
- no bulk public publication.

### Collector requirements

- concurrency 1 initially
- bounded pages
- delay
- retry/backoff
- immediate stop on 403/429
- stable upstream numeric row identity
- content hashing
- version detection
- deterministic HTML parsing
- PDF vs Request-a-Copy distinction
- future-date anomaly flag
- duplicate/collision review
- raw snapshot retention policy
- source identity firewall before staging

### Pilot

Start with a deliberately small sample.

Review:

- source identity
- number
- type
- title
- date
- authors
- tags
- PDF state

Only after fixture tests and manual review should ingestion scale.

### Exit criteria

A repeatable small pilot produces staged/reviewable records with zero canonical mutation.

---

## PASS 4 — Government, office, and Citizen's Charter acquisition

**Priority:** P1  
**Goal:** expand citizen utility using primary sources.

### Workstreams

#### Full current officials roster
Acquire authoritative current:

- SB councilors
- ex-officio members
- term/validity source

Do not fill gaps from unofficial election-return pages alone.

#### Offices
Acquire dated authoritative:

- office list
- department heads
- institutional contacts
- office hours where published

Separate office identity from current officeholder.

#### Citizen's Charter
Find a dated current authoritative Charter from:

- municipal source
- ARTA
- DILG or other direct government archive

Only ingest after Pass 2 schema hardening.

### Exit criteria

Each new public domain has an explicit activation gate and source freshness policy.

---

## PASS 5 — Unified static search and evidence UX

**Priority:** P1  
**Goal:** make the verified corpus genuinely useful without pretending gated data exists.

### Tasks

Generate a static Fuse.js index from published Santa Cruz records only.

Initial index candidates:

- barangays
- mayor
- vice mayor
- population snapshot
- later reviewed legislation pilot
- later reviewed services

Do not index:

- Pagsanjan research
- observed-only source leads as facts
- blocked sources
- withheld records
- dormant BetterLB data

Every result should display or be able to resolve:

- source
- as-of/reference date
- freshness
- record type

Update search copy to exactly match indexed domains.

### Exit criteria

Every hit is a published Santa Cruz record and can be traced to its evidence.

---

## PASS 6 — Transparency pilots

**Priority:** P1/P2  
**Goal:** add transparent public records conservatively, document-first.

### Procurement

Start with reviewed individual PhilGEPS notices, not volatile totals.

Preserve:

- ref ID
- title
- procuring entity
- ABC/amount only when directly present
- dates
- source status
- notice lifecycle/status

### Infrastructure

For DPWH planning/scoping material, explicitly label lifecycle stage:

```text
planning
procurement
awarded
ongoing
completed
unknown
```

Never infer completion from age.

### FDP / COA

Keep discovery work separate until exact Santa Cruz, Laguna documents are obtained.

Do not interpret “not found in this search” as “does not exist.”

### Exit criteria

No dashboard metric exists unless its computation and source universe are stable and reviewable.

---

## PASS 7 — Vercel preview and public-beta gate

**Priority:** final pre-release gate  
**Goal:** produce a tested preview, not an automatic public launch.

### Prerequisites

- all P0 findings resolved
- CI green
- admin absent from public build
- evidence model stable
- accurate search
- no unsupported service/official/contact claims
- security audit triaged

### Tasks

1. Align Node runtime with Vercel.
2. Validate SPA deep-link fallback.
3. Add reviewed security headers.
4. Create a Vercel preview.
5. Keep preview noindex.
6. Test direct refresh:
   - `/sources`
   - `/government/elected-officials`
   - `/government/barangays`
   - a barangay detail route
   - `/statistics/population`
   - `/search`
   - 404
7. Run:
   - Chromium
   - Firefox
   - WebKit
   - 320 / 375 / 768 / 1440 widths
   - keyboard
   - axe
8. Inspect built client bundles for secrets.
9. Set `baseUrl` only after the reviewed deployment URL is known.
10. Generate canonical/sitemap only after base URL approval.

### Public beta decision

A Vercel URL does **not** automatically mean BetterLGU `🟢 Active`.

Keep WIP until:

- useful verified data exists;
- preview QA passes;
- maintenance/review process exists;
- user explicitly approves public launch.

---

# 21. Priority backlog

## P0 — do before any new feature corpus

- Fix broken production build.
- Align Node runtime.
- Get Quality Gate + Quality Check green.
- Correct stale “green CI” documentation.
- Correct BetterLGU Planned → WIP references.
- Separate evidence dimensions.
- Strengthen source identity with explicit PSGC/province.
- Fix executive term provenance.
- Remove/build-gate public admin routes.
- Guard `VITE_ADMIN_MOCK_MODE`.
- Harden service/Charter schemas.
- Fix SEO canonical/baseUrl/default-description behavior.
- Generate/triage real npm audit report.

## P1 — next civic value

- SB legislation staging pilot.
- Full officials roster research.
- Office directory research.
- dated Citizen's Charter acquisition.
- unified published-record Fuse search.
- reviewed PhilGEPS procurement pilot.
- reviewed DPWH planning/infrastructure pilot.
- source freshness policies.
- source-ledger public boundary cleanup.

## P2 — after public-beta foundation

- FDP acquisition workflow.
- COA annual audit archive workflow.
- broader statistics.
- historical population series if official/reproducible.
- automated freshness monitoring that opens issues only.
- remote search only if local Fuse genuinely stops scaling.
- backend/admin decision only when a real mutation workflow is needed.
- production indexing/custom domain/social channels.

---

# 22. Things that should explicitly remain disabled

Until evidence and maintenance justify them:

- D1 writes
- Cloudflare KV writes
- production admin
- automatic canonical promotion
- Meilisearch
- weather
- forex
- tourism
- complete finance dashboards
- emergency contacts without recent re-verification
- unsupported full official roster
- citizen service requirements without a dated Charter
- social links/domain not yet established

The inherited architecture can stay in the repository as dormant capability.

---

# 23. Commit protocol for the next work

Do not repeat a large 20-commit push without checking remote CI between major boundaries.

Recommended sequence:

1. one coherent feature/fix;
2. run targeted test;
3. run local release gate;
4. commit;
5. push at the end of a pass or a small group of tightly related commits;
6. wait for GitHub Actions;
7. inspect failed logs before beginning the next pass;
8. update `CONTEXT.md` only with verified final state.

This is especially important because the latest push's local green state diverged from GitHub's clean Linux build.

---

# 24. Anti-hallucination state snapshot for the next agent

As of this audit:

## Repository
- Public: yes
- Branch: `main`
- Head: `b02c35393bf7cba8ada78b175f43f89e99ddcf62`
- Production deployment: no verified deployment
- Domain: none configured
- Vercel config: present, SPA rewrite only

## BetterLGU
- PR: #244
- State: OPEN
- Mergeable: yes
- Merged: no
- Maintainer: `@Diannn3`
- PR status: `🟡 Work in Progress`
- Repo link: present
- Human review at audit time: none

## Published evidence baseline
- PSGC: `0403426000`
- correspondence code: `043426000`
- 2024 POPCEN: `126844`
- barangays: 26
- mayor: Joseph Kris Benjamin B. Agarao
- vice mayor: Laarni A. Malibiran
- exact PhilGEPS procuring entity identity present

## Still gated
- full council roster
- ex-officio roster
- departments/heads
- current office contacts
- Citizens' Charter
- legislation corpus
- emergency contacts
- finance/FDP
- exact COA AAR
- broad infrastructure publication
- tourism
- non-population statistics

## CI
- unit tests: pass on latest workflow
- TypeScript: pass
- lint: pass
- E2E: pass
- zizmor: pass
- production build: **FAIL**
- Quality Gate: **FAIL**
- Quality Check: **FAIL**

No future agent should claim this head is fully green until a newer successful run is verified.

---

# 25. Recommended prompt for the very next implementation pass

```text
Read CONTEXT.md and BETTERSANTACRUZ_POST_PUSH_AUDIT_NEXT_STEPS.md first.

Implement only PASS 0 — CI and state-truth stabilization. Do not add new civic features, legislation, services, officials, procurement records, or deployment.

Start from current origin/main and verify the head before editing. Reproduce the GitHub build failure from a clean install. Fix the crawler-note generator so the production build never depends on plain Node importing a .ts module it cannot load. Select one supported Node runtime for local development, GitHub Actions, and future Vercel use; strongly evaluate Node 24, and if not compatible use a Node 22 release >=22.19. Align .nvmrc, .node-version, package engines, and all release workflows. Do not paper over engine warnings.

Make Quality Gate and Quality Check deterministic. Prefer npm ci over npm install for release checks. Generate an actual npm-audit-report.json and classify rather than blindly force-upgrading dependencies. Do not merge automated major dependency upgrades without test evidence.

Reconcile documentation with the real external state: BetterLGU PR #244 is OPEN, not merged, and its current PR row/status is Work in Progress with repository Diannn3/betterstacruzlaguna. Remove stale Santa Cruz Planned/repository '-' statements but do not alter Pagsanjan status. Update QA claims only after the exact pushed SHA has green GitHub Actions.

Run and report:
- npm ci
- npm run validate:data
- npm test -- --run
- npx tsc --noEmit
- npm run lint
- npx prettier --check .
- npm run build
- npm run test:e2e
- any workflow/security checks feasible locally

Commit coherent fixes separately. Push only after the local gate is green. Then inspect GitHub Actions and do not declare PASS 0 complete until Quality Gate, Quality Check, E2E, and zizmor are green on the same SHA.

Do not deploy to Vercel. Do not modify BetterLGU PR #244. Do not add a domain. Do not activate admin/D1/Cloudflare. Do not expand the civic dataset in this pass.
```

---

# 26. Final audit conclusion

The latest push **substantially improved BetterSantaCruz** and successfully implemented most of the old identity/baseline foundation. The PSA baseline, provenance work, same-name protection, source UI, and honest empty-state direction are worth keeping.

The next move is **not more data yet**.

First make the repository's technical and evidentiary contracts trustworthy:

1. repair remote CI;
2. make docs reflect remote truth;
3. separate evidence dimensions;
4. strengthen source identity;
5. fix field-level executive provenance;
6. lock down public routes/schemas/SEO;
7. then begin legislation staging.

That sequence minimizes the chance that thousands of incoming records amplify a weak evidence model or that a future Vercel deployment exposes inherited admin/backend surfaces.

**Next canonical gate:** PASS 0 — CI and state-truth stabilization.
