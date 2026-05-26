import { useState, useEffect } from 'react';
import { PartyPopper, Plus, QrCode, Users, Calendar, MapPin, Clock, CheckCircle, Trash2 } from 'lucide-react';

const eventsData = [
    { id: 'e1', name: 'Paws in the Park', date: '2024-03-15', time: '10:00 AM - 4:00 PM', location: 'Juhu Beach, Mumbai', capacity: 200, registered: 156, scanned: 42, status: 'upcoming', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=400' },
    { id: 'e2', name: 'Pet Health Camp', date: '2024-03-22', time: '9:00 AM - 2:00 PM', location: 'Bandra West, Mumbai', capacity: 100, registered: 88, scanned: 0, status: 'upcoming', image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=400' },
    { id: 'e3', name: 'Dog Show Championship', date: '2024-02-10', time: '11:00 AM - 6:00 PM', location: 'NSCI Dome, Mumbai', capacity: 500, registered: 482, scanned: 471, status: 'completed', image: 'https://images.unsplash.com/photo-1477884213360-7e9d7dcc8f9b?auto=format&fit=crop&q=80&w=400' },
];

export default function Events() {
    const [events] = useState(eventsData);
    const [showCreate, setShowCreate] = useState(false);
    const [liveScanning, setLiveScanning] = useState(false);
    const [scanCount, setScanCount] = useState(42);

    // Simulate live ticket scans
    useEffect(() => {
        if (!liveScanning) return;
        const interval = setInterval(() => {
            setScanCount(prev => prev + 1);
        }, 3000);
        return () => clearInterval(interval);
    }, [liveScanning]);

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h1>Events & QR Scanner</h1>
                    <p className="subtitle">Create events and manage live ticket scanning.</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(!showCreate)}><Plus size={14} /> Create Event</button>
                </div>
            </div>

            <div className="stats-grid" style={{ marginBottom: 20 }}>
                <div className="stat-card accent">
                    <div className="stat-icon accent"><PartyPopper size={20} /></div>
                    <div className="stat-label">Total Events</div>
                    <div className="stat-value">{events.length}</div>
                </div>
                <div className="stat-card info">
                    <div className="stat-icon info"><Users size={20} /></div>
                    <div className="stat-label">Total Registrations</div>
                    <div className="stat-value">{events.reduce((a, e) => a + e.registered, 0)}</div>
                </div>
                <div className="stat-card purple">
                    <div className="stat-icon purple"><QrCode size={20} /></div>
                    <div className="stat-label">Tickets Scanned</div>
                    <div className="stat-value">{events.reduce((a, e) => a + e.scanned, 0)}</div>
                </div>
            </div>

            {/* Live Scanner Panel */}
            <div className="card" style={{ marginBottom: 20, border: liveScanning ? '1px solid var(--accent)' : '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: liveScanning ? 'var(--accent-light)' : 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: liveScanning ? 'var(--accent)' : 'var(--text-muted)' }}>
                            <QrCode size={20} />
                        </div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>Live QR Scanner</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                {liveScanning ? (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent)' }}>
                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1.5s infinite' }} />
                                        Scanning active • {scanCount} scanned
                                    </span>
                                ) : 'Scanner is idle'}
                            </div>
                        </div>
                    </div>
                    <button className={`btn ${liveScanning ? 'btn-danger' : 'btn-primary'} btn-sm`} onClick={() => setLiveScanning(!liveScanning)}>
                        {liveScanning ? 'Stop Scanner' : 'Start Scanner'}
                    </button>
                </div>

                {liveScanning && (
                    <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Recent Scans</div>
                        {[
                            { name: 'Sarah Jenkins', ticket: 'TKT-0156', time: 'Just now', valid: true },
                            { name: 'Amit Kumar', ticket: 'TKT-0155', time: '30s ago', valid: true },
                            { name: 'Unknown', ticket: 'TKT-XXXX', time: '2m ago', valid: false },
                        ].map((scan, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {scan.valid ? <CheckCircle size={14} color="var(--accent)" /> : <Trash2 size={14} color="var(--danger)" />}
                                    <span style={{ fontSize: 12, fontWeight: 600 }}>{scan.name}</span>
                                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{scan.ticket}</span>
                                </div>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{scan.time}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Event Form */}
            {showCreate && (
                <div className="card" style={{ marginBottom: 20 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Create New Event</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <input type="text" className="input" placeholder="Event Name" />
                        <input type="date" className="input" />
                        <input type="text" className="input" placeholder="Location" />
                        <input type="number" className="input" placeholder="Capacity" />
                        <input type="text" className="input" placeholder="Start Time" />
                        <input type="text" className="input" placeholder="End Time" />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                        <button className="btn btn-primary btn-sm">Create Event</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setShowCreate(false)}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Event Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
                {events.map(e => (
                    <div key={e.id} className="card" style={{ overflow: 'hidden', padding: 0 }}>
                        <div style={{ height: 140, background: `url(${e.image}) center/cover`, position: 'relative' }}>
                            <span className={`badge-status ${e.status === 'upcoming' ? 'active' : 'completed'}`} style={{ position: 'absolute', top: 12, right: 12 }}>{e.status}</span>
                        </div>
                        <div style={{ padding: 16 }}>
                            <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{e.name}</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={14} />{e.date}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={14} />{e.time}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={14} />{e.location}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 16, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                                <div><div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Capacity</div><div style={{ fontWeight: 800, fontSize: 16 }}>{e.registered}/{e.capacity}</div></div>
                                <div><div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Scanned</div><div style={{ fontWeight: 800, fontSize: 16, color: 'var(--accent)' }}>{e.scanned}</div></div>
                                <div style={{ marginLeft: 'auto' }}>
                                    <div className="progress-bar" style={{ width: 80, marginTop: 4 }}>
                                        <div className="progress-fill" style={{ width: `${(e.registered / e.capacity) * 100}%`, background: 'var(--accent)' }} />
                                    </div>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{Math.round((e.registered / e.capacity) * 100)}% full</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
