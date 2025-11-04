import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Role, DecodedToken } from '../types';

interface AuthContextType {
    isAuthenticated: boolean;
    userRole: Role | null;
    username: string | null;
    user: { id: number; role: Role; username: string } | null;
    login: (token: string) => void;
    logout: () => void;
    loading: boolean;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

// Helper function to decode JWT token
const decodeToken = (token: string): DecodedToken | null => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
};

// Helper function to get role from JWT token
const getRoleFromToken = (decodedToken: DecodedToken): Role => {
    // Get role directly from token if available
    if (decodedToken.role) {
        const tokenRole = decodedToken.role.toUpperCase();

        // Map token role to Role enum
        switch (tokenRole) {
            case 'ADMIN':
                return Role.ADMIN;
            case 'MANAGER':
                return Role.MANAGER;
            case 'STUDENT':
                return Role.STUDENT;
            default:
                return Role.STUDENT;
        }
    }

    // Fallback: if no role in token, use username pattern (temporary)
    const lowerUsername = decodedToken.sub.toLowerCase();

    if (lowerUsername.includes('admin')) {
        return Role.ADMIN;
    }
    if (lowerUsername.includes('manager')) {
        return Role.MANAGER;
    }

    return Role.STUDENT;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState<Role | null>(null);
    const [username, setUsername] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = () => {
            const token = localStorage.getItem('token');
            if (token) {
                const decoded = decodeToken(token);
                if (decoded && decoded.exp * 1000 > Date.now()) {
                    // Token is valid
                    setIsAuthenticated(true);
                    setUsername(decoded.sub);
                    setUserRole(getRoleFromToken(decoded));
                } else {
                    // Token expired
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };

        initializeAuth();
    }, []);

    const login = (token: string) => {
        try {
            localStorage.setItem('token', token);
            const decoded = decodeToken(token);

            if (decoded) {
                const role = getRoleFromToken(decoded);
                setIsAuthenticated(true);
                setUsername(decoded.sub);
                setUserRole(role);
            }
        } catch (error) {
            console.error('AuthContext: error during login:', error);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUsername(null);
        setUserRole(null);
    };

    const value: AuthContextType = {
        isAuthenticated,
        userRole,
        username,
        user:
            userRole && username
                ? {
                    id: 0,
                    role: userRole,
                    username,
                }
                : null,
        login,
        logout,
        loading,
    };


    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
