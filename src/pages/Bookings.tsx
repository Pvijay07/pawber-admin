import { useState, useEffect } from 'react';
import {
    Eye, Clock, Download, UserPlus, Search, X, Trash2,
    MapPin, CreditCard, CheckCircle2, Phone,
    Navigation, RefreshCw, ExternalLink
} from 'lucide-react';
import { adminService } from '../services/admin.service';

export default function Bookings() {
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Direct Assign State
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [providers, setProviders] = useState<any[]>([]);
    const [providerSearch, setProviderSearch] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);

    // Details & Tracking Modal State
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [bookingDetails, setBookingDetails] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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

    const handleOpenDetails = async (booking: any) => {
        setSelectedBooking(booking);
        setIsDetailsModalOpen(true);
        setLoadingDetails(true);
        try {
            const res = await adminService.getBookingDetails(booking.id);
            if (res.data?.success) {
                setBookingDetails(res.data);
            }
        } catch (err: any) {
            console.error('Failed to get booking details:', err);
            // Fallback to table data
            setBookingDetails({
                booking,
                payments: [],
                tracking: { started: !!booking.tracking_started, latest_location: null, updates: [] }
            });
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleUpdateStatus = async (status: string, paymentStatus?: string) => {
        if (!bookingDetails?.booking?.id) return;
        setIsUpdatingStatus(true);
        try {
            const res = await adminService.updateBookingStatus(bookingDetails.booking.id, {
                status,
                payment_status: paymentStatus
            });
            if (res.data?.success) {
                setBookingDetails((prev: any) => ({
                    ...prev,
                    booking: {
                        ...prev.booking,
                        status: res.data.booking.status,
                        payment_status: res.data.booking.payment_status || prev.booking.payment_status
                    }
                }));
                fetchBookings();
            }
        } catch (err: any) {
            alert(err.response?.data?.message || err.message || 'Failed to update booking status');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleDeleteBooking = async (booking: any) => {
        const confirmMsg = `Are you sure you want to permanently delete booking #${booking.id.slice(0, 8)} (${booking.service?.name || 'Service'})? All associated payments, reviews, and event records will also be removed.`;
        if (!window.confirm(confirmMsg)) return;

        setDeletingId(booking.id);
        try {
            await adminService.deleteBooking(booking.id);
            setBookings(prev => prev.filter(b => b.id !== booking.id));
            if (isDetailsModalOpen && selectedBooking?.id === booking.id) {
                setIsDetailsModalOpen(false);
            }
        } catch (err: any) {
            alert(err.response?.data?.message || err.message || 'Failed to delete booking');
        } finally {
            setDeletingId(null);
        }
    };

    const filtered = bookings.filter(b => {
        if (filter !== 'all' && b.status !== filter) return false;
        const userName = b.user?.full_name || '';
        if (search && !userName.toLowerCase().includes(search.toLowerCase()) && !b.id.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const filteredProviders = providers.filter(p =>
        p.business_name?.toLowerCase().includes(providerSearch.toLowerCase()) ||
        p.profiles?.full_name?.toLowerCase().includes(providerSearch.toLowerCase())
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
                    <p className="subtitle">Real-time oversight of service bookings, live tracking, and payments.</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn btn-secondary btn-sm" onClick={fetchBookings}>
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
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
                                <td>
                                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)', fontSize: 12 }}>
                                        #{b.id.substring(0, 8)}
                                    </span>
                                </td>
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
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                        <Clock size={10} /> {new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </td>
                                <td>
                                    <span className={`badge-status ${b.status}`}>{b.status.replace('_', ' ')}</span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', fontSize: 12 }}
                                            title="View Details, Tracking & Payments"
                                            onClick={() => handleOpenDetails(b)}
                                        >
                                            <Eye size={13} /> Details
                                        </button>
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
                                        <button
                                            className="btn btn-ghost btn-sm btn-icon"
                                            style={{ color: 'var(--danger)' }}
                                            title="Delete Booking"
                                            disabled={deletingId === b.id}
                                            onClick={() => handleDeleteBooking(b)}
                                        >
                                            <Trash2 size={14} />
                                        </button>
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
                                            {p.business_name?.[0] || 'P'}
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

            {/* Comprehensive Booking Details, Live Tracking & Payments Modal */}
            {isDetailsModalOpen && (
                <div className="modal-overlay" onClick={() => setIsDetailsModalOpen(false)}>
                    <div className="modal-content" style={{ maxWidth: 720, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <h2>Booking #{selectedBooking?.id?.substring(0, 8)}</h2>
                                    {bookingDetails?.booking && (
                                        <span className={`badge-status ${bookingDetails.booking.status}`}>
                                            {bookingDetails.booking.status?.replace('_', ' ')}
                                        </span>
                                    )}
                                </div>
                                <p className="subtitle">Complete service specs, real-time GPS tracking, and payment breakdown.</p>
                            </div>
                            <button className="btn-icon" onClick={() => setIsDetailsModalOpen(false)}><X size={20} /></button>
                        </div>

                        <div className="modal-body">
                            {loadingDetails ? (
                                <div style={{ textAlign: 'center', padding: '50px 0' }}>
                                    <div className="loader" style={{ margin: '0 auto 12px' }}></div>
                                    <p style={{ color: 'var(--text-muted)' }}>Loading tracking and payment records...</p>
                                </div>
                            ) : (
                                <>
                                    {/* Quick Overview Cards */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
                                        <div style={{ padding: 14, background: 'var(--bg-secondary)', borderRadius: 14 }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Customer</div>
                                            <div style={{ fontWeight: 700, fontSize: 14 }}>{bookingDetails?.booking?.user?.full_name || 'Client'}</div>
                                            {bookingDetails?.booking?.user?.phone && (
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                                    <Phone size={12} /> {bookingDetails.booking.user.phone}
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ padding: 14, background: 'var(--bg-secondary)', borderRadius: 14 }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Assigned Expert</div>
                                            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary)' }}>
                                                {bookingDetails?.booking?.provider?.business_name || 'Not Assigned'}
                                            </div>
                                            {bookingDetails?.booking?.provider?.user?.phone && (
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                                    <Phone size={12} /> {bookingDetails.booking.provider.user.phone}
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ padding: 14, background: 'var(--bg-secondary)', borderRadius: 14 }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Service & Pricing</div>
                                            <div style={{ fontWeight: 700, fontSize: 14 }}>{bookingDetails?.booking?.service?.name}</div>
                                            <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700, marginTop: 2 }}>
                                                ₹{bookingDetails?.booking?.total_amount} ({bookingDetails?.booking?.payment_status || 'unpaid'})
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Controls */}
                                    <div style={{ padding: 14, background: 'rgba(255, 82, 0, 0.05)', border: '1px solid rgba(255, 82, 0, 0.15)', borderRadius: 14, marginBottom: 20 }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
                                            ⚡ Admin Action Controls (Override Status):
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                disabled={isUpdatingStatus}
                                                onClick={() => handleUpdateStatus('confirmed')}
                                            >
                                                Mark Confirmed
                                            </button>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                disabled={isUpdatingStatus}
                                                onClick={() => handleUpdateStatus('in_progress')}
                                            >
                                                Mark In Progress
                                            </button>
                                            <button
                                                className="btn btn-primary btn-sm"
                                                disabled={isUpdatingStatus}
                                                onClick={() => handleUpdateStatus('completed', 'paid')}
                                            >
                                                <CheckCircle2 size={14} /> Mark Completed & Paid
                                            </button>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                style={{ color: 'var(--danger)' }}
                                                disabled={isUpdatingStatus}
                                                onClick={() => handleUpdateStatus('cancelled', 'refunded')}
                                            >
                                                Cancel & Refund
                                            </button>
                                        </div>
                                    </div>

                                    {/* GPS Tracking Section */}
                                    <div style={{ marginBottom: 24 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                            <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Navigation size={18} color="var(--primary)" /> Real-Time GPS Tracking Details
                                            </h3>
                                            <span style={{ fontSize: 12, color: bookingDetails?.tracking?.started ? '#10b981' : 'var(--text-muted)', fontWeight: 600 }}>
                                                {bookingDetails?.tracking?.started ? '● Tracking Active' : '○ Tracking Not Started'}
                                            </span>
                                        </div>

                                        {bookingDetails?.tracking?.latest_location ? (
                                            <div style={{ padding: 14, background: 'var(--bg-secondary)', borderRadius: 12 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                    <div>
                                                        <div style={{ fontWeight: 700, fontSize: 13 }}>Latest GPS Coordinates:</div>
                                                        <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                                                            Lat: {bookingDetails.tracking.latest_location.latitude}, Lng: {bookingDetails.tracking.latest_location.longitude}
                                                        </div>
                                                    </div>
                                                    <a
                                                        href={`https://www.google.com/maps/search/?api=1&query=${bookingDetails.tracking.latest_location.latitude},${bookingDetails.tracking.latest_location.longitude}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-secondary btn-sm"
                                                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                                                    >
                                                        <ExternalLink size={12} /> Open in Google Maps
                                                    </a>
                                                </div>
                                                <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                                                    <span>Status: <strong>{bookingDetails.tracking.latest_location.status || 'in_progress'}</strong></span>
                                                    <span>Speed: {bookingDetails.tracking.latest_location.speed || 0} km/h</span>
                                                    <span>Total GPS Pings: {bookingDetails.tracking.total_updates}</span>
                                                    <span>Last ping: {new Date(bookingDetails.tracking.latest_location.created_at).toLocaleTimeString()}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ padding: 14, background: 'var(--bg-secondary)', borderRadius: 12, color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
                                                No GPS coordinate updates recorded yet for this booking.
                                                {bookingDetails?.booking?.address && (
                                                    <div style={{ marginTop: 6, color: 'var(--text-primary)' }}>
                                                        <MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />
                                                        Client Address: {bookingDetails.booking.address}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Payments & Escrow Section */}
                                    <div>
                                        <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                                            <CreditCard size={18} color="var(--primary)" /> Payment & Transaction Details
                                        </h3>

                                        <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 14 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Payment Status:</span>
                                                <span className={`badge-status ${bookingDetails?.booking?.payment_status === 'paid' ? 'completed' : 'pending'}`}>
                                                    {bookingDetails?.booking?.payment_status || 'unpaid'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Service Fee:</span>
                                                <span style={{ fontWeight: 700 }}>₹{bookingDetails?.booking?.total_amount || 0}</span>
                                            </div>

                                            {bookingDetails?.payments && bookingDetails.payments.length > 0 ? (
                                                <div style={{ marginTop: 12, borderTop: '1px solid var(--border-color)', paddingTop: 10 }}>
                                                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Associated Gateway Payments ({bookingDetails.payments.length}):</div>
                                                    {bookingDetails.payments.map((p: any) => (
                                                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '6px 0' }}>
                                                            <div>
                                                                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{p.order_id || p.id.substring(0, 8)}</span>
                                                                <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>({p.payment_gateway || 'Razorpay'})</span>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>₹{p.amount}</span>
                                                                <span className={`badge-status ${p.status === 'success' ? 'completed' : p.status}`}>
                                                                    {p.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                                                    No direct online gateway checkout linked yet (Cash, Wallet or pending checkout).
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
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
                    background: rgba(0,0,0,0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    backdrop-filter: blur(4px);
                    padding: 16px;
                }
                .modal-content {
                    background: var(--bg-primary, #fff);
                    color: var(--text-primary);
                    border-radius: 24px;
                    width: 100%;
                    padding: 24px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.25);
                    animation: modalSlide 0.25s ease-out;
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
