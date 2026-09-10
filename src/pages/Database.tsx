import { useState, useEffect } from 'react';
import { 
    Database, 
    Trash2, 
    RefreshCw, 
    Search, 
    AlertTriangle, 
    Eye, 
    CalendarCheck, 
    Users, 
    Briefcase, 
    PawPrint, 
    Wallet, 
    Bell, 
    Webhook, 
    ShieldAlert, 
    Layers
} from 'lucide-react';
import { adminService } from '../services/admin.service';

interface TableStat {
    tableName: string;
    count: number;
}

const TABLE_ICONS: Record<string, any> = {
    bookings: CalendarCheck,
    profiles: Users,
    providers: Briefcase,
    pets: PawPrint,
    payments: Wallet,
    wallets: Wallet,
    wallet_transactions: Layers,
    notifications: Bell,
    disputes: AlertTriangle,
    webhook_logs: Webhook,
    reviews: Layers,
    services: Layers
};

const TABLE_LABELS: Record<string, string> = {
    bookings: 'Bookings',
    profiles: 'Users / Profiles',
    providers: 'Service Providers',
    pets: 'Pets',
    payments: 'Payments',
    wallets: 'Wallets (PawPay/Vault)',
    wallet_transactions: 'Wallet Transactions',
    notifications: 'Notifications',
    disputes: 'Disputes',
    webhook_logs: 'Webhook Logs',
    reviews: 'Reviews',
    services: 'Services'
};

