import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EventForm from '../components/events/EventForm';
import MinigameActivityForm from '../components/events/MinigameActivityForm';
import { CreateActivityRequest, ActivityType } from '../types/activity';
import { eventAPI } from '../services/eventAPI';

type EventFormType = 'normal' | 'minigame';

const CreateEvent: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formType, setFormType] = useState<EventFormType>('normal');
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
        <div>
            {/* Error Message */}
            {error && (
                <div className="max-w-4xl mx-auto px-6 pb-6">
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

            {/* Event Type Selector */}
            <div className="max-w-4xl mx-auto px-6 pt-6">
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <label className="block text-sm font-medium text-[#001C44] mb-3">
                        Chọn loại sự kiện
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setFormType('normal')}
                            className={`p-4 border-2 rounded-lg text-left transition-all ${
                                formType === 'normal'
                                    ? 'border-[#001C44] bg-[#001C44] bg-opacity-5'
                                    : 'border-gray-300 hover:border-[#001C44] hover:border-opacity-50'
                            }`}
                        >
                            <div className="flex items-center">
                                <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                                    formType === 'normal'
                                        ? 'border-[#001C44] bg-[#001C44]'
                                        : 'border-gray-300'
                                }`}>
                                    {formType === 'normal' && (
                                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                                    )}
                                </div>
                                <div>
                                    <div className="font-medium text-[#001C44]">Sự kiện thông thường</div>
                                    <div className="text-sm text-gray-600">Tạo sự kiện với đầy đủ tính năng</div>
                                </div>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormType('minigame')}
                            className={`p-4 border-2 rounded-lg text-left transition-all ${
                                formType === 'minigame'
                                    ? 'border-[#001C44] bg-[#001C44] bg-opacity-5'
                                    : 'border-gray-300 hover:border-[#001C44] hover:border-opacity-50'
                            }`}
                        >
                            <div className="flex items-center">
                                <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                                    formType === 'minigame'
                                        ? 'border-[#001C44] bg-[#001C44]'
                                        : 'border-gray-300'
                                }`}>
                                    {formType === 'minigame' && (
                                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                                    )}
                                </div>
                                <div>
                                    <div className="font-medium text-[#001C44]">Mini Game</div>
                                    <div className="text-sm text-gray-600">Tạo activity cho Mini Game Quiz</div>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Form */}
            {formType === 'normal' ? (
                <EventForm
                    onSubmit={handleSubmit}
                    loading={loading}
                    title="Tạo sự kiện mới"
                    onCancel={() => navigate('/manager/events')}
                />
            ) : (
                <MinigameActivityForm
                    onSubmit={handleSubmit}
                    loading={loading}
                    title="Tạo Mini Game"
                    onCancel={() => navigate('/manager/events')}
                />
            )}
        </div>
    );
};

export default CreateEvent;
