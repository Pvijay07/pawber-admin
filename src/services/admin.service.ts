import api from './api';

// ─── Types ──────────────────────────────────────

export interface DashboardStats {
    total_users: number;
    total_providers: number;
    total_bookings: number;
    total_revenue: number;
    service_distribution?: any[];
}

export interface DashboardResponse {
    stats: DashboardStats;
    recent_bookings: any[];
    pending_providers: any[];
}

// ─── Admin Service ──────────────────────────────

export const adminService = {
    // Dashboard
    getDashboard: () =>
        api.get<DashboardResponse>('/admin/dashboard'),

    // Users
    listUsers: (params?: { role?: string; limit?: number; offset?: number }) =>
        api.get('/admin/users', { params }),

    // Pets
    listPets: (params?: { limit?: number; offset?: number }) =>
        api.get('/admin/pets', { params }),

    // Providers
    listProviders: (params?: { status?: string; limit?: number; offset?: number }) =>
        api.get('/admin/providers', { params }),

    updateProviderStatus: (id: string, status: 'approved' | 'rejected' | 'suspended') =>
        api.patch(`/admin/providers/${id}/status`, { status }),

    updateProviderCommission: (id: string, commission_rate: number) =>
        api.patch(`/admin/providers/${id}/commission`, { commission_rate }),

    // KYC & Verification
    updateProviderKYC: (id: string, kyc_status: 'verified' | 'rejected' | 'pending') =>
        api.patch(`/admin/providers/${id}/kyc`, { kyc_status }),

    // Documents
    verifyDocument: (id: string, verification_status: 'approved' | 'rejected') =>
        api.patch(`/admin/documents/${id}/verify`, { verification_status }),

    // Bookings
    listBookings: (params?: { status?: string; limit?: number; offset?: number }) =>
        api.get('/admin/bookings', { params }),

    // Disputes
    listDisputes: () =>
        api.get('/admin/disputes'),

    resolveDispute: (id: string, data: { resolution: string; status?: string }) =>
        api.patch(`/admin/disputes/${id}/resolve`, data),

    // Coupons
    listCoupons: () =>
        api.get('/admin/coupons'),

    createCoupon: (data: {
        code: string;
        discount_type: 'percentage' | 'flat';
        discount_value: number;
        max_uses?: number;
        min_order_amount?: number;
        expires_at?: string;
    }) => api.post('/admin/coupons', data),

    // Events
    createEvent: (data: {
        title: string;
        description?: string;
        event_date: string;
        location?: string;
        image_url?: string;
    }) => api.post('/admin/events', data),

    // Webhook Logs
    listWebhookLogs: (params?: { source?: string; limit?: number }) =>
        api.get('/admin/webhook-logs', { params }),

    // Service Catalog (Shared with public but managed by Admin)
    listCategories: () =>
        api.get('/services/categories'),

    listServices: (categoryId?: string) =>
        api.get('/services', { params: { category_id: categoryId } }),

    getServiceDetails: (id: string) =>
        api.get(`/services/${id}`),

    listAllPackages: () =>
        api.get('/services/all/packages'),

    listAllAddons: () =>
        api.get('/services/all/addons'),

    saveCategory: (id: string | null, data: any) =>
        id ? api.patch(`/services/categories/${id}`, data) : api.post('/services/categories', data),

    saveService: (id: string | null, data: any) =>
        id ? api.patch(`/services/${id}`, data) : api.post('/services', data),

    savePackage: (serviceId: string, id: string | null, data: any) =>
        id ? api.patch(`/services/${serviceId}/packages/${id}`, data) : api.post(`/services/${serviceId}/packages`, data),

    saveAddon: (serviceId: string, id: string | null, data: any) =>
        id ? api.patch(`/services/${serviceId}/addons/${id}`, data) : api.post(`/services/${serviceId}/addons`, data),

    deleteCatalogItem: (table: string, id: string) =>
        api.delete(`/services/${id}`, { params: { table } }),

    // Communications
    sendBroadcast: (data: { title: string; body: string; channels?: string[]; segments?: string[] }) =>
        api.post('/admin/notifications/broadcast', data),

    assignBookingProvider: (bookingId: string, providerId: string) =>
        api.patch(`/admin/bookings/${bookingId}/assign`, { provider_id: providerId }),

    // Content Management
    getContent: (key: string) =>
        api.get(`/content/${key}`),

    updateContent: (key: string, content: any) =>
        api.patch(`/content/${key}`, { content }),

    // Notifications Simulator
    getNotificationTemplates: () =>
        api.get<{ success: boolean; templates: any[] }>('/admin/notifications/templates'),

    triggerSimulationNotification: (data: { userId?: string; templateId: string; context?: Record<string, any> }) =>
        api.post<{ success: boolean; message: string }>('/admin/notifications/trigger-simulation', data),
};
