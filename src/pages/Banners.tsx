import { useState, useEffect } from 'react';
import { 
    Image as ImageIcon, Plus, Trash2, Save, ExternalLink, 
    MoveUp, MoveDown, AlertCircle, Info, Sparkles 
} from 'lucide-react';
import { adminService } from '../services/admin.service';

interface Banner {
    title: string;
    subtitle: string;
    image: string;
    action: string;
    serviceId: string;
}

export default function Banners() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchBanners = async () => {
        try {
            setLoading(true);
            const response = await adminService.getDashboard(); // We can use dashboard for now or add a specific one
            // Actually let's use the content route
            const contentRes = await fetch(`${import.meta.env.VITE_API_URL}/content/homepage`);
            const data = await contentRes.json();
            if (data.content?.client_home_banners) {
                setBanners(data.content.client_home_banners);
            }
        } catch (err) {
            console.error('Error fetching banners:', err);
            setError('Failed to load banners');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    const handleAddBanner = () => {
        const newBanner: Banner = {
            title: 'New Promotion',
            subtitle: 'Get amazing discounts!',
            image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=800',
            action: 'bookingFlow',
            serviceId: 'grooming'
        };
        setBanners([...banners, newBanner]);
    };

    const handleRemoveBanner = (index: number) => {
        setBanners(banners.filter((_, i) => i !== index));
    };

    const handleUpdateBanner = (index: number, field: keyof Banner, value: string) => {
        const newBanners = [...banners];
        newBanners[index] = { ...newBanners[index], [field]: value };
        setBanners(newBanners);
    };

    const moveBanner = (index: number, direction: 'up' | 'down') => {
        const newBanners = [...banners];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex >= 0 && newIndex < banners.length) {
            [newBanners[index], newBanners[newIndex]] = [newBanners[newIndex], newBanners[index]];
            setBanners(newBanners);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);
            // We use the adminService to update content
            // Assuming we add updateContent to adminService
            const response = await adminService.updateContent('client_home_banners', banners);
            if (response.data) {
                alert('Banners updated successfully! 🚀');
            }
        } catch (err: any) {
            console.error('Error saving banners:', err);
            setError(err.response?.data?.error || 'Failed to save banners');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loader"></div>
                <p>Loading Banner Configurations...</p>
            </div>
        );
    }

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h1>App Banners</h1>
                    <p className="subtitle">Manage the sliding banners shown at the top of the mobile app.</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn btn-secondary" onClick={fetchBanners} disabled={saving}>
                        Reset Changes
                    </button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                    </button>
                </div>
            </div>

            {error && (
                <div className="alert alert-danger" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            <div className="banner-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 24 }}>
                {banners.map((banner, index) => (
                    <div key={index} className="chart-card banner-item-card" style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8, zIndex: 10 }}>
                            <button className="btn-icon" onClick={() => moveBanner(index, 'up')} disabled={index === 0}>
                                <MoveUp size={14} />
                            </button>
                            <button className="btn-icon" onClick={() => moveBanner(index, 'down')} disabled={index === banners.length - 1}>
                                <MoveDown size={14} />
                            </button>
                            <button className="btn-icon danger" onClick={() => handleRemoveBanner(index)}>
                                <Trash2 size={14} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: 20 }}>
                            <div style={{ width: 140, height: 180, borderRadius: 16, overflow: 'hidden', background: 'var(--bg-tertiary)', flexShrink: 0 }}>
                                <img src={banner.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: 8, color: 'white', fontSize: 10, backdropFilter: 'blur(4px)' }}>
                                    Preview
                                </div>
                            </div>

                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div>
                                    <label className="stat-label" style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>Banner Title</label>
                                    <input 
                                        type="text" 
                                        className="input" 
                                        value={banner.title} 
                                        onChange={(e) => handleUpdateBanner(index, 'title', e.target.value)}
                                        placeholder="e.g. Summer Sale"
                                    />
                                </div>
                                <div>
                                    <label className="stat-label" style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>Subtitle / Offer</label>
                                    <input 
                                        type="text" 
                                        className="input" 
                                        value={banner.subtitle} 
                                        onChange={(e) => handleUpdateBanner(index, 'subtitle', e.target.value)}
                                        placeholder="e.g. 20% Off All Services"
                                    />
                                </div>
                                <div>
                                    <label className="stat-label" style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>Image URL</label>
                                    <div style={{ position: 'relative' }}>
                                        <input 
                                            type="text" 
                                            className="input" 
                                            value={banner.image} 
                                            onChange={(e) => handleUpdateBanner(index, 'image', e.target.value)}
                                            style={{ paddingRight: 36 }}
                                        />
                                        <ImageIcon size={14} style={{ position: 'absolute', right: 12, top: 12, color: 'var(--text-muted)' }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label className="stat-label" style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>Action Type</label>
                                <select 
                                    className="input" 
                                    value={banner.action} 
                                    onChange={(e) => handleUpdateBanner(index, 'action', e.target.value)}
                                >
                                    <option value="bookingFlow">Open Booking Flow</option>
                                    <option value="external">External Link</option>
                                    <option value="none">No Action</option>
                                </select>
                            </div>
                            <div>
                                <label className="stat-label" style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>Target Service ID</label>
                                <input 
                                    type="text" 
                                    className="input" 
                                    value={banner.serviceId} 
                                    onChange={(e) => handleUpdateBanner(index, 'serviceId', e.target.value)}
                                    placeholder="e.g. grooming"
                                />
                            </div>
                        </div>
                    </div>
                ))}

                <button 
                    className="chart-card add-banner-btn" 
                    onClick={handleAddBanner}
                    style={{ 
                        border: '2px dashed var(--border)', 
                        background: 'transparent', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: 12,
                        minHeight: 280,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    <div style={{ width: 48, height: 48, borderRadius: 24, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                        <Plus size={24} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Add New Banner</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Create a new promotional slide</div>
                    </div>
                </button>
            </div>

            <div className="chart-card" style={{ marginTop: 24, display: 'flex', gap: 16, alignItems: 'center', background: 'var(--primary-light)', border: '1px solid var(--primary)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                    <Info size={20} />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 14 }}>Banner Best Practices</div>
                    <div style={{ fontSize: 12, color: 'var(--primary)', opacity: 0.8 }}>Use high-quality 16:9 images. Keep titles short and catchy. Banners are updated instantly in the mobile app upon saving.</div>
                </div>
            </div>
        </div>
    );
}
