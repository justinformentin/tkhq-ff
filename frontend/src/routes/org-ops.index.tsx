import { createFileRoute } from '@tanstack/react-router';
import { OrgOpsPage } from '@/pages/OrgOpsPage';

export const Route = createFileRoute('/org-ops/')({
  component: OrgOpsRouteComponent,
});

function OrgOpsRouteComponent() {
  return <OrgOpsPage />;
}
