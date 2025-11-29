export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
}

export interface AuthResponse {
    token: string;
}

export interface Response<T = any> {
    status: boolean;
    message: string;
    data?: T;
    body?: T; // Add body field for actual API response
}

export interface User {
    id: number;
    username: string;
    email: string;
    role: Role;
    isActivated: boolean;
    lastLogin?: string;
    createdAt: string;
    updatedAt: string;
    isDeleted?: boolean;
}

export interface UserResponse {
    id: number;
    username: string;
    email: string;
    role: Role;
    isActivated: boolean;
    lastLogin?: string | null;
    createdAt: string;
    updatedAt: string;
    isDeleted: boolean;
}

export interface CreateUserRequest {
    username: string;
    email: string;
    password: string;
    role: 'ADMIN' | 'MANAGER';
    isActivated?: boolean;
}

export interface UpdateUserRequest {
    username?: string;
    email?: string;
    password?: string;
    role?: 'ADMIN' | 'MANAGER';
    isActivated?: boolean;
}

export enum Role {
    ADMIN = 'ADMIN',
    MANAGER = 'MANAGER',
    STUDENT = 'STUDENT'
}

export interface DecodedToken {
    sub: string; // username
    exp: number;
    iat: number;
    role?: string; // role from token
}
