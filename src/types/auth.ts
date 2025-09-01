export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
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
