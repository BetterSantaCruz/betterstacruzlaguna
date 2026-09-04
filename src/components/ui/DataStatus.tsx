import { Info } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DataStatusProps {
  title?: string;
  message: string;
  sourceHref?: string;
  sourceLabel?: string;
}

export function DataStatus({
  title = 'Data currently being verified',
  message,
  sourceHref,
  sourceLabel = 'View source ledger',
}: DataStatusProps) {
  return (
    <div
      role='status'
      className='border-kapwa-border-weak bg-kapwa-bg-surface-raised flex flex-col items-start gap-3 rounded-2xl border p-5 sm:flex-row sm:items-start'
    >
      <Info
        className='text-kapwa-text-brand mt-0.5 h-5 w-5 shrink-0'
        aria-hidden='true'
      />
      <div>
        <h3 className='text-kapwa-text-strong font-bold'>{title}</h3>
        <p className='text-kapwa-text-support mt-1 text-sm leading-relaxed'>
          {message}
        </p>
        {sourceHref && (
          <Link
            to={sourceHref}
            className='text-kapwa-text-brand mt-3 inline-flex min-h-11 items-center font-semibold underline underline-offset-2'
          >
            {sourceLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
