import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import Users from './pages/Users';
import Providers from './pages/Providers';
import Payments from './pages/Payments';
import Disputes from './pages/Disputes';
import Events from './pages/Events';
import WebhookLogs from './pages/WebhookLogs';
import Services from './pages/Services';
import PetSettings from './pages/PetSettings';
import Banners from './pages/Banners';
import Login from './pages/Login';
import NotificationsSimulator from './pages/NotificationsSimulator';
import WhatsAppInbox from './pages/WhatsAppInbox';
import Database from './pages/Database';
import SeasonalThemes from './pages/SeasonalThemes';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import './App.css';

export { useTheme } from './context/ThemeContext';

export type Page =
  | 'dashboard'
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
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
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
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
