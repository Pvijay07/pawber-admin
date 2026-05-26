import { useState } from 'react';
import { Webhook, RefreshCw, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';

const webhookLogs = [
    { id: 'wh-001', source: 'Razorpay', event: 'payment.captured', status: 'success', statusCode: 200, payload: '{ "order_id": "order_abc123", "amount": 1999 }', response: '{ "status": "ok" }', timestamp: '2024-02-15 14:32:15', latency: '120ms' },
    { id: 'wh-002', source: 'Razorpay', event: 'payment.failed', status: 'success', statusCode: 200, payload: '{ "order_id": "order_def456", "error": "insufficient_funds" }', response: '{ "status": "ok" }', timestamp: '2024-02-15 14:28:10', latency: '85ms' },
    { id: 'wh-003', source: 'Supabase', event: 'INSERT on bookings', status: 'success', statusCode: 200, payload: '{ "table": "bookings", "record": { "id": "bk-0412" } }', response: '{ "processed": true }', timestamp: '2024-02-15 14:25:00', latency: '45ms' },
    { id: 'wh-004', source: 'API', event: 'POST /api/bookings', status: 'failed', statusCode: 500, payload: '{ "service_id": "...", "package_id": "..." }', response: '{ "error": "Internal server error" }', timestamp: '2024-02-15 13:45:22', latency: '2,400ms' },
    { id: 'wh-005', source: 'Razorpay', event: 'refund.processed', status: 'success', statusCode: 200, payload: '{ "refund_id": "rfnd_789", "amount": 1499 }', response: '{ "status": "ok" }', timestamp: '2024-02-14 16:48:30', latency: '150ms' },
    { id: 'wh-006', source: 'API', event: 'GET /api/providers', status: 'success', statusCode: 200, payload: '{ "query": { "category": "grooming" } }', response: '{ "count": 12 }', timestamp: '2024-02-14 15:10:05', latency: '62ms' },
    { id: 'wh-007', source: 'Supabase', event: 'UPDATE on providers', status: 'failed', statusCode: 504, payload: '{ "table": "providers", "old_record": { ... } }', response: '{ "error": "Gateway timeout" }', timestamp: '2024-02-14 12:00:00', latency: '30,000ms' },
    { id: 'wh-008', source: 'API', event: 'POST /api/auth/login', status: 'success', statusCode: 200, payload: '{ "email": "user@test.com" }', response: '{ "token": "jwt..." }', timestamp: '2024-02-14 11:30:00', latency: '210ms' },
];

export default function WebhookLogs() {
    const [filter, setFilter] = useState('all');
    const [sourceFilter, setSourceFilter] = useState('all');
    const [selected, setSelected] = useState<typeof webhookLogs[0] | null>(null);

    const filtered = webhookLogs.filter(log => {
        if (filter !== 'all' && log.status !== filter) return false;
        if (sourceFilter !== 'all' && log.source !== sourceFilter) return false;
        return true;
    });

    const sources = [...new Set(webhookLogs.map(l => l.source))];

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h1>Webhook & API Logs</h1>
                    <p className="subtitle">Monitor incoming webhooks, API calls, and system events.</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn btn-secondary btn-sm"><RefreshCw size={14} /> Refresh</button>
                </div>
            </div>

            <div className="stats-grid" style={{ marginBottom: 20 }}>
                <div className="stat-card accent">
                    <div className="stat-icon accent"><Webhook size={20} /></div>
                    <div className="stat-label">Total Events</div>
                    <div className="stat-value">{webhookLogs.length}</div>
                </div>
                <div className="stat-card accent">
                    <div className="stat-icon accent"><CheckCircle size={20} /></div>
                    <div className="stat-label">Successful</div>
                    <div className="stat-value">{webhookLogs.filter(l => l.status === 'success').length}</div>
                </div>
                <div className="stat-card danger">
                    <div className="stat-icon danger"><XCircle size={20} /></div>
                    <div className="stat-label">Failed</div>
                    <div className="stat-value">{webhookLogs.filter(l => l.status === 'failed').length}</div>
                </div>
                <div className="stat-card info">
                    <div className="stat-icon info"><Clock size={20} /></div>
                    <div className="stat-label">Avg Latency</div>
                    <div className="stat-value">185ms</div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                <button onClick={() => setFilter('all')} className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'} btn-sm`}>All</button>
                <button onClick={() => setFilter('success')} className={`btn ${filter === 'success' ? 'btn-primary' : 'btn-secondary'} btn-sm`}>Success</button>
                <button onClick={() => setFilter('failed')} className={`btn ${filter === 'failed' ? 'btn-primary' : 'btn-secondary'} btn-sm`}>Failed</button>
                <span style={{ borderLeft: '1px solid var(--border)', margin: '0 4px' }} />
                <button onClick={() => setSourceFilter('all')} className={`btn ${sourceFilter === 'all' ? 'btn-primary' : 'btn-secondary'} btn-sm`}>All Sources</button>
                {sources.map(s => (
                    <button key={s} onClick={() => setSourceFilter(s)} className={`btn ${sourceFilter === s ? 'btn-primary' : 'btn-secondary'} btn-sm`}>{s}</button>
                ))}
            </div>

            <div className="table-container">
                <div className="table-header">
                    <div className="table-title">Logs ({filtered.length})</div>
                </div>
                <table>
                    <thead>
                        <tr><th>ID</th><th>Source</th><th>Event</th><th>Status</th><th>Code</th><th>Latency</th><th>Timestamp</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        {filtered.map(log => (
                            <tr key={log.id}>
                                <td><span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 11, color: 'var(--text-primary)' }}>{log.id}</span></td>
                                <td>
                                    <span className={`badge-status ${log.source === 'Razorpay' ? 'confirmed' : log.source === 'Supabase' ? 'active' : 'in_progress'}`}>
                                        {log.source}
                                    </span>
                                </td>
                                <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{log.event}</td>
                                <td>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: log.status === 'success' ? 'var(--accent)' : 'var(--danger)' }}>
                                        {log.status === 'success' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                        {log.status}
                                    </span>
                                </td>
                                <td>
                                    <span style={{
                                        fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
                                        padding: '2px 6px', borderRadius: 4,
                                        background: log.statusCode >= 200 && log.statusCode < 300 ? 'var(--accent-light)' : log.statusCode >= 400 ? 'var(--danger-light)' : 'var(--warning-light)',
                                        color: log.statusCode >= 200 && log.statusCode < 300 ? 'var(--accent)' : log.statusCode >= 400 ? 'var(--danger)' : 'var(--warning)',
                                    }}>
                                        {log.statusCode}
                                    </span>
                                </td>
                                <td style={{ fontFamily: 'monospace', fontSize: 11, color: parseInt(log.latency) > 1000 ? 'var(--danger)' : 'var(--text-muted)' }}>{log.latency}</td>
                                <td style={{ fontSize: 11, whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{log.timestamp}</td>
                                <td>
                                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setSelected(log)}><Eye size={14} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Log Detail Modal */}
            {selected && (
                <div className="modal-overlay" onClick={() => setSelected(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 600 }}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {selected.status === 'success' ? <CheckCircle size={18} color="var(--accent)" /> : <XCircle size={18} color="var(--danger)" />}
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 14 }}>{selected.event}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{selected.id} • {selected.source} • {selected.timestamp}</div>
                                </div>
                            </div>
                            <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Request Payload</div>
                                <pre style={{ padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", overflow: 'auto', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                                    {selected.payload}
                                </pre>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Response</div>
                                <pre style={{ padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", overflow: 'auto', color: selected.status === 'success' ? 'var(--accent)' : 'var(--danger)', border: '1px solid var(--border)' }}>
                                    {selected.response}
                                </pre>
                            </div>
                            <div className="grid-3">
                                <div style={{ padding: 8, background: 'var(--bg-tertiary)', borderRadius: 8, textAlign: 'center' }}>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Status</div>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: selected.statusCode < 300 ? 'var(--accent)' : 'var(--danger)' }}>{selected.statusCode}</div>
                                </div>
                                <div style={{ padding: 8, background: 'var(--bg-tertiary)', borderRadius: 8, textAlign: 'center' }}>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Latency</div>
                                    <div style={{ fontSize: 16, fontWeight: 800 }}>{selected.latency}</div>
                                </div>
                                <div style={{ padding: 8, background: 'var(--bg-tertiary)', borderRadius: 8, textAlign: 'center' }}>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Source</div>
                                    <div style={{ fontSize: 16, fontWeight: 800 }}>{selected.source}</div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary btn-sm"><RefreshCw size={14} /> Retry</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
