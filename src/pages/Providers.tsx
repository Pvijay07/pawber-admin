import { useState, useEffect } from 'react';
import { Briefcase, Star, CheckCircle, XCircle, Ban, Percent, TrendingUp, Shield } from 'lucide-react';

import { adminService } from '../services/admin.service';

export default function Providers() {
    const [filter, setFilter] = useState('all');
    const [providers, setProviders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editCommission, setEditCommission] = useState<{ id: string; value: number } | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await adminService.listProviders();
            setProviders(response.data.providers || []);
        } catch (err) {
            console.error('Error fetching providers:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const updateStatus = async (id: string, status: string) => {
        try {
            await adminService.updateProviderStatus(id, status as any);
            fetchData();
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    const approve = (id: string) => updateStatus(id, 'approved');
    const reject = (id: string) => updateStatus(id, 'rejected');
    const suspend = (id: string) => updateStatus(id, 'suspended');

    const updateKYC = async (id: string, kyc_status: any) => {
        try {
            await adminService.updateProviderKYC(id, kyc_status);
            fetchData();
        } catch (err) {
            console.error('Error updating KYC:', err);
        }
    };

    const updateCommission = async (id: string, value: number) => {
        try {
            await adminService.updateProviderCommission(id, value);
            setProviders(prev => prev.map(p => p.id === id ? { ...p, commission_rate: value } : p));
            setEditCommission(null);
        } catch (err) {
            console.error('Error updating commission:', err);
        }
    };


    const filtered = providers.filter(p => filter === 'all' || p.status === filter);

    if (loading) return <div className="p-8 text-center">Loading providers...</div>;

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h1>Provider Management</h1>
                    <p className="subtitle">Approve, manage, and monitor service providers.</p>
                </div>
            </div>

            <div className="stats-grid" style={{ marginBottom: 20 }}>
                <div className="stat-card accent">
                    <div className="stat-icon accent"><Briefcase size={20} /></div>
                    <div className="stat-label">Total Providers</div>
                    <div className="stat-value">{providers.length}</div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-icon warning"><Shield size={20} /></div>
                    <div className="stat-label">Pending Approval</div>
                    <div className="stat-value">{providers.filter(p => p.status === 'pending').length}</div>
                </div>
                <div className="stat-card info">
                    <div className="stat-icon info"><TrendingUp size={20} /></div>
                    <div className="stat-label">Verified</div>
                    <div className="stat-value">{providers.filter(p => p.kyc_status === 'verified').length}</div>
                </div>
                <div className="stat-card purple">
                    <div className="stat-icon purple"><Percent size={20} /></div>
                    <div className="stat-label">Avg Commission</div>
                    <div className="stat-value">{providers.length > 0 ? Math.round(providers.reduce((a, p) => a + (p.commission_rate || 15), 0) / providers.length) : 0}%</div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {['all', 'approved', 'pending', 'suspended'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'} btn-sm`}>
                        {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            <div className="table-container">
                <div className="table-header">
                    <div className="table-title">Providers ({filtered.length})</div>
                </div>
                <table>
                    <thead><tr><th>Provider</th><th>Category</th><th>Rating</th><th>Experience</th><th>Commission</th><th>KYC Status</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {filtered.map(p => (
                            <tr key={p.id}>
                                <td>
                                    <div className="table-user">
                                        <div className="sidebar-user-avatar" style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                                            {p.user?.full_name?.[0] || 'P'}
                                        </div>
                                        <div><div className="table-name">{p.business_name || p.user?.full_name}</div><div className="table-sub">{p.category}</div></div>
                                    </div>
                                </td>
                                <td><span className="badge-status confirmed">{p.category}</span></td>
                                <td>
                                    {p.rating > 0 ? (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#f59e0b' }}>
                                            <Star size={12} fill="#f59e0b" /> {p.rating}
                                        </span>
                                    ) : '—'}
                                </td>
                                <td style={{ fontWeight: 700 }}>{p.experience_years || 0} yrs</td>
                                <td>
                                    {editCommission?.id === p.id ? (
                                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                            <input
                                                type="number"
                                                className="input"
                                                value={editCommission?.value || 0}
                                                onChange={e => setEditCommission({ id: p.id, value: parseInt(e.target.value) || 0 })}

                                                style={{ width: 60, padding: '4px 8px', fontSize: 12 }}
                                                autoFocus
                                            />
                                            <button className="btn btn-primary btn-sm" onClick={() => editCommission && updateCommission(p.id, editCommission.value)} style={{ padding: '4px 8px' }}>✓</button>
                                        </div>
                                    ) : (
                                        <div onClick={() => setEditCommission({ id: p.id, value: p.commission_rate || 15 })} style={{ cursor: 'pointer' }}>
                                            {p.commission_rate || 15}%
                                        </div>
                                    )}
                                </td>
                                <td>
                                    <span className={`badge-status ${p.kyc_status === 'verified' ? 'confirmed' : p.kyc_status === 'rejected' ? 'cancelled' : 'pending'}`}>
                                        {p.kyc_status || 'pending'}
                                    </span>
                                </td>
                                <td><span className={`badge-status ${p.status}`}>{p.status}</span></td>
                                <td>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        {p.status === 'pending' && (
                                            <>
                                                <button className="btn btn-primary btn-sm" onClick={() => approve(p.id)} style={{ padding: '4px 8px' }}><CheckCircle size={14} /></button>
                                                <button className="btn btn-danger btn-sm" onClick={() => reject(p.id)} style={{ padding: '4px 8px' }}><XCircle size={14} /></button>
                                            </>
                                        )}
                                        {p.status === 'approved' && (
                                            <button className="btn btn-danger btn-sm" onClick={() => suspend(p.id)} style={{ padding: '4px 8px' }}><Ban size={14} /></button>
                                        )}
                                        {p.status === 'suspended' && (
                                            <button className="btn btn-primary btn-sm" onClick={() => approve(p.id)} style={{ padding: '4px 8px' }}><CheckCircle size={14} /></button>
                                        )}
                                        {p.kyc_status !== 'verified' && (
                                            <button className="btn btn-secondary btn-sm" onClick={() => updateKYC(p.id, 'verified')} title="Verify KYC" style={{ padding: '4px 8px' }}><Shield size={14} /></button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

