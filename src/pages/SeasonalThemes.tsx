import { useState, useEffect } from 'react';
import {
    Sparkles,
    CheckCircle2,
    RefreshCw,
    Palette,
    Tag,
    Zap,
    Smartphone,
    Save,
    Edit3,
    X,
    Radio
} from 'lucide-react';
import { adminService } from '../services/admin.service';

interface ThemeConfig {
    id: string;
    key: string;
    name: string;
    type: string;
    is_active: boolean;
    start_date?: string | null;
    end_date?: string | null;
    theme_data: {
        primary: string;
        accent: string;
        success?: string;
        headerGlow?: string;
        badgeText?: string;
        motifType?: 'none' | 'diwali' | 'holi' | 'monsoon' | 'summer' | 'tricolor' | 'christmas';
        greeting?: string;
        couponCode?: string;
        banners?: Array<{
            title: string;
            subtitle: string;
            tag: string;
            cta: string;
            categoryId: string;
            gradient: [string, string];
            image: string;
        }>;
    };
    created_at?: string;
    updated_at?: string;
}

const THEME_ICONS: Record<string, string> = {
    default: '⚡',
    diwali: '🪔',
    holi: '🌈',
    monsoon: '🌧️',
    summer: '☀️',
    independence: '🇮🇳',
    christmas: '🎄',
};

