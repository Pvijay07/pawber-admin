import { useState, useEffect } from 'react';
import {
    Wallet, ArrowUpRight, RefreshCw, AlertCircle, CreditCard,
    ShieldCheck, Clock, CheckCircle2
} from 'lucide-react';
import { adminService } from '../services/admin.service';

export default function Payments() {
    const [filter, setFilter] = useState('all');
    const [showAdjust, setShowAdjust] = useState(false);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [stats, setStats] = useState({
        total_revenue: 0,
        in_escrow: 0,
        failed_count: 0,
        total_transactions: 0
    });

    // Manual adjustment state
    const [adjustIdentifier, setAdjustIdentifier] = useState('');
    const [adjustAmount, setAdjustAmount] = useState('');
    const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
    const [adjustReason, setAdjustReason] = useState('');
    const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);
    const [adjustSuccessMsg, setAdjustSuccessMsg] = useState<string | null>(null);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const res = await adminService.getPayments();
            if (res.data?.success) {
                setTransactions(res.data.transactions || []);
                if (res.data.stats) {
                    setStats(res.data.stats);
                }
            }
        } catch (err) {
            console.error('Failed to load payments data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    const handleApplyAdjustment = async () => {
        if (!adjustIdentifier || !adjustAmount) {
            alert('Please enter user identifier (phone, email, or UUID) and amount');
            return;
        }

        const amt = parseFloat(adjustAmount);
        if (isNaN(amt) || amt <= 0) {
            alert('Please enter a valid positive amount');
            return;
        }

        setIsSubmittingAdjust(true);
        setAdjustSuccessMsg(null);
        try {
            const res = await adminService.adjustWallet({
                user_identifier: adjustIdentifier,
                amount: amt,
                type: adjustType,
                reason: adjustReason || 'Admin wallet adjustment'
            });

            if (res.data?.success) {
                setAdjustSuccessMsg(res.data.message);
                setAdjustIdentifier('');
                setAdjustAmount('');
                setAdjustReason('');
                fetchPayments(); // Refresh transactions and numbers
            }
        } catch (err: any) {
            alert(err.response?.data?.error || err.message || 'Failed to adjust wallet');
        } finally {
            setIsSubmittingAdjust(false);
        }
    };

    const filtered = transactions.filter(t => {
        if (filter !== 'all' && t.status !== filter && t.type !== filter) return false;
        if (search) {
            const term = search.toLowerCase();
            const userName = (t.user || '').toLowerCase();
            const txnId = (t.id || '').toLowerCase();
            const orderId = (t.order_id || '').toLowerCase();
            const bookingId = (t.booking_id || '').toLowerCase();
            return userName.includes(term) || txnId.includes(term) || orderId.includes(term) || bookingId.includes(term);
        }
        return true;
    });

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h1>Payments & Financials</h1>
                    <p className="subtitle">Real-time gateway transactions, escrow holding, and customer wallets.</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowAdjust(!showAdjust)}>
                        <RefreshCw size={14} /> Manual Adjustment
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={fetchPayments}>
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>
            </div>

            <div className="stats-grid" style={{ marginBottom: 20 }}>
                <div className="stat-card accent">
                    <div className="stat-icon accent"><Wallet size={20} /></div>
                    <div className="stat-label">Total Settled Revenue</div>
                    <div className="stat-value">₹{stats.total_revenue.toLocaleString()}</div>
                    <div className="stat-change up"><ArrowUpRight size={12} /> Live from Razorpay & bookings</div>
                </div>
                <div className="stat-card info">
                    <div className="stat-icon info"><ShieldCheck size={20} /></div>
                    <div className="stat-label">Held In Escrow</div>
                    <div className="stat-value">₹{stats.in_escrow.toLocaleString()}</div>
                    <div className="stat-change info">Secured for active service jobs</div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-icon warning"><Clock size={20} /></div>
                    <div className="stat-label">Total Transactions</div>
                    <div className="stat-value">{stats.total_transactions}</div>
                    <div className="stat-change">All platform payment intents</div>
                </div>
                <div className="stat-card danger">
                    <div className="stat-icon danger"><AlertCircle size={20} /></div>
                    <div className="stat-label">Failed Gateway Payments</div>
                    <div className="stat-value">{stats.failed_count}</div>
                    <div className="stat-change danger">Check logs for drops</div>
                </div>
            </div>

            {showAdjust && (
                <div className="card" style={{ marginBottom: 20, border: '1px solid var(--primary-light)' }}>
                    <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Wallet size={16} color="var(--primary)" /> Manual Customer Wallet Adjustment
                    </h4>
                    {adjustSuccessMsg && (
                        <div style={{ padding: '8px 12px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', borderRadius: 8, fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <CheckCircle2 size={16} /> {adjustSuccessMsg}
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <input
                            type="text"
                            className="input"
                            placeholder="User Phone, Email or ID"
                            style={{ flex: 1, minWidth: 200 }}
                            value={adjustIdentifier}
                            onChange={e => setAdjustIdentifier(e.target.value)}
                        />
                        <input
                            type="number"
                            className="input"
                            placeholder="Amount (₹)"
                            style={{ width: 140 }}
                            value={adjustAmount}
                            onChange={e => setAdjustAmount(e.target.value)}
                        />
                        <select
                            className="select"
                            style={{ width: 140 }}
                            value={adjustType}
                            onChange={e => setAdjustType(e.target.value as 'credit' | 'debit')}
                        >
                            <option value="credit">Credit (+)</option>
                            <option value="debit">Debit (-)</option>
                        </select>
                        <input
                            type="text"
                            className="input"
                            placeholder="Reason (e.g. Booking refund, Goodwill)"
                            style={{ flex: 1.5, minWidth: 200 }}
                            value={adjustReason}
                            onChange={e => setAdjustReason(e.target.value)}
                        />
                        <button
                            className="btn btn-primary btn-sm"
                            disabled={isSubmittingAdjust}
                            onClick={handleApplyAdjustment}
                        >
                            {isSubmittingAdjust ? 'Applying...' : 'Apply Adjustment'}
                        </button>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['all', 'completed', 'pending', 'failed'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                        >
                            {f === 'all' ? 'All Transactions' : f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="search-box" style={{ position: 'relative' }}>
                        <input
                            type="text"
                            className="input"
                            placeholder="Search user, order, or ID..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ width: 240, fontSize: 13 }}
                        />
                    </div>
                </div>
            </div>

            <div className="table-container">
                <div className="table-header">
                    <div className="table-title">Live Transactions ({filtered.length})</div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Order / Payment ID</th>
                            <th>User</th>
                            <th>Amount</th>
                            <th>Gateway / Method</th>
                            <th>Booking</th>
                            <th>Date & Time</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>Loading real transaction records...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No payment transactions found.</td></tr>
                        ) : filtered.map(t => (
                            <tr key={t.id}>
                                <td>
                                    <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: 'var(--text-primary)' }}>
                                        {t.order_id || t.id.substring(0, 8)}
                                    </div>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>ID: {t.id.substring(0, 8)}</div>
                                </td>
                                <td>
                                    <div className="table-user">
                                        <div className="table-avatar" style={{ background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11 }}>
                                            {t.user?.[0] || 'U'}
                                        </div>
                                        <div>
                                            <span className="table-name">{t.user}</span>
                                            {t.phone && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t.phone}</div>}
                                        </div>
                                    </div>
                                </td>
                                <td style={{ fontWeight: 700, color: t.status === 'failed' ? 'var(--danger)' : 'var(--accent)' }}>
                                    ₹{(t.amount || 0).toLocaleString()}
                                </td>
                                <td style={{ fontSize: 12 }}>
                                    <CreditCard size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                                    {t.method}
                                </td>
                                <td>
                                    {t.booking_id ? (
                                        <div>
                                            <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>#{t.booking_code}</span>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.description}</div>
                                        </div>
                                    ) : (
                                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>
                                    )}
                                </td>
                                <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                                    <div>{new Date(t.date).toLocaleDateString()}</div>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                </td>
                                <td>
                                    <span className={`badge-status ${t.status === 'completed' ? 'completed' : t.status === 'pending' ? 'pending' : 'cancelled'}`}>
                                        {t.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
