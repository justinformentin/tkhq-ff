/**
 * EmailPage — Email / SES admin panel (thin orchestrator).
 *
 * Delegates all data and state to tab sub-components:
 *   - SuppressionsTab  — suppression list, add, lookup
 *   - SesDomainTab     — domain lookup, refresh, create
 *   - VerificationTab  — email verification lookup and override
 */

import { useEnvironment } from '@/lib/environment';
import { ProdWarning } from '@/components/ui/prod-warning';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SuppressionsTab } from './email-components/SuppressionsTab';
import { SesDomainTab } from './email-components/SesDomainTab';
import { VerificationTab } from './email-components/VerificationTab';

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

      <Tabs defaultValue="suppressions">
        <TabsList className="mb-6">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="suppressions">
          <SuppressionsTab env={env} isProduction={isProduction} />
        </TabsContent>

        <TabsContent value="ses-domain">
          <SesDomainTab env={env} isProduction={isProduction} />
        </TabsContent>

        <TabsContent value="verification">
          <VerificationTab env={env} isProduction={isProduction} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
