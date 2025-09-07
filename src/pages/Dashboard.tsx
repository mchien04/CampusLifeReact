import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types';
import { AdminDashboard, ManagerDashboard, StudentDashboard } from '../components/dashboard';

const Dashboard: React.FC = () => {
    const { userRole, isAuthenticated, username } = useAuth();

    const renderDashboard = () => {

        switch (userRole) {
            case Role.ADMIN:
                return <AdminDashboard />;
            case Role.MANAGER:
                return <ManagerDashboard />;
            case Role.STUDENT:
                return <StudentDashboard />;
            default:
                return (
                    <div className="min-h-screen flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-gray-900 mb-4">Lỗi xác thực</h1>
                            <p className="text-gray-600">Không thể xác định quyền người dùng.</p>
                            <p className="text-sm text-gray-500 mt-2">UserRole: {userRole || 'null'}</p>
                            <p className="text-sm text-gray-500">IsAuthenticated: {isAuthenticated ? 'true' : 'false'}</p>
                            <p className="text-sm text-gray-500">Username: {username || 'null'}</p>
                        </div>
                    </div>
                );
        }
    };

    return renderDashboard();
};

export default Dashboard;
