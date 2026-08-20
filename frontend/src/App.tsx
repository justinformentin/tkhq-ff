import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { FlagsPage } from './pages/FlagsPage';
import { FlagDetailPage } from './pages/FlagDetailPage';
import { OrgSearchPage } from './pages/OrgSearchPage';
import { Toaster } from './components/Toaster';
import { EnvironmentProvider } from './components/EnvironmentProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <EnvironmentProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/flags" replace />} />
              <Route path="/flags" element={<FlagsPage />} />
              <Route path="/flags/:flag" element={<FlagDetailPage />} />
              <Route path="/org-search" element={<OrgSearchPage />} />
            </Routes>
          </Layout>
          <Toaster />
        </BrowserRouter>
      </EnvironmentProvider>
    </QueryClientProvider>
  );
}
