import { useState, useEffect } from 'react';
import { MoreVertical, Eye, Clock, Download, UserPlus, Search, X } from 'lucide-react';
import { adminService } from '../services/admin.service';

export default function Bookings() {
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Direct Assign State
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [providers, setProviders] = useState<any[]>([]);
    const [providerSearch, setProviderSearch] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const response = await adminService.listBookings();
            setBookings(response.data.bookings || []);
        } catch (err) {
            console.error('Error fetching bookings:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchProviders = async () => {
        try {
            const res = await adminService.listProviders({ status: 'approved' });
            setProviders(res.data.providers || []);
        } catch (err) {
            console.error('Error fetching providers:', err);
        }
    };

    const handleOpenAssign = (booking: any) => {
        setSelectedBooking(booking);
        setIsAssignModalOpen(true);
        if (providers.length === 0) fetchProviders();
    };

    const handleAssign = async (providerId: string) => {
        if (!selectedBooking) return;
        setIsAssigning(true);
        try {
            await adminService.assignBookingProvider(selectedBooking.id, providerId);
            setIsAssignModalOpen(false);
            fetchBookings();
            alert('Provider assigned successfully!');
        } catch (err) {
            alert('Failed to assign provider');
        } finally {
            setIsAssigning(false);
        }
    };

    const filtered = bookings.filter(b => {
        if (filter !== 'all' && b.status !== filter) return false;
        const userName = b.user?.full_name || '';
        if (search && !userName.toLowerCase().includes(search.toLowerCase()) && !b.id.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const filteredProviders = providers.filter(p => 
        p.business_name.toLowerCase().includes(providerSearch.toLowerCase()) ||
        p.profiles?.full_name.toLowerCase().includes(providerSearch.toLowerCase())
    );

    const counts = {
        all: bookings.length,
        pending: bookings.filter(b => b.status === 'pending').length,
        confirmed: bookings.filter(b => b.status === 'confirmed').length,
        in_progress: bookings.filter(b => b.status === 'in_progress').length,
        completed: bookings.filter(b => b.status === 'completed').length,
        cancelled: bookings.filter(b => b.status === 'cancelled').length,
    };


    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h1>Booking Management</h1>
                    <p className="subtitle">Track and manage all service bookings across the platform.</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn btn-secondary btn-sm"><Download size={14} /> Export CSV</button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                {Object.entries(counts).map(([key, count]) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={`btn ${filter === key ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    >
                        {key === 'all' ? 'All' : key.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} ({count})
                    </button>
                ))}
            </div>

            <div className="table-container">
                <div className="table-header">
                    <div className="table-title">Bookings ({filtered.length})</div>
                    <div className="table-actions">
                        <input
                            type="text"
                            className="input search-input"
                            placeholder="Search by name or ID..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ width: 220 }}
                        />
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Booking ID</th>
                            <th>Client</th>
                            <th>Pet</th>
                            <th>Service</th>
                            <th>Provider</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px' }}>Loading bookings...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px' }}>No bookings found.</td></tr>
                        ) : filtered.map(b => (
                            <tr key={b.id}>
                                <td><span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)', fontSize: 12 }}>{b.id.substring(0, 8)}</span></td>
                                <td>
                                    <div className="table-user">
                                        <div className="table-avatar" style={{ background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 10 }}>
                                            {b.user?.full_name?.[0] || 'U'}
                                        </div>
                                        <span className="table-name">{b.user?.full_name || 'Unnamed'}</span>
                                    </div>
                                </td>
                                <td style={{ fontWeight: 600 }}>{b.pet_name || 'Pet'}</td>
                                <td>{b.service?.name || 'Service'}</td>
                                <td style={{ fontSize: 12 }}>
                                    {b.provider?.business_name ? (
                                        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{b.provider.business_name}</span>
                                    ) : (
                                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Unassigned</span>
                                    )}
                                </td>
                                <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{(b.total_amount || 0).toLocaleString()}</td>
                                <td>
                                    <div style={{ fontSize: 12 }}>{new Date(b.created_at).toLocaleDateString()}</div>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10} /> {new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                </td>
                                <td><span className={`badge-status ${b.status}`}>{b.status.replace('_', ' ')}</span></td>
                                <td>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <button className="btn btn-ghost btn-sm btn-icon" title="View"><Eye size={14} /></button>
                                        {!b.provider_id && b.status === 'pending' && (
                                            <button 
                                                className="btn btn-ghost btn-sm btn-icon" 
                                                style={{ color: 'var(--primary)' }} 
                                                title="Direct Assign"
                                                onClick={() => handleOpenAssign(b)}
                                            >
                                                <UserPlus size={14} />
                                            </button>
                                        )}
                                        <button className="btn btn-ghost btn-sm btn-icon" title="More"><MoreVertical size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                    </tbody>
                </table>
            </div>

            {/* Direct Assign Modal */}
            {isAssignModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: 500 }}>
                        <div className="modal-header">
                            <div>
                                <h2>Direct Assign Expert</h2>
                                <p className="subtitle">Select a professional to assign to this booking.</p>
                            </div>
                            <button className="btn-icon" onClick={() => setIsAssignModalOpen(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="booking-summary-mini" style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 12, marginBottom: 20 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Booking for</div>
                                <div style={{ fontSize: 16, fontWeight: 700 }}>{selectedBooking?.service?.name} • ₹{selectedBooking?.total_amount}</div>
                                <div style={{ fontSize: 13 }}>Client: {selectedBooking?.user?.full_name}</div>
                            </div>

                            <div className="search-box" style={{ position: 'relative', marginBottom: 16 }}>
                                <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                                <input 
                                    type="text" 
                                    className="input" 
                                    placeholder="Search experts by name or business..." 
                                    style={{ paddingLeft: 40 }}
                                    value={providerSearch}
                                    onChange={e => setProviderSearch(e.target.value)}
                                />
                            </div>

                            <div className="provider-list-scroll" style={{ maxHeight: 300, overflowY: 'auto' }}>
                                {filteredProviders.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>No available experts found.</div>
                                ) : filteredProviders.map(p => (
                                    <div key={p.id} className="provider-item-select" onClick={() => handleAssign(p.id)} style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        padding: 12, 
                                        borderRadius: 12, 
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}>
                                        <div className="table-avatar" style={{ background: 'var(--primary)', color: '#fff', marginRight: 12 }}>
                                            {p.business_name[0]}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700, fontSize: 14 }}>{p.business_name}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.profiles?.full_name} • {p.category}</div>
                                        </div>
                                        <button className="btn btn-secondary btn-sm" disabled={isAssigning}>Assign</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <style>{`
                .provider-item-select:hover {
                    background: var(--bg-secondary);
                }
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    backdrop-filter: blur(4px);
                }
                .modal-content {
                    background: #fff;
                    border-radius: 24px;
                    width: 100%;
                    padding: 24px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                    animation: modalSlide 0.3s ease-out;
                }
                @keyframes modalSlide {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 20px;
                }
            `}</style>
        </div>
    );
}
