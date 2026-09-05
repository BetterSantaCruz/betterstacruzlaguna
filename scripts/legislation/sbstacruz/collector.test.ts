import { describe, expect, it, vi } from 'vitest';

import {
  SOURCES,
  assertAllowedUrl,
  collectSource,
  parseDetailsCell,
  parseSponsorsCell,
  rowToRawPayload,
} from './collector';

function sourcePage(status = 200) {
  return new Response(
    '<html><title>Santa Cruz Laguna</title><body>Republic of the Philippines Santa Cruz LAGUNA</body></html>',
    {
      status,
      headers: { 'content-type': 'text/html' },
    }
  );
}

type RowOptions = {
  sourceType?: string;
  numberLabel?: string;
  approved?: string;
};

function row(id: number, options: RowOptions = {}) {
  const sourceType = options.sourceType ?? 'Resolution';
  const numberLabel = options.numberLabel ?? `Kapasiyahan Blg. ${id} -T'2025`;
  const approved = options.approved ?? 'June 23, 2026';

  return [
    id,
    `<div><b>Type:</b><br>${sourceType}<br><b>Number:</b><br>${numberLabel}<br><b>Category:</b><br>Public</div>`,
    `<div>Observed title ${id}</div>`,
    `<div><b>Main Sponsor:</b><br><ul><li><a href="author/1">HON. MAIN SPONSOR</a></li></ul><b>Co-Sponsor:</b><br><ul><li><a href="author/2">HON. CO SPONSOR</a></li></ul></div>`,
    '<span class="badge">Budget, Expenditures</span>',
    approved,
    `<a href="/documents/request/${id}">Request a Copy</a>`,
  ];
}

function ordinanceRow(id: number) {
  return row(id, {
    sourceType: 'Ordinance',
    numberLabel: `Kautusang Bayan Blg. ${id} - T'2025`,
  });
}

function dataResponse(rows: unknown[][], status = 200) {
  return new Response(
    JSON.stringify({
      draw: 1,
      recordsTotal: rows.length,
      recordsFiltered: rows.length,
      data: rows,
    }),
    {
      status,
      headers: { 'content-type': 'application/json' },
    }
  );
}

const noSleep = vi.fn(async () => undefined);
const fixedNow = () => new Date('2026-09-05T11:45:00.000Z');

describe('Santa Cruz SB characterized row parsing', () => {
  it('extracts the explicit Details labels without inventing a detail URL', () => {
    expect(parseDetailsCell(row(98533)[1])).toEqual({
      sourceDocumentType: 'Resolution',
      numberLabel: "Kapasiyahan Blg. 98533 -T'2025",
      sourceCategory: 'Public',
    });

    const payload = rowToRawPayload(row(98533));
    expect(payload.detailUrl).toBeNull();
    expect(payload.sourceNativeId).toBe('98533');
    expect(payload.sourceCategory).toBe('Public');
  });

  it('maps explicitly labelled Main Sponsor and Co-Sponsor roles separately', () => {
    expect(parseSponsorsCell(row(1)[3])).toEqual({
      mainSponsors: ['HON. MAIN SPONSOR'],
      coSponsors: ['HON. CO SPONSOR'],
    });

    const payload = rowToRawPayload(row(1));
    expect(payload.authors).toEqual(['HON. MAIN SPONSOR']);
    expect(payload.coAuthors).toEqual(['HON. CO SPONSOR']);
  });

  it('preserves Request a Copy as raw evidence rather than calling it a public document', () => {
    const sourceRow = row(98533);
    const payload = rowToRawPayload(sourceRow);

    expect(payload.actionText).toBe('Request a Copy');
    expect(payload.documentUrl).toBeNull();
    expect(payload.rawActionHref).toBe(
      'https://www.sbstacruz.com/documents/request/98533'
    );
    expect(payload.rawRow).toEqual(sourceRow);
  });

  it('preserves tags and the exact upstream approved-date text for later validation', () => {
    const payload = rowToRawPayload(
      row(9, { approved: 'December 22, 2026' })
    );

    expect(payload.tags).toEqual(['Budget, Expenditures']);
    expect(payload.approvedDate).toBe('December 22, 2026');
  });
});

