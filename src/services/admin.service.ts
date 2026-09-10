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
    listProviders: (params?: { status?: string; kyc_status?: string; limit?: number; offset?: number }) =>
        api.get('/admin/providers', { params }),

    getProviderById: (id: string) =>
        api.get(`/admin/providers/${id}`),

    updateProviderStatus: (id: string, status: 'approved' | 'rejected' | 'suspended') =>
        api.patch(`/admin/providers/${id}/status`, { status }),

    updateProviderCommission: (id: string, commission_rate: number) =>
        api.patch(`/admin/providers/${id}/commission`, { commission_rate }),

    // KYC & Verification
    updateProviderKYC: (id: string, kyc_status: 'approved' | 'verified' | 'rejected' | 'pending', rejection_reason?: string) =>
        api.patch(`/admin/providers/${id}/kyc`, { kyc_status, rejection_reason }),

    // Documents
    verifyDocument: (id: string, verification_status: 'approved' | 'rejected' | 'pending', notes?: string) =>
        api.patch(`/admin/documents/${id}/verify`, { verification_status, notes }),

    // Bookings
    listBookings: (params?: { status?: string; limit?: number; offset?: number }) =>
        api.get('/admin/bookings', { params }),

    deleteBooking: (id: string) =>
        api.delete(`/admin/bookings/${id}`),

    bulkDeleteBookings: (data: { status?: string; ids?: string[] }) =>
        api.delete('/admin/bookings', { data }),

    // Users
    deleteUser: (id: string) =>
        api.delete(`/admin/users/${id}`),

    // Providers
    deleteProvider: (id: string) =>
        api.delete(`/admin/providers/${id}`),

    // Pets
    deletePet: (id: string) =>
        api.delete(`/admin/pets/${id}`),

    // Database & Data Management
    getDatabaseOverview: () =>
        api.get<{ success: boolean; tables: { tableName: string; count: number }[] }>('/admin/database/overview'),

    getTableRecords: (tableName: string, params?: { limit?: number; offset?: number; search?: string }) =>
        api.get<{ success: boolean; rows: any[]; totalCount: number }>(`/admin/database/table/${tableName}`, { params }),

    deleteTableRow: (tableName: string, id: string) =>
        api.delete(`/admin/database/table/${tableName}/${id}`),

    purgeDatabase: (target: 'notifications' | 'webhook_logs' | 'cancelled_bookings' | 'all_test_bookings') =>
        api.post<{ success: boolean; message: string }>('/admin/database/purge', { target }),

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

    // Festival & Seasonal Theming
    listThemes: () =>
        api.get<{ success: boolean; data: any[] }>('/theme/admin/all'),

    activateTheme: (key: string) =>
        api.post<{ success: boolean; data: any; message: string }>(`/theme/admin/${key}/activate`),

    updateTheme: (key: string, data: any) =>
        api.put<{ success: boolean; data: any; message: string }>(`/theme/admin/${key}`, data),
};
