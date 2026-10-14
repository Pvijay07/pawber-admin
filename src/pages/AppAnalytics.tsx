import { useState, useEffect } from 'react';
import {
    Users, Briefcase, CalendarCheck, AlertTriangle, TrendingUp,
    RefreshCw, Smartphone, CheckCircle2,
    Clock, ShieldAlert, XCircle, Sparkles,
    Activity, Eye
} from 'lucide-react';
import { useTheme } from '../App';
import { adminService } from '../services/admin.service';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar
} from 'recharts';

export default function AppAnalytics({ onNavigate }: { onNavigate?: (page: string) => void }) {
    const { isDark } = useTheme();
    const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
    const [activeTab, setActiveTab] = useState<'customer' | 'provider' | 'issues' | 'trends'>('customer');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);
        try {
            const res = await adminService.getAppAnalytics(timeframe);
            if (res.data?.success && res.data?.data) {
                setData(res.data.data);
            } else {
                throw new Error(res.data?.error?.message || 'Failed to fetch analytics data');
            }
        } catch (err: any) {
            console.error('Failed to load app analytics:', err);
            setError(err?.response?.data?.error?.message || err?.message || 'Failed to load analytics.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [timeframe]);

    const summary = data?.summary || {
        total_registered_clients: 0,
        total_registered_providers: 0,
        new_clients_timeframe: 0,
        new_providers_timeframe: 0,
        total_pets_registered: 0,
        clients_without_pets: 0,
        pending_provider_approvals: 0,
        online_providers: 0,
        total_bookings: 0,
        completed_bookings: 0,
        cancelled_bookings: 0,
        total_disputes: 0,
        stuck_bookings_count: 0,
    };

    const customerFunnel = data?.funnels?.customer_app || [];
    const providerFunnel = data?.funnels?.provider_app || [];
    const issues = data?.issues || {
        stuck_arrivals_count: 0,
        stuck_in_progress_count: 0,
        unassigned_pending_count: 0,
        total_cancellations: 0,
        cancelled_by_breakdown: {},
        top_cancellation_reasons: [],
        recent_issues_feed: [],
    };
    const timeline = data?.registration_timeline || [];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'healthy':
                return <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={12} /> Healthy</span>;
            case 'warning':
                return <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={12} /> Drop-off</span>;
            case 'critical':
                return <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><XCircle size={12} /> High Bottleneck</span>;
            default:
                return null;
        }
    };

    return (
        <div className="page-container" style={{ paddingBottom: '3rem' }}>
            {/* Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Smartphone className="text-primary" size={28} />
                        App Analytics & Funnel Diagnostics
                    </h1>
                    <p className="page-subtitle">
                        Cross-app user journey telemetry: registrations, funnel drop-offs, stuck stages, and operational issues across Pawber Client & Pawber Partner.
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {/* Timeframe Selector */}
                    <div className="filter-pill-group" style={{ display: 'flex', background: isDark ? '#1e293b' : '#e2e8f0', borderRadius: '10px', padding: '3px' }}>
                        {(['7d', '30d', '90d', 'all'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTimeframe(t)}
                                style={{
                                    border: 'none',
                                    background: timeframe === t ? (isDark ? '#334155' : '#ffffff') : 'transparent',
                                    color: timeframe === t ? '#FF7A3D' : (isDark ? '#94a3b8' : '#64748b'),
                                    fontWeight: timeframe === t ? '600' : '500',
                                    padding: '6px 14px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    transition: 'all 0.15s ease',
                                    boxShadow: timeframe === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >
                                {t === '7d' ? '7 Days' : t === '30d' ? '30 Days' : t === '90d' ? '90 Days' : 'All Time'}
                            </button>
                        ))}
                    </div>

                    {/* Refresh Button */}
                    <button
                        className="btn btn-secondary"
                        onClick={() => fetchData(true)}
                        disabled={refreshing || loading}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                        <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
                        {refreshing ? 'Updating...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {error && (
                <div style={{
                    padding: '1rem',
                    borderRadius: '10px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                }}>
                    <AlertTriangle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {/* Top Overview KPI Cards */}
            <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
                        <Users size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Customer App Registrations</span>
                        <div className="stat-value">{summary.total_registered_clients.toLocaleString()}</div>
                        <div style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#64748b', marginTop: '4px' }}>
                            <span style={{ color: '#10b981', fontWeight: 600 }}>+{summary.new_clients_timeframe}</span> in {timeframe} • {summary.clients_without_pets} without pet
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(249, 115, 22, 0.12)', color: '#f97316' }}>
                        <Briefcase size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Partner App Registrations</span>
                        <div className="stat-value">{summary.total_registered_providers.toLocaleString()}</div>
                        <div style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#64748b', marginTop: '4px' }}>
                            <span style={{ color: '#10b981', fontWeight: 600 }}>{summary.online_providers} Online</span> • {summary.pending_provider_approvals} Pending KYC
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                        <CalendarCheck size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Bookings Fulfilled</span>
                        <div className="stat-value">{summary.completed_bookings.toLocaleString()}</div>
                        <div style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#64748b', marginTop: '4px' }}>
                            of {summary.total_bookings.toLocaleString()} total • {summary.total_bookings > 0 ? Math.round((summary.completed_bookings / summary.total_bookings) * 100) : 0}% success rate
                        </div>
                    </div>
                </div>

                <div className="stat-card" style={{ borderColor: summary.stuck_bookings_count > 0 ? 'rgba(239, 68, 68, 0.4)' : undefined }}>
                    <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
                        <ShieldAlert size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Active Bottlenecks & Stuck</span>
                        <div className="stat-value" style={{ color: summary.stuck_bookings_count > 0 ? '#ef4444' : undefined }}>
                            {summary.stuck_bookings_count}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#64748b', marginTop: '4px' }}>
                            {issues.stuck_arrivals_count} OTP delays • {summary.cancelled_bookings} cancelled • {summary.total_disputes} disputes
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                marginBottom: '1.5rem',
                overflowX: 'auto',
                paddingBottom: '2px'
            }}>
                <button
                    onClick={() => setActiveTab('customer')}
                    style={{
                        padding: '10px 18px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'customer' ? '3px solid #FF7A3D' : '3px solid transparent',
                        color: activeTab === 'customer' ? '#FF7A3D' : (isDark ? '#94a3b8' : '#64748b'),
                        fontWeight: activeTab === 'customer' ? 600 : 500,
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.15s ease'
                    }}
                >
                    <Smartphone size={18} />
                    Customer App Funnel ({customerFunnel.length} Stages)
                </button>

                <button
                    onClick={() => setActiveTab('provider')}
                    style={{
                        padding: '10px 18px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'provider' ? '3px solid #FF7A3D' : '3px solid transparent',
                        color: activeTab === 'provider' ? '#FF7A3D' : (isDark ? '#94a3b8' : '#64748b'),
                        fontWeight: activeTab === 'provider' ? 600 : 500,
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.15s ease'
                    }}
                >
                    <Briefcase size={18} />
                    Partner App Funnel ({providerFunnel.length} Stages)
                </button>

                <button
                    onClick={() => setActiveTab('issues')}
                    style={{
                        padding: '10px 18px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'issues' ? '3px solid #ef4444' : '3px solid transparent',
                        color: activeTab === 'issues' ? '#ef4444' : (isDark ? '#94a3b8' : '#64748b'),
                        fontWeight: activeTab === 'issues' ? 600 : 500,
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.15s ease'
                    }}
                >
                    <AlertTriangle size={18} />
                    Issues & Drop-off Bottlenecks
                    {(issues.stuck_arrivals_count > 0 || issues.recent_issues_feed.length > 0) && (
                        <span style={{
                            background: '#ef4444',
                            color: '#fff',
                            fontSize: '0.75rem',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            fontWeight: 700
                        }}>
                            {issues.recent_issues_feed.length}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => setActiveTab('trends')}
                    style={{
                        padding: '10px 18px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'trends' ? '3px solid #FF7A3D' : '3px solid transparent',
                        color: activeTab === 'trends' ? '#FF7A3D' : (isDark ? '#94a3b8' : '#64748b'),
                        fontWeight: activeTab === 'trends' ? 600 : 500,
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.15s ease'
                    }}
                >
                    <TrendingUp size={18} />
                    Growth & Registration Trends
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                    <div className="loader" style={{ margin: '0 auto 1rem' }}></div>
                    <p style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Analyzing cross-app telemetry data...</p>
                </div>
            ) : (
                <>
                    {/* TAB 1: CUSTOMER APP FUNNEL */}
                    {activeTab === 'customer' && (
                        <div>
                            {/* Diagnostic Highlights Card */}
                            <div className="card" style={{ marginBottom: '1.5rem', background: isDark ? '#1e293b' : '#f8fafc' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                    <Sparkles className="text-primary" size={20} />
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Customer Journey Drop-Off Diagnostics</h3>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                                    <div style={{
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        background: isDark ? '#0f172a' : '#ffffff',
                                        border: `1px solid ${summary.clients_without_pets > 0 ? 'rgba(249, 115, 22, 0.3)' : (isDark ? '#334155' : '#e2e8f0')}`
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f97316' }}>Drop-off Point #1: Registration</span>
                                            <span className="badge badge-warning">{summary.clients_without_pets} Stopped</span>
                                        </div>
                                        <p style={{ fontSize: '0.88rem', margin: '8px 0', color: isDark ? '#cbd5e1' : '#334155' }}>
                                            <strong>{summary.clients_without_pets} users</strong> registered an account but never added their pet profile.
                                        </p>
                                        <div style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                                            💡 <em>Recommendation:</em> Trigger automated WhatsApp prompt inviting client to add pet photos and vaccination records.
                                        </div>
                                    </div>

                                    <div style={{
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        background: isDark ? '#0f172a' : '#ffffff',
                                        border: `1px solid ${issues.stuck_arrivals_count > 0 ? 'rgba(239, 68, 68, 0.3)' : (isDark ? '#334155' : '#e2e8f0')}`
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ef4444' }}>Drop-off Point #2: Arrival & Start OTP</span>
                                            <span className="badge badge-danger">{issues.stuck_arrivals_count} Stalled</span>
                                        </div>
                                        <p style={{ fontSize: '0.88rem', margin: '8px 0', color: isDark ? '#cbd5e1' : '#334155' }}>
                                            <strong>{issues.stuck_arrivals_count} bookings</strong> currently have provider arrived, but client has not verified Start OTP.
                                        </p>
                                        <div style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                                            💡 <em>Recommendation:</em> Check if client is receiving push notifications or trigger emergency SMS with the 4-digit OTP.
                                        </div>
                                    </div>

                                    <div style={{
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        background: isDark ? '#0f172a' : '#ffffff',
                                        border: `1px solid ${summary.cancelled_bookings > 0 ? 'rgba(239, 68, 68, 0.3)' : (isDark ? '#334155' : '#e2e8f0')}`
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ef4444' }}>Drop-off Point #3: Cancellations</span>
                                            <span className="badge badge-danger">{summary.cancelled_bookings} Cancelled</span>
                                        </div>
                                        <p style={{ fontSize: '0.88rem', margin: '8px 0', color: isDark ? '#cbd5e1' : '#334155' }}>
                                            <strong>{summary.cancelled_bookings} bookings</strong> aborted prior to fulfillment.
                                        </p>
                                        <div style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                                            💡 <em>Recommendation:</em> Review top cancellation reasons in the "Issues" tab to reduce friction and improve partner arrival punctuality.
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Full Stage Funnel List */}
                            <div className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Customer App End-to-End Funnel</h3>
                                        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                                            Tracking progression from initial app installation down to successful service completion.
                                        </p>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>
                                        End-to-End Conversion: {customerFunnel[customerFunnel.length - 1]?.percentage || 0}%
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                    {customerFunnel.map((step: any) => (
                                        <div
                                            key={step.step}
                                            style={{
                                                padding: '1rem',
                                                borderRadius: '8px',
                                                background: isDark ? '#1e293b' : '#f8fafc',
                                                border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{
                                                        width: '28px',
                                                        height: '28px',
                                                        borderRadius: '50%',
                                                        background: '#FF7A3D',
                                                        color: '#ffffff',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 700,
                                                        fontSize: '0.85rem'
                                                    }}>
                                                        {step.step}
                                                    </div>
                                                    <div>
                                                        <span style={{ fontWeight: 600, fontSize: '0.98rem' }}>{step.name}</span>
                                                        <span style={{ fontSize: '0.82rem', color: isDark ? '#94a3b8' : '#64748b', marginLeft: '8px' }}>
                                                            ({step.description})
                                                        </span>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    {getStatusBadge(step.status)}
                                                    <div style={{ textAlign: 'right' }}>
                                                        <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{step.count.toLocaleString()}</span>
                                                        <span style={{ fontSize: '0.85rem', color: isDark ? '#94a3b8' : '#64748b', marginLeft: '4px' }}>
                                                            ({step.percentage}%)
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div style={{
                                                height: '7px',
                                                background: isDark ? '#0f172a' : '#e2e8f0',
                                                borderRadius: '4px',
                                                overflow: 'hidden',
                                                marginTop: '2px'
                                            }}>
                                                <div style={{
                                                    width: `${Math.max(step.percentage, 2)}%`,
                                                    height: '100%',
                                                    background: step.status === 'critical' ? '#ef4444' : step.status === 'warning' ? '#f59e0b' : '#10b981',
                                                    borderRadius: '4px',
                                                    transition: 'width 0.4s ease'
                                                }}></div>
                                            </div>

                                            {/* Drop-off Note */}
                                            {step.dropped_here > 0 && (
                                                <div style={{
                                                    fontSize: '0.8rem',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    color: isDark ? '#94a3b8' : '#64748b',
                                                    marginTop: '2px'
                                                }}>
                                                    <span style={{ color: step.status === 'critical' ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>
                                                        ⚠️ {step.dropped_here.toLocaleString()} dropped off here ({step.drop_rate}% drop rate)
                                                    </span>
                                                    <span style={{ fontStyle: 'italic' }}>{step.hint}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: PROVIDER APP FUNNEL */}
                    {activeTab === 'provider' && (
                        <div>
                            {/* Provider Diagnostic Card */}
                            <div className="card" style={{ marginBottom: '1.5rem', background: isDark ? '#1e293b' : '#f8fafc' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <Briefcase className="text-primary" size={20} />
                                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Partner Onboarding & Fulfilment Diagnostics</h3>
                                    </div>
                                    {onNavigate && (
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => onNavigate('providers')}
                                            style={{ fontSize: '0.85rem', padding: '6px 14px' }}
                                        >
                                            Go to Providers Management
                                        </button>
                                    )}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                                    <div style={{
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        background: isDark ? '#0f172a' : '#ffffff',
                                        border: `1px solid ${summary.pending_provider_approvals > 0 ? 'rgba(249, 115, 22, 0.3)' : (isDark ? '#334155' : '#e2e8f0')}`
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f97316' }}>Awaiting Admin Verification</span>
                                            <span className="badge badge-warning">{summary.pending_provider_approvals} Pending</span>
                                        </div>
                                        <p style={{ fontSize: '0.88rem', margin: '8px 0', color: isDark ? '#cbd5e1' : '#334155' }}>
                                            <strong>{summary.pending_provider_approvals} providers</strong> submitted documents and are waiting for your approval to start receiving bookings.
                                        </p>
                                        <div style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                                            💡 <em>Action:</em> Open Providers tab and review submitted Aadhaar/Certificates to approve them.
                                        </div>
                                    </div>

                                    <div style={{
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        background: isDark ? '#0f172a' : '#ffffff',
                                        border: `1px solid ${summary.online_providers === 0 ? 'rgba(239, 68, 68, 0.3)' : (isDark ? '#334155' : '#e2e8f0')}`
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#10b981' }}>Live Online Availability</span>
                                            <span className="badge badge-success">{summary.online_providers} Online</span>
                                        </div>
                                        <p style={{ fontSize: '0.88rem', margin: '8px 0', color: isDark ? '#cbd5e1' : '#334155' }}>
                                            <strong>{summary.online_providers} partners</strong> currently have their status toggled online in the partner mobile app.
                                        </p>
                                        <div style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                                            💡 <em>Health:</em> Ensures customer booking requests in Walking, Grooming, and Training receive immediate instant match.
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Full Provider Funnel Stages */}
                            <div className="card">
                                <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.15rem' }}>Partner App Onboarding & Job Funnel</h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                    {providerFunnel.map((step: any) => (
                                        <div
                                            key={step.step}
                                            style={{
                                                padding: '1rem',
                                                borderRadius: '8px',
                                                background: isDark ? '#1e293b' : '#f8fafc',
                                                border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{
                                                        width: '28px',
                                                        height: '28px',
                                                        borderRadius: '50%',
                                                        background: '#f97316',
                                                        color: '#ffffff',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 700,
                                                        fontSize: '0.85rem'
                                                    }}>
                                                        {step.step}
                                                    </div>
                                                    <div>
                                                        <span style={{ fontWeight: 600, fontSize: '0.98rem' }}>{step.name}</span>
                                                        <span style={{ fontSize: '0.82rem', color: isDark ? '#94a3b8' : '#64748b', marginLeft: '8px' }}>
                                                            ({step.description})
                                                        </span>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    {getStatusBadge(step.status)}
                                                    <div style={{ textAlign: 'right' }}>
                                                        <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{step.count.toLocaleString()}</span>
                                                        <span style={{ fontSize: '0.85rem', color: isDark ? '#94a3b8' : '#64748b', marginLeft: '4px' }}>
                                                            ({step.percentage}%)
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div style={{
                                                height: '7px',
                                                background: isDark ? '#0f172a' : '#e2e8f0',
                                                borderRadius: '4px',
                                                overflow: 'hidden',
                                                marginTop: '2px'
                                            }}>
                                                <div style={{
                                                    width: `${Math.max(step.percentage, 2)}%`,
                                                    height: '100%',
                                                    background: step.status === 'critical' ? '#ef4444' : step.status === 'warning' ? '#f59e0b' : '#f97316',
                                                    borderRadius: '4px',
                                                    transition: 'width 0.4s ease'
                                                }}></div>
                                            </div>

                                            {/* Drop-off Note */}
                                            {step.dropped_here > 0 && (
                                                <div style={{
                                                    fontSize: '0.8rem',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    color: isDark ? '#94a3b8' : '#64748b',
                                                    marginTop: '2px'
                                                }}>
                                                    <span style={{ color: step.status === 'critical' ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>
                                                        ⚠️ {step.dropped_here.toLocaleString()} dropped off ({step.drop_rate}% drop rate)
                                                    </span>
                                                    <span style={{ fontStyle: 'italic' }}>{step.hint}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: ISSUES & DROP-OFF BOTTLENECKS */}
                    {activeTab === 'issues' && (
                        <div>
                            {/* Stuck Bookings & Alerts */}
                            <div className="card" style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <AlertTriangle className="text-danger" size={22} />
                                        <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Operational Bottlenecks & Critical Stalls</h3>
                                    </div>
                                    <span className="badge badge-danger">{summary.stuck_bookings_count} Active Alerts</span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                                    <div style={{
                                        padding: '1.2rem',
                                        borderRadius: '8px',
                                        background: isDark ? '#1e293b' : '#fef2f2',
                                        border: '1px solid rgba(239, 68, 68, 0.25)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#ef4444' }}>Arrived but Start OTP Pending</span>
                                            <Clock size={16} color="#ef4444" />
                                        </div>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 700, margin: '8px 0', color: '#ef4444' }}>
                                            {issues.stuck_arrivals_count}
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#64748b', margin: 0 }}>
                                            Provider arrived at customer door &gt; 15 mins ago, but Start OTP was not entered.
                                        </p>
                                    </div>

                                    <div style={{
                                        padding: '1.2rem',
                                        borderRadius: '8px',
                                        background: isDark ? '#1e293b' : '#fffbeb',
                                        border: '1px solid rgba(245, 158, 11, 0.25)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f59e0b' }}>Long In-Progress Service</span>
                                            <Activity size={16} color="#f59e0b" />
                                        </div>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 700, margin: '8px 0', color: '#f59e0b' }}>
                                            {issues.stuck_in_progress_count}
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#64748b', margin: 0 }}>
                                            Session marked in_progress for &gt; 4 hours without completion or End OTP verification.
                                        </p>
                                    </div>

                                    <div style={{
                                        padding: '1.2rem',
                                        borderRadius: '8px',
                                        background: isDark ? '#1e293b' : '#f8fafc',
                                        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Unassigned Pending Requests</span>
                                            <Users size={16} />
                                        </div>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 700, margin: '8px 0' }}>
                                            {issues.unassigned_pending_count}
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#64748b', margin: 0 }}>
                                            Pending bookings awaiting provider match for &gt; 30 minutes in the expansion queue.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Top Cancellation Reasons Breakdown */}
                            <div className="card" style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Top Reasons Bookings Stopped / Cancelled</h3>
                                        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                                            Analysis of client and provider cancellations to eliminate recurring service barriers.
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <span className="badge badge-secondary">By Client: {issues.cancelled_by_breakdown?.client || 0}</span>
                                        <span className="badge badge-secondary">By Provider: {issues.cancelled_by_breakdown?.provider || 0}</span>
                                        <span className="badge badge-secondary">System Timeout: {issues.cancelled_by_breakdown?.system || 0}</span>
                                    </div>
                                </div>

                                {issues.top_cancellation_reasons?.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                                        <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 8px' }} />
                                        <p style={{ margin: 0 }}>No cancellations recorded in this timeframe.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                        {issues.top_cancellation_reasons.map((r: any, idx: number) => {
                                            const totalCanc = issues.total_cancellations || 1;
                                            const pct = Math.round((r.count / totalCanc) * 100);
                                            return (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        padding: '0.75rem 1rem',
                                                        borderRadius: '8px',
                                                        background: isDark ? '#1e293b' : '#f8fafc',
                                                        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '4px'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>
                                                            {idx + 1}. {r.reason}
                                                        </span>
                                                        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#ef4444' }}>
                                                            {r.count} times ({pct}%)
                                                        </span>
                                                    </div>
                                                    <div style={{
                                                        height: '5px',
                                                        background: isDark ? '#0f172a' : '#e2e8f0',
                                                        borderRadius: '3px',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <div style={{ width: `${pct}%`, height: '100%', background: '#ef4444' }}></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Real-time Triage / Issues Feed */}
                            <div className="card">
                                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem' }}>Live Issues & Operational Alerts Feed</h3>

                                {issues.recent_issues_feed?.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                                        <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 8px' }} />
                                        <p style={{ margin: 0 }}>All services operating smoothly. Zero active alerts.</p>
                                    </div>
                                ) : (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr>
                                                    <th>Severity</th>
                                                    <th>Issue Type</th>
                                                    <th>Description</th>
                                                    <th>Client</th>
                                                    <th>Provider</th>
                                                    <th>Time</th>
                                                    {onNavigate && <th>Action</th>}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {issues.recent_issues_feed.map((issue: any) => (
                                                    <tr key={issue.id}>
                                                        <td>
                                                            <span className={`badge badge-${issue.severity === 'critical' || issue.severity === 'high' ? 'danger' : issue.severity === 'medium' ? 'warning' : 'secondary'}`}>
                                                                {issue.severity.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td style={{ fontWeight: 600 }}>{issue.title}</td>
                                                        <td style={{ fontSize: '0.85rem', color: isDark ? '#cbd5e1' : '#334155' }}>
                                                            {issue.description}
                                                        </td>
                                                        <td style={{ fontSize: '0.85rem' }}>{issue.client_name}</td>
                                                        <td style={{ fontSize: '0.85rem' }}>{issue.provider_name}</td>
                                                        <td style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                                                            {issue.created_at ? new Date(issue.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                                        </td>
                                                        {onNavigate && (
                                                            <td>
                                                                <button
                                                                    className="btn btn-secondary"
                                                                    onClick={() => onNavigate('bookings')}
                                                                    style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                                                                    title="View in Bookings"
                                                                >
                                                                    <Eye size={12} />
                                                                </button>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 4: GROWTH & TIMELINE TRENDS */}
                    {activeTab === 'trends' && (
                        <div>
                            {/* Area Chart: Daily Registrations */}
                            <div className="card" style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Registration Growth Trend</h3>
                                        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                                            Daily client signups vs partner onboarding registrations.
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div style={{ width: '12px', height: '12px', background: '#3b82f6', borderRadius: '3px' }}></div>
                                            <span>Customers</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div style={{ width: '12px', height: '12px', background: '#f97316', borderRadius: '3px' }}></div>
                                            <span>Partners</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ height: '320px', width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={timeline}>
                                            <defs>
                                                <linearGradient id="clientGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                                                </linearGradient>
                                                <linearGradient id="provGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                                            <XAxis dataKey="date" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} />
                                            <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} />
                                            <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: isDark ? '#334155' : '#cbd5e1' }} />
                                            <Area type="monotone" dataKey="clients" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#clientGrad)" name="Clients Registered" />
                                            <Area type="monotone" dataKey="providers" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#provGrad)" name="Partners Registered" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Bar Chart: Bookings Volume */}
                            <div className="card">
                                <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.15rem' }}>Daily Booking Activity</h3>
                                <div style={{ height: '280px', width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={timeline}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                                            <XAxis dataKey="date" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} />
                                            <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} />
                                            <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: isDark ? '#334155' : '#cbd5e1' }} />
                                            <Bar dataKey="bookings" fill="#10b981" radius={[4, 4, 0, 0]} name="Bookings Created" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
