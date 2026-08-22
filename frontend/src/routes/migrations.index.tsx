import { createFileRoute } from '@tanstack/react-router';
import { MigrationsPage } from '@/pages/MigrationsPage';

export const Route = createFileRoute('/migrations/')({
  component: MigrationsRouteComponent,
});

function MigrationsRouteComponent() {
  return <MigrationsPage />;
}
