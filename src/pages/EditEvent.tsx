import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StandardActivityForm from '../components/events/StandardActivityForm';
import MinigameActivityForm from '../components/events/MinigameActivityForm';
import SeriesActivityForm from '../components/events/SeriesActivityForm';
import { BaseEventFormData } from '../components/events/BaseEventForm';
import { ActivityResponse, ActivityType } from '../types/activity';
import { eventAPI } from '../services/eventAPI';
import { standardActivityAPI } from '../services/standardActivityAPI';
import { minigameActivityAPI } from '../services/minigameActivityAPI';
import { seriesAPI } from '../services/seriesAPI';
import { useAuth } from '../contexts/AuthContext';
import { mapScoreRuleResponseToRequest, reconstructActivityPresetConfig } from '../utils/scoreRuleMapper';

const coerceBoolean = (value: unknown, fallback = false) => {
    if (value === undefined || value === null) return fallback;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true' || normalized === '1') return true;
        if (normalized === 'false' || normalized === '0' || normalized === '') return false;
    }
    return Boolean(value);
};

const normalizeOrganizerIds = (event: ActivityResponse) => {
    const directIds = Array.isArray(event.organizerIds) ? event.organizerIds : [];

    if (directIds.length > 0) {
        return directIds
            .map((id) => Number(id))
            .filter((id) => Number.isFinite(id));
    }

    const organizerObjects = Array.isArray((event as any).organizers) ? (event as any).organizers : [];
    return organizerObjects
        .map((organizer: any) => Number(organizer?.id ?? organizer?.departmentId))
        .filter((id: number) => Number.isFinite(id));
};

