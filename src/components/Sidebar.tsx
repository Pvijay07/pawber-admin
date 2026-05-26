import { useTheme, type Page } from '../App';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, CalendarCheck, Users, Briefcase, Wallet,
    AlertTriangle, PartyPopper, Webhook, Sun, Moon, Menu, PawPrint,
    ChevronLeft, LogOut, Layers, Settings, Image
} from 'lucide-react';

interface SidebarProps {
    currentPage: Page;
    onNavigate: (page: Page) => void;
    isOpen: boolean;
    onToggle: () => void;
}

const navItems: { section: string; items: { id: Page; icon: any; label: string; badge?: number }[] }[] = [
    {
        section: 'Main',
        items: [
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'bookings', icon: CalendarCheck, label: 'Bookings' },
        ],
    },
    {
        section: 'Management',
        items: [
            { id: 'users', icon: Users, label: 'Users & Pets' },
            { id: 'providers', icon: Briefcase, label: 'Providers' },
            { id: 'services', icon: Layers, label: 'Services' },
            { id: 'pet-settings', icon: Settings, label: 'Pet Settings' },
            { id: 'disputes', icon: AlertTriangle, label: 'Disputes' },
        ],
    },
    { section: 'Finance', items: [{ id: 'payments', icon: Wallet, label: 'Payments' }] },
    {
        section: 'Operations',
        items: [
            { id: 'banners', icon: Image, label: 'App Banners' },
            { id: 'events', icon: PartyPopper, label: 'Events' },
            { id: 'webhooks', icon: Webhook, label: 'Webhook Logs' },
        ],
    },
];

export default function Sidebar({ currentPage, onNavigate, isOpen, onToggle }: SidebarProps) {
    const { isDark, toggle } = useTheme();
    const { user, signOut } = useAuth();

    return (
        <aside className={`sidebar ${isOpen ? '' : 'collapsed'}`}>
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">
                    <PawPrint size={22} />
                </div>
                <div className="sidebar-logo-text">
                    Paw<span>ber</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((section) => (
                    <div key={section.section}>
                        <div className="sidebar-section-title">{section.section}</div>
                        {section.items.map((item) => (
                            <button
                                key={item.id}
                                className={`sidebar-item ${currentPage === item.id ? 'active' : ''}`}
                                onClick={() => onNavigate(item.id)}
                                title={item.label}
                            >
                                <item.icon size={18} className="sidebar-item-icon" />
                                <span className="sidebar-label">{item.label}</span>
                                {item.badge && <span className="badge sidebar-label">{item.badge}</span>}
                            </button>
                        ))}
                    </div>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div style={{ display: 'flex', gap: 6, marginBottom: 12, paddingLeft: 4 }}>
                    <button className="theme-toggle" onClick={toggle} title="Toggle theme">
                        {isDark ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                    <button className="theme-toggle" onClick={onToggle} title="Toggle sidebar">
                        {isOpen ? <ChevronLeft size={16} /> : <Menu size={16} />}
                    </button>
                    <button className="theme-toggle" onClick={signOut} title="Logout" style={{ color: 'var(--danger)' }}>
                        <LogOut size={16} />
                    </button>
                </div>
                <div className="sidebar-user">
                    <div className="sidebar-user-avatar" style={{ background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                        {user?.email?.[0].toUpperCase() || 'A'}
                    </div>
                    <div className="sidebar-user-info">
                        <div className="name" style={{ fontSize: 11 }}>{user?.email?.split('@')[0]}</div>
                        <div className="role">Administrator</div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
