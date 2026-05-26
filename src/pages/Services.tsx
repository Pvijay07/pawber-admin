import { useState, useEffect } from 'react';
import {
    Grid, Plus, Edit2, Trash2, Package, Tag,
    Clock
} from 'lucide-react';
import { adminService } from '../services/admin.service';

type Tab = 'services' | 'packages' | 'addons' | 'categories';

export default function Services() {
    const [activeTab, setActiveTab] = useState<Tab>('services');
    const [loading, setLoading] = useState(true);
    const [services, setServices] = useState<any[]>([]);
    const [packages, setPackages] = useState<any[]>([]);
    const [addons, setAddons] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    
    // Selection state for detail view
    const [selectedService, setSelectedService] = useState<any | null>(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'service' | 'package' | 'addon' | 'category'>('service');
    const [editItem, setEditItem] = useState<any | null>(null);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'services') {
                const response = await adminService.listServices();
                setServices(response.data.data.services || []);
            } else if (activeTab === 'packages') {
                const response = await adminService.listAllPackages();
                setPackages(response.data.data.packages || []);
            } else if (activeTab === 'addons') {
                const response = await adminService.listAllAddons();
                setAddons(response.data.data.addons || []);
            } else {
                const response = await adminService.listCategories();
                setCategories(response.data.data.categories || []);
            }
        } catch (err) {
            console.error('Error fetching services data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchServiceDetails = async (service: any) => {
        setSelectedService(service);
        try {
            const response = await adminService.getServiceDetails(service.id);
            const data = response.data.data.service;
            // When in detail view, we show specific packages/addons
            setPackages(data.packages || []);
            setAddons(data.addons || []);
        } catch (err) {
            console.error('Error fetching service details:', err);
        }
    };

    const handleDelete = async (table: string, id: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
            await adminService.deleteCatalogItem(table, id);
            fetchData();
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h1>Service Catalog</h1>
                    <p className="subtitle">Manage Pawber's master list of services, packages and addons.</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setModalType(activeTab === 'services' ? 'service' : activeTab === 'packages' ? 'package' : 'addon');
                        setEditItem(null);
                        setIsModalOpen(true);
                    }}
                >
                    <Plus size={18} /> Add {activeTab === 'services' ? 'Service' : activeTab === 'packages' ? 'Package' : activeTab === 'addons' ? 'Addon' : 'Category'}
                </button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                <button
                    onClick={() => { setActiveTab('services'); setSelectedService(null); }}
                    className={`btn ${activeTab === 'services' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                >
                    <Grid size={14} style={{ marginRight: 6 }} /> Services
                </button>
                <button
                    onClick={() => { setActiveTab('packages'); setSelectedService(null); }}
                    className={`btn ${activeTab === 'packages' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                >
                    <Package size={14} style={{ marginRight: 6 }} /> Packages
                </button>
                <button
                    onClick={() => { setActiveTab('addons'); setSelectedService(null); }}
                    className={`btn ${activeTab === 'addons' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                >
                    <Tag size={14} style={{ marginRight: 6 }} /> Addons
                </button>
                <button
                    onClick={() => { setActiveTab('categories'); setSelectedService(null); }}
                    className={`btn ${activeTab === 'categories' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                >
                    <Grid size={14} style={{ marginRight: 6 }} /> Categories
                </button>
            </div>

            {loading ? (
                <div className="loader-container"><div className="loader"></div></div>
            ) : activeTab === 'services' ? (
                <div style={{ display: 'grid', gridTemplateColumns: selectedService ? '1fr 400px' : '1fr', gap: 24 }}>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Service</th>
                                    <th>Category</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {services.map(svc => (
                                    <tr
                                        key={svc.id}
                                        onClick={() => fetchServiceDetails(svc)}
                                        style={{ cursor: 'pointer', background: selectedService?.id === svc.id ? 'var(--bg-tertiary)' : '' }}
                                    >
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                {svc.image_url ?
                                                    <img src={svc.image_url} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} /> :
                                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={16} /></div>
                                                }
                                                <div style={{ fontWeight: 600 }}>{svc.name}</div>
                                            </div>
                                        </td>
                                        <td><span className="badge-status info">{svc.category?.name || 'Uncategorized'}</span></td>
                                        <td>
                                            <span className={`badge-status ${svc.is_active ? 'active' : 'pending'}`}>
                                                {svc.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                                                <button className="btn btn-ghost btn-sm btn-icon" onClick={(e) => { e.stopPropagation(); setEditItem(svc); setModalType('service'); setIsModalOpen(true); }}><Edit2 size={14} /></button>
                                                <button className="btn btn-ghost btn-sm btn-icon text-danger" onClick={(e) => { e.stopPropagation(); handleDelete('services', svc.id); }}><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {selectedService && (
                        <div className="animate-in card" style={{ padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h3 style={{ margin: 0 }}>{selectedService.name} Detail</h3>
                                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedService(null)}>✕</button>
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <h4 style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>PACKAGES</h4>
                                    <button className="btn btn-primary btn-xs" onClick={() => { setModalType('package'); setEditItem(null); setIsModalOpen(true); }}><Plus size={12} /> Add</button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {packages.map(p => (
                                        <div key={p.id} className="card" style={{ padding: 12, background: 'var(--bg-tertiary)', border: 'none' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ fontWeight: 600, fontSize: 13 }}>{p.package_name}</span>
                                                <span style={{ color: 'var(--primary)', fontWeight: 700 }}>₹{p.price}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : activeTab === 'packages' ? (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Package Name</th>
                                <th>Service</th>
                                <th>Price</th>
                                <th>Duration</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {packages.map(pkg => (
                                <tr key={pkg.id}>
                                    <td><span style={{ fontWeight: 600 }}>{pkg.package_name}</span></td>
                                    <td><span className="badge-status info">{pkg.service?.name}</span></td>
                                    <td><span style={{ fontWeight: 700 }}>₹{pkg.price}</span></td>
                                    <td><Clock size={12} /> {pkg.duration_minutes} min</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                                            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setEditItem(pkg); setModalType('package'); setIsModalOpen(true); }}><Edit2 size={14} /></button>
                                            <button className="btn btn-ghost btn-sm btn-icon text-danger" onClick={() => handleDelete('service_packages', pkg.id)}><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : activeTab === 'addons' ? (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Addon Name</th>
                                <th>Service</th>
                                <th>Extra Price</th>
                                <th>Extra Time</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {addons.map(addon => (
                                <tr key={addon.id}>
                                    <td><span style={{ fontWeight: 600 }}>{addon.name}</span></td>
                                    <td><span className="badge-status info">{addon.service?.name}</span></td>
                                    <td><span style={{ fontWeight: 700 }}>+₹{addon.price}</span></td>
                                    <td>{addon.duration_minutes} min</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                                            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setEditItem(addon); setModalType('addon'); setIsModalOpen(true); }}><Edit2 size={14} /></button>
                                            <button className="btn btn-ghost btn-sm btn-icon text-danger" onClick={() => handleDelete('addons', addon.id)}><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Category Name</th>
                                <th>Sort Order</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map(cat => (
                                <tr key={cat.id}>
                                    <td><span style={{ fontWeight: 600 }}>{cat.name}</span></td>
                                    <td>{cat.sort_order}</td>
                                    <td>
                                        {cat.is_coming_soon ? 
                                            <span className="badge-status pending">Coming Soon</span> :
                                            <span className={`badge-status ${cat.is_active ? 'active' : 'pending'}`}>
                                                {cat.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        }
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                                            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setEditItem(cat); setModalType('category'); setIsModalOpen(true); }}><Edit2 size={14} /></button>
                                            <button className="btn btn-ghost btn-sm btn-icon text-danger" onClick={() => handleDelete('service_categories', cat.id)}><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal for Add/Edit */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
                        <div className="modal-header">
                            <h3>{editItem ? 'Edit' : 'Add New'} {modalType}</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => setIsModalOpen(false)}>✕</button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            
                            {/* Service Selection for global package/addon add */}
                            {(modalType === 'package' || modalType === 'addon') && !selectedService && (
                                <div className="form-group">
                                    <label>Select Service *</label>
                                    <select className="input" id="modal-service-select" defaultValue={editItem?.service_id || ''}>
                                        <option value="">Choose a service...</option>
                                        {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            )}

                            <div className="form-group">
                                <label>Name / Label</label>
                                <input
                                    type="text"
                                    className="input"
                                    id="modal-name-input"
                                    defaultValue={editItem?.name || editItem?.package_name || ''}
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    className="input"
                                    id="modal-desc-input"
                                    rows={3}
                                    defaultValue={editItem?.description || ''}
                                />
                            </div>

                            {(modalType === 'package' || modalType === 'addon') && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div className="form-group">
                                        <label>Price (₹)</label>
                                        <input type="number" className="input" id="modal-price-input" defaultValue={editItem?.price || 0} />
                                    </div>
                                    <div className="form-group">
                                        <label>Duration (mins)</label>
                                        <input type="number" className="input" id="modal-duration-input" defaultValue={editItem?.duration_minutes || 0} />
                                    </div>
                                </div>
                            )}

                            {modalType === 'service' && (
                                <div className="form-group">
                                    <label>Image URL</label>
                                    <input type="text" className="input" id="modal-image-input" defaultValue={editItem?.image_url || ''} />
                                </div>
                            )}

                            {modalType === 'category' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div className="form-group">
                                        <label>Sort Order</label>
                                        <input type="number" className="input" id="modal-sort-input" defaultValue={editItem?.sort_order || 0} />
                                    </div>
                                    <div className="form-group">
                                        <label>Coming Soon?</label>
                                        <select className="input" id="modal-comingsoon-select" defaultValue={editItem?.is_coming_soon ? 'true' : 'false'}>
                                            <option value="false">No (Active)</option>
                                            <option value="true">Yes (Coming Soon)</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary btn-sm" onClick={() => setIsModalOpen(false)}>Cancel</button>
                            <button className="btn btn-primary btn-sm" onClick={async () => {
                                const name = (document.getElementById('modal-name-input') as HTMLInputElement).value;
                                const description = (document.getElementById('modal-desc-input') as HTMLTextAreaElement).value;
                                const price = (document.getElementById('modal-price-input') as HTMLInputElement)?.value;
                                const duration_minutes = (document.getElementById('modal-duration-input') as HTMLInputElement)?.value;
                                const image_url = (document.getElementById('modal-image-input') as HTMLInputElement)?.value;
                                const sort_order = (document.getElementById('modal-sort-input') as HTMLInputElement)?.value;
                                const is_coming_soon = (document.getElementById('modal-comingsoon-select') as HTMLSelectElement)?.value === 'true';
                                const serviceId = selectedService?.id || (document.getElementById('modal-service-select') as HTMLSelectElement)?.value;

                                if ((modalType === 'package' || modalType === 'addon') && !serviceId) {
                                    alert('Please select a service');
                                    return;
                                }

                                let payload: any = { description, is_active: true };

                                if (modalType === 'service') {
                                    payload = { ...payload, name, image_url };
                                } else if (modalType === 'category') {
                                    payload = { ...payload, name, sort_order: Number(sort_order), is_coming_soon, is_active: !is_coming_soon };
                                } else if (modalType === 'package') {
                                    payload = { package_name: name, price: Number(price), duration_minutes: Number(duration_minutes), service_id: serviceId };
                                } else if (modalType === 'addon') {
                                    payload = { name, price: Number(price), duration_minutes: Number(duration_minutes), service_id: serviceId };
                                }

                                try {
                                    let response;
                                    if (modalType === 'service') {
                                        response = await adminService.saveService(editItem?.id, payload);
                                    } else if (modalType === 'category') {
                                        response = await adminService.saveCategory(editItem?.id, payload);
                                    } else if (modalType === 'package') {
                                        response = await adminService.savePackage(serviceId, editItem?.id, payload);
                                    } else {
                                        response = await adminService.saveAddon(serviceId, editItem?.id, payload);
                                    }

                                    if (response.data.success) {
                                        setIsModalOpen(false);
                                        fetchData();
                                    } else {
                                        alert(response.data.error?.message || 'Failed to save');
                                    }
                                } catch (err) {
                                    console.error('Save error:', err);
                                }
                            }}>
                                {editItem ? 'Save Updates' : 'Add Item'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
