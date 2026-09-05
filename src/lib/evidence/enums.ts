export const sourceAuthorities = [
  'primary-official',
  'secondary-reputable',
  'civic-index',
  'community',
  'unknown',
] as const;
export type SourceAuthority = (typeof sourceAuthorities)[number];

export const sourceAccessStates = [
  'not-checked',
  'reachable',
  'partially-rendered',
  'blocked',
  'auth-redirect',
  'unreachable',
] as const;
export type SourceAccessState = (typeof sourceAccessStates)[number];

export const sourceReviewStates = [
  'unreviewed',
  'needs-review',
  'reviewed',
  'rejected',
] as const;
export type SourceReviewState = (typeof sourceReviewStates)[number];

export const sourceLedgerStates = ['withheld', 'listed'] as const;
export type SourceLedgerState = (typeof sourceLedgerStates)[number];

export const factVerificationStates = [
  'unverified',
  'single-source',
  'corroborated',
  'disputed',
] as const;
export type FactVerificationState = (typeof factVerificationStates)[number];

export const assertionTypes = [
  'direct',
  'derived',
  'corroborative',
  'contextual',
] as const;
export type AssertionType = (typeof assertionTypes)[number];

export const publicationStates = [
  'withheld',
  'staged',
  'review-ready',
  'published',
  'superseded',
  'retracted',
] as const;
export type PublicationState = (typeof publicationStates)[number];

export const freshnessStates = [
  'fresh',
  'review-due',
  'stale',
  'expired',
] as const;
export type FreshnessState = (typeof freshnessStates)[number];

export const identityResolutionMethods = [
  'explicit-psgc',
  'official-entity-id',
  'exact-official-name',
  'document-context',
  'manual-review',
] as const;
export type IdentityResolutionMethod =
  (typeof identityResolutionMethods)[number];
