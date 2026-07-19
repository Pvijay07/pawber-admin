import { useState, useEffect, createContext, useContext } from 'react';
import Sidebar from './components/Sidebar';
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
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

export type Page = 'dashboard' | 'bookings' | 'users' | 'providers' | 'payments' | 'disputes' | 'events' | 'webhooks' | 'services' | 'pet-settings' | 'banners' | 'notifications' | 'whatsapp';

interface ThemeContextType {
  isDark: boolean;
  toggle: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({ isDark: true, toggle: () => { } });
export const useTheme = () => useContext(ThemeContext);

function AppContent() {
  const { user, loading, isAdmin } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const { isDark } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

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
      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderPage()}
      </main>
    </div>
  );
}

function App() {
  const [isDark, setIsDark] = useState(true);

  return (
    <AuthProvider>
      <ThemeContext.Provider value={{ isDark, toggle: () => setIsDark(!isDark) }}>
        <AppContent />
      </ThemeContext.Provider>
    </AuthProvider>
  );
}

export default App;
