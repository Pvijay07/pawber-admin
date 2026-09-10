import { useState, useEffect } from 'react';
import { 
    Briefcase, 
    CheckCircle, 
    XCircle, 
    Ban, 
    Percent, 
    Shield, 
    Eye, 
    FileText, 
    ExternalLink, 
    AlertCircle, 
    Clock, 
    Search,
    X,
    FileCheck,
    CreditCard,
    Trash2
} from 'lucide-react';
import { adminService } from '../services/admin.service';

export default function Providers() {
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [providers, setProviders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editCommission, setEditCommission] = useState<{ id: string; value: number } | null>(null);

    // Modals
    const [selectedProvider, setSelectedProvider] = useState<any | null>(null);
    const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; providerId: string; providerName: string; reason: string } | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await adminService.listProviders();
            const list = response.data.providers || [];
            setProviders(list);

            // If a provider modal is open, refresh its data
            if (selectedProvider) {
                const updated = list.find((p: any) => p.id === selectedProvider.id);
                if (updated) setSelectedProvider(updated);
            }
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
    const suspend = (id: string) => updateStatus(id, 'suspended');

    // KYC Approval
    const handleApproveKYC = async (id: string) => {
        setActionLoading(true);
        try {
            await adminService.updateProviderKYC(id, 'approved');
            await fetchData();
            if (selectedProvider?.id === id) {
                setSelectedProvider((prev: any) => prev ? { ...prev, kyc_status: 'approved', status: 'approved' } : null);
            }
        } catch (err) {
            console.error('Error approving KYC:', err);
            alert('Failed to approve KYC. Please check server logs.');
        } finally {
            setActionLoading(false);
        }
    };

    // Open Reject Dialog
    const openRejectDialog = (provider: any) => {
        const name = provider.profiles?.full_name || provider.user?.full_name || provider.business_name || 'Provider';
        setRejectModal({
            isOpen: true,
            providerId: provider.id,
            providerName: name,
            reason: 'Aadhaar document was illegible or details mismatch. Please re-upload clear photos.'
        });
    };

    // Confirm Reject
    const handleConfirmRejectKYC = async () => {
        if (!rejectModal) return;
        setActionLoading(true);
        try {
            await adminService.updateProviderKYC(rejectModal.providerId, 'rejected', rejectModal.reason);
            await fetchData();
            if (selectedProvider?.id === rejectModal.providerId) {
                setSelectedProvider((prev: any) => prev ? { ...prev, kyc_status: 'rejected', kyc_rejection_reason: rejectModal.reason } : null);
            }
            setRejectModal(null);
        } catch (err) {
            console.error('Error rejecting KYC:', err);
            alert('Failed to reject KYC.');
        } finally {
            setActionLoading(false);
        }
    };

    // Document Verification
    const handleVerifyDocument = async (docId: string, status: 'approved' | 'rejected', notes?: string) => {
        try {
            await adminService.verifyDocument(docId, status, notes);
            await fetchData();
        } catch (err) {
            console.error('Error updating document status:', err);
        }
    };

    const handleDeleteProvider = async (provider: any) => {
        const name = provider.business_name || provider.profiles?.full_name || 'Provider';
        if (!window.confirm(`Are you sure you want to permanently delete provider "${name}"? This will remove their services, KYC documents, bank details, and unassign active bookings.`)) {
            return;
        }
        setActionLoading(true);
        try {
            await adminService.deleteProvider(provider.id);
            setProviders(prev => prev.filter(p => p.id !== provider.id));
            if (selectedProvider?.id === provider.id) setSelectedProvider(null);
        } catch (err: any) {
            alert(err.response?.data?.message || err.message || 'Failed to delete provider');
        } finally {
            setActionLoading(false);
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

    const getProfile = (p: any) => p.profiles || p.user || {};

    const filtered = providers.filter(p => {
        const prof = getProfile(p);
        const fullName = (prof.full_name || p.business_name || '').toLowerCase();
        const phone = (prof.phone || '').toLowerCase();
        const aadhaar = (p.aadhaar_number || '').toLowerCase();
        const s = search.toLowerCase();

        if (search && !fullName.includes(s) && !phone.includes(s) && !aadhaar.includes(s)) {
            return false;
        }

        if (filter === 'all') return true;
        if (filter === 'pending_kyc') return p.kyc_status === 'pending';
        if (filter === 'approved_kyc') return p.kyc_status === 'approved' || p.kyc_status === 'verified';
        if (filter === 'rejected_kyc') return p.kyc_status === 'rejected';
        return p.status === filter;
    });

    const pendingKycCount = providers.filter(p => p.kyc_status === 'pending').length;
    const verifiedKycCount = providers.filter(p => p.kyc_status === 'approved' || p.kyc_status === 'verified').length;

    if (loading && providers.length === 0) return <div className="p-8 text-center">Loading providers...</div>;

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h1>Provider & KYC Management</h1>
                    <p className="subtitle">Review uploaded Aadhaar proofs, approve/reject KYC, and manage partner accounts.</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid" style={{ marginBottom: 20 }}>
                <div className="stat-card accent">
                    <div className="stat-icon accent"><Briefcase size={20} /></div>
                    <div className="stat-label">Total Providers</div>
                    <div className="stat-value">{providers.length}</div>
                </div>
                <div className="stat-card warning" style={{ cursor: 'pointer' }} onClick={() => setFilter('pending_kyc')}>
                    <div className="stat-icon warning"><Clock size={20} /></div>
                    <div className="stat-label">Pending KYC Review</div>
                    <div className="stat-value" style={{ color: pendingKycCount > 0 ? '#f59e0b' : undefined }}>
                        {pendingKycCount}
                    </div>
                </div>
                <div className="stat-card info">
                    <div className="stat-icon info"><Shield size={20} /></div>
                    <div className="stat-label">KYC Verified</div>
                    <div className="stat-value">{verifiedKycCount}</div>
                </div>
                <div className="stat-card purple">
                    <div className="stat-icon purple"><Percent size={20} /></div>
                    <div className="stat-label">Avg Commission</div>
                    <div className="stat-value">
                        {providers.length > 0 ? Math.round(providers.reduce((a, p) => a + (p.commission_rate || 15), 0) / providers.length) : 0}%
                    </div>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'pending_kyc', label: `Pending KYC (${pendingKycCount})`, badge: pendingKycCount > 0 },
                        { key: 'approved_kyc', label: 'KYC Approved' },
                        { key: 'rejected_kyc', label: 'KYC Rejected' },
                        { key: 'approved', label: 'Active Partners' },
                        { key: 'pending', label: 'Pending Appr.' },
                        { key: 'suspended', label: 'Suspended' }
                    ].map(f => (
                        <button 
                            key={f.key} 
                            onClick={() => setFilter(f.key)} 
                            className={`btn ${filter === f.key ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                            style={f.badge ? { borderColor: '#f59e0b', color: filter === f.key ? '#fff' : '#d97706', fontWeight: 600 } : undefined}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <div style={{ position: 'relative', width: 260 }}>
                    <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        className="input"
                        placeholder="Search by name, phone, Aadhaar..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ paddingLeft: 32, height: 36, fontSize: 13 }}
                    />
                </div>
            </div>

            {/* Providers Table */}
            <div className="table-container">
                <div className="table-header">
                    <div className="table-title">Providers ({filtered.length})</div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Provider</th>
                            <th>Category</th>
                            <th>Aadhaar Number</th>
                            <th>Uploaded Proofs</th>
                            <th>KYC Status</th>
                            <th>Account Status</th>
                            <th>Commission</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={8} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                                    No providers found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            filtered.map(p => {
                                const prof = getProfile(p);
                                const fullName = prof.full_name || p.business_name || 'Provider';
                                const phone = prof.phone || 'N/A';
                                const docs = p.provider_documents || [];
                                const isKycApproved = p.kyc_status === 'approved' || p.kyc_status === 'verified';
                                const isKycPending = p.kyc_status === 'pending';
                                const isKycRejected = p.kyc_status === 'rejected';

                                return (
                                    <tr key={p.id}>
                                        <td>
                                            <div className="table-user">
                                                <div className="sidebar-user-avatar" style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                                                    {fullName[0]?.toUpperCase() || 'P'}
                                                </div>
                                                <div>
                                                    <div className="table-name" style={{ fontWeight: 600 }}>{fullName}</div>
                                                    <div className="table-sub">{phone} {p.city ? `• ${p.city}` : ''}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge-status confirmed" style={{ textTransform: 'capitalize' }}>
                                                {p.category || 'Service'}
                                            </span>
                                        </td>
                                        <td>
                                            {p.aadhaar_number ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <CreditCard size={14} color="var(--text-muted)" />
                                                    <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 13, letterSpacing: 0.5 }}>
                                                        {p.aadhaar_number.replace(/(\d{4})/g, '$1 ').trim()}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Not provided</span>
                                            )}
                                        </td>
                                        <td>
                                            <button 
                                                className="btn btn-secondary btn-xs"
                                                onClick={() => setSelectedProvider(p)}
                                                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px' }}
                                            >
                                                <FileText size={12} />
                                                <span>{docs.length} doc{docs.length === 1 ? '' : 's'}</span>
                                            </button>
                                        </td>
                                        <td>
                                            {isKycApproved ? (
                                                <span className="badge-status confirmed" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                    <CheckCircle size={11} /> Verified
                                                </span>
                                            ) : isKycRejected ? (
                                                <span className="badge-status cancelled" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                    <XCircle size={11} /> Rejected
                                                </span>
                                            ) : isKycPending ? (
                                                <span className="badge-status pending" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fef3c7', color: '#92400e', fontWeight: 600 }}>
                                                    <Clock size={11} /> Review Pending
                                                </span>
                                            ) : (
                                                <span className="badge-status" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                                                    Not Submitted
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge-status ${p.status}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td>
                                            {editCommission?.id === p.id ? (
                                                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                                    <input
                                                        type="number"
                                                        className="input"
                                                        value={editCommission?.value || 0}
                                                        onChange={e => setEditCommission({ id: p.id, value: parseInt(e.target.value) || 0 })}
                                                        style={{ width: 54, padding: '2px 6px', fontSize: 12 }}
                                                        autoFocus
                                                    />
                                                    <button className="btn btn-primary btn-sm" onClick={() => editCommission && updateCommission(p.id, editCommission.value)} style={{ padding: '2px 6px' }}>✓</button>
                                                </div>
                                            ) : (
                                                <div onClick={() => setEditCommission({ id: p.id, value: p.commission_rate || 15 })} style={{ cursor: 'pointer' }} title="Click to edit">
                                                    {p.commission_rate || 15}%
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                {/* View & Review KYC Documents Modal Button */}
                                                <button 
                                                    className="btn btn-secondary btn-sm" 
                                                    onClick={() => setSelectedProvider(p)} 
                                                    title="Review Aadhaar & Documents"
                                                    style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
                                                >
                                                    <Eye size={13} />
                                                    <span style={{ fontSize: 11 }}>Review</span>
                                                </button>

                                                {/* Quick Approve KYC */}
                                                {!isKycApproved && (
                                                    <button 
                                                        className="btn btn-sm" 
                                                        onClick={() => handleApproveKYC(p.id)} 
                                                        title="Approve Aadhaar KYC"
                                                        style={{ padding: '4px 8px', backgroundColor: '#10b981', color: '#fff' }}
                                                    >
                                                        <CheckCircle size={13} />
                                                    </button>
                                                )}

                                                {/* Quick Reject KYC */}
                                                {!isKycRejected && (
                                                    <button 
                                                        className="btn btn-danger btn-sm" 
                                                        onClick={() => openRejectDialog(p)} 
                                                        title="Reject KYC"
                                                        style={{ padding: '4px 8px' }}
                                                    >
                                                        <XCircle size={13} />
                                                    </button>
                                                )}

                                                {/* Suspend / Unsuspend */}
                                                {p.status === 'approved' && (
                                                    <button className="btn btn-ghost btn-sm" onClick={() => suspend(p.id)} title="Suspend account" style={{ padding: '4px 6px' }}>
                                                        <Ban size={13} color="var(--danger)" />
                                                    </button>
                                                )}
                                                {p.status === 'suspended' && (
                                                    <button className="btn btn-primary btn-sm" onClick={() => approve(p.id)} title="Reactivate account" style={{ padding: '4px 6px' }}>
                                                        <CheckCircle size={13} />
                                                    </button>
                                                )}

                                                {/* Delete Provider */}
                                                <button 
                                                    className="btn btn-ghost btn-sm" 
                                                    onClick={() => handleDeleteProvider(p)} 
                                                    title="Delete Provider" 
                                                    style={{ padding: '4px 6px', color: 'var(--danger)' }}
                                                    disabled={actionLoading}
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* ─── FULL KYC REVIEW & DOCUMENT INSPECTION MODAL ─── */}
            {selectedProvider && (
                <div className="modal-overlay" onClick={() => setSelectedProvider(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 680, maxWidth: '95vw', maxHeight: '88vh' }}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div className="sidebar-user-avatar" style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>
                                    {getProfile(selectedProvider).full_name?.[0]?.toUpperCase() || 'P'}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 16 }}>
                                        {getProfile(selectedProvider).full_name || selectedProvider.business_name || 'Provider Profile'}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                        {getProfile(selectedProvider).phone || 'No phone'} • {getProfile(selectedProvider).email || 'No email'}
                                    </div>
                                </div>
                            </div>
                            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedProvider(null)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {/* Aadhaar Info Card */}
                            <div style={{ background: 'var(--bg-tertiary)', borderRadius: 16, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        12-Digit Aadhaar Number
                                    </div>
                                    <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace', color: 'var(--text-primary)', marginTop: 4 }}>
                                        {selectedProvider.aadhaar_number 
                                            ? selectedProvider.aadhaar_number.replace(/(\d{4})/g, '$1 ').trim()
                                            : 'Not submitted yet'}
                                    </div>
                                </div>
                                <div>
                                    {selectedProvider.kyc_status === 'approved' || selectedProvider.kyc_status === 'verified' ? (
                                        <span className="badge-status confirmed" style={{ padding: '6px 12px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                            <CheckCircle size={14} /> KYC Approved
                                        </span>
                                    ) : selectedProvider.kyc_status === 'rejected' ? (
                                        <span className="badge-status cancelled" style={{ padding: '6px 12px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                            <XCircle size={14} /> KYC Rejected
                                        </span>
                                    ) : selectedProvider.kyc_status === 'pending' ? (
                                        <span className="badge-status pending" style={{ padding: '6px 12px', fontSize: 12, background: '#fef3c7', color: '#92400e', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                            <Clock size={14} /> Under Admin Review
                                        </span>
                                    ) : (
                                        <span className="badge-status" style={{ padding: '6px 12px', fontSize: 12 }}>
                                            Not Submitted
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Rejection notice if previously rejected */}
                            {selectedProvider.kyc_status === 'rejected' && selectedProvider.kyc_rejection_reason && (
                                <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 12, padding: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                    <AlertCircle size={16} color="#ef4444" style={{ marginTop: 2, flexShrink: 0 }} />
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: '#991b1b' }}>Previous Rejection Reason:</div>
                                        <div style={{ fontSize: 12, color: '#ef4444', marginTop: 2 }}>{selectedProvider.kyc_rejection_reason}</div>
                                    </div>
                                </div>
                            )}

                            {/* Uploaded Documents Gallery */}
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <FileCheck size={16} color="var(--accent)" />
                                    <span>Uploaded KYC Documents ({(selectedProvider.provider_documents || []).length})</span>
                                </div>

                                {(selectedProvider.provider_documents || []).length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '24px 0', border: '1px dashed var(--border)', borderRadius: 12, color: 'var(--text-muted)', fontSize: 13 }}>
                                        No documents have been uploaded yet.
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                                        {(selectedProvider.provider_documents || []).map((doc: any) => {
                                            const isDocApproved = doc.verification_status === 'approved';
                                            const isDocRejected = doc.verification_status === 'rejected';

                                            return (
                                                <div 
                                                    key={doc.id} 
                                                    style={{ 
                                                        border: '1px solid var(--border)', 
                                                        borderRadius: 14, 
                                                        padding: 12, 
                                                        background: 'var(--bg-secondary)',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: 10
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'capitalize' }}>
                                                            {doc.document_type === 'aadhaar' ? '🪪 Aadhaar Card (Front/Back)' : doc.document_type === 'selfie' ? '🤳 Live Selfie' : doc.document_type}
                                                        </span>
                                                        <span className={`badge-status ${isDocApproved ? 'confirmed' : isDocRejected ? 'cancelled' : 'pending'}`} style={{ fontSize: 10 }}>
                                                            {doc.verification_status || 'pending'}
                                                        </span>
                                                    </div>

                                                    {/* Document Preview Image */}
                                                    <div 
                                                        style={{ 
                                                            height: 140, 
                                                            borderRadius: 8, 
                                                            overflow: 'hidden', 
                                                            background: '#f3f4f6', 
                                                            cursor: 'pointer',
                                                            position: 'relative'
                                                        }}
                                                        onClick={() => setPreviewDocUrl(doc.file_url)}
                                                    >
                                                        <img 
                                                            src={doc.file_url} 
                                                            alt={doc.document_type} 
                                                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                            onError={(e) => {
                                                                (e.target as HTMLElement).style.display = 'none';
                                                            }}
                                                        />
                                                        <div style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '2px 6px', borderRadius: 4, fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <Eye size={10} /> View
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <a 
                                                            href={doc.file_url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                                                        >
                                                            Open Full Image <ExternalLink size={11} />
                                                        </a>

                                                        <div style={{ display: 'flex', gap: 4 }}>
                                                            {!isDocApproved && (
                                                                <button 
                                                                    className="btn btn-sm"
                                                                    onClick={() => handleVerifyDocument(doc.id, 'approved')}
                                                                    title="Approve this document"
                                                                    style={{ padding: '2px 6px', background: '#10b981', color: '#fff', fontSize: 11 }}
                                                                >
                                                                    Approve
                                                                </button>
                                                            )}
                                                            {!isDocRejected && (
                                                                <button 
                                                                    className="btn btn-danger btn-sm"
                                                                    onClick={() => handleVerifyDocument(doc.id, 'rejected', 'Document illegible or mismatch')}
                                                                    title="Reject this document"
                                                                    style={{ padding: '2px 6px', fontSize: 11 }}
                                                                >
                                                                    Reject
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer Actions */}
                        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedProvider(null)}>
                                    Close
                                </button>
                                <button 
                                    className="btn btn-danger btn-sm" 
                                    style={{ background: 'var(--danger)', color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}
                                    onClick={() => handleDeleteProvider(selectedProvider)}
                                    disabled={actionLoading}
                                >
                                    <Trash2 size={13} />
                                    <span>Delete</span>
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: 10 }}>
                                <button 
                                    className="btn btn-danger btn-sm" 
                                    onClick={() => openRejectDialog(selectedProvider)}
                                    disabled={actionLoading}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                                >
                                    <XCircle size={14} />
                                    <span>Reject KYC</span>
                                </button>

                                <button 
                                    className="btn btn-sm" 
                                    onClick={() => handleApproveKYC(selectedProvider.id)}
                                    disabled={actionLoading}
                                    style={{ background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
                                >
                                    <CheckCircle size={14} />
                                    <span>{actionLoading ? 'Approving...' : 'Approve KYC & Activate Partner'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── REJECT KYC REASON MODAL ─── */}
            {rejectModal?.isOpen && (
                <div className="modal-overlay" onClick={() => setRejectModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 480 }}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <AlertCircle size={20} color="var(--danger)" />
                                <h3>Reject KYC for {rejectModal.providerName}</h3>
                            </div>
                            <button className="btn btn-ghost btn-sm" onClick={() => setRejectModal(null)}>✕</button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                Specify why the Aadhaar KYC is being rejected. This reason will be sent directly to the provider in a notification and shown on their verification screen.
                            </p>

                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Quick Presets:</label>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                                    {[
                                        'Aadhaar document is blurred or unreadable',
                                        'Aadhaar number does not match card photo',
                                        'Card front or back is missing',
                                        'Name on card does not match profile'
                                    ].map(preset => (
                                        <button 
                                            key={preset} 
                                            type="button" 
                                            className="btn btn-secondary btn-xs"
                                            onClick={() => setRejectModal(prev => prev ? { ...prev, reason: preset } : null)}
                                            style={{ fontSize: 11 }}
                                        >
                                            {preset}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginTop: 6 }}>
                                <label style={{ fontSize: 12, fontWeight: 700 }}>Rejection Reason (sent to provider):</label>
                                <textarea
                                    className="input"
                                    rows={3}
                                    value={rejectModal.reason}
                                    onChange={e => setRejectModal(prev => prev ? { ...prev, reason: e.target.value } : null)}
                                    placeholder="Explain why the verification was rejected..."
                                    style={{ width: '100%', marginTop: 6, padding: 10, fontSize: 13 }}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary btn-sm" onClick={() => setRejectModal(null)}>
                                Cancel
                            </button>
                            <button 
                                className="btn btn-danger btn-sm" 
                                onClick={handleConfirmRejectKYC}
                                disabled={actionLoading || !rejectModal.reason.trim()}
                                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                                <XCircle size={14} />
                                <span>{actionLoading ? 'Rejecting...' : 'Confirm Rejection'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── FULL IMAGE LIGHTBOX PREVIEW ─── */}
            {previewDocUrl && (
                <div 
                    className="modal-overlay" 
                    onClick={() => setPreviewDocUrl(null)}
                    style={{ background: 'rgba(0,0,0,0.85)', zIndex: 300 }}
                >
                    <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
                        <button 
                            className="btn btn-ghost btn-sm" 
                            onClick={() => setPreviewDocUrl(null)}
                            style={{ position: 'absolute', top: -40, right: 0, color: '#fff', fontSize: 18 }}
                        >
                            ✕ Close
                        </button>
                        <img 
                            src={previewDocUrl} 
                            alt="Document Preview" 
                            style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: 12, objectFit: 'contain', background: '#000' }} 
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
