import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';

import { Suspense, lazy } from 'react';

const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const CategoryPage = lazy(() => import('./pages/CategoryPage').then(m => ({ default: m.CategoryPage })));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const ProductFormPage = lazy(() => import('./pages/ProductFormPage').then(m => ({ default: m.ProductFormPage })));
const SearchPage = lazy(() => import('./pages/SearchPage').then(m => ({ default: m.SearchPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage').then(m => ({ default: m.ProjectsPage })));
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage').then(m => ({ default: m.ProjectDetailPage })));

import { ErrorBoundary } from './components/ErrorBoundary';
import { PwaInstallPrompt } from './components/ui/PwaInstallPrompt';
import { PwaUpdatePrompt } from './components/ui/PwaUpdatePrompt';
import { ConflictResolutionModal } from './components/ui/ConflictResolutionModal';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function App() {
  useEffect(() => {
    const handleSyncCompleted = () => {
      console.log('[App]: Senkronizasyon tamamlandı, önbellek yenileniyor...');
      queryClient.invalidateQueries();
    };
    window.addEventListener('sync-completed', handleSyncCompleted);
    return () => {
      window.removeEventListener('sync-completed', handleSyncCompleted);
    };
  }, []);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme-dark">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <PwaInstallPrompt />
            <PwaUpdatePrompt />
            <ConflictResolutionModal />
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route 
                path="/*" 
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ErrorBoundary>
                        <Suspense fallback={<div className="flex h-full items-center justify-center p-8"><div className="animate-spin h-8 w-8 border-4 border-amber-600 rounded-full border-t-transparent"></div></div>}>
                          <Routes>
                            <Route path="/" element={<DashboardPage />} />
                            <Route path="/category/:id" element={<CategoryPage />} />
                            <Route path="/category/:categoryId/new" element={<ProductFormPage />} />
                            <Route path="/product/new" element={<ProductFormPage />} />
                            <Route path="/product/:id/edit" element={<ProductFormPage />} />
                            <Route path="/product/:id" element={<ProductDetailPage />} />
                            <Route path="/search" element={<SearchPage />} />
                            <Route path="/settings" element={<SettingsPage />} />
                            <Route path="/projects" element={<ProjectsPage />} />
                            <Route path="/projects/:id" element={<ProjectDetailPage />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                          </Routes>
                        </Suspense>
                      </ErrorBoundary>
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
