import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add valid auth token
api.interceptors.request.use(
    async (config) => {
        try {
            const { supabase } = await import('../lib/supabase');
            let { data: { session } } = await supabase.auth.getSession();

            // If token is missing or will expire within 60 seconds, proactively refresh it
            if (session?.expires_at && session.expires_at * 1000 < Date.now() + 60000) {
                const { data: refreshed, error } = await supabase.auth.refreshSession();
                if (!error && refreshed.session) {
                    session = refreshed.session;
                }
            }

            if (session?.access_token) {
                config.headers.Authorization = `Bearer ${session.access_token}`;
            }
        } catch (err) {
            console.error('Failed to attach auth token:', err);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to auto-recover from 401 (expired token)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const { supabase } = await import('../lib/supabase');
                const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
                if (!refreshError && refreshData.session?.access_token) {
                    originalRequest.headers.Authorization = `Bearer ${refreshData.session.access_token}`;
                    return api(originalRequest);
                } else {
                    // Session cannot be refreshed - prompt user to login again
                    await supabase.auth.signOut();
                    window.location.reload();
                }
            } catch (refreshErr) {
                console.error('Session auto-refresh failed:', refreshErr);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
