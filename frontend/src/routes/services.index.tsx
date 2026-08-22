import { createFileRoute } from '@tanstack/react-router';
import { ServiceControlPage } from '@/pages/ServiceControlPage';

export const Route = createFileRoute('/services/')({
  component: ServiceControlRouteComponent,
});

function ServiceControlRouteComponent() {
  return <ServiceControlPage />;
}
