import { useState, useEffect } from 'react';
import { AlertTriangle, Eye, CheckCircle, XCircle, DollarSign, Image, Ban } from 'lucide-react';
import { adminService } from '../services/admin.service';

export default function Disputes() {
    const [disputes, setDisputes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<any | null>(null);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const fetchDisputes = async () => {
            setLoading(true);
            try {
                const response = await adminService.listDisputes();
                setDisputes(response.data.disputes || []);
            } catch (err) {
                console.error('Error fetching disputes:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDisputes();
    }, []);

    const resolve = async (id: string, action: 'refund' | 'penalize' | 'dismiss') => {
        try {
            await adminService.resolveDispute(id, {
                resolution: action,
                status: 'resolved'
            });
            setDisputes(prev => prev.map(d => d.id === id ? { ...d, status: 'resolved' } : d));
            setSelected(null);
        } catch (err) {
            console.error('Error resolving dispute:', err);
        }
    };

    const filtered = disputes.filter(d => filter === 'all' || d.status === filter);

    if (loading) return <div className="p-8 text-center">Loading disputes...</div>;

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h1>Dispute Management</h1>
                    <p className="subtitle">Review and resolve service disputes between clients and providers.</p>
                </div>
            </div>

            <div className="stats-grid" style={{ marginBottom: 20 }}>
                <div className="stat-card danger">
                    <div className="stat-icon danger"><AlertTriangle size={20} /></div>
                    <div className="stat-label">Open Disputes</div>
                    <div className="stat-value">{disputes.filter(d => d.status === 'open').length}</div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-icon warning"><Eye size={20} /></div>
                    <div className="stat-label">Under Review</div>
                    <div className="stat-value">{disputes.filter(d => d.status === 'review').length}</div>
                </div>
                <div className="stat-card accent">
                    <div className="stat-icon accent"><CheckCircle size={20} /></div>
                    <div className="stat-label">Resolved</div>
                    <div className="stat-value">{disputes.filter(d => d.status === 'resolved').length}</div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {['all', 'open', 'review', 'resolved'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'} btn-sm`}>
                        {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
                {filtered.map(d => (
                    <div key={d.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setSelected(d)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                <div style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)' }}>{d.id.substring(0, 8)}</div>
                                <span className="badge-status pending" style={{ fontSize: 10, textTransform: 'uppercase' }}>
                                    High priority {/* Can add a field if needed */}
                                </span>
                            </div>
                            <span className={`badge-status ${d.status === 'open' ? 'cancelled' : d.status === 'review' ? 'pending' : 'completed'}`}>{d.status.replace('_', ' ')}</span>
                        </div>

                        <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 10 }}>
                                    {d.raised_by_user?.full_name?.[0] || 'U'}
                                </div>
                                <div><div style={{ fontSize: 12, fontWeight: 600 }}>{d.raised_by_user?.full_name || 'User'}</div><div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Client</div></div>
                            </div>
                            <span style={{ color: 'var(--text-muted)' }}>vs</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 10 }}>
                                    {d.booking?.provider?.business_name?.[0] || 'P'}
                                </div>
                                <div><div style={{ fontSize: 12, fontWeight: 600 }}>{d.booking?.provider?.business_name || 'Provider'}</div><div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Provider</div></div>
                            </div>
                            <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>₹{(d.booking?.total_amount || 0).toLocaleString()}</span>
                        </div>

                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{d.reason}</p>

                        <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}><Image size={12} /> {d.evidence_urls?.length || 0} evidence</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>•</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.booking?.service?.name || 'Service'}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>•</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(d.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                ))}

            </div>

            {/* Detail Modal */}
            {selected && (
                <div className="modal-overlay" onClick={() => setSelected(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div><div style={{ fontWeight: 700, fontSize: 16 }}>Dispute {selected.id.substring(0, 8)}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Booking: {selected.booking_id.substring(0, 8)}</div></div>
                            <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="grid-2" style={{ marginBottom: 16 }}>
                                <div className="card">
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Client</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 10 }}>
                                            {selected.raised_by_user?.full_name?.[0] || 'U'}
                                        </div>
                                        <span style={{ fontWeight: 600, fontSize: 13 }}>{selected.raised_by_user?.full_name || 'User'}</span>
                                    </div>
                                </div>
                                <div className="card">
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Provider</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 10 }}>
                                            {selected.booking?.provider?.business_name?.[0] || 'P'}
                                        </div>
                                        <span style={{ fontWeight: 600, fontSize: 13 }}>{selected.booking?.provider?.business_name || 'Provider'}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: 12, background: 'var(--bg-tertiary)', borderRadius: 10, marginBottom: 16 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Complaint</div>
                                <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)' }}>{selected.reason}</p>
                            </div>

                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                                {selected.evidence_urls?.map((ev: string, i: number) => (
                                    <div key={i} style={{ padding: '8px 12px', background: 'var(--bg-tertiary)', borderRadius: 8, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--info)' }}>
                                        <Image size={14} /> {ev.split('/').pop()}
                                    </div>
                                ))}
                            </div>

                            <div className="grid-2">
                                <div style={{ padding: 8, background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Service</span>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>{selected.booking?.service?.name || 'Service'}</div>
                                </div>
                                <div style={{ padding: 8, background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Amount</span>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>₹{(selected.booking?.total_amount || 0).toLocaleString()}</div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-primary btn-sm" onClick={() => resolve(selected.id, 'refund')}><DollarSign size={14} /> Full Refund</button>
                            <button className="btn btn-danger btn-sm" onClick={() => resolve(selected.id, 'penalize')}><Ban size={14} /> Penalize Provider</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => resolve(selected.id, 'dismiss')}><XCircle size={14} /> Dismiss</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
