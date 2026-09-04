import { Outlet, useLocation } from 'react-router-dom';

import { PageHeader } from '@/components/layout';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { DataStatus } from '@/components/ui/DataStatus';
import { config } from '@/lib/lguConfig';

import TransparencySidebar from './components/TransparencySidebar';
import { lguLabels } from '@/lib/lguLabels';

export default function TransparencyLayout() {
  const location = useLocation();
  const isIndexPage = location.pathname === '/transparency';

  return (
    <SidebarLayout
      sidebar={<TransparencySidebar />}
      collapsible={true}
      defaultCollapsed={!isIndexPage}
      // Unified header using PageHeader component
      headerNode={
        isIndexPage ? (
          <PageHeader
            variant='centered'
            title='Transparency Module'
            description={`The ${lguLabels.name} transparency module is kept unavailable until its source records and verification workflow are ready.`}
          />
        ) : (
          <PageHeader
            variant='compact'
            title='Transparency Module'
            description='Source-backed municipal funds, infrastructure, and procurement records are not published yet.'
            autoBreadcrumbs={true}
          />
        )
      }
    >
      {config.features.transparency ? (
        <Outlet />
      ) : (
        <DataStatus
          title='Transparency data is not published yet'
          message='This feature remains disabled while BetterSantaCruz establishes verified source records. The project will not show inherited sample budgets, contracts, infrastructure records, or changing aggregate totals.'
          sourceHref='/sources'
        />
      )}
    </SidebarLayout>
  );
}
