import { useState, useEffect } from 'react';
import { adminService } from '../services/admin.service';
import { 
    Bell, Filter, Play, CheckCircle, AlertTriangle, 
    Info, ShieldAlert, RefreshCw, X, HelpCircle, Users, Briefcase
} from 'lucide-react';

interface NotificationTemplate {
    id: string;
    category: 'client' | 'provider' | 'admin' | 'chat' | 'marketing';
    subcategory: string;
    title: string;
    bodyTemplate: string;
    priority: 'critical' | 'high' | 'normal' | 'low';
    defaultChannels: string[];
}

export default function NotificationsSimulator() {
    const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [providers, setProviders] = useState<any[]>([]);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedPriority, setSelectedPriority] = useState<string>('all');
    
    const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
    const [targetUserType, setTargetUserType] = useState<'client' | 'provider' | 'custom'>('client');
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [customUserId, setCustomUserId] = useState<string>('');
    const [contextValues, setContextValues] = useState<Record<string, string>>({});
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [simulatedLogs, setSimulatedLogs] = useState<any[]>([]);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadInitialData();
    }, []);

    // Extract placeholders like {petName} from template string
    useEffect(() => {
        if (selectedTemplate) {
            const matches = selectedTemplate.bodyTemplate.match(/{[a-zA-Z0-9_]+}/g) || [];
            const fields = matches.map(m => m.replace(/[{}]/g, ''));
            const initialContext: Record<string, string> = {};
            
            // Set defaults based on field name for ease of use
            fields.forEach(field => {
                if (field === 'petName') initialContext[field] = 'Buddy';
                else if (field === 'providerName') initialContext[field] = 'Dr. Sarah (Groomer)';
                else if (field === 'clientName') initialContext[field] = 'John Doe';
                else if (field === 'amount' || field === 'bidAmount' || field === 'feeAmount' || field === 'rewardAmount' || field === 'netAmount') initialContext[field] = '$45.00';
                else if (field === 'serviceName') initialContext[field] = 'Dog Walking';
                else if (field === 'bookingId' || field === 'walkId' || field === 'invoiceId' || field === 'ticketId') initialContext[field] = 'BK-9981';
                else if (field === 'couponCode') initialContext[field] = 'SUMMER20';
                else if (field === 'points') initialContext[field] = '150';
                else if (field === 'totalPoints') initialContext[field] = '1250';
                else if (field === 'dateTime' || field === 'newTime' || field === 'startTime' || field === 'time') initialContext[field] = 'Today at 4:30 PM';
                else initialContext[field] = 'Test Value';
            });
            
            setContextValues(initialContext);
        }
    }, [selectedTemplate]);

    const loadInitialData = async () => {
        setIsLoading(true);
        try {
            // Load templates
            const templatesRes = await adminService.getNotificationTemplates();
            if (templatesRes.data?.success) {
                setTemplates(templatesRes.data.templates);
            }

            // Load users for target selection
            const usersRes = await adminService.listUsers({ limit: 100 });
            if (usersRes.data?.users) {
                setUsers(usersRes.data.users.filter((u: any) => u.role === 'client'));
            }

            // Load providers for target selection
            const provsRes = await adminService.listProviders({ limit: 100 });
            if (provsRes.data?.providers) {
                setProviders(provsRes.data.providers);
            }
        } catch (err) {
            console.error('Failed to load simulator data', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTrigger = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTemplate) return;

        setIsSubmitting(true);
        setFeedback(null);

        const targetId = targetUserType === 'custom' ? customUserId : selectedUserId;

        try {
            const res = await adminService.triggerSimulationNotification({
                userId: targetId || undefined,
                templateId: selectedTemplate.id,
                context: contextValues
            });

            if (res.data?.success) {
                setFeedback({
                    type: 'success',
                    message: res.data.message
                });

                // Add to session logs
                setSimulatedLogs(prev => [
                    {
                        id: Math.random().toString(),
                        timestamp: new Date().toLocaleTimeString(),
                        templateId: selectedTemplate.id,
                        title: selectedTemplate.title,
                        priority: selectedTemplate.priority,
                        targetUserId: targetId || 'System Fallback User',
                        channels: selectedTemplate.defaultChannels,
                        status: 'Sent'
                    },
                    ...prev
                ]);

                // Clear modal after short delay
                setTimeout(() => {
                    setSelectedTemplate(null);
                    setFeedback(null);
                }, 2000);
            } else {
                setFeedback({
                    type: 'error',
                    message: 'Failed to simulate notification.'
                });
            }
        } catch (err: any) {
            setFeedback({
                type: 'error',
                message: err.response?.data?.error || err.message || 'An error occurred.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filter logic
    const filteredTemplates = templates.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              t.bodyTemplate.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
        const matchesPriority = selectedPriority === 'all' || t.priority === selectedPriority;
        return matchesSearch && matchesCategory && matchesPriority;
    });

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'critical':
                return <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><ShieldAlert size={12} /> Critical</span>;
            case 'high':
                return <span className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={12} /> High</span>;
            case 'normal':
                return <span className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Info size={12} /> Normal</span>;
            case 'low':
                return <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={12} /> Low</span>;
            default:
                return <span className="badge badge-secondary">{priority}</span>;
        }
    };

    return (
        <div className="animate-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Bell size={26} color="var(--accent)" /> Notification Center & Simulator
                    </h1>
                    <p className="subtitle">
                        Manage, filter, and simulate multi-channel notifications for clients, providers, and system operations.
                    </p>
                </div>
                <div className="page-header-actions">
                    <button className="btn btn-secondary btn-sm" onClick={loadInitialData} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <RefreshCw size={14} /> Refresh Data
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid" style={{ marginBottom: 28 }}>
                <div className="stat-card accent">
                    <div className="stat-icon accent"><Bell size={20} /></div>
                    <div className="stat-label">Total Notifications Catalog</div>
                    <div className="stat-value">{templates.length}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, fontWeight: 500 }}>Preconfigured System Alerts</div>
                </div>
                <div className="stat-card danger">
                    <div className="stat-icon danger"><ShieldAlert size={20} /></div>
                    <div className="stat-label">Critical Priority</div>
                    <div className="stat-value" style={{ color: 'var(--danger)' }}>{templates.filter(t => t.priority === 'critical').length}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, fontWeight: 500 }}>Multi-channel broadcast</div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-icon warning"><Users size={20} /></div>
                    <div className="stat-label">Client Subscriptions</div>
                    <div className="stat-value" style={{ color: 'var(--warning)' }}>{users.length}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, fontWeight: 500 }}>Active simulation clients</div>
                </div>
                <div className="stat-card info">
                    <div className="stat-icon info"><Briefcase size={20} /></div>
                    <div className="stat-label">Registered Providers</div>
                    <div className="stat-value" style={{ color: 'var(--info)' }}>{providers.length}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, fontWeight: 500 }}>Active simulation experts</div>
                </div>
            </div>

            {/* Filter and Simulator Actions */}
            <div className="row" style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                {/* Left Column - Templates Catalog */}
                <div style={{ flex: '2', minWidth: '340px' }}>
                    <div className="card" style={{ padding: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>System Notifications Catalog</h3>
                            
                            {/* Search */}
                            <div className="search-box" style={{ width: 250 }}>
                                <input 
                                    type="text" 
                                    placeholder="Search notifications..." 
                                    className="input search-input" 
                                    style={{ width: '100%' }}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Filters Bar */}
                        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Filter size={13} color="var(--text-muted)" />
                                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Role:</span>
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {['all', 'client', 'provider', 'admin', 'chat', 'marketing'].map(cat => (
                                    <button 
                                        key={cat} 
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                                        style={{ textTransform: 'capitalize', fontSize: 11, borderRadius: 20, padding: '4px 12px' }}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Priority:</span>
                                <select 
                                    className="select"
                                    value={selectedPriority}
                                    onChange={(e) => setSelectedPriority(e.target.value)}
                                    style={{ width: 130, fontSize: 12, padding: '4px 8px' }}
                                >
                                    <option value="all">All Priorities</option>
                                    <option value="critical">🔴 Critical</option>
                                    <option value="high">🟠 High</option>
                                    <option value="normal">🔵 Normal</option>
                                    <option value="low">🟢 Low</option>
                                </select>
                            </div>
                        </div>

                        {/* Templates List Grid */}
                        {isLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 0', flexDirection: 'column', gap: 12 }}>
                                <div className="loader"></div>
                                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading templates registry...</p>
                            </div>
                        ) : filteredTemplates.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px 0', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
                                <Bell size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>No templates match filters</h4>
                                <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Try adjusting your search query or filter tags.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                                {filteredTemplates.map(t => (
                                    <div 
                                        key={t.id} 
                                        className="card hover-effect" 
                                        style={{ 
                                            padding: 18, 
                                            borderRadius: 'var(--radius-md)', 
                                            border: '1px solid var(--border)', 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            justifyContent: 'space-between',
                                            cursor: 'pointer',
                                            background: 'var(--bg-card)',
                                            transition: 'all 0.2s'
                                        }}
                                        onClick={() => setSelectedTemplate(t)}
                                    >
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '3px 8px', background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: 6, letterSpacing: 0.5 }}>
                                                    {t.category} • {t.subcategory}
                                                </span>
                                                {getPriorityBadge(t.priority)}
                                            </div>
                                            <h4 style={{ margin: '0 0 6px 0', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{t.title}</h4>
                                            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 36, lineHeight: 1.5 }}>
                                                {t.bodyTemplate}
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                {t.defaultChannels.map(ch => (
                                                    <span key={ch} style={{ fontSize: 10, padding: '2px 6px', background: 'var(--bg-tertiary)', color: 'var(--text-muted)', borderRadius: 4, textTransform: 'capitalize', fontWeight: 600 }}>
                                                        {ch}
                                                    </span>
                                                ))}
                                            </div>
                                            <button className="btn btn-sm btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 11 }}>
                                                <Play size={10} /> Simulate
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column - Session Simulator Logs */}
                <div style={{ flex: '1', minWidth: '300px' }}>
                    <div className="card" style={{ padding: 24 }}>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Recent Activity Log</h3>
                        <p style={{ margin: '0 0 16px 0', fontSize: 12, color: 'var(--text-muted)' }}>
                            View the output of simulated notifications in this session.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 600, overflowY: 'auto' }}>
                            {simulatedLogs.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 0', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
                                    <HelpCircle size={30} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
                                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>No simulations run in this session.</p>
                                </div>
                            ) : (
                                simulatedLogs.map(log => (
                                    <div key={log.id} style={{ padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{log.timestamp}</span>
                                            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--info)' }}>{log.status}</span>
                                        </div>
                                        <h5 style={{ margin: '0 0 4px 0', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{log.title}</h5>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                                            Target: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{log.targetUserId.substring(0, 8)}...</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                            {log.channels.map((ch: string) => (
                                                <span key={ch} style={{ fontSize: 9, padding: '2px 5px', background: 'var(--bg-tertiary)', color: 'var(--text-muted)', borderRadius: 4, fontWeight: 600 }}>
                                                    {ch}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Simulation Drawer Modal */}
            {selectedTemplate && (
                <div style={{ position: 'fixed', right: 0, top: 0, width: 450, maxWidth: '90vw', height: '100%', background: 'var(--bg-card)', borderLeft: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', zIndex: 1000, padding: 24, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Simulate Notification</h3>
                        <button className="btn btn-secondary btn-icon" onClick={() => setSelectedTemplate(null)} style={{ width: 32, height: 32, borderRadius: '50%' }}>
                            <X size={16} />
                        </button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', marginBottom: 20 }}>
                        <div style={{ padding: 14, background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)' }}>{selectedTemplate.category}</span>
                                {getPriorityBadge(selectedTemplate.priority)}
                            </div>
                            <h4 style={{ margin: '0 0 6px 0', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{selectedTemplate.title}</h4>
                            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{selectedTemplate.bodyTemplate}</p>
                        </div>

                        <form onSubmit={handleTrigger}>
                            {/* Target User */}
                            <div className="form-group" style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Target User Type</label>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                        <input type="radio" checked={targetUserType === 'client'} onChange={() => { setTargetUserType('client'); setSelectedUserId(''); }} /> Client
                                    </label>
                                    <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                        <input type="radio" checked={targetUserType === 'provider'} onChange={() => { setTargetUserType('provider'); setSelectedUserId(''); }} /> Provider
                                    </label>
                                    <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                        <input type="radio" checked={targetUserType === 'custom'} onChange={() => { setTargetUserType('custom'); setSelectedUserId(''); }} /> Custom UID
                                    </label>
                                </div>
                            </div>

                            {/* User Selection */}
                            {targetUserType === 'client' && (
                                <div className="form-group" style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Select Client Profile</label>
                                    <select 
                                        className="select" 
                                        style={{ width: '100%' }}
                                        value={selectedUserId} 
                                        onChange={(e) => setSelectedUserId(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Choose User --</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.full_name || u.email} ({u.email})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {targetUserType === 'provider' && (
                                <div className="form-group" style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Select Provider Profile</label>
                                    <select 
                                        className="select" 
                                        style={{ width: '100%' }}
                                        value={selectedUserId} 
                                        onChange={(e) => setSelectedUserId(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Choose Provider --</option>
                                        {providers.map(p => (
                                            <option key={p.id} value={p.user_id}>{p.business_name || p.full_name} ({p.email})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {targetUserType === 'custom' && (
                                <div className="form-group" style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Target User UUID</label>
                                    <input 
                                        type="text" 
                                        className="input" 
                                        style={{ width: '100%' }}
                                        placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000" 
                                        value={customUserId} 
                                        onChange={(e) => setCustomUserId(e.target.value)}
                                        required
                                    />
                                </div>
                            )}

                            {/* Context Parameters */}
                            {Object.keys(contextValues).length > 0 && (
                                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
                                    <h4 style={{ margin: '0 0 12px 0', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Template Parameters</h4>
                                    
                                    {Object.keys(contextValues).map(key => (
                                        <div key={key} className="form-group" style={{ marginBottom: 12 }}>
                                            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontFamily: 'monospace' }}>
                                                {`{${key}}`}
                                            </label>
                                            <input 
                                                type="text" 
                                                className="input" 
                                                style={{ width: '100%' }}
                                                value={contextValues[key]} 
                                                onChange={(e) => setContextValues(prev => ({ ...prev, [key]: e.target.value }))}
                                                required
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {feedback && (
                                <div className={`badge-status ${feedback.type === 'success' ? 'active' : 'cancelled'}`} style={{ marginTop: 16, width: '100%', padding: '10px 14px', borderRadius: 10, justifyContent: 'center' }}>
                                    {feedback.message}
                                </div>
                            )}

                            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={() => setSelectedTemplate(null)}
                                    style={{ flex: 1, justifyContent: 'center' }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary" 
                                    disabled={isSubmitting}
                                    style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                                >
                                    {isSubmitting ? 'Simulating...' : <><Play size={12} /> Trigger Notification</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