export default function DatabasePage() {
    const [tables, setTables] = useState<TableStat[]>([]);
    const [activeTable, setActiveTable] = useState<string>('bookings');
    const [rows, setRows] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [loadingOverview, setLoadingOverview] = useState<boolean>(true);
    const [loadingRows, setLoadingRows] = useState<boolean>(false);
    const [search, setSearch] = useState<string>('');
    const [page, setPage] = useState<number>(0);
    const pageSize = 25;

    // Modals
    const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ id: string; tableName: string; title: string } | null>(null);
    const [purgeModal, setPurgeModal] = useState<{ target: 'notifications' | 'webhook_logs' | 'cancelled_bookings' | 'all_test_bookings'; title: string; desc: string; requireConfirmText?: boolean } | null>(null);
    const [confirmInput, setConfirmInput] = useState<string>('');
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    // Fetch Table Overview
    const fetchOverview = async () => {
        setLoadingOverview(true);
        try {
            const res = await adminService.getDatabaseOverview();
            if (res.data?.success) {
                setTables(res.data.tables);
            }
        } catch (err) {
            console.error('Failed to load database overview:', err);
        } finally {
            setLoadingOverview(false);
        }
    };

    // Fetch Rows of Active Table
    const fetchTableRows = async (tableName: string, pageIndex: number = 0) => {
        setLoadingRows(true);
        try {
            const res = await adminService.getTableRecords(tableName, {
                limit: pageSize,
                offset: pageIndex * pageSize,
            });
            if (res.data?.success) {
                setRows(res.data.rows || []);
                setTotalCount(res.data.totalCount ?? res.data.rows?.length ?? 0);
            }
        } catch (err) {
            console.error(`Failed to load records for table ${tableName}:`, err);
        } finally {
            setLoadingRows(false);
        }
    };

    useEffect(() => {
        fetchOverview();
    }, []);

    useEffect(() => {
        setPage(0);
        setSearch('');
        fetchTableRows(activeTable, 0);
    }, [activeTable]);

    // Delete Single Row
    const handleConfirmDelete = async () => {
        if (!deleteModal) return;
        setActionLoading(true);
        try {
            await adminService.deleteTableRow(deleteModal.tableName, deleteModal.id);
            setDeleteModal(null);
            fetchTableRows(activeTable, page);
            fetchOverview();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delete record');
        } finally {
            setActionLoading(false);
        }
    };

    // Purge Bulk Data
    const handleConfirmPurge = async () => {
        if (!purgeModal) return;
        if (purgeModal.requireConfirmText && confirmInput.trim().toUpperCase() !== 'DELETE') {
            alert('Please type DELETE to confirm this operation.');
            return;
        }

        setActionLoading(true);
        try {
            const res = await adminService.purgeDatabase(purgeModal.target);
            alert(res.data?.message || 'Purge completed successfully');
            setPurgeModal(null);
            setConfirmInput('');
            fetchOverview();
            fetchTableRows(activeTable, 0);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to purge data');
        } finally {
            setActionLoading(false);
        }
    };

    // Dynamic Columns based on table rows
    const getDisplayColumns = () => {
        if (!rows || rows.length === 0) return ['id'];
        const first = rows[0];
        const keys = Object.keys(first);
        // Prioritize common columns
        const priority = ['id', 'name', 'full_name', 'title', 'status', 'booking_status', 'email', 'phone', 'total_amount', 'amount', 'created_at'];
        const sorted = keys.sort((a, b) => {
            const aIdx = priority.indexOf(a);
            const bIdx = priority.indexOf(b);
            if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
            if (aIdx !== -1) return -1;
            if (bIdx !== -1) return 1;
            return a.localeCompare(b);
        });
        return sorted.slice(0, 7); // Show top 7 columns
    };

    const columns = getDisplayColumns();

    // Client-side search filtering
    const filteredRows = rows.filter(row => {
        if (!search) return true;
        const s = search.toLowerCase();
        return Object.values(row).some(val => {
            if (val === null || val === undefined) return false;
            return String(val).toLowerCase().includes(s);
        });
    });

    return (
        <div className="animate-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1>Database & Data Management</h1>
                    <p className="subtitle">Inspect real database tables, remove test records, and clean up database collections.</p>
                </div>
                <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => { fetchOverview(); fetchTableRows(activeTable, page); }}
                    disabled={loadingOverview || loadingRows}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                    <RefreshCw size={14} className={loadingOverview || loadingRows ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                </button>
            </div>

            {/* Quick Purge / Danger Zone Shortcuts */}
            <div style={{ 
                background: 'var(--bg-secondary)', 
                border: '1px solid var(--border)', 
                borderRadius: 16, 
                padding: '16px 20px', 
                marginBottom: 24,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ShieldAlert size={20} color="var(--accent)" />
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>Fast Data Cleanup (Test / Stale Data)</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Quickly wipe test bookings, log backlogs, or spam notifications.</div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button 
                        className="btn btn-secondary btn-xs"
                        onClick={() => setPurgeModal({
                            target: 'notifications',
                            title: 'Clear All Notifications',
                            desc: 'This will delete all notification messages across all users in the system.'
                        })}
                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                        <Trash2 size={12} /> Clear Notifications
                    </button>

                    <button 
                        className="btn btn-secondary btn-xs"
                        onClick={() => setPurgeModal({
                            target: 'webhook_logs',
                            title: 'Clear Webhook Logs',
                            desc: 'This will delete all webhook activity logs from the database.'
                        })}
                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                        <Trash2 size={12} /> Clear Webhook Logs
                    </button>

                    <button 
                        className="btn btn-secondary btn-xs"
                        onClick={() => setPurgeModal({
                            target: 'cancelled_bookings',
                            title: 'Clear Cancelled Bookings',
                            desc: 'This will permanently remove all bookings with status "cancelled".'
                        })}
                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                        <Trash2 size={12} /> Clear Cancelled Bookings
                    </button>

                    <button 
                        className="btn btn-danger btn-xs"
                        onClick={() => setPurgeModal({
                            target: 'all_test_bookings',
                            title: 'Wipe All Bookings (Test Data)',
                            desc: 'WARNING: This will permanently delete ALL bookings and their dependent pet assignments, walk traces, reviews, and payments. Administrator profiles are protected.',
                            requireConfirmText: true
                        })}
                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                        <AlertTriangle size={12} /> Clear All Bookings
                    </button>
                </div>
            </div>

            {/* Table Overview Cards Grid */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
                gap: 12, 
                marginBottom: 24 
            }}>
                {tables.map(t => {
                    const Icon = TABLE_ICONS[t.tableName] || Database;
                    const isActive = activeTable === t.tableName;
                    return (
                        <div 
                            key={t.tableName}
                            onClick={() => setActiveTable(t.tableName)}
                            style={{
                                background: isActive ? 'var(--bg-secondary)' : 'var(--bg-card)',
                                border: `1.5px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                                borderRadius: 14,
                                padding: '12px 14px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: isActive ? 'var(--shadow-sm)' : 'none'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <Icon size={16} color={isActive ? 'var(--accent)' : 'var(--text-muted)'} />
                                <span style={{ 
                                    fontSize: 12, 
                                    fontWeight: 700, 
                                    padding: '2px 8px', 
                                    borderRadius: 10, 
                                    background: isActive ? 'var(--accent-light)' : 'var(--bg-tertiary)',
                                    color: isActive ? 'var(--accent)' : 'var(--text-secondary)'
                                }}>
                                    {t.count}
                                </span>
                            </div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                {TABLE_LABELS[t.tableName] || t.tableName}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>
                                {t.tableName}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Table Header & Search */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Database size={18} color="var(--accent)" />
                    <span style={{ fontWeight: 700, fontSize: 16 }}>
                        Table: <span style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{activeTable}</span>
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        ({totalCount} total row{totalCount === 1 ? '' : 's'})
                    </span>
                </div>

                <div style={{ position: 'relative', width: 280 }}>
                    <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        className="input"
                        placeholder="Search within this table..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ paddingLeft: 32, height: 36, fontSize: 13 }}
                    />
                </div>
            </div>

            {/* Table Data Viewer */}
            <div className="table-container">
                <div style={{ overflowX: 'auto' }}>
                    <table>
                        <thead>
                            <tr>
                                {columns.map(col => (
                                    <th key={col} style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.5 }}>
                                        {col.replace(/_/g, ' ')}
                                    </th>
                                ))}
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingRows ? (
                                <tr>
                                    <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: 32 }}>
                                        <div className="loader" style={{ margin: '0 auto 8px' }}></div>
                                        <div>Loading {activeTable} records...</div>
                                    </td>
                                </tr>
                            ) : filteredRows.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                                        No records found in table "{activeTable}".
                                    </td>
                                </tr>
                            ) : (
                                filteredRows.map((row, idx) => {
                                    const rowId = row.id || row.key || idx;
                                    return (
                                        <tr key={rowId}>
                                            {columns.map(col => {
                                                const val = row[col];
                                                let rendered = '—';
                                                if (val !== null && val !== undefined) {
                                                    if (typeof val === 'object') {
                                                        rendered = JSON.stringify(val);
                                                    } else if (typeof val === 'boolean') {
                                                        rendered = val ? 'true' : 'false';
                                                    } else if (col.includes('_at') || col === 'date') {
                                                        try { rendered = new Date(val).toLocaleDateString(); } catch { rendered = String(val); }
                                                    } else {
                                                        rendered = String(val);
                                                    }
                                                }

                                                return (
                                                    <td key={col} style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {col === 'id' ? (
                                                            <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>
                                                                {String(val).slice(0, 8)}...
                                                            </span>
                                                        ) : col === 'status' ? (
                                                            <span className={`badge-status ${val}`}>
                                                                {String(val)}
                                                            </span>
                                                        ) : (
                                                            <span style={{ fontSize: 12 }}>{rendered}</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                                    {/* View JSON modal */}
                                                    <button 
                                                        className="btn btn-ghost btn-sm"
                                                        onClick={() => setSelectedRecord(row)}
                                                        title="View full record JSON"
                                                        style={{ padding: '4px 6px' }}
                                                    >
                                                        <Eye size={13} />
                                                    </button>

                                                    {/* Delete row */}
                                                    <button 
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => setDeleteModal({
                                                            id: row.id,
                                                            tableName: activeTable,
                                                            title: `Delete record from "${activeTable}" (ID: ${String(row.id).slice(0, 8)}...)`
                                                        })}
                                                        title="Delete this record"
                                                        style={{ padding: '4px 6px' }}
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

                {/* Pagination */}
                {totalCount > pageSize && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            Showing page {page + 1} of {Math.ceil(totalCount / pageSize)}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button 
                                className="btn btn-secondary btn-xs"
                                disabled={page === 0}
                                onClick={() => {
                                    const nextP = page - 1;
                                    setPage(nextP);
                                    fetchTableRows(activeTable, nextP);
                                }}
                            >
                                Previous
                            </button>
                            <button 
                                className="btn btn-secondary btn-xs"
                                disabled={(page + 1) * pageSize >= totalCount}
                                onClick={() => {
                                    const nextP = page + 1;
                                    setPage(nextP);
                                    fetchTableRows(activeTable, nextP);
                                }}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ─── RECORD JSON MODAL ─── */}
            {selectedRecord && (
                <div className="modal-overlay" onClick={() => setSelectedRecord(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 620, maxWidth: '95vw', maxHeight: '85vh' }}>
                        <div className="modal-header">
                            <div>
                                <h3 style={{ fontSize: 16 }}>Record Details</h3>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                    Table: {activeTable} • ID: {selectedRecord.id}
                                </div>
                            </div>
                            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedRecord(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <pre style={{ 
                                background: 'var(--bg-tertiary)', 
                                padding: 16, 
                                borderRadius: 12, 
                                fontSize: 12, 
                                overflowX: 'auto',
                                maxHeight: 400,
                                fontFamily: 'monospace'
                            }}>
                                {JSON.stringify(selectedRecord, null, 2)}
                            </pre>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="btn btn-danger btn-sm"
                                onClick={() => {
                                    const r = selectedRecord;
                                    setSelectedRecord(null);
                                    setDeleteModal({
                                        id: r.id,
                                        tableName: activeTable,
                                        title: `Delete record from "${activeTable}"`
                                    });
                                }}
                            >
                                <Trash2 size={13} /> Delete Record
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedRecord(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── SINGLE ROW DELETE CONFIRMATION MODAL ─── */}
            {deleteModal && (
                <div className="modal-overlay" onClick={() => setDeleteModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 440 }}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <AlertTriangle size={20} color="var(--danger)" />
                                <h3>Confirm Deletion</h3>
                            </div>
                            <button className="btn btn-ghost btn-sm" onClick={() => setDeleteModal(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                {deleteModal.title}
                            </p>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                                This action is permanent and cannot be undone. Any dependent relations will be removed.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary btn-sm" onClick={() => setDeleteModal(null)}>
                                Cancel
                            </button>
                            <button 
                                className="btn btn-danger btn-sm"
                                onClick={handleConfirmDelete}
                                disabled={actionLoading}
                                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                                <Trash2 size={13} />
                                <span>{actionLoading ? 'Deleting...' : 'Yes, Delete'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── BULK DATA PURGE CONFIRMATION MODAL ─── */}
            {purgeModal && (
                <div className="modal-overlay" onClick={() => setPurgeModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 480 }}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <ShieldAlert size={22} color="var(--danger)" />
                                <h3>{purgeModal.title}</h3>
                            </div>
                            <button className="btn btn-ghost btn-sm" onClick={() => setPurgeModal(null)}>✕</button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                {purgeModal.desc}
                            </p>

                            {purgeModal.requireConfirmText && (
                                <div style={{ marginTop: 8 }}>
                                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--danger)' }}>
                                        Type "DELETE" to confirm permanent purge:
                                    </label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={confirmInput}
                                        onChange={e => setConfirmInput(e.target.value)}
                                        placeholder="DELETE"
                                        style={{ marginTop: 6, width: '100%', borderColor: 'var(--danger)' }}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary btn-sm" onClick={() => setPurgeModal(null)}>
                                Cancel
                            </button>
                            <button 
                                className="btn btn-danger btn-sm"
                                onClick={handleConfirmPurge}
                                disabled={actionLoading || (purgeModal.requireConfirmText && confirmInput.trim().toUpperCase() !== 'DELETE')}
                                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                                <Trash2 size={14} />
                                <span>{actionLoading ? 'Purging...' : 'Confirm Purge'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
