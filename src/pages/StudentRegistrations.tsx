import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ActivityRegistrationResponse, ActivityParticipationResponse } from '../types/registration';
import { registrationAPI } from '../services/registrationAPI';
import { RegistrationList, ParticipationList } from '../components/registration';

const StudentRegistrations: React.FC = () => {
    const [registrations, setRegistrations] = useState<ActivityRegistrationResponse[]>([]);
    const [participations, setParticipations] = useState<ActivityParticipationResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'registrations' | 'participations'>('registrations');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [registrationsData, participationsData] = await Promise.all([
                registrationAPI.getMyRegistrations(),
                registrationAPI.getMyParticipations()
            ]);
            setRegistrations(registrationsData);
            setParticipations(participationsData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelRegistration = async (activityId: number) => {
        // Tìm registration để kiểm tra trạng thái
        const registration = registrations.find(reg => reg.activityId === activityId);

        if (registration?.status === 'APPROVED') {
            alert('Không thể hủy đăng ký đã được duyệt!');
            return;
        }

        const confirmed = window.confirm(
            'Bạn có chắc chắn muốn hủy đăng ký sự kiện này?\n\n' +
            '⚠️ Lưu ý: Sau khi hủy, bạn sẽ không thể đăng ký lại sự kiện này.'
        );

        if (confirmed) {
            try {
                await registrationAPI.cancelRegistration(activityId);
                await loadData(); // Reload data
                alert('Hủy đăng ký thành công!');
            } catch (error: any) {
                console.error('Error canceling registration:', error);
                alert('Có lỗi xảy ra khi hủy đăng ký: ' + (error.response?.data?.message || error.message));
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Quản lý đăng ký sự kiện</h1>
                            <p className="text-gray-600 mt-1">Xem và quản lý các đăng ký sự kiện của bạn</p>
                        </div>
                        <Link
                            to="/dashboard"
                            className="px-4 py-2 text-gray-600 hover:text-gray-900"
                        >
                            ← Quay lại Dashboard
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Tabs */}
                <div className="mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('registrations')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'registrations'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Đăng ký sự kiện ({registrations.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('participations')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'participations'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Lịch sử tham gia ({participations.length})
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6">
                        {activeTab === 'registrations' ? (
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-lg font-medium text-gray-900">Đăng ký sự kiện</h2>
                                    <Link
                                        to="/student/events"
                                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Xem sự kiện
                                    </Link>
                                </div>
                                <RegistrationList
                                    registrations={registrations}
                                    onCancelRegistration={handleCancelRegistration}
                                    showActions={true}
                                    isAdmin={false}
                                />
                            </div>
                        ) : (
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-lg font-medium text-gray-900">Lịch sử tham gia</h2>
                                </div>
                                <ParticipationList
                                    participations={participations}
                                    showActions={false}
                                    isAdmin={false}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentRegistrations;
