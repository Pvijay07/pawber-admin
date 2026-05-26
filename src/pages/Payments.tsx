import { useState } from 'react';
import { Wallet, ArrowUpRight, RefreshCw, AlertCircle, Download, CreditCard, ShieldCheck, Clock } from 'lucide-react';

const transactions = [
    { id: 'TXN-8842', user: 'Sarah Jenkins', avatar: 'https://i.pravatar.cc/100?img=1', type: 'payment', amount: 1999, status: 'completed', method: 'Razorpay', booking: 'BK-0412', date: '2024-02-15 14:32', description: 'Spa & Grooming' },
    { id: 'TXN-8841', user: 'Amit Kumar', avatar: 'https://i.pravatar.cc/100?img=3', type: 'payment', amount: 499, status: 'completed', method: 'Razorpay', booking: 'BK-0411', date: '2024-02-15 13:10', description: 'Vet Checkup' },
    { id: 'TXN-8840', user: 'David Miller', avatar: 'https://i.pravatar.cc/100?img=12', type: 'payout', amount: 4200, status: 'pending', method: 'Bank Transfer', booking: '—', date: '2024-02-15 10:00', description: 'Weekly Payout' },
    { id: 'TXN-8839', user: 'Neha Gupta', avatar: 'https://i.pravatar.cc/100?img=9', type: 'refund', amount: 1499, status: 'completed', method: 'Razorpay', booking: 'BK-0408', date: '2024-02-14 16:45', description: 'Cancelled booking refund' },
    { id: 'TXN-8838', user: 'Raj Patel', avatar: 'https://i.pravatar.cc/100?img=8', type: 'payment', amount: 2499, status: 'failed', method: 'Razorpay', booking: 'BK-0409', date: '2024-02-14 11:22', description: 'Pet Training' },
    { id: 'TXN-8837', user: 'Anita Desai', avatar: 'https://i.pravatar.cc/100?img=25', type: 'payout', amount: 3800, status: 'completed', method: 'Bank Transfer', booking: '—', date: '2024-02-13 09:00', description: 'Weekly Payout' },
    { id: 'TXN-8836', user: 'Priya Sharma', avatar: 'https://i.pravatar.cc/100?img=5', type: 'wallet_credit', amount: 500, status: 'completed', method: 'Admin', booking: '—', date: '2024-02-13 08:15', description: 'Goodwill credit' },
];

export default function Payments() {
    const [filter, setFilter] = useState('all');
    const [showAdjust, setShowAdjust] = useState(false);

    const filtered = transactions.filter(t => filter === 'all' || t.type === filter);

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h1>Payments & Wallet</h1>
                    <p className="subtitle">Monitor transactions, process refunds, and manage payouts.</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowAdjust(!showAdjust)}><RefreshCw size={14} /> Manual Adjustment</button>
                    <button className="btn btn-secondary btn-sm"><Download size={14} /> Export</button>
                </div>
            </div>

            <div className="stats-grid" style={{ marginBottom: 20 }}>
                <div className="stat-card accent">
                    <div className="stat-icon accent"><Wallet size={20} /></div>
                    <div className="stat-label">Total Revenue</div>
                    <div className="stat-value">₹4,72,000</div>
                    <div className="stat-change up"><ArrowUpRight size={12} /> +18.2%</div>
                </div>
                <div className="stat-card info">
                    <div className="stat-icon info"><ShieldCheck size={20} /></div>
                    <div className="stat-label">In Escrow</div>
                    <div className="stat-value">₹1,24,500</div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-icon warning"><Clock size={20} /></div>
                    <div className="stat-label">Pending Payouts</div>
                    <div className="stat-value">₹42,800</div>
                </div>
                <div className="stat-card danger">
                    <div className="stat-icon danger"><AlertCircle size={20} /></div>
                    <div className="stat-label">Failed Payments</div>
                    <div className="stat-value">3</div>
                </div>
            </div>

            {showAdjust && (
                <div className="card" style={{ marginBottom: 20 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Manual Wallet Adjustment</h4>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <input type="text" className="input" placeholder="User email or ID" style={{ flex: 1, minWidth: 200 }} />
                        <input type="number" className="input" placeholder="Amount" style={{ width: 120 }} />
                        <select className="select" style={{ width: 140 }}>
                            <option>Credit (+)</option>
                            <option>Debit (-)</option>
                        </select>
                        <input type="text" className="input" placeholder="Reason" style={{ flex: 1, minWidth: 200 }} />
                        <button className="btn btn-primary btn-sm">Apply</button>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {['all', 'payment', 'payout', 'refund', 'wallet_credit'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'} btn-sm`}>
                        {f === 'all' ? 'All' : f === 'wallet_credit' ? 'Wallet' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}
                    </button>
                ))}
            </div>

            <div className="table-container">
                <div className="table-header">
                    <div className="table-title">Transactions ({filtered.length})</div>
                </div>
                <table>
                    <thead><tr><th>TXN ID</th><th>User</th><th>Type</th><th>Amount</th><th>Method</th><th>Booking</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {filtered.map(t => (
                            <tr key={t.id}>
                                <td><span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: 'var(--text-primary)' }}>{t.id}</span></td>
                                <td>
                                    <div className="table-user">
                                        <img src={t.avatar} alt={t.user} className="table-avatar" />
                                        <span className="table-name">{t.user}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className={`badge-status ${t.type === 'payment' ? 'active' : t.type === 'payout' ? 'confirmed' : t.type === 'refund' ? 'pending' : 'in_progress'}`}>
                                        {t.type === 'wallet_credit' ? 'Wallet' : t.type}
                                    </span>
                                </td>
                                <td style={{ fontWeight: 700, color: t.type === 'refund' || t.type === 'payout' ? 'var(--danger)' : 'var(--accent)' }}>
                                    {t.type === 'refund' || t.type === 'payout' ? '-' : '+'}₹{t.amount.toLocaleString()}
                                </td>
                                <td style={{ fontSize: 12 }}><CreditCard size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />{t.method}</td>
                                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{t.booking}</td>
                                <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{t.date}</td>
                                <td><span className={`badge-status ${t.status === 'completed' ? 'completed' : t.status === 'pending' ? 'pending' : 'cancelled'}`}>{t.status}</span></td>
                                <td>
                                    {t.status === 'pending' && <button className="btn btn-primary btn-sm" style={{ fontSize: 10 }}>Approve</button>}
                                    {t.status === 'failed' && <button className="btn btn-danger btn-sm" style={{ fontSize: 10 }}>Retry</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
