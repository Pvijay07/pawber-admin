import { useState, useEffect } from 'react';
import { Users as UsersIcon, Eye, Ban, PawPrint, Mail, Phone } from 'lucide-react';
import { adminService } from '../services/admin.service';

export default function Users() {
    const [tab, setTab] = useState<'users' | 'pets'>('users');
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [pets, setPets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalUsers: 0, totalPets: 0, suspended: 0 });
    const [selectedUser, setSelectedUser] = useState<any | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const uRes = await adminService.listUsers();
                const usersData = uRes.data.users || [];

                const pRes = await adminService.listPets();
                const petsData = pRes.data.pets || [];

                setUsers(usersData);
                setPets(petsData);

                setStats({
                    totalUsers: usersData.length,
                    totalPets: petsData.length,
                    suspended: usersData.filter((u: any) => u.deleted_at !== null).length
                });
            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };


        fetchData();
    }, []);


    const filteredUsers = users.filter(u =>
        (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(search.toLowerCase())
    );

    const filteredPets = pets.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h1>Users & Pets</h1>
                    <p className="subtitle">Manage user profiles and their registered pets.</p>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: 20 }}>
                <div className="stat-card info">
                    <div className="stat-icon info"><UsersIcon size={20} /></div>
                    <div className="stat-label">Total Users</div>
                    <div className="stat-value">{stats.totalUsers}</div>
                </div>
                <div className="stat-card accent">
                    <div className="stat-icon accent"><PawPrint size={20} /></div>
                    <div className="stat-label">Total Pets</div>
                    <div className="stat-value">{stats.totalPets}</div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-icon warning"><Ban size={20} /></div>
                    <div className="stat-label">Inactive</div>
                    <div className="stat-value">{stats.suspended}</div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <button onClick={() => setTab('users')} className={`btn ${tab === 'users' ? 'btn-primary' : 'btn-secondary'} btn-sm`}>Users</button>
                <button onClick={() => setTab('pets')} className={`btn ${tab === 'pets' ? 'btn-primary' : 'btn-secondary'} btn-sm`}>Pets</button>
            </div>

            {loading ? (
                <div className="loader-container"><div className="loader"></div></div>
            ) : tab === 'users' ? (
                <div className="table-container">
                    <div className="table-header">
                        <div className="table-title">All Users</div>
                        <input type="text" className="input search-input" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
                    </div>
                    <table>
                        <thead>
                            <tr><th>User</th><th>Contact</th><th>Role</th><th>Joined</th><th>Status</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(u => (
                                <tr key={u.id}>
                                    <td>
                                        <div className="table-user">
                                            <div className="sidebar-user-avatar" style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                                                {u.full_name?.[0] || 'U'}
                                            </div>
                                            <div>
                                                <div className="table-name">{u.full_name || 'Unnamed User'}</div>
                                                <div className="table-sub">{u.id.substring(0, 8)}...</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: 12 }}><Mail size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />{u.email}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}><Phone size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />{u.phone || 'N/A'}</div>
                                    </td>
                                    <td><span className={`badge-status ${u.role === 'provider' ? 'confirmed' : 'active'}`}>{u.role}</span></td>
                                    <td><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString()}</span></td>
                                    <td><span className={`badge-status ${u.onboarded ? 'active' : 'pending'}`}>{u.onboarded ? 'Active' : 'Pending'}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setSelectedUser(u)}><Eye size={14} /></button>
                                            <button className="btn btn-danger btn-sm btn-icon"><Ban size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="table-container">
                    <div className="table-header">
                        <div className="table-title">All Registered Pets</div>
                        <input type="text" className="input search-input" placeholder="Search pets..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
                    </div>
                    <table>
                        <thead>
                            <tr><th>Pet</th><th>Type</th><th>Breed</th><th>Age</th><th>Owner ID</th><th>Created</th></tr>
                        </thead>
                        <tbody>
                            {filteredPets.map((p, i) => (
                                <tr key={i}>
                                    <td>
                                        <div className="table-user">
                                            {p.image_url ?
                                                <img src={p.image_url} alt={p.name} className="table-avatar" /> :
                                                <div className="table-avatar" style={{ background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PawPrint size={14} /></div>
                                            }
                                            <span className="table-name">{p.name}</span>
                                        </div>
                                    </td>
                                    <td>{p.type}</td>
                                    <td>{p.breed}</td>
                                    <td>{p.age} yrs</td>
                                    <td><span style={{ fontSize: 13, fontWeight: 600 }}>{p.owner?.full_name || 'Unknown'}</span></td>
                                    <td><span style={{ fontSize: 12 }}>{new Date(p.created_at).toLocaleDateString()}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* User Detail Modal */}
            {selectedUser && (
                <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div className="sidebar-user-avatar" style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                                    {selectedUser.full_name?.[0] || 'U'}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 16 }}>{selectedUser.full_name || 'Unnamed'}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{selectedUser.email}</div>
                                </div>
                            </div>
                            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedUser(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: 8, background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>User ID</span>
                                    <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>{selectedUser.id}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: 8, background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Phone</span>
                                    <span style={{ fontSize: 12, fontWeight: 600 }}>{selectedUser.phone || 'N/A'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: 8, background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Role</span>
                                    <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{selectedUser.role}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: 8, background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Joined</span>
                                    <span style={{ fontSize: 12, fontWeight: 600 }}>{new Date(selectedUser.created_at).toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: 8, background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Status</span>
                                    <span className={`badge-status ${selectedUser.onboarded ? 'active' : 'pending'}`}>{selectedUser.onboarded ? 'Active' : 'Pending'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-danger btn-sm"><Ban size={14} /> Suspend User</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedUser(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
