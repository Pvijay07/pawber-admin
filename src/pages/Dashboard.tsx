import { useState, useEffect } from 'react';
import {
    DollarSign, Users, CalendarCheck, TrendingUp, ShieldCheck,
    Briefcase, ArrowUpRight, ArrowDownRight, Clock, Star, Megaphone, Send
} from 'lucide-react';
import { useTheme } from '../App';
import { adminService } from '../services/admin.service';
import { supabase } from '../lib/supabase';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

// Keep some visual data as placeholders if backend doesn't provide them yet
const revenueData = [
    { month: 'Jan', revenue: 42000, bookings: 120 },
    { month: 'Feb', revenue: 48000, bookings: 145 },
    { month: 'Mar', revenue: 55000, bookings: 180 },
    { month: 'Apr', revenue: 62000, bookings: 210 },
    { month: 'May', revenue: 58000, bookings: 195 },
    { month: 'Jun', revenue: 72000, bookings: 250 },
    { month: 'Jul', revenue: 85000, bookings: 310 },
];

const serviceData = [
    { name: 'Grooming', value: 42, color: '#FF7A3D' },
    { name: 'Vet', value: 25, color: '#3b82f6' },
    { name: 'Walking', value: 18, color: '#f59e0b' },
    { name: 'Training', value: 10, color: '#8b5cf6' },
    { name: 'Boarding', value: 5, color: '#ef4444' },
];

const weeklyBookings = [
    { day: 'Mon', count: 45 },
    { day: 'Tue', count: 52 },
    { day: 'Wed', count: 38 },
    { day: 'Thu', count: 65 },
    { day: 'Fri', count: 58 },
    { day: 'Sat', count: 82 },
    { day: 'Sun', count: 40 },
];

const topProviders = [
    { name: 'David Miller', avatar: 'https://i.pravatar.cc/100?img=12', rating: 4.9, jobs: 142, earnings: '₹82,400', trend: 'up' },
    { name: 'Anita Desai', avatar: 'https://i.pravatar.cc/100?img=25', rating: 4.8, jobs: 128, earnings: '₹71,200', trend: 'up' },
    { name: 'Vikram Shah', avatar: 'https://i.pravatar.cc/100?img=33', rating: 4.7, jobs: 96, earnings: '₹54,800', trend: 'down' },
    { name: 'Meera Joshi', avatar: 'https://i.pravatar.cc/100?img=44', rating: 4.9, jobs: 88, earnings: '₹48,600', trend: 'up' },
];

