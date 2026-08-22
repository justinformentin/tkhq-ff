import { createRootRoute, Outlet } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EnvironmentProvider } from '@/components/EnvironmentProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthGate } from '@/components/AuthGate';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Toaster } from '@/components/Toaster';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <EnvironmentProvider>
          <AuthGate>
            <DashboardLayout>
              <Outlet />
            </DashboardLayout>
          </AuthGate>
          <Toaster />
        </EnvironmentProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
