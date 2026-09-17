import { useTheme, type Page } from '../App';
import { useAuth } from '../context/AuthContext';
import {
  Sun,
  Moon,
  Menu,
  ChevronRight,
  ShieldCheck,
  LogOut,
  Sparkles,
  LayoutDashboard,
  CalendarCheck,
  Users,
  Briefcase,
  Wallet,
  AlertTriangle,
  PartyPopper,
  Webhook,
  Layers,
  Settings,
  Image,
  Bell,
  MessageCircle,
  Database,
  Palette
} from 'lucide-react';

interface TopbarProps {
  currentPage: Page;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const pageMeta: Record<Page, { title: string; category: string; icon: any }> = {
  dashboard: { title: 'Dashboard', category: 'Overview', icon: LayoutDashboard },
  bookings: { title: 'Bookings', category: 'Management', icon: CalendarCheck },
  users: { title: 'Users & Pets', category: 'Management', icon: Users },
  providers: { title: 'Providers', category: 'Management', icon: Briefcase },
  services: { title: 'Services Catalog', category: 'Management', icon: Layers },
  'pet-settings': { title: 'Pet Settings', category: 'Management', icon: Settings },
  disputes: { title: 'Disputes & Support', category: 'Management', icon: AlertTriangle },
  payments: { title: 'Payments & Escrow', category: 'Finance', icon: Wallet },
  themes: { title: 'Seasonal Themes', category: 'Operations', icon: Palette },
  whatsapp: { title: 'WhatsApp Inbox', category: 'Operations', icon: MessageCircle },
  banners: { title: 'App Banners', category: 'Operations', icon: Image },
  events: { title: 'Community Events', category: 'Operations', icon: PartyPopper },
  notifications: { title: 'Notification Center', category: 'Operations', icon: Bell },
  webhooks: { title: 'Webhook Logs', category: 'Operations', icon: Webhook },
  database: { title: 'Database & Maintenance', category: 'Operations', icon: Database },
};

export default function Topbar({ currentPage, sidebarOpen, onToggleSidebar }: TopbarProps) {
  const { isDark, toggle } = useTheme();
  const { user, signOut } = useAuth();

  const currentMeta = pageMeta[currentPage] || {
    title: 'Admin Portal',
    category: 'System',
    icon: Sparkles,
  };
  const IconComponent = currentMeta.icon;

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="topbar-toggle-btn"
          onClick={onToggleSidebar}
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-label="Toggle navigation sidebar"
        >
          <Menu size={18} />
        </button>

        <div className="topbar-breadcrumbs">
          <span className="breadcrumb-category">{currentMeta.category}</span>
          <ChevronRight size={13} className="breadcrumb-separator" />
          <div className="breadcrumb-current">
            <IconComponent size={15} className="breadcrumb-icon" />
            <span className="breadcrumb-title">{currentMeta.title}</span>
          </div>
        </div>
      </div>

      <div className="topbar-right">
        {/* Real-time System Sync Badge */}
        <div className="topbar-sync-badge" title="Supabase Real-Time Sync Connected">
          <span className="sync-pulse-dot" />
          <span className="sync-text">Live Sync</span>
        </div>

        {/* ─── DEDICATED LIGHT / DARK THEME TOGGLE ─── */}
        <div className="theme-segmented-control" role="group" aria-label="Color Theme Switcher">
          <button
            type="button"
            className={`theme-segment-btn ${!isDark ? 'active' : ''}`}
            onClick={() => isDark && toggle()}
            title="Switch to Light Theme"
            aria-pressed={!isDark}
          >
            <Sun size={14} />
            <span className="theme-label">Light</span>
          </button>
          <button
            type="button"
            className={`theme-segment-btn ${isDark ? 'active' : ''}`}
            onClick={() => !isDark && toggle()}
            title="Switch to Dark Theme"
            aria-pressed={isDark}
          >
            <Moon size={14} />
            <span className="theme-label">Dark</span>
          </button>
        </div>

        {/* Administrator Profile Pill */}
        <div className="topbar-user-pill">
          <div className="user-avatar-badge">
            {user?.email ? user.email.slice(0, 2).toUpperCase() : 'AD'}
          </div>
          <div className="user-info-text">
            <span className="user-email-label" title={user?.email || 'admin@pawber.com'}>
              {user?.email ? user.email.split('@')[0] : 'admin'}
            </span>
            <span className="user-role-tag">
              <ShieldCheck size={10} />
              Admin
            </span>
          </div>

          <button
            type="button"
            className="topbar-logout-btn"
            onClick={signOut}
            title="Sign Out of Admin Portal"
            aria-label="Sign Out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