export default function Dashboard() {
    const { isDark } = useTheme();
    const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
    const [realStats, setRealStats] = useState({
        revenue: '₹0',
        users: '0',
        bookings: '0',
        escrow: '₹0',
        providers: '0',
        conversion: '0%'
    });
    const [recentBookings, setRecentBookings] = useState<any[]>([]);
    const [pendingProviders, setPendingProviders] = useState<any[]>([]);
    const [broadcast, setBroadcast] = useState({ title: '', body: '', channel: 'push' });
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [serviceStats, setServiceStats] = useState<any[]>([
        { name: 'Grooming', value: 42, color: '#FF7A3D' },
        { name: 'Vet', value: 25, color: '#3b82f6' },
        { name: 'Walking', value: 18, color: '#f59e0b' },
        { name: 'Training', value: 10, color: '#8b5cf6' },
        { name: 'Boarding', value: 5, color: '#ef4444' },
    ]);

    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!broadcast.title || !broadcast.body) return;
        setIsBroadcasting(true);
        try {
            await adminService.sendBroadcast({
                title: broadcast.title,
                body: broadcast.body,
                channels: [broadcast.channel]
            });
            setBroadcast({ title: '', body: '', channel: 'push' });
            alert('Broadcast sent successfully! 🚀');
        } catch (err) {
            console.error('Broadcast error:', err);
            alert('Failed to send broadcast.');
        } finally {
            setIsBroadcasting(false);
        }
    };

    const fetchDashboardData = async () => {
        try {
            const response = await adminService.getDashboard();
            const { stats, recent_bookings, pending_providers } = response.data;

            setRealStats({
                revenue: `₹${(stats.total_revenue || 0).toLocaleString()}`,
                users: (stats.total_users || 0).toLocaleString(),
                bookings: (stats.total_bookings || 0).toLocaleString(),
                escrow: '₹0',
                providers: (stats.total_providers || 0).toLocaleString(),
                conversion: '68.4%'
            });
            setRecentBookings(recent_bookings || []);
            setPendingProviders(pending_providers || []);
            
            if (stats.service_distribution) {
                const colors = ['#FF7A3D', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];
                setServiceStats(stats.service_distribution.map((s: any, i: number) => ({
                    ...s,
                    color: colors[i % colors.length]
                })));
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        }
    };

    useEffect(() => {
        fetchDashboardData();

        // Real-time synchronization for Admin monitor
        console.log('📡 Admin Monitoring: Real-time Sync Active');
        
        const channel = supabase
            .channel('admin_dashboard_sync')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, () => {
                console.log('🔔 New Booking Detected - Refreshing Admin Dashboard');
                fetchDashboardData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'providers' }, () => {
                console.log('🔔 Provider Change Detected - Updating Approvals');
                fetchDashboardData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);


    const stats = [
        { label: 'Total Revenue', value: realStats.revenue, change: '+18.2%', trend: 'up', icon: DollarSign, type: 'accent' },
        { label: 'Active Users', value: realStats.users, change: '+12.5%', trend: 'up', icon: Users, type: 'info' },
        { label: 'Total Bookings', value: realStats.bookings, change: '+8.3%', trend: 'up', icon: CalendarCheck, type: 'purple' },
        { label: 'Escrow Balance', value: realStats.escrow, change: '-2.1%', trend: 'down', icon: ShieldCheck, type: 'warning' },
        { label: 'Active Providers', value: realStats.providers, change: '+6.8%', trend: 'up', icon: Briefcase, type: 'accent' },
        { label: 'Conversion Rate', value: realStats.conversion, change: '+3.2%', trend: 'up', icon: TrendingUp, type: 'info' },
    ];

    const chartColors = {
        stroke: isDark ? '#FF7A3D' : '#FF7A3D',
        fill: isDark ? 'rgba(255,122,61,0.1)' : 'rgba(255,122,61,0.08)',
        grid: isDark ? '#3D2A1E' : '#F5E6D8',
        text: isDark ? '#7A5540' : '#B09080',
    };

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h1>Dashboard</h1>
                    <p className="subtitle">Welcome back! Here's what's happening with Pawber today.</p>
                </div>
                <div className="page-header-actions">
                    {(['week', 'month', 'year'] as const).map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`btn ${period === p ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                        >
                            {p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'This Year'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {stats.map((stat, i) => (
                    <div key={i} className={`stat-card ${stat.type}`}>
                        <div className={`stat-icon ${stat.type}`}>
                            <stat.icon size={20} />
                        </div>
                        <div className="stat-label">{stat.label}</div>
                        <div className="stat-value">{stat.value}</div>
                        <div className={`stat-change ${stat.trend}`}>
                            {stat.trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            {stat.change}
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="charts-grid">
                {/* Revenue Chart */}
                <div className="chart-card">
                    <div className="card-header">
                        <div className="card-title">Revenue Overview</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <span className="badge-status active" style={{ fontSize: 10 }}>● Live</span>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={revenueData}>
                            <defs>
                                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#FF7A3D" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#FF7A3D" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                            <XAxis dataKey="month" tick={{ fill: chartColors.text, fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: chartColors.text, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                            <Tooltip
                                contentStyle={{
                                    background: isDark ? '#1a1f35' : '#fff',
                                    border: `1px solid ${isDark ? '#3D2A1E' : '#DEC9B5'}`,
                                    borderRadius: 10,
                                    fontSize: 12,
                                    fontWeight: 600,
                                }}
                                formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="#FF7A3D" strokeWidth={2.5} fill="url(#revGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Service Distribution */}
                <div className="chart-card">
                    <div className="card-header">
                        <div className="card-title">Service Breakdown</div>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={serviceStats} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={4}>
                                {serviceStats.map((entry, i) => (
                                    <Cell key={i} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    background: isDark ? '#1a1f35' : '#fff',
                                    border: `1px solid ${isDark ? '#3D2A1E' : '#DEC9B5'}`,
                                    borderRadius: 10,
                                    fontSize: 12,
                                }}
                                formatter={(value: any) => [`${value}%`, 'Share']}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', justifyContent: 'center', marginTop: 8 }}>
                        {serviceStats.map((s, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>
                                <span style={{ width: 8, height: 8, borderRadius: 3, background: s.color, display: 'inline-block' }} />
                                {s.name} ({s.value}%)
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Weekly Bookings + Top Providers */}
            <div className="charts-grid" style={{ marginBottom: 28 }}>
                <div className="chart-card">
                    <div className="card-header">
                        <div className="card-title">Weekly Bookings</div>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={weeklyBookings}>
                            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                            <XAxis dataKey="day" tick={{ fill: chartColors.text, fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: chartColors.text, fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: isDark ? '#1a1f35' : '#fff', border: `1px solid ${isDark ? '#3D2A1E' : '#DEC9B5'}`, borderRadius: 10, fontSize: 12 }} />
                            <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={32} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Pending Approvals */}
                <div className="chart-card">
                    <div className="card-header">
                        <div className="card-title">Pending Approvals</div>
                        {pendingProviders.length > 0 && (
                            <span className="badge-status pending" style={{ fontSize: 10 }}>{pendingProviders.length} pending</span>
                        )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {pendingProviders.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>
                                No pending provider approvals 🎉
                            </div>
                        ) : (
                            pendingProviders.map((p: any, i: number) => (
                                <div key={p.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < pendingProviders.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                                        {p.user?.full_name?.[0] || 'P'}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{p.business_name || 'New Provider'}</div>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{p.category || 'General'} · {p.city || 'Unknown'}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button
                                            className="btn btn-primary btn-sm"
                                            style={{ fontSize: 10, padding: '4px 10px' }}
                                            onClick={async () => {
                                                try {
                                                    await adminService.updateProviderStatus(p.id, 'approved');
                                                    setPendingProviders(prev => prev.filter(pp => pp.id !== p.id));
                                                } catch (err) { console.error(err); }
                                            }}
                                        >
                                            Approve
                                        </button>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            style={{ fontSize: 10, padding: '4px 10px' }}
                                            onClick={async () => {
                                                try {
                                                    await adminService.updateProviderStatus(p.id, 'rejected');
                                                    setPendingProviders(prev => prev.filter(pp => pp.id !== p.id));
                                                } catch (err) { console.error(err); }
                                            }}
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {/* Top Providers (static showcase) */}
                    <div style={{ borderTop: '1px solid var(--border)', marginTop: 16, paddingTop: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>Top Providers</div>
                        {topProviders.map((p, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0', borderBottom: i < topProviders.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: i === 0 ? '#f59e0b' : 'var(--text-muted)', flexShrink: 0 }}>
                                    {i + 1}
                                </div>
                                <img src={p.avatar} alt={p.name} style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                                    <div style={{ fontSize: 9, color: 'var(--text-muted)', display: 'flex', gap: 6 }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><Star size={9} fill="#f59e0b" color="#f59e0b" /> {p.rating}</span>
                                        <span>{p.jobs} jobs</span>
                                    </div>
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{p.earnings}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Broadcast Section */}
            <div className="chart-card" style={{ marginBottom: 28 }}>
                <div className="card-header">
                    <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Megaphone size={18} color="var(--primary)" />
                        Broadcast Promotion
                    </div>
                    <p className="subtitle" style={{ fontSize: 11, marginTop: 4 }}>Send a multi-channel notification to all users.</p>
                </div>
                <form onSubmit={handleBroadcast} style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ flex: 1, minWidth: 240 }}>
                        <div style={{ marginBottom: 12 }}>
                            <label className="stat-label" style={{ display: 'block', marginBottom: 6 }}>Promotion Title</label>
                            <input 
                                type="text" 
                                className="input" 
                                placeholder="Summer Sale 20% Off!" 
                                value={broadcast.title}
                                onChange={e => setBroadcast({...broadcast, title: e.target.value})}
                                required
                            />
                        </div>
                        <div>
                            <label className="stat-label" style={{ display: 'block', marginBottom: 6 }}>Channel</label>
                            <select 
                                className="input" 
                                value={broadcast.channel}
                                onChange={e => setBroadcast({...broadcast, channel: e.target.value})}
                                style={{ width: '100%' }}
                            >
                                <option value="push">Push Notification Only</option>
                                <option value="email">Email Campaign</option>
                                <option value="push,email">Multi-Channel (Push + Email)</option>
                                <option value="whatsapp">WhatsApp (Business API)</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ flex: 2, minWidth: 300 }}>
                        <label className="stat-label" style={{ display: 'block', marginBottom: 6 }}>Message Body</label>
                        <textarea 
                            className="input" 
                            placeholder="Get 20% discount on your next grooming session..." 
                            rows={4}
                            style={{ height: 110, resize: 'none' }}
                            value={broadcast.body}
                            onChange={e => setBroadcast({...broadcast, body: e.target.value})}
                            required
                        />
                        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                            <button 
                                type="submit" 
                                className="btn btn-primary" 
                                disabled={isBroadcasting || !broadcast.title || !broadcast.body}
                                style={{ gap: 8 }}
                            >
                                {isBroadcasting ? 'Sending...' : <><Send size={16} /> Send Broadcast Now</>}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Recent Bookings */}
            <div className="table-container">
                <div className="table-header">
                    <div className="table-title">Recent Bookings</div>
                    <div className="table-actions">
                        <input type="text" className="input search-input" placeholder="Search bookings..." style={{ width: 200 }} />
                        <button className="btn btn-primary btn-sm">View All</button>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Booking</th>
                            <th>User</th>
                            <th>Service</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentBookings.map((b) => (
                            <tr key={b.id}>
                                <td><span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: 12 }}>{b.id.substring(0, 8)}</span></td>
                                <td>
                                    <div className="table-user">
                                        <div className="table-avatar" style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                                            {b.user?.full_name?.[0] || 'U'}
                                        </div>
                                        <span className="table-name">{b.user?.full_name || 'Unnamed'}</span>
                                    </div>
                                </td>
                                <td>{b.service?.name || 'Service'}</td>
                                <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{(b.total_amount || 0).toLocaleString()}</td>
                                <td><span className={`badge-status ${b.status}`}>{b.status.replace('_', ' ')}</span></td>
                                <td><span style={{ color: 'var(--text-muted)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></td>
                            </tr>
                        ))}

                    </tbody>
                </table>
            </div>
        </div>
    );
}
