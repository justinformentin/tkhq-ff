import { createFileRoute } from '@tanstack/react-router';
import { EmailPage } from '@/pages/EmailPage';

export const Route = createFileRoute('/email/')({
  component: EmailRouteComponent,
});

function EmailRouteComponent() {
  return <EmailPage />;
}
