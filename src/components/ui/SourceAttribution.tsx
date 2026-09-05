import { ExternalLink, ShieldCheck } from 'lucide-react';

import { Badge } from './Badge';

export interface SourceAttributionData {
  sourceId: string;
  sourceTitle: string;
  sourceUrl: string;
  sourceOrganization: string;
  retrievedAt: string;
  lastVerifiedAt: string;
  verificationStatus: string;
}

interface SourceAttributionProps {
  source: SourceAttributionData;
  className?: string;
}

const statusVariants = {
  verified: 'success',
  observed: 'warning',
  pending: 'warning',
  'access-restricted': 'error',
  unreachable: 'error',
  'discovery-only': 'slate',
  secondary: 'slate',
  collaboration: 'primary',
} as const;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'long',
    timeZone: 'Asia/Manila',
  }).format(new Date(`${value}T00:00:00+08:00`));
}

export function SourceAttribution({
  source,
  className = '',
}: SourceAttributionProps) {
  const variant =
    statusVariants[source.verificationStatus as keyof typeof statusVariants] ??
    'slate';

  return (
    <aside
      role='note'
      aria-label='Source attribution'
      className={`border-kapwa-border-weak bg-kapwa-bg-surface-raised flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-start sm:justify-between ${className}`}
    >
      <div className='flex min-w-0 items-start gap-3'>
        <ShieldCheck
          className='text-kapwa-text-brand mt-0.5 h-5 w-5 shrink-0'
          aria-hidden='true'
        />
        <div className='min-w-0'>
          <div className='mb-1 flex flex-wrap items-center gap-2'>
            <span className='text-kapwa-text-disabled text-[10px] font-bold tracking-widest uppercase'>
              Source attribution
            </span>
            <Badge variant={variant} dot>
              {source.verificationStatus}
            </Badge>
          </div>
          <a
            href={source.sourceUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='text-kapwa-text-strong hover:text-kapwa-text-brand inline-flex items-start gap-1 text-sm leading-snug font-bold underline underline-offset-2'
          >
            <span>{source.sourceTitle}</span>
            <ExternalLink
              className='mt-0.5 h-3.5 w-3.5 shrink-0'
              aria-hidden='true'
            />
          </a>
          <p className='text-kapwa-text-support mt-1 text-xs'>
            {source.sourceOrganization} · Source ID: {source.sourceId}
          </p>
          <p className='text-kapwa-text-support mt-1 text-xs'>
            Retrieved {formatDate(source.retrievedAt)} · Last checked{' '}
            {formatDate(source.lastVerifiedAt)}
          </p>
        </div>
      </div>
    </aside>
  );
}
