import fs from 'node:fs';
import path from 'node:path';

import {
  collectSource,
  type CollectionResult,
  type SourceKey,
} from './collector';

const PILOT_LIMIT_PER_SOURCE = 20;
const DEFAULT_OUTPUT = 'pipeline/openlgu/sbstacruz-legislation/pilot';

function parseArgs(argv: string[]) {
  let output = DEFAULT_OUTPUT;
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === '--output' && next) {
      output = next;
      index += 1;
    } else if (arg === '--help' || arg === '-h') {
      console.log(
        `Usage: tsx scripts/legislation/sbstacruz/pilot.ts [options]\n\n` +
          `Runs the bounded Data Pass C pilot: at most 20 recent ordinances and 20\n` +
          `recent resolutions using only the characterized public SB DataTables\n` +
          `transport. Output is staging/review material only and is never promoted\n` +
          `to public civic data automatically.\n\n` +
          `Options:\n` +
          `  --output <path>   Ignored pipeline output directory. Default: ${DEFAULT_OUTPUT}\n`
      );
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return { output };
}

function writeJson(filePath: string, value: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function countBy(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function summarize(result: CollectionResult) {
  const anomalyCodes = result.staged.flatMap(record =>
    record.anomalies.map(anomaly => anomaly.code)
  );
  const documentStates = result.staged.map(record => record.document.state);

  return {
    source: result.source.key,
    sourceId: result.source.sourceId,
    sourcePageUrl: result.source.pageUrl,
    status: result.manifest.status,
    error: result.manifest.error,
    requestedLimit: PILOT_LIMIT_PER_SOURCE,
    recordsObserved: result.observations.length,
    recordsStaged: result.staged.length,
    recordsWithAnomalies: result.manifest.recordsWithAnomalies,
    anomalyCounts: countBy(anomalyCodes),
    documentStateCounts: countBy(documentStates),
    missingFieldCounts: {
      sourceNativeId: result.observations.filter(
        record => !record.sourceNativeId
      ).length,
      number: result.staged.filter(record => !record.parsedNumber).length,
      seriesYear: result.staged.filter(record => !record.seriesYear).length,
      title: result.staged.filter(record => !record.titleRaw).length,
      dateEnacted: result.staged.filter(record => !record.dateEnacted).length,
      authors: result.staged.filter(record => record.authors.length === 0)
        .length,
      tags: result.staged.filter(record => record.tagsRaw.length === 0).length,
    },
    warningCounts: countBy(result.warnings.map(warning => warning.code)),
    blockingRecordCount: result.staged.filter(record =>
      record.anomalies.some(anomaly => anomaly.severity === 'blocking')
    ).length,
    publicationStates: countBy(
      result.staged.map(record => record.publication.state)
    ),
  };
}

function writeSourceOutput(
  outputRoot: string,
  key: SourceKey,
  result: CollectionResult
) {
  const sourceDirectory = path.join(outputRoot, key);
  writeJson(path.join(sourceDirectory, 'manifest.json'), result.manifest);
  writeJson(
    path.join(sourceDirectory, 'observations.json'),
    result.observations
  );
  writeJson(path.join(sourceDirectory, 'staged.json'), result.staged);
  writeJson(path.join(sourceDirectory, 'warnings.json'), result.warnings);
  writeJson(path.join(sourceDirectory, 'summary.json'), summarize(result));
}

async function main() {
  const args = parseArgs(process.argv);
  const outputRoot = path.resolve(args.output);
  const startedAt = new Date().toISOString();
  const sourceOrder: SourceKey[] = ['ordinances', 'resolutions'];
  const results: Partial<Record<SourceKey, CollectionResult>> = {};

  for (const sourceKey of sourceOrder) {
    const result = await collectSource({
      sourceKey,
      limit: PILOT_LIMIT_PER_SOURCE,
    });
    results[sourceKey] = result;
    writeSourceOutput(outputRoot, sourceKey, result);

    if (sourceKey !== sourceOrder[sourceOrder.length - 1]) {
      await new Promise(resolve => setTimeout(resolve, 2_500));
    }
  }

  const summaries = sourceOrder.map(sourceKey =>
    summarize(results[sourceKey]!)
  );
  const reviewSummary = {
    schemaVersion: 1,
    purpose: 'Data Pass C bounded SB legislation staging pilot',
    generatedAt: new Date().toISOString(),
    startedAt,
    deterministicSelection: {
      perSourceLimit: PILOT_LIMIT_PER_SOURCE,
      sourceOrder,
      upstreamOrdering:
        'DataTables order[0][column]=3, order[0][dir]=desc as characterized from the public pages',
    },
    safetyBoundaries: {
      authenticationUsed: false,
      accessControlBypassUsed: false,
      concurrency: 1,
      stopOn403: true,
      stopOn429: true,
      hardCollectorRecordCap: 200,
      canonicalPublicationPerformed: false,
      d1WritesPerformed: false,
      kvWritesPerformed: false,
      adminWritesPerformed: false,
    },
    sources: summaries,
    totalObserved: summaries.reduce(
      (total, summary) => total + summary.recordsObserved,
      0
    ),
    totalStaged: summaries.reduce(
      (total, summary) => total + summary.recordsStaged,
      0
    ),
    allRecordsRemainStaged: summaries.every(
      summary =>
        Object.keys(summary.publicationStates).length <= 1 &&
        (summary.publicationStates.staged ?? 0) === summary.recordsStaged
    ),
    requiresHumanReview: true,
  };

  writeJson(path.join(outputRoot, 'review-summary.json'), reviewSummary);
  console.log(JSON.stringify(reviewSummary, null, 2));

  if (summaries.some(summary => summary.status === 'failed')) {
    process.exitCode = 2;
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
