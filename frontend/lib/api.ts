import axios from 'axios';
import { saveAuthRedirect } from './auth';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined'
        ? `http://${window.location.hostname}:5000/api`
        : 'http://localhost:5000/api'),
});

// Request interceptor — attach JWT token to every request
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Response interceptor — auto-logout on 401 (expired/invalid token)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (
            typeof window !== 'undefined' &&
            error.response?.status === 401 &&
            window.location.pathname !== '/login' &&
            window.location.pathname !== '/register'
        ) {
            // Token is expired or invalid — clear session and redirect
            saveAuthRedirect(window.location.pathname + window.location.search);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
