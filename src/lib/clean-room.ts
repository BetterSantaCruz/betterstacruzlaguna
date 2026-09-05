const INHERITED_CLAIM_PATTERNS = [
  /Los Baños|Los Banos/i,
  /Better\s*LB/i,
  /Science\s+and\s+Nature City/i,
] as const;

export interface TextFileSnapshot {
  path: string;
  contents: string;
}

/** Return publishable file paths that still contain inherited local claims. */
export function findInheritedClaimPaths(
  files: readonly TextFileSnapshot[]
): string[] {
  return files
    .filter(file =>
      INHERITED_CLAIM_PATTERNS.some(pattern => pattern.test(file.contents))
    )
    .map(file => file.path);
}
