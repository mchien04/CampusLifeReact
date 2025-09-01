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
};

export default api;
