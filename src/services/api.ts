import axios from 'axios';
import { LoginRequest, RegisterRequest, Response, AuthResponse } from '../types';

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
        }

        // Debug for grade submission requests
        if (config.url?.includes('/grade')) {
            console.log('=== API REQUEST DEBUG (GRADE) ===');
            console.log('URL:', config.url);
            console.log('Method:', config.method);
            console.log('Token exists:', !!token);
            console.log('Authorization header:', config.headers.Authorization);
            console.log('=== END REQUEST DEBUG ===');
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
        // Debug for grade submission errors
        if (error.config?.url?.includes('/grade')) {
            console.log('=== API RESPONSE ERROR DEBUG (GRADE) ===');
            console.log('Error status:', error.response?.status);
            console.log('Error statusText:', error.response?.statusText);
            console.log('Error data:', error.response?.data);
            console.log('Request URL:', error.config?.url);
            console.log('Request method:', error.config?.method);
            console.log('Request headers:', error.config?.headers);
            console.log('=== END ERROR DEBUG ===');
        }

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