const EditEvent: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { isAuthenticated, userRole, username } = useAuth();
    const [loading, setLoading] = useState(false);
    const [loadingEvent, setLoadingEvent] = useState(true);
    const [error, setError] = useState('');
    const [event, setEvent] = useState<ActivityResponse | null>(null);
    const navigate = useNavigate();

    const initialData: Partial<BaseEventFormData> = useMemo(() => {
        if (!event) {
            return {};
        }

        const draftValue = event.draft !== undefined ? event.draft : event.isDraft;
        const importantValue = event.important !== undefined ? event.important : event.isImportant;

        return {
            name: event.name,
            type: event.type ?? undefined,
            description: event.description,
            startDate: event.startDate,
            endDate: event.endDate,
            requiresSubmission: coerceBoolean(event.requiresSubmission, false),
            registrationStartDate: event.registrationStartDate ?? undefined,
            registrationDeadline: event.registrationDeadline ?? undefined,
            shareLink: event.shareLink,
            isImportant: coerceBoolean(importantValue, false),
            isDraft: coerceBoolean(draftValue, false),
            bannerUrl: event.bannerUrl || '',
            location: event.location,
            ticketQuantity: event.ticketQuantity ?? undefined,
            benefits: event.benefits,
            requirements: event.requirements,
            contactInfo: event.contactInfo,
            requiresApproval: coerceBoolean(event.requiresApproval, false),
            mandatoryForFacultyStudents: coerceBoolean(event.mandatoryForFacultyStudents, false),
            organizerIds: normalizeOrganizerIds(event),
            scoreRules: event.scoreRules?.map(mapScoreRuleResponseToRequest) ?? [],
            presetCode: event.presetCode || 'CUSTOM',
            presetConfig: event.presetConfig || null,
        };
    }, [event]);

    useEffect(() => {
        const fetchEvent = async () => {
            if (!id) {
                setError('ID sự kiện không hợp lệ');
                setLoadingEvent(false);
                return;
            }

            try {
                const response = await eventAPI.getEvent(parseInt(id));
                if (response.status && response.data) {
                    setEvent(response.data);
                } else {
                    setError('Không tìm thấy sự kiện');
                }
            } catch (err: any) {
                console.error('Error fetching event:', err);
                setError('Có lỗi xảy ra khi tải thông tin sự kiện');
            } finally {
                setLoadingEvent(false);
            }
        };

        fetchEvent();
    }, [id]);


    const handleSubmit = async (data: BaseEventFormData) => {
        if (!id) {
            setError('ID sự kiện không hợp lệ');
            return;
        }

        if (!event) {
            setError('Không tìm thấy sự kiện');
            return;
        }

        setLoading(true);
        setError('');

        try {
            let response;
            const eventId = parseInt(id);

            if (event.seriesId) {
                // Use new series-scoped update endpoint
                // Strip 'type' — backend SeriesChildActivityUpdateRequest does not accept it
                const { type: _, ...restData } = data;
                const seriesUpdateData = {
                    name: restData.name,
                    description: restData.description || null,
                    startDate: restData.startDate || event.startDate,
                    endDate: restData.endDate || event.endDate,
                    location: restData.location || null,
                    bannerUrl: restData.bannerUrl || null,
                    shareLink: restData.shareLink || null,
                    benefits: restData.benefits || null,
                    requirements: restData.requirements || null,
                    contactInfo: restData.contactInfo || null,
                    organizerIds: restData.organizerIds && restData.organizerIds.length > 0 ? restData.organizerIds : undefined,
                };
                response = await seriesAPI.updateActivityInSeries(event.seriesId, eventId, seriesUpdateData);
            } else if (event.type === ActivityType.MINIGAME) {
                // Strip scoreRules — backend MinigameActivityUpdateRequest is standalone and does not accept it
                const { scoreRules: _, ...updateData } = data;
                response = await minigameActivityAPI.updateMinigameActivity(eventId, updateData as any);
            } else {
                // Strip scoreRules — backend StandardActivityUpdateRequest is standalone and does not accept it
                const { scoreRules: _, ...updateData } = data;
                response = await standardActivityAPI.updateStandardActivity(eventId, updateData as any);
            }

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
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001C44] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải thông tin sự kiện...</p>
                </div>
            </div>
        );
    }

    if (error && !event) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">❌</div>
                    <h3 className="text-lg font-medium text-[#001C44] mb-2">Lỗi</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/manager/events')}
                        className="bg-[#001C44] hover:bg-[#002A66] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
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

    return (
        <div className="min-h-screen bg-gray-50">

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
            {event.seriesId ? (
                <SeriesActivityForm
                    onSubmit={(data) => {
                        const updateData: BaseEventFormData = {
                            ...initialData,
                            ...data,
                            type: event.type ?? ActivityType.SUKIEN,
                            startDate: data.startDate || event.startDate,
                            endDate: data.endDate || event.endDate,
                        };
                        handleSubmit(updateData);
                    }}
                    loading={loading}
                    initialData={initialData}
                    title={event.type === ActivityType.MINIGAME ? "Chỉnh sửa Mini Game trong chuỗi" : "Chỉnh sửa sự kiện trong chuỗi"}
                    onCancel={() => navigate('/manager/events')}
                    isMinigame={event.type === ActivityType.MINIGAME}
                />
            ) : event.type === ActivityType.MINIGAME ? (
                <MinigameActivityForm
                    onSubmit={handleSubmit}
                    loading={loading}
                    initialData={initialData}
                    title="Chỉnh sửa thông tin Mini Game"
                    onCancel={() => navigate('/manager/events')}
                    lockApprovalWhenImportant={false}
                    activeScoreEntryCount={event?.activeScoreEntryCount ?? 0}
                />
            ) : (
                <StandardActivityForm
                    onSubmit={handleSubmit}
                    loading={loading}
                    initialData={initialData}
                    title="Chỉnh sửa sự kiện"
                    onCancel={() => navigate('/manager/events')}
                    lockApprovalWhenImportant={false}
                    activeScoreEntryCount={event?.activeScoreEntryCount ?? 0}
                />
            )}

        </div>
    );
};

export default EditEvent;