export default function SeasonalThemes() {
    const [themes, setThemes] = useState<ThemeConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [activatingKey, setActivatingKey] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [editingTheme, setEditingTheme] = useState<ThemeConfig | null>(null);
    const [saving, setSaving] = useState(false);

    const activeTheme = themes.find(t => t.is_active) || themes[0];

    const fetchThemes = async () => {
        try {
            setLoading(true);
            const res = await adminService.listThemes();
            if (res.data?.data) {
                setThemes(res.data.data);
            }
        } catch (err: any) {
            console.error('Failed to load themes:', err);
            setStatusMessage({ text: 'Failed to load theme configurations', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchThemes();
    }, []);

    const handleActivate = async (key: string) => {
        try {
            setActivatingKey(key);
            setStatusMessage(null);
            const res = await adminService.activateTheme(key);
            if (res.data?.success) {
                setStatusMessage({
                    text: `Theme "${res.data.data?.name || key}" activated! All mobile apps updated in real-time.`,
                    type: 'success'
                });
                await fetchThemes();
            } else {
                setStatusMessage({ text: res.data?.message || 'Failed to activate theme', type: 'error' });
            }
        } catch (err: any) {
            console.error('Error activating theme:', err);
            setStatusMessage({
                text: err.response?.data?.error || err.message || 'Activation failed',
                type: 'error'
            });
        } finally {
            setActivatingKey(null);
        }
    };

    const handleSaveEdit = async () => {
        if (!editingTheme) return;
        try {
            setSaving(true);
            const res = await adminService.updateTheme(editingTheme.key, {
                name: editingTheme.name,
                theme_data: editingTheme.theme_data,
            });
            if (res.data?.success) {
                setStatusMessage({ text: `Theme "${editingTheme.name}" updated successfully!`, type: 'success' });
                setEditingTheme(null);
                await fetchThemes();
            }
        } catch (err: any) {
            console.error('Error updating theme:', err);
            setStatusMessage({ text: err.response?.data?.error || 'Failed to update theme', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="page-container" style={{ paddingBottom: 60 }}>
            {/* Page Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Palette size={26} color="var(--primary)" />
                        Festival & Seasonal Theming
                        <span className="badge badge-primary" style={{ fontSize: 11, verticalAlign: 'middle' }}>
                            Live Engine
                        </span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: 4, maxWidth: 650 }}>
                        Manage zero-code seasonal & festival experiences inspired by Swiggy and Zepto.
                        Activating a theme instantly updates headers, badges, colors, and banners across all active user devices via WebSockets.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={fetchThemes}
                        disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Status Alert Banner */}
            {statusMessage && (
                <div
                    className={`alert ${statusMessage.type === 'success' ? 'alert-success' : 'alert-danger'}`}
                    style={{
                        padding: '12px 16px',
                        marginBottom: 20,
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: statusMessage.type === 'success' ? 'rgba(0, 183, 97, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        border: `1px solid ${statusMessage.type === 'success' ? '#00B761' : '#EF4444'}`,
                        color: statusMessage.type === 'success' ? '#00B761' : '#EF4444'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Sparkles size={18} />
                        <span style={{ fontWeight: 600 }}>{statusMessage.text}</span>
                    </div>
                    <button
                        onClick={() => setStatusMessage(null)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Live Active Theme Preview Hero Card */}
            {activeTheme && (
                <div
                    className="card"
                    style={{
                        marginBottom: 28,
                        background: `linear-gradient(135deg, ${activeTheme.theme_data.primary}15 0%, var(--surface) 60%)`,
                        border: `2px solid ${activeTheme.theme_data.primary}`,
                        borderRadius: 14,
                        padding: 24,
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                            className="badge"
                            style={{
                                backgroundColor: '#00B761',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '6px 12px',
                                fontSize: 12,
                                fontWeight: 700,
                                borderRadius: 20
                            }}
                        >
                            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#fff', display: 'inline-block' }} />
                            LIVE ON CLIENT APP
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <span style={{ fontSize: 32 }}>{THEME_ICONS[activeTheme.key] || '🎉'}</span>
                        <div>
                            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                                {activeTheme.name}
                            </h2>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                Key: <code style={{ color: activeTheme.theme_data.primary }}>{activeTheme.key}</code> • Type: {activeTheme.type}
                            </span>
                        </div>
                    </div>

                    {/* Active Attributes Ribbon */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
                        <div style={{ background: 'var(--surface-subtle, rgba(0,0,0,0.05))', padding: '10px 14px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: activeTheme.theme_data.primary, border: '1px solid rgba(0,0,0,0.1)' }} />
                            <div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Primary Color</div>
                                <div style={{ fontSize: 12, fontWeight: 700 }}>{activeTheme.theme_data.primary}</div>
                            </div>
                        </div>

                        <div style={{ background: 'var(--surface-subtle, rgba(0,0,0,0.05))', padding: '10px 14px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: activeTheme.theme_data.accent, border: '1px solid rgba(0,0,0,0.1)' }} />
                            <div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Accent Color</div>
                                <div style={{ fontSize: 12, fontWeight: 700 }}>{activeTheme.theme_data.accent}</div>
                            </div>
                        </div>

                        <div style={{ background: 'var(--surface-subtle, rgba(0,0,0,0.05))', padding: '10px 14px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Tag size={18} color="var(--primary)" />
                            <div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Coupon</div>
                                <div style={{ fontSize: 12, fontWeight: 700 }}>{activeTheme.theme_data.couponCode || 'None'}</div>
                            </div>
                        </div>

                        <div style={{ background: 'var(--surface-subtle, rgba(0,0,0,0.05))', padding: '10px 14px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Zap size={18} color="#FF9900" />
                            <div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Festival Badge</div>
                                <div style={{ fontSize: 12, fontWeight: 700 }}>{activeTheme.theme_data.badgeText || 'STANDARD'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Greeting Preview Bar */}
                    {activeTheme.theme_data.greeting && (
                        <div
                            style={{
                                marginTop: 16,
                                padding: '10px 14px',
                                borderRadius: 8,
                                background: 'rgba(255, 255, 255, 0.08)',
                                borderLeft: `4px solid ${activeTheme.theme_data.primary}`,
                                fontSize: 13,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8
                            }}
                        >
                            <Sparkles size={16} color={activeTheme.theme_data.primary} />
                            <strong>Active In-App Greeting:</strong>
                            <span>{activeTheme.theme_data.greeting}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Themes Grid */}
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Radio size={18} color="var(--primary)" />
                Available Festival & Seasonal Presets ({themes.length})
            </h2>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                    gap: 20
                }}
            >
                {themes.map((theme) => {
                    const isLive = theme.is_active;
                    const isActivating = activatingKey === theme.key;

                    return (
                        <div
                            key={theme.key}
                            className="card"
                            style={{
                                borderRadius: 12,
                                border: isLive ? `2px solid ${theme.theme_data.primary}` : '1px solid var(--border)',
                                padding: 20,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                position: 'relative',
                                background: isLive ? `linear-gradient(180deg, ${theme.theme_data.primary}0D 0%, var(--surface) 100%)` : 'var(--surface)',
                                boxShadow: isLive ? `0 4px 20px ${theme.theme_data.primary}20` : 'none',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <div>
                                {/* Card Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ fontSize: 26 }}>{THEME_ICONS[theme.key] || '🎨'}</span>
                                        <div>
                                            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{theme.name}</h3>
                                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                                key: <code>{theme.key}</code>
                                            </span>
                                        </div>
                                    </div>
                                    {isLive ? (
                                        <span className="badge" style={{ backgroundColor: '#00B761', color: '#fff', fontSize: 10, fontWeight: 700 }}>
                                            ACTIVE
                                        </span>
                                    ) : (
                                        <span className="badge" style={{ backgroundColor: 'var(--surface-subtle)', color: 'var(--text-muted)', fontSize: 10 }}>
                                            READY
                                        </span>
                                    )}
                                </div>

                                {/* Swatch and Badge Preview */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <div
                                            style={{
                                                width: 20,
                                                height: 20,
                                                borderRadius: 4,
                                                backgroundColor: theme.theme_data.primary,
                                                border: '1px solid rgba(0,0,0,0.1)'
                                            }}
                                            title={`Primary: ${theme.theme_data.primary}`}
                                        />
                                        <div
                                            style={{
                                                width: 20,
                                                height: 20,
                                                borderRadius: 4,
                                                backgroundColor: theme.theme_data.accent,
                                                border: '1px solid rgba(0,0,0,0.1)'
                                            }}
                                            title={`Accent: ${theme.theme_data.accent}`}
                                        />
                                    </div>

                                    {theme.theme_data.badgeText && (
                                        <div
                                            style={{
                                                fontSize: 10,
                                                fontWeight: 800,
                                                padding: '3px 8px',
                                                borderRadius: 12,
                                                backgroundColor: `${theme.theme_data.primary}20`,
                                                color: theme.theme_data.primary,
                                                border: `1px solid ${theme.theme_data.primary}40`,
                                                letterSpacing: 0.5
                                            }}
                                        >
                                            {theme.theme_data.badgeText}
                                        </div>
                                    )}

                                    {theme.theme_data.couponCode && (
                                        <div
                                            style={{
                                                fontSize: 10,
                                                fontWeight: 700,
                                                padding: '3px 8px',
                                                borderRadius: 12,
                                                backgroundColor: 'rgba(0,0,0,0.05)',
                                                color: 'var(--text)',
                                                border: '1px dashed var(--border)'
                                            }}
                                        >
                                            🎟️ {theme.theme_data.couponCode}
                                        </div>
                                    )}
                                </div>

                                {/* Theme Greeting / Description */}
                                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: 16 }}>
                                    {theme.theme_data.greeting || 'Standard Pawber pet care experience.'}
                                </p>

                                {/* Banners summary */}
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Smartphone size={13} />
                                    <span>{theme.theme_data.banners?.length || 0} Hero carousel banners tailored</span>
                                </div>
                            </div>

                            {/* Card Actions */}
                            <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                                {isLive ? (
                                    <button
                                        className="btn btn-secondary"
                                        disabled
                                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                                    >
                                        <CheckCircle2 size={15} color="#00B761" />
                                        Currently Live
                                    </button>
                                ) : (
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => handleActivate(theme.key)}
                                        disabled={isActivating}
                                        style={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 6,
                                            backgroundColor: theme.theme_data.primary,
                                            borderColor: theme.theme_data.primary
                                        }}
                                    >
                                        <Zap size={14} />
                                        {isActivating ? 'Activating...' : 'Activate Theme'}
                                    </button>
                                )}

                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setEditingTheme(JSON.parse(JSON.stringify(theme)))}
                                    title="Edit theme content & colors"
                                    style={{ padding: '8px 12px' }}
                                >
                                    <Edit3 size={15} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Inline Theme Editor Modal */}
            {editingTheme && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.65)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: 20
                    }}
                >
                    <div
                        className="card"
                        style={{
                            width: '100%',
                            maxWidth: 620,
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            padding: 24,
                            borderRadius: 14,
                            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Edit3 size={18} color="var(--primary)" />
                                Customize Theme: {editingTheme.name}
                            </h2>
                            <button
                                onClick={() => setEditingTheme(null)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                                    Theme Display Name
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={editingTheme.name}
                                    onChange={(e) => setEditingTheme({ ...editingTheme, name: e.target.value })}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8 }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                                        Primary Color Hex
                                    </label>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <input
                                            type="color"
                                            value={editingTheme.theme_data.primary}
                                            onChange={(e) => setEditingTheme({
                                                ...editingTheme,
                                                theme_data: { ...editingTheme.theme_data, primary: e.target.value }
                                            })}
                                            style={{ width: 40, height: 40, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                                        />
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={editingTheme.theme_data.primary}
                                            onChange={(e) => setEditingTheme({
                                                ...editingTheme,
                                                theme_data: { ...editingTheme.theme_data, primary: e.target.value }
                                            })}
                                            style={{ flex: 1, padding: '8px 12px', borderRadius: 8 }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                                        Accent Color Hex
                                    </label>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <input
                                            type="color"
                                            value={editingTheme.theme_data.accent}
                                            onChange={(e) => setEditingTheme({
                                                ...editingTheme,
                                                theme_data: { ...editingTheme.theme_data, accent: e.target.value }
                                            })}
                                            style={{ width: 40, height: 40, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                                        />
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={editingTheme.theme_data.accent}
                                            onChange={(e) => setEditingTheme({
                                                ...editingTheme,
                                                theme_data: { ...editingTheme.theme_data, accent: e.target.value }
                                            })}
                                            style={{ flex: 1, padding: '8px 12px', borderRadius: 8 }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                                        Badge Label Text
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={editingTheme.theme_data.badgeText || ''}
                                        onChange={(e) => setEditingTheme({
                                            ...editingTheme,
                                            theme_data: { ...editingTheme.theme_data, badgeText: e.target.value }
                                        })}
                                        placeholder="e.g. PETWALI SPECIAL"
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8 }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                                        Coupon Code
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={editingTheme.theme_data.couponCode || ''}
                                        onChange={(e) => setEditingTheme({
                                            ...editingTheme,
                                            theme_data: { ...editingTheme.theme_data, couponCode: e.target.value }
                                        })}
                                        placeholder="e.g. DIWALI100"
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8 }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                                    In-App Greeting / Ribbon Message
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={editingTheme.theme_data.greeting || ''}
                                    onChange={(e) => setEditingTheme({
                                        ...editingTheme,
                                        theme_data: { ...editingTheme.theme_data, greeting: e.target.value }
                                    })}
                                    placeholder="e.g. 🪔 Happy Diwali! Keep your pets safe with soundproof boarding & anti-stress grooming ✨"
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8 }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setEditingTheme(null)}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSaveEdit}
                                    disabled={saving}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                                >
                                    <Save size={15} />
                                    {saving ? 'Saving...' : 'Save Theme Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
