/**
 * EmailPage — Email / SES admin panel (thin orchestrator).
 *
 * Delegates all data and state to tab sub-components:
 *   - SuppressionsTab  — suppression list, add, lookup
 *   - SesDomainTab     — domain lookup, refresh, create
 *   - VerificationTab  — email verification lookup and override
 */

import * as Tabs from '@radix-ui/react-tabs';
import { useEnvironment } from '@/lib/environment';
import { ProdWarning } from '@/components/ui/prod-warning';
import { SuppressionsTab } from './email-components/SuppressionsTab';
import { SesDomainTab } from './email-components/SesDomainTab';
import { VerificationTab } from './email-components/VerificationTab';

const TAB_TRIGGER =
  'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=inactive]:border-transparent data-[state=inactive]:text-muted-foreground hover:data-[state=inactive]:text-foreground';

const TABS = [
  { value: 'suppressions', label: 'Suppressions' },
  { value: 'ses-domain', label: 'SES Domain' },
  { value: 'verification', label: 'Email Verification' },
];

export function EmailPage() {
  const { env, isProduction } = useEnvironment();

  return (
    <div className="p-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Email / SES</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Manage email suppression lists and SES domain / verification status.
        </p>
      </div>

      <ProdWarning env={env} />

      <Tabs.Root defaultValue="suppressions">
        <Tabs.List className="flex gap-1 border-b border-border mb-6">
          {TABS.map((tab) => (
            <Tabs.Trigger key={tab.value} value={tab.value} className={TAB_TRIGGER}>
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="suppressions">
          <SuppressionsTab env={env} isProduction={isProduction} />
        </Tabs.Content>

        <Tabs.Content value="ses-domain">
          <SesDomainTab env={env} isProduction={isProduction} />
        </Tabs.Content>

        <Tabs.Content value="verification">
          <VerificationTab env={env} isProduction={isProduction} />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