describe('Santa Cruz SB bounded collector', () => {
  it('collects only the requested rows and keeps every result staged', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(sourcePage())
      .mockResolvedValueOnce(dataResponse([row(1), row(2)]));

    const result = await collectSource({
      sourceKey: 'resolutions',
      limit: 2,
      fetchImpl,
      sleep: noSleep,
      delayMs: 0,
      now: fixedNow,
    });

    expect(result.manifest.status).toBe('success');
    expect(result.manifest.recordsObserved).toBe(2);
    expect(result.manifest.recordsStaged).toBe(2);
    expect(result.observations).toHaveLength(2);
    expect(result.staged.every(item => item.publication.state === 'staged')).toBe(
      true
    );
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('adds a blocking identity anomaly when Details Type contradicts the source', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(sourcePage())
      .mockResolvedValueOnce(dataResponse([row(1, { sourceType: 'Ordinance' })]));

    const result = await collectSource({
      sourceKey: 'resolutions',
      limit: 1,
      fetchImpl,
      sleep: noSleep,
      delayMs: 0,
      now: fixedNow,
    });

    expect(result.staged[0].anomalies).toContainEqual(
      expect.objectContaining({
        code: 'source_identity_mismatch',
        severity: 'blocking',
      })
    );
  });

  it('accepts the explicitly observed ordinance Type on the ordinance source', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(sourcePage())
      .mockResolvedValueOnce(dataResponse([ordinanceRow(362)]));

    const result = await collectSource({
      sourceKey: 'ordinances',
      limit: 1,
      fetchImpl,
      sleep: noSleep,
      delayMs: 0,
      now: fixedNow,
    });

    expect(
      result.staged[0].anomalies.some(
        anomaly => anomaly.code === 'source_identity_mismatch'
      )
    ).toBe(false);
  });

  it('refuses non-whitelisted hosts and paths before network access', () => {
    expect(() =>
      assertAllowedUrl(
        'https://example.com/resolutionsData',
        SOURCES.resolutions
      )
    ).toThrow('non-whitelisted host');
    expect(() =>
      assertAllowedUrl(
        'https://www.sbstacruz.com/admin',
        SOURCES.resolutions
      )
    ).toThrow('non-whitelisted path');
    expect(
      assertAllowedUrl(
        'https://www.sbstacruz.com/resolutionsData?start=0',
        SOURCES.resolutions
      ).pathname
    ).toBe('/resolutionsData');
  });

  it('stops immediately on HTTP 403 instead of retrying or bypassing', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(sourcePage())
      .mockResolvedValueOnce(new Response('Forbidden', { status: 403 }));

    const result = await collectSource({
      sourceKey: 'ordinances',
      limit: 20,
      fetchImpl,
      sleep: noSleep,
      delayMs: 0,
      now: fixedNow,
    });

    expect(result.manifest.status).toBe('failed');
    expect(result.manifest.http403).toBe(1);
    expect(result.manifest.recordsObserved).toBe(0);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('stops immediately on HTTP 429 instead of retrying or evading rate limits', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(sourcePage())
      .mockResolvedValueOnce(new Response('Too Many Requests', { status: 429 }));

    const result = await collectSource({
      sourceKey: 'resolutions',
      limit: 20,
      fetchImpl,
      sleep: noSleep,
      delayMs: 0,
      now: fixedNow,
    });

    expect(result.manifest.status).toBe('failed');
    expect(result.manifest.http429).toBe(1);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('retries transient 5xx responses only within the bounded retry budget', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(sourcePage())
      .mockResolvedValueOnce(new Response('Temporary', { status: 503 }))
      .mockResolvedValueOnce(new Response('Temporary', { status: 502 }))
      .mockResolvedValueOnce(dataResponse([row(1)]));

    const sleep = vi.fn(async () => undefined);
    const result = await collectSource({
      sourceKey: 'resolutions',
      limit: 1,
      fetchImpl,
      sleep,
      delayMs: 0,
      now: fixedNow,
    });

    expect(result.manifest.status).toBe('success');
    expect(result.manifest.recordsObserved).toBe(1);
    expect(fetchImpl).toHaveBeenCalledTimes(4);
    expect(sleep).toHaveBeenCalledWith(1_000);
    expect(sleep).toHaveBeenCalledWith(2_000);
  });

  it('rejects non-JSON and unexpected response shapes without staging records', async () => {
    const nonJsonFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(sourcePage())
      .mockResolvedValueOnce(
        new Response('<html>not json</html>', {
          status: 200,
          headers: { 'content-type': 'text/html' },
        })
      );

    const nonJson = await collectSource({
      sourceKey: 'ordinances',
      limit: 1,
      fetchImpl: nonJsonFetch,
      sleep: noSleep,
      delayMs: 0,
      now: fixedNow,
    });
    expect(nonJson.manifest.shapeFailures).toBe(1);
    expect(nonJson.staged).toHaveLength(0);

    const wrongShapeFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(sourcePage())
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [['too', 'short']] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      );

    const wrongShape = await collectSource({
      sourceKey: 'ordinances',
      limit: 1,
      fetchImpl: wrongShapeFetch,
      sleep: noSleep,
      delayMs: 0,
      now: fixedNow,
    });
    expect(wrongShape.manifest.shapeFailures).toBe(1);
    expect(wrongShape.staged).toHaveLength(0);
  });

  it('flags duplicate source identities and logical keys inside a run', async () => {
    const duplicate = row(7);
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(sourcePage())
      .mockResolvedValueOnce(dataResponse([duplicate, duplicate]));

    const result = await collectSource({
      sourceKey: 'resolutions',
      limit: 2,
      fetchImpl,
      sleep: noSleep,
      delayMs: 0,
      now: fixedNow,
    });

    expect(result.warnings.map(item => item.code)).toContain(
      'duplicate_source_native_id'
    );
    expect(result.warnings.map(item => item.code)).toContain(
      'duplicate_logical_key'
    );
    expect(result.staged[1].anomalies.map(item => item.code)).toContain(
      'duplicate_logical_key'
    );
  });

  it('refuses collection limits above the hard safety cap before any request', async () => {
    const fetchImpl = vi.fn<typeof fetch>();

    await expect(
      collectSource({
        sourceKey: 'resolutions',
        limit: 201,
        fetchImpl,
        sleep: noSleep,
        delayMs: 0,
        now: fixedNow,
      })
    ).rejects.toThrow('hard safety cap 200');
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
