import axios from 'axios';
import { LoginRequest, RegisterRequest, ForgotPasswordRequest, ResetPasswordRequest, Response, AuthResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            // Debug log (remove in production)
            if (process.env.NODE_ENV === 'development') {
                console.log('[API Request]', config.method?.toUpperCase(), config.url, 'Token:', token.substring(0, 20) + '...');
            }
        } else {
            // Debug log when no token
            if (process.env.NODE_ENV === 'development') {
                console.warn('[API Request]', config.method?.toUpperCase(), config.url, 'No token found in localStorage');
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    login: async (data: LoginRequest): Promise<Response<AuthResponse>> => {
        const response = await api.post('/api/auth/login', data);
        return response.data;
    },

    register: async (data: RegisterRequest): Promise<Response<null>> => {
        const response = await api.post('/api/auth/register', data);
        return response.data;
    },

    verifyAccount: async (token: string): Promise<Response<null>> => {
        const response = await api.get(`/api/auth/verify?token=${token}`);
        return response.data;
    },

    forgotPassword: async (data: ForgotPasswordRequest): Promise<Response<null>> => {
        const response = await api.post('/api/auth/forgot-password', data);
        return response.data;
    },

    resetPassword: async (data: ResetPasswordRequest): Promise<Response<null>> => {
        const response = await api.post('/api/auth/reset-password', data);
        return response.data;
    },
};

export const departmentAPI = {
    getAll: async (): Promise<Response<any[]>> => {
        const response = await api.get('/api/departments');
        return {
            status: true,
            message: 'Departments retrieved successfully',
            data: response.data
        };
    },

    getById: async (id: number): Promise<Response<any>> => {
        const response = await api.get(`/api/departments/${id}`);
        return {
            status: true,
            message: 'Department retrieved successfully',
            data: response.data
        };
    },
};

export default api;
