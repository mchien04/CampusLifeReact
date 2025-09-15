import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EventForm from '../components/events/EventForm';
import { CreateActivityRequest } from '../types/activity';
import { eventAPI } from '../services/eventAPI';

const CreateEvent: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (data: CreateActivityRequest) => {
        setLoading(true);
        setError('');
        console.log('🔍 CreateEvent: handleSubmit called with data:', data);
        console.log('🔍 CreateEvent: bannerUrl value:', data.bannerUrl);
        console.log('🔍 CreateEvent: bannerUrl type:', typeof data.bannerUrl);

        try {
            console.log('🔍 CreateEvent: Calling eventAPI.createEvent...');
            const response = await eventAPI.createEvent(data);
            console.log('🔍 CreateEvent: API response:', response);

            if (response.status) {
                console.log('🔍 CreateEvent: Event created successfully!');
                // Show success message and redirect
                alert('Tạo sự kiện thành công!');
                navigate('/manager/events');
            } else {
                console.error('🔍 CreateEvent: API returned error:', response.message);
                setError(response.message || 'Có lỗi xảy ra khi tạo sự kiện');
            }
        } catch (err: any) {
            console.error('🔍 CreateEvent: Exception occurred:', err);
            setError(err.message || 'Có lỗi xảy ra khi tạo sự kiện');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Tạo sự kiện mới</h1>
                            <p className="text-gray-600 mt-1">Tạo và quản lý sự kiện cho sinh viên</p>
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
                title="Tạo sự kiện mới"
                onCancel={() => navigate('/manager/events')}
            />
        </div>
    );
};

export default CreateEvent;
