import { z } from 'zod';

export const anomalyCodes = [
  'missing_number',
  'missing_title',
  'missing_series_year',
  'unknown_series_code',
  'future_document_date',
  'date_series_year_mismatch',
  'duplicate_logical_key',
  'possible_language_variant_duplicate',
  'source_record_changed',
  'source_record_disappeared',
  'author_parse_ambiguous',
  'collective_author_unresolved',
  'author_coauthor_duplicate',
  'document_link_broken',
  'request_copy_no_public_file',
  'unexpected_document_link',
  'pagination_gap',
  'unexpected_response_shape',
  'source_identity_mismatch',
  'empty_record',
] as const;

export const anomalyCodeSchema = z.enum(anomalyCodes);
export type AnomalyCode = z.infer<typeof anomalyCodeSchema>;

export const anomalySeveritySchema = z.enum(['info', 'review', 'blocking']);
export type AnomalySeverity = z.infer<typeof anomalySeveritySchema>;

export const santaCruzLegislationIdentitySchema = z.object({
  name: z.literal('Santa Cruz'),
  province: z.literal('Laguna'),
  psgc10: z.literal('0403426000'),
});

export const collectionObservationSchema = z.object({
  observationId: z.string().min(1),
  sourceId: z.enum(['sc-sb-ordinances', 'sc-sb-resolutions']),
  sourceKey: z.enum(['sbstacruz-ordinances', 'sbstacruz-resolutions']),
  municipality: santaCruzLegislationIdentitySchema,
  logicalRecordKey: z.string().min(1),
  sourceNativeId: z.string().min(1).nullable(),
  sourceRecordUrl: z.string().url().nullable(),
  collectedAt: z.string().datetime({ offset: true }),
  collectorVersion: z.string().min(1),
  runId: z.string().min(1),
  contentHash: z.string().regex(/^sha256:[0-9a-f]{64}$/),
  rawPayload: z.record(z.unknown()),
  transport: z.object({
    pageUrl: z.string().url(),
    endpointUrl: z.string().url().nullable(),
    httpStatus: z.number().int().min(100).max(599).nullable(),
  }),
});

export type CollectionObservation = z.infer<typeof collectionObservationSchema>;

export const stagedPersonNameSchema = z.object({
  rawName: z.string().min(1),
  normalizedCandidate: z.string().min(1).nullable(),
});

export const stagedLegislationSchema = z.object({
  stagedId: z.string().min(1),
  observationId: z.string().min(1),
  municipality: santaCruzLegislationIdentitySchema,
  documentType: z.enum(['ordinance', 'resolution']),
  sourceNativeId: z.string().min(1).nullable(),
  rawNumberLabel: z.string(),
  parsedNumber: z.string().min(1).nullable(),
  seriesCode: z.string().min(1).nullable(),
  seriesYear: z.number().int().min(1900).max(2100).nullable(),
  candidateDocumentKey: z.string().min(1),
  titleRaw: z.string(),
  titleNormalized: z.string(),
  languageHint: z.enum(['en', 'fil', 'mixed', 'unknown']),
  dateEnacted: z.string().date().nullable(),
  dateEvidence: z.enum(['explicit-field', 'detail-page', 'unknown']),
  authors: z.array(stagedPersonNameSchema),
  coAuthors: z.array(stagedPersonNameSchema),
  tagsRaw: z.array(z.string()),
  tagsNormalized: z.array(z.string()),
  document: z.object({
    state: z.enum([
      'pdf-available',
      'request-copy',
      'metadata-only',
      'unavailable',
    ]),
    url: z.string().url().nullable(),
  }),
  evidence: z.object({
    sourceIds: z.array(z.string().min(1)).min(1),
    verification: z.enum(['unverified', 'single-source']),
    assertionType: z.literal('direct'),
  }),
  publication: z.object({
    state: z.literal('staged'),
  }),
  anomalies: z.array(
    z.object({
      code: anomalyCodeSchema,
      severity: anomalySeveritySchema,
      note: z.string().nullable(),
    })
  ),
  contentHash: z.string().regex(/^sha256:[0-9a-f]{64}$/),
  firstSeenAt: z.string().datetime({ offset: true }),
  lastSeenAt: z.string().datetime({ offset: true }),
});

export type StagedLegislation = z.infer<typeof stagedLegislationSchema>;

export const collectionRunManifestSchema = z.object({
  schemaVersion: z.literal(1),
  runId: z.string().min(1),
  collectorVersion: z.string().min(1),
  startedAt: z.string().datetime({ offset: true }),
  finishedAt: z.string().datetime({ offset: true }),
  sourceId: z.string().min(1),
  sourcePageUrl: z.string().url(),
  collectionMode: z.enum(['public-json', 'browser-dom', 'server-rendered']),
  requestedPages: z.number().int().min(0),
  successfulPages: z.number().int().min(0),
  recordsObserved: z.number().int().min(0),
  recordsStaged: z.number().int().min(0),
  recordsWithAnomalies: z.number().int().min(0),
  http429: z.number().int().min(0),
  http403: z.number().int().min(0),
  shapeFailures: z.number().int().min(0),
  status: z.enum(['success', 'partial', 'failed']),
  error: z.string().nullable(),
});

export type CollectionRunManifest = z.infer<typeof collectionRunManifestSchema>;
