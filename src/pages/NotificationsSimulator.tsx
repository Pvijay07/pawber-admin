import { useState, useEffect } from 'react';
import { adminService } from '../services/admin.service';
import { 
    Bell, Search, Filter, Play, CheckCircle, AlertTriangle, 
    Info, ShieldAlert, RefreshCw, X, HelpCircle
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
        <div className="container-fluid" style={{ padding: '24px 30px' }}>
            {/* Header */}
            <div className="dashboard-header" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Bell size={26} className="text-primary" /> Notification Center & Simulator
                    </h1>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
                        Manage, filter, and simulate multi-channel notifications for clients, providers, and system operations.
                    </p>
                </div>
                <button className="btn btn-secondary" onClick={loadInitialData} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <RefreshCw size={14} /> Refresh Data
                </button>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 24 }}>
                <div className="stats-card">
                    <div className="label">Total Notifications Catalog</div>
                    <div className="value">{templates.length}</div>
                    <div className="desc">Preconfigured System Alerts</div>
                </div>
                <div className="stats-card">
                    <div className="label">Critical Priority</div>
                    <div className="value text-danger">{templates.filter(t => t.priority === 'critical').length}</div>
                    <div className="desc">Multi-channel broadcast</div>
                </div>
                <div className="stats-card">
                    <div className="label">Client Subscriptions</div>
                    <div className="value text-warning">{users.length}</div>
                    <div className="desc">Active simulation clients</div>
                </div>
                <div className="stats-card">
                    <div className="label">Registered Providers</div>
                    <div className="value text-success">{providers.length}</div>
                    <div className="desc">Active simulation experts</div>
                </div>
            </div>

            {/* Filter and Simulator Actions */}
            <div className="row" style={{ display: 'flex', gap: 24 }}>
                {/* Left Column - Templates Catalog */}
                <div style={{ flex: '2', minWidth: '0' }}>
                    <div className="panel" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>System Notifications Catalog</h3>
                            
                            {/* Search */}
                            <div className="search-box" style={{ position: 'relative', width: 250 }}>
                                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input 
                                    type="text" 
                                    placeholder="Search notifications..." 
                                    className="form-control" 
                                    style={{ paddingLeft: 30, fontSize: 13 }}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Filters Bar */}
                        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Filter size={13} className="text-muted" />
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Role:</span>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                {['all', 'client', 'provider', 'admin', 'chat', 'marketing'].map(cat => (
                                    <button 
                                        key={cat} 
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-light'}`}
                                        style={{ textTransform: 'capitalize', fontSize: 11 }}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Priority:</span>
                                <select 
                                    className="form-control form-control-sm"
                                    value={selectedPriority}
                                    onChange={(e) => setSelectedPriority(e.target.value)}
                                    style={{ width: 110, fontSize: 11, padding: '2px 8px' }}
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
                            <div style={{ textAlign: 'center', padding: '60px 0', border: '1px dashed var(--border)', borderRadius: 8 }}>
                                <Bell size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>No templates match filters</h4>
                                <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Try adjusting your search query or filter tags.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                {filteredTemplates.map(t => (
                                    <div 
                                        key={t.id} 
                                        className="panel hover-effect" 
                                        style={{ 
                                            padding: 16, 
                                            borderRadius: 8, 
                                            border: '1px solid var(--border)', 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            justifyContent: 'space-between',
                                            cursor: 'pointer',
                                            background: 'var(--surface-overlay)'
                                        }}
                                        onClick={() => setSelectedTemplate(t)}
                                    >
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                                <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', padding: '2px 6px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 4 }}>
                                                    {t.category} • {t.subcategory}
                                                </span>
                                                {getPriorityBadge(t.priority)}
                                            </div>
                                            <h4 style={{ margin: '0 0 6px 0', fontSize: 14, fontWeight: 600 }}>{t.title}</h4>
                                            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 36 }}>
                                                {t.bodyTemplate}
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-light)' }}>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                {t.defaultChannels.map(ch => (
                                                    <span key={ch} style={{ fontSize: 10, padding: '1px 5px', border: '1px solid var(--border)', borderRadius: 4, textTransform: 'capitalize' }}>
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
                <div style={{ flex: '1', minWidth: '320px' }}>
                    <div className="panel" style={{ padding: 20 }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600 }}>Recent Activity Log</h3>
                        <p style={{ margin: '0 0 16px 0', fontSize: 12, color: 'var(--text-muted)' }}>
                            View the output of simulated notifications in this session.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 600, overflowY: 'auto' }}>
                            {simulatedLogs.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 0', border: '1px dashed var(--border)', borderRadius: 8 }}>
                                    <HelpCircle size={30} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
                                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>No simulations run in this session.</p>
                                </div>
                            ) : (
                                simulatedLogs.map(log => (
                                    <div key={log.id} style={{ padding: 12, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--background)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{log.timestamp}</span>
                                            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--success)' }}>{log.status}</span>
                                        </div>
                                        <h5 style={{ margin: '0 0 4px 0', fontSize: 12, fontWeight: 600 }}>{log.title}</h5>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                                            Target: <span style={{ fontFamily: 'monospace' }}>{log.targetUserId.substring(0, 8)}...</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                            {log.channels.map((ch: string) => (
                                                <span key={ch} style={{ fontSize: 9, padding: '1px 4px', background: 'var(--border-light)', borderRadius: 3 }}>
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
                <div style={{ position: 'fixed', right: 0, top: 0, width: 450, height: '100%', background: 'var(--surface)', borderLeft: '1px solid var(--border)', boxShadow: '-4px 0 20px rgba(0,0,0,0.15)', zIndex: 1000, padding: 24, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Simulate Notification</h3>
                        <button className="btn btn-light" onClick={() => setSelectedTemplate(null)} style={{ padding: 4, borderRadius: 50 }}>
                            <X size={18} />
                        </button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', marginBottom: 20 }}>
                        <div style={{ padding: 12, background: 'var(--background)', borderRadius: 6, border: '1px solid var(--border)', marginBottom: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)' }}>{selectedTemplate.category}</span>
                                {getPriorityBadge(selectedTemplate.priority)}
                            </div>
                            <h4 style={{ margin: '0 0 6px 0', fontSize: 14, fontWeight: 600 }}>{selectedTemplate.title}</h4>
                            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>{selectedTemplate.bodyTemplate}</p>
                        </div>

                        <form onSubmit={handleTrigger}>
                            {/* Target User */}
                            <div className="form-group" style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Target User Type</label>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <input type="radio" checked={targetUserType === 'client'} onChange={() => { setTargetUserType('client'); setSelectedUserId(''); }} /> Client
                                    </label>
                                    <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <input type="radio" checked={targetUserType === 'provider'} onChange={() => { setTargetUserType('provider'); setSelectedUserId(''); }} /> Provider
                                    </label>
                                    <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <input type="radio" checked={targetUserType === 'custom'} onChange={() => { setTargetUserType('custom'); setSelectedUserId(''); }} /> Custom UID
                                    </label>
                                </div>
                            </div>

                            {/* User Selection */}
                            {targetUserType === 'client' && (
                                <div className="form-group" style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Select Client Profile</label>
                                    <select 
                                        className="form-control" 
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
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Select Provider Profile</label>
                                    <select 
                                        className="form-control" 
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
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Target User UUID</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
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
                                    <h4 style={{ margin: '0 0 12px 0', fontSize: 13, fontWeight: 600 }}>Template Parameters</h4>
                                    
                                    {Object.keys(contextValues).map(key => (
                                        <div key={key} className="form-group" style={{ marginBottom: 12 }}>
                                            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontFamily: 'monospace' }}>
                                                {`{${key}}`}
                                            </label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                value={contextValues[key]} 
                                                onChange={(e) => setContextValues(prev => ({ ...prev, [key]: e.target.value }))}
                                                required
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {feedback && (
                                <div className={`alert ${feedback.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginTop: 16 }}>
                                    {feedback.message}
                                </div>
                            )}

                            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={() => setSelectedTemplate(null)}
                                    style={{ flex: 1 }}
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
