import { describe, expect, it, vi } from 'vitest';

import { collectSource, rowToRawPayload } from './collector';

function sourcePage(status = 200) {
  return new Response(
    '<html><title>Santa Cruz Laguna</title><body>Santa Cruz LAGUNA</body></html>',
    {
      status,
      headers: { 'content-type': 'text/html' },
    }
  );
}

function row(id: number, number = `Resolution No. ${id}-S2026`) {
  return [
    id,
    `<a href="/resolution/${id}">${number}</a>`,
    `Observed title ${id}`,
    'Hon. Example Person',
    'Public Record',
    '2026-08-01',
    '<a href="/contact">Request a Copy</a>',
  ];
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

describe('Santa Cruz SB bounded collector', () => {
  it('maps the seven observed DataTables columns without inventing co-authors', () => {
    const payload = rowToRawPayload(row(98533));

    expect(payload.sourceNativeId).toBe('98533');
    expect(payload.numberLabel).toBe('Resolution No. 98533-S2026');
    expect(payload.title).toBe('Observed title 98533');
    expect(payload.authors).toBe('Hon. Example Person');
    expect(payload.coAuthors).toEqual([]);
    expect(payload.actionText).toBe('Request a Copy');
    expect(payload.documentUrl).toBeNull();
    expect(payload.rawActionHref).toBe('https://www.sbstacruz.com/contact');
    expect(payload.rawRow).toEqual(row(98533));
  });

  it('collects only the requested bounded pilot rows and keeps them staged', async () => {
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
