import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: Role[];
    requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    allowedRoles = [],
    requireAuth = true
}) => {
    const { isAuthenticated, userRole, loading } = useAuth();

    console.log('ProtectedRoute:', {
        isAuthenticated,
        userRole,
        loading,
        requireAuth,
        allowedRoles,
        currentPath: window.location.pathname
    }); // Debug log

    // Show loading spinner while checking auth
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    // If authentication is required but user is not authenticated
    if (requireAuth && !isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // If user is authenticated but accessing login/register pages, redirect to dashboard
    if (isAuthenticated && (window.location.pathname === '/login' || window.location.pathname === '/register')) {
        return <Navigate to="/dashboard" replace />;
    }

    // If specific roles are required, check if user has the right role
    if (allowedRoles.length > 0 && isAuthenticated && userRole && !allowedRoles.includes(userRole)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Không có quyền truy cập</h1>
                    <p className="text-gray-600 mb-4">Bạn không có quyền truy cập vào trang này.</p>
                    <button
                        onClick={() => window.history.back()}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default ProtectedRoute;
