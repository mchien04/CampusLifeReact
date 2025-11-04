import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EventForm from '../components/events/EventForm';
import { CreateActivityRequest, ActivityResponse } from '../types/activity';
import { eventAPI } from '../services/eventAPI';
import { useAuth } from '../contexts/AuthContext';

const EditEvent: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { isAuthenticated, userRole, username } = useAuth();
    const [loading, setLoading] = useState(false);
    const [loadingEvent, setLoadingEvent] = useState(true);
    const [error, setError] = useState('');
    const [event, setEvent] = useState<ActivityResponse | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const response = await eventAPI.getEvent(parseInt(id!));
                console.log(" Raw event response:", response);

                const eventData = response.data || (response as any).body || (response as any).data;

                if (response.status && eventData) {
                    console.log(" Dữ liệu sự kiện:", eventData);
                    setEvent(eventData);
                } else {
                    setError("Không tìm thấy sự kiện");
                }
            } catch (err) {
                console.error("Error fetching event:", err);
                setError("Có lỗi xảy ra khi tải thông tin sự kiện");
            } finally {
                setLoadingEvent(false);
            }
        };

        fetchEvent();
    }, [id]);

    const testUserInfo = async () => {
        try {
            console.log('🔍 EditEvent: Testing user info...');
            const response = await eventAPI.debugUserInfo();
            console.log('🔍 EditEvent: User info response:', response);
            alert(`User Info: ${JSON.stringify(response, null, 2)}`);
        } catch (error) {
            console.error('🔍 EditEvent: Test user info failed:', error);
            alert('Failed to get user info');
        }
    };

    const handleSubmit = async (data: CreateActivityRequest) => {
        if (!id) {
            setError('ID sự kiện không hợp lệ');
            return;
        }

        console.log('🔍 EditEvent: handleSubmit called');
        console.log('🔍 EditEvent: Auth status:', { isAuthenticated, userRole, username });
        console.log('🔍 EditEvent: Token in localStorage:', localStorage.getItem('token'));
        console.log('🔍 EditEvent: Data to send:', data);

        setLoading(true);
        setError('');

        try {
            const response = await eventAPI.updateEvent(parseInt(id), data);

            if (response.status) {
                alert('Cập nhật sự kiện thành công!');
                navigate('/manager/events');
            } else {
                setError(response.message || 'Có lỗi xảy ra khi cập nhật sự kiện');
            }
        } catch (err: any) {
            setError(err.message || 'Có lỗi xảy ra khi cập nhật sự kiện');
        } finally {
            setLoading(false);
        }
    };

    if (loadingEvent) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải thông tin sự kiện...</p>
                </div>
            </div>
        );
    }

    if (error && !event) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">❌</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Lỗi</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/manager/events')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                        Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-gray-400 text-6xl mb-4">📅</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy sự kiện</h3>
                    <p className="text-gray-600 mb-4">Sự kiện bạn đang tìm kiếm không tồn tại.</p>
                    <button
                        onClick={() => navigate('/manager/events')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                        Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }

    // Convert ActivityResponse to CreateActivityRequest format
    const initialData: Partial<CreateActivityRequest> = {
        id: event.id,
        name: event.name,
        type: event.type,
        scoreType: event.scoreType,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        requiresSubmission: event.requiresSubmission,
        maxPoints: event.maxPoints?.toString() || '0',
        penaltyPointsIncomplete: event.penaltyPointsIncomplete?.toString() || '0',
        registrationStartDate: event.registrationStartDate,
        registrationDeadline: event.registrationDeadline,
        shareLink: event.shareLink,
        isImportant: event.isImportant,
        bannerUrl: event.bannerUrl,
        location: event.location,
        ticketQuantity: event.ticketQuantity,
        benefits: event.benefits,
        requirements: event.requirements,
        contactInfo: event.contactInfo,
        mandatoryForFacultyStudents: event.mandatoryForFacultyStudents,
        organizerIds: event.organizerIds || []
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Debug Banner */}
            <div className="bg-yellow-50 border-b border-yellow-200 p-4">
                <div className="max-w-7xl mx-auto">
                    <h3 className="text-sm font-medium text-yellow-800 mb-2">🔍 Debug Info:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div>
                            <strong>Auth Status:</strong> {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
                        </div>
                        <div>
                            <strong>Username:</strong> {username || 'N/A'}
                        </div>
                        <div>
                            <strong>Role:</strong> {userRole || 'N/A'}
                        </div>
                    </div>
                    <div className="mt-2">
                        <strong>Token:</strong> {localStorage.getItem('token') ? '✅ Present' : '❌ Missing'}
                    </div>
                    <div className="mt-2">
                        <button
                            onClick={testUserInfo}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                        >
                            Test User Info
                        </button>
                    </div>
                </div>
            </div>

            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa sự kiện</h1>
                            <p className="text-gray-600 mt-1">Cập nhật thông tin sự kiện: {event.name}</p>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="px-4 py-2 text-gray-600 hover:text-gray-900"
                            >
                                ← Quay lại Dashboard
                            </button>
                            <button
                                onClick={() => navigate('/manager/events')}
                                className="px-4 py-2 text-gray-600 hover:text-gray-900"
                            >
                                ← Quay lại danh sách
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="max-w-4xl mx-auto px-6 pt-6">
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Lỗi</h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p>{error}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Form */}
            <EventForm
                onSubmit={handleSubmit}
                loading={loading}
                initialData={initialData}
                title="Chỉnh sửa sự kiện"
                onCancel={() => navigate('/manager/events')}
                seriesId={event.id}
            />


        </div>
    );
};

export default EditEvent;
