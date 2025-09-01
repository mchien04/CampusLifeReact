import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Role, DecodedToken } from '../types';

interface AuthContextType {
    isAuthenticated: boolean;
    userRole: Role | null;
    username: string | null;
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
        console.log('AuthContext: role found in token:', tokenRole); // Debug log

        // Map token role to Role enum
        switch (tokenRole) {
            case 'ADMIN':
                return Role.ADMIN;
            case 'MANAGER':
                return Role.MANAGER;
            case 'STUDENT':
                return Role.STUDENT;
            default:
                console.log('AuthContext: unknown role in token, defaulting to STUDENT'); // Debug log
                return Role.STUDENT;
        }
    }

    // Fallback: if no role in token, use username pattern (temporary)
    console.log('AuthContext: no role in token, using username fallback'); // Debug log
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
            console.log('AuthContext: login called with token:', token); // Debug log

            localStorage.setItem('token', token);
            console.log('AuthContext: token saved to localStorage'); // Debug log

            const decoded = decodeToken(token);
            console.log('AuthContext: decoded token:', decoded); // Debug log

            if (decoded) {
                console.log('AuthContext: full decoded token:', decoded); // Debug log
                console.log('AuthContext: token keys:', Object.keys(decoded)); // Debug log
                const role = getRoleFromToken(decoded);
                console.log('AuthContext: username:', decoded.sub); // Debug log
                console.log('AuthContext: determined role:', role); // Debug log

                setIsAuthenticated(true);
                setUsername(decoded.sub);
                setUserRole(role);

                console.log('AuthContext: state updated - isAuthenticated: true, username:', decoded.sub, 'role:', role); // Debug log
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
        login,
        logout,
        loading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
