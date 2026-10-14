import { useState, lazy, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import './App.css';

// ─── Route-Level Code Splitting (Lazy-loaded chunks) ──────────
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Bookings = lazy(() => import('./pages/Bookings'));
const Users = lazy(() => import('./pages/Users'));
const Providers = lazy(() => import('./pages/Providers'));
const Payments = lazy(() => import('./pages/Payments'));
const Disputes = lazy(() => import('./pages/Disputes'));
const Events = lazy(() => import('./pages/Events'));
const WebhookLogs = lazy(() => import('./pages/WebhookLogs'));
const Services = lazy(() => import('./pages/Services'));
const PetSettings = lazy(() => import('./pages/PetSettings'));
const Banners = lazy(() => import('./pages/Banners'));
const Login = lazy(() => import('./pages/Login'));
const NotificationsSimulator = lazy(() => import('./pages/NotificationsSimulator'));
const WhatsAppInbox = lazy(() => import('./pages/WhatsAppInbox'));
const Database = lazy(() => import('./pages/Database'));
const SeasonalThemes = lazy(() => import('./pages/SeasonalThemes'));
const AppAnalytics = lazy(() => import('./pages/AppAnalytics'));

export { useTheme } from './context/ThemeContext';

export type Page =
  | 'dashboard'
  | 'analytics'
  | 'bookings'
  | 'users'
  | 'providers'
  | 'payments'
  | 'disputes'
  | 'events'
  | 'webhooks'
  | 'services'
  | 'pet-settings'
  | 'banners'
  | 'notifications'
  | 'whatsapp'
  | 'database'
  | 'themes';

function PageLoader() {
  return (
    <div className="loading-screen" style={{ minHeight: '400px' }}>
      <div className="loader"></div>
      <p style={{ marginTop: '12px', fontSize: '13px', fontWeight: 600, color: '#64748B' }}>
        Loading view...
      </p>
    </div>
  );
}

function AppContent() {
  const { user, loading, isAdmin } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const { isDark } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <p>Loading Pawber Admin...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Login />
      </Suspense>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'analytics': return <AppAnalytics onNavigate={(page: string) => setCurrentPage(page as Page)} />;
      case 'bookings': return <Bookings />;
      case 'users': return <Users />;
      case 'providers': return <Providers />;
      case 'payments': return <Payments />;
      case 'disputes': return <Disputes />;
      case 'events': return <Events />;
      case 'webhooks': return <WebhookLogs />;
      case 'services': return <Services />;
      case 'pet-settings': return <PetSettings />;
      case 'banners': return <Banners />;
      case 'notifications': return <NotificationsSimulator />;
      case 'whatsapp': return <WhatsAppInbox />;
      case 'database': return <Database />;
      case 'themes': return <SeasonalThemes />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className={`app-layout ${isDark ? 'dark' : 'light'}`}>
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className={`main-wrapper ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Topbar
          currentPage={currentPage}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="main-content-body">
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              {renderPage()}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
