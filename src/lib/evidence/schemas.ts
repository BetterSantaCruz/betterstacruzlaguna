import { z } from 'zod';

import { SANTA_CRUZ_IDENTITY, assertSantaCruzIdentity } from '../municipality-identity';
import {
  assertionTypes,
  factVerificationStates,
  identityResolutionMethods,
  publicationStates,
  sourceAccessStates,
  sourceAuthorities,
  sourceLedgerStates,
  sourceReviewStates,
} from './enums';

const dateSchema = z.string().date();
const dateTimeSchema = z.string().datetime({ offset: true });

export const municipalityIdentitySchema = z.object({
  municipality: z.literal('Santa Cruz'),
  province: z.literal('Laguna'),
  region: z.literal('Region IV-A'),
  regionName: z.literal('CALABARZON'),
  municipalityPsgc: z.literal(SANTA_CRUZ_IDENTITY.psgc10),
  correspondenceCode: z.literal(SANTA_CRUZ_IDENTITY.correspondenceCode).nullable(),
});

export const sourceAccessSchema = z
  .object({
    state: z.enum(sourceAccessStates),
    checkedAt: dateSchema.nullable(),
    httpStatus: z.number().int().min(100).max(599).nullable(),
    note: z.string().min(1).nullable(),
  })
  .superRefine((access, ctx) => {
    if (access.state === 'not-checked' && access.checkedAt !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'not-checked access must not have checkedAt',
        path: ['checkedAt'],
      });
    }
    if (access.state !== 'not-checked' && access.checkedAt === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${access.state} access requires checkedAt`,
        path: ['checkedAt'],
      });
    }
  });

export const civicSourceSchema = z.object({
  sourceId: z.string().min(1),
  sourceTitle: z.string().min(1),
  sourceUrl: z
    .string()
    .url()
    .refine(url => /^https?:\/\//i.test(url), 'sourceUrl must use HTTP(S)'),
  sourceOrganization: z.string().min(1),
  sourceType: z.string().min(1),
  identity: municipalityIdentitySchema,
  identityResolution: z.object({
    observedLocation: z.string().min(1).nullable(),
    resolutionMethod: z.enum(identityResolutionMethods),
    evidenceSourceIds: z.array(z.string().min(1)),
    note: z.string().min(1).nullable(),
  }),
  categories: z.array(z.string().min(1)).min(1),
  authority: z.enum(sourceAuthorities),
  access: sourceAccessSchema,
  reviewState: z.enum(sourceReviewStates),
  ledgerState: z.enum(sourceLedgerStates),
  publishedAt: dateTimeSchema.nullable(),
  retrievedAt: dateSchema,
  lastVerifiedAt: dateSchema,
  archive: z.object({
    filename: z.string().min(1).nullable(),
    sha256: z
      .string()
      .regex(/^sha256:[a-f0-9]{64}$/)
      .nullable(),
  }),
  notes: z.string().min(1),
});

export const sourceRegistrySchema = z.object({
  schemaVersion: z.literal(2),
  sources: z.array(civicSourceSchema),
});

export const fieldProvenanceSchema = z.object({
  sourceIds: z.array(z.string().min(1)).min(1),
  assertionType: z.enum(assertionTypes),
  note: z.string().min(1).nullable(),
});

export const freshnessMetadataSchema = z
  .object({
    lastVerifiedAt: dateSchema,
    reviewCadenceDays: z.number().int().positive().nullable(),
    validFrom: dateSchema.nullable(),
    validUntil: dateSchema.nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.validFrom && value.validUntil && value.validFrom > value.validUntil) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'validFrom must not be after validUntil',
        path: ['validUntil'],
      });
    }
  });

export const civicFactSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  value: z.union([z.string().min(1), z.number().finite(), z.boolean()]),
  evidence: z
    .object({
      sourceIds: z.array(z.string().min(1)).min(1),
      verification: z.enum(factVerificationStates),
      assertionType: z.enum(assertionTypes),
      note: z.string().min(1).nullable(),
    })
    .superRefine((evidence, ctx) => {
      const uniqueIds = new Set(evidence.sourceIds);
      if (uniqueIds.size !== evidence.sourceIds.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'evidence sourceIds must be unique',
          path: ['sourceIds'],
        });
      }
      if (evidence.verification === 'single-source' && evidence.sourceIds.length !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'single-source verification requires exactly one source',
          path: ['sourceIds'],
        });
      }
      if (evidence.verification === 'corroborated' && evidence.sourceIds.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'corroborated verification requires at least two sources',
          path: ['sourceIds'],
        });
      }
    }),
  publication: z.object({ state: z.enum(publicationStates) }),
  freshness: freshnessMetadataSchema,
});

export const civicRegistrySchema = z.object({
  schemaVersion: z.literal(2),
  municipality: z.object({
    name: z.literal('Santa Cruz'),
    province: z.literal('Laguna'),
    psgc10: z.literal(SANTA_CRUZ_IDENTITY.psgc10),
  }),
  facts: z.array(civicFactSchema),
});

export type MunicipalityIdentity = z.infer<typeof municipalityIdentitySchema>;
export type CivicSource = z.infer<typeof civicSourceSchema>;
export type SourceRegistry = z.infer<typeof sourceRegistrySchema>;
export type FieldProvenance = z.infer<typeof fieldProvenanceSchema>;
export type FreshnessMetadata = z.infer<typeof freshnessMetadataSchema>;
export type CivicFact = z.infer<typeof civicFactSchema>;
export type CivicRegistry = z.infer<typeof civicRegistrySchema>;

export function assertSourceIdentity(source: CivicSource): void {
  assertSantaCruzIdentity({
    ...source.identity,
    sourceTitle: source.sourceTitle,
    sourceOrganization: source.sourceOrganization,
    observedLocation: source.identityResolution.observedLocation,
    notes: source.notes,
  });
}
