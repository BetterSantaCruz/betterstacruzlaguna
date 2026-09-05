import { describe, expect, it } from 'vitest';

import {
  classifyDocumentState,
  contentHash,
  languageHintFor,
  parseNumberLabel,
  toCollectionObservation,
  toStagedLegislation,
  type RawLegislationPayload,
} from './parse';
import {
  collectionObservationSchema,
  stagedLegislationSchema,
} from './schemas';

const COLLECTED_AT = '2026-09-05T11:30:00.000Z';

function observation(
  rawPayload: RawLegislationPayload,
  documentType: 'ordinance' | 'resolution' = 'resolution'
) {
  return toCollectionObservation({
    documentType,
    sourceId:
      documentType === 'ordinance'
        ? 'sc-sb-ordinances'
        : 'sc-sb-resolutions',
    sourceKey:
      documentType === 'ordinance'
        ? 'sbstacruz-ordinances'
        : 'sbstacruz-resolutions',
    pageUrl: `https://www.sbstacruz.com/${
      documentType === 'ordinance' ? 'ordinances' : 'resolutions'
    }`,
    endpointUrl: `https://www.sbstacruz.com/${
      documentType === 'ordinance' ? 'ordinancesData' : 'resolutionsData'
    }`,
    httpStatus: 200,
    rawPayload,
    runId: 'pilot-test',
    collectedAt: COLLECTED_AT,
  });
}

describe('Santa Cruz SB staging invariants', () => {
  it('preserves raw number labels while parsing S and T series tokens without assigning semantics', () => {
    expect(parseNumberLabel('Resolution No. 175 -S2026')).toEqual({
      rawNumberLabel: 'Resolution No. 175 -S2026',
      parsedNumber: '175',
      seriesCode: 'S',
      seriesYear: 2026,
    });

    expect(parseNumberLabel("KAPASIYAHAN BLG. 056-T'2009")).toEqual({
      rawNumberLabel: "KAPASIYAHAN BLG. 056-T'2009",
      parsedNumber: '056',
      seriesCode: 'T',
      seriesYear: 2009,
    });
  });

  it('does not invent an enactment date from a number-series year', () => {
    const staged = toStagedLegislation(
      observation({
        sourceNativeId: 1,
        numberLabel: 'Resolution No. 175 -S2026',
        title: 'Observed title',
        approvedDate: '',
      }),
      'resolution'
    );

    expect(staged.seriesYear).toBe(2026);
    expect(staged.dateEnacted).toBeNull();
    expect(staged.dateEvidence).toBe('unknown');
  });

  it('treats English and Filipino wording as language hints, not equivalence evidence', () => {
    expect(languageHintFor('Resolution No. 1-S2026', 'A RESOLUTION')).toBe(
      'en'
    );
    expect(
      languageHintFor('KAPASIYAHAN BLG. 001-T2026', 'KAPASIYAHANG PINAGTITIBAY')
    ).toBe('fil');
  });

  it('keeps logical identity stable when the source-native record changes content', () => {
    const first = observation({
      sourceNativeId: 98533,
      numberLabel: 'Resolution No. 175-S2026',
      title: 'First observed title',
    });
    const changed = observation({
      sourceNativeId: 98533,
      numberLabel: 'Resolution No. 175-S2026',
      title: 'Changed upstream title',
    });

    expect(first.logicalRecordKey).toBe(changed.logicalRecordKey);
    expect(first.logicalRecordKey).toBe('native:98533');
    expect(first.contentHash).not.toBe(changed.contentHash);
  });

  it('keeps Request a Copy distinct from a publicly available PDF', () => {
    expect(classifyDocumentState('Request a Copy', null)).toEqual({
      state: 'request-copy',
      url: null,
    });
    expect(
      classifyDocumentState(
        'View PDF',
        'https://www.sbstacruz.com/files/example.pdf'
      )
    ).toEqual({
      state: 'pdf-available',
      url: 'https://www.sbstacruz.com/files/example.pdf',
    });
  });

  it('flags collective authors, duplicate author roles, future dates, and year mismatches for review', () => {
    const staged = toStagedLegislation(
      observation({
        sourceNativeId: 2,
        numberLabel: 'Resolution No. 2-S2025',
        title: 'Observed title',
        approvedDate: '2027-01-01',
        authors: ['Sangguniang Bayan', 'Hon. Example Person'],
        coAuthors: ['Hon. Example Person'],
        actionText: 'Request a Copy',
      }),
      'resolution'
    );

    const anomalyCodes = staged.anomalies.map(item => item.code);
    expect(anomalyCodes).toContain('collective_author_unresolved');
    expect(anomalyCodes).toContain('author_coauthor_duplicate');
    expect(anomalyCodes).toContain('future_document_date');
    expect(anomalyCodes).toContain('date_series_year_mismatch');
    expect(anomalyCodes).toContain('request_copy_no_public_file');
  });

  it('produces deterministic hashes and schema-valid staged records', () => {
    const raw = {
      sourceNativeId: 3,
      numberLabel: 'Ordinance No. 3-S2026',
      title: 'Observed ordinance title',
      approvedDate: '2026-08-01',
      authors: ['Hon. Example Person'],
      tags: ['Public record'],
      actionText: 'Request a Copy',
    };
    const firstHash = contentHash(raw);
    const secondHash = contentHash({ ...raw });
    expect(firstHash).toBe(secondHash);

    const observed = observation(raw, 'ordinance');
    const staged = toStagedLegislation(observed, 'ordinance');
    expect(collectionObservationSchema.safeParse(observed).success).toBe(true);
    expect(stagedLegislationSchema.safeParse(staged).success).toBe(true);
    expect(staged.publication.state).toBe('staged');
    expect(staged.evidence.verification).toBe('single-source');
  });
});
