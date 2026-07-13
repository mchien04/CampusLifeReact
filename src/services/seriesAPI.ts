import api from './api';
import { Response } from '../types/auth';
import {
    SeriesResponse,
    CreateSeriesRequest,
    UpdateSeriesRequest,
    AddActivityToSeriesRequest,
    SeriesRegistrationResponse,
    StudentSeriesProgress,
    SeriesRegistrationStatus,
    SeriesOverviewResponse,
    SeriesProgressListResponse
} from '../types/series';
import { ActivityResponse, SeriesChildActivityResponse, SeriesChildActivityCreateRequest, SeriesChildActivityUpdateRequest } from '../types/activity';
import { SeriesPresetPreviewResponse } from '../types/presets';
import { mapSeriesError, stripChildOrganizerIds } from '../utils/seriesHelpers';

const normalizeSeries = (raw: any): SeriesResponse => {
    // milestonePoints: BE list endpoint trả JSON string, detail endpoint trả object
    let milestonePoints: Record<string, number> = {};
    if (typeof raw.milestonePoints === 'string') {
        try { milestonePoints = JSON.parse(raw.milestonePoints); } catch { milestonePoints = {}; }
    } else if (raw.milestonePoints && typeof raw.milestonePoints === 'object') {
        milestonePoints = Object.fromEntries(
            Object.entries(raw.milestonePoints).map(([k, v]) => [k, Number(v)])
        );
    }
    return {
        ...raw,
        milestonePoints,
        // Normalize field names: detail dùng important/draft, list dùng isImportant/isDraft
        important: raw.important ?? raw.isImportant,
        isImportant: raw.isImportant ?? raw.important,
        draft: raw.draft ?? raw.isDraft,
        isDraft: raw.isDraft ?? raw.draft,
        mainActivityId: raw.mainActivityId ?? raw.mainActivity,
        organizerIds: Array.isArray(raw.organizerIds) ? raw.organizerIds : [],
        latestEndDate: raw.latestEndDate ?? null,
        ended: !!raw.ended,
    };
};

export const seriesAPI = {
    // Series Presets
    getSeriesPresets: async (): Promise<Response<any[]>> => {
        try {
            const response = await api.get('/api/series/presets');
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error fetching series presets:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Không thể tải danh sách mẫu chuỗi sự kiện',
                data: []
            };
        }
    },

    previewSeriesPreset: async (data: any): Promise<Response<SeriesPresetPreviewResponse>> => {
        try {
            const response = await api.post('/api/series/presets/preview', data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error previewing series preset:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi xem trước mẫu',
                data: undefined
            };
        }
    },

    // Get all series
    getSeries: async (): Promise<Response<SeriesResponse[]>> => {
        try {
            const response = await api.get('/api/series');
            const rawList = response.data.body || response.data.data || [];
            return {
                status: response.data.status,
                message: response.data.message,
                data: Array.isArray(rawList) ? rawList.map(normalizeSeries) : []
            };
        } catch (error: any) {
            console.error('Error fetching series:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Không thể tải danh sách chuỗi sự kiện',
                data: []
            };
        }
    },

    // Get series by ID
    getSeriesById: async (id: number): Promise<Response<SeriesResponse>> => {
        try {
            const response = await api.get(`/api/series/${id}`);
            const raw = response.data.body || response.data.data;
            return {
                status: response.data.status,
                message: response.data.message,
                data: raw ? normalizeSeries(raw) : undefined
            };
        } catch (error: any) {
            console.error('Error fetching series:', error);
            throw error;
        }
    },

    /**
     * Get activities in series
     * 
     * Endpoint: GET /api/series/{seriesId}/activities
     * 
     * Notes:
     * - Activities are sorted by seriesOrder (ascending)
     * - Only returns activities that are not deleted (isDeleted = false)
     * - Activities in series inherit score configuration from the series context
     * - Properties like registrationStartDate, registrationDeadline, requiresApproval, 
     *   ticketQuantity are inherited from the series
     * 
     * @param seriesId - ID of the series
     * @returns Response containing array of ActivityResponse, sorted by seriesOrder
     */
    getSeriesActivities: async (seriesId: number): Promise<Response<ActivityResponse[]>> => {
        try {
            const response = await api.get(`/api/series/${seriesId}/activities`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data || []
            };
        } catch (error: any) {
            console.error('Error fetching series activities:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Không thể tải danh sách sự kiện trong chuỗi',
                data: []
            };
        }
    },

    // Create series
    createSeries: async (data: CreateSeriesRequest): Promise<Response<SeriesResponse>> => {
        try {
            const response = await api.post('/api/series', data);
            const raw = response.data.body || response.data.data;
            return {
                status: response.data.status,
                message: mapSeriesError(response.data.message || ''),
                data: raw ? normalizeSeries(raw) : undefined
            };
        } catch (error: any) {
            console.error('Error creating series:', error);
            return {
                status: false,
                message: mapSeriesError(
                    error.response?.data?.message || 'Có lỗi xảy ra khi tạo chuỗi sự kiện'
                ),
                data: undefined
            };
        }
    },

    // Create activity in series
    createActivityInSeries: async (
        seriesId: number,
        data: SeriesChildActivityCreateRequest
    ): Promise<Response<SeriesChildActivityResponse>> => {
        try {
            const safe = stripChildOrganizerIds(data as SeriesChildActivityCreateRequest & { organizerIds?: number[] });
            const response = await api.post(`/api/series/${seriesId}/activities`, safe);
            return {
                status: response.data.status,
                message: mapSeriesError(response.data.message || ''),
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error creating activity in series:', error);
            return {
                status: false,
                message: mapSeriesError(
                    error.response?.data?.message || 'Có lỗi xảy ra khi tạo sự kiện trong chuỗi'
                ),
                data: undefined
            };
        }
    },

    // Update activity in series
    updateActivityInSeries: async (
        seriesId: number,
        activityId: number,
        data: SeriesChildActivityUpdateRequest
    ): Promise<Response<SeriesChildActivityResponse>> => {
        try {
            const safe = stripChildOrganizerIds(data as SeriesChildActivityUpdateRequest & { organizerIds?: number[] });
            const response = await api.put(`/api/series/${seriesId}/activities/${activityId}`, safe);
            return {
                status: response.data.status,
                message: mapSeriesError(response.data.message || ''),
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error updating activity in series:', error);
            return {
                status: false,
                message: mapSeriesError(
                    error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật sự kiện trong chuỗi'
                ),
                data: undefined
            };
        }
    },

    // Get activity detail in series
    getActivityInSeries: async (
        seriesId: number,
        activityId: number
    ): Promise<Response<SeriesChildActivityResponse>> => {
        try {
            const response = await api.get(`/api/series/${seriesId}/activities/${activityId}`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error fetching activity in series:', error);
            throw error;
        }
    },

    // Add existing activity to series
    addActivityToSeries: async (
        seriesId: number,
        data: AddActivityToSeriesRequest
    ): Promise<Response<ActivityResponse>> => {
        try {
            const response = await api.post(`/api/series/${seriesId}/activities/attach`, data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error adding activity to series:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi thêm sự kiện vào chuỗi',
                data: undefined
            };
        }
    },

    // Register for series (Student)
    registerForSeries: async (seriesId: number): Promise<SeriesRegistrationResponse> => {
        try {
            const response = await api.post(`/api/series/${seriesId}/register`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data || []
            };
        } catch (error: any) {
            console.error('Error registering for series:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi đăng ký chuỗi sự kiện',
                data: []
            };
        }
    },

    /**
     * P7-6: Huỷ đăng ký series — DELETE /api/series/{seriesId}/register.
     * On error trả message BE (isImportant/mandatory/ATTENDED...).
     */
    cancelSeriesRegistration: async (seriesId: number): Promise<Response<null>> => {
        try {
            const response = await api.delete(`/api/series/${seriesId}/register`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: null
            };
        } catch (error: any) {
            console.error('Error cancelling series registration:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi huỷ đăng ký chuỗi sự kiện',
                data: null
            };
        }
    },

    /**
     * P7-7: Đăng ký chờ (waitlist) series — POST /api/series/{seriesId}/waitlist.
     */
    waitlistSeries: async (seriesId: number): Promise<Response<any[]>> => {
        try {
            const response = await api.post(`/api/series/${seriesId}/waitlist`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data || []
            };
        } catch (error: any) {
            console.error('Error waitlisting series:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi đăng ký danh sách chờ',
                data: []
            };
        }
    },

    /**
     * Get my registration status for a series (Student)
     * Endpoint: GET /api/series/{seriesId}/registration/my
     *
     * Used to check whether the current student has registered for any activity in this series.
     */
    getMySeriesRegistrationStatus: async (seriesId: number): Promise<Response<SeriesRegistrationStatus>> => {
        try {
            const response = await api.get(`/api/series/${seriesId}/registration/my`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error fetching series registration status:', error);
            // In case of error, treat as not registered but still return a valid response shape
            return {
                status: false,
                message: error.response?.data?.message || 'Không thể kiểm tra trạng thái đăng ký chuỗi sự kiện',
                data: undefined
            };
        }
    },

    /**
     * Get my series progress (Student)
     * Endpoint: GET /api/series/{seriesId}/progress/my
     * 
     * Response includes:
     * - completedCount: Số sự kiện đã hoàn thành
     * - totalActivities: Tổng số sự kiện trong series
     * - completedActivityIds: Danh sách ID các sự kiện đã hoàn thành
     * - pointsEarned: Tổng điểm milestone đã nhận
     * - currentMilestone: Mốc hiện tại đã đạt
     * - nextMilestoneCount: Số sự kiện cần để đạt mốc tiếp theo
     * - nextMilestonePoints: Điểm sẽ nhận khi đạt mốc tiếp theo
     * - milestonePoints: Map các mốc điểm
     * - scoreType: Loại điểm (REN_LUYEN, etc.)
     */
    getMySeriesProgress: async (seriesId: number): Promise<Response<StudentSeriesProgress>> => {
        try {
            const response = await api.get(`/api/series/${seriesId}/progress/my`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error fetching series progress:', error);
            // Return null if not found (student hasn't registered)
            if (error.response?.status === 404) {
                return {
                    status: false,
                    message: 'Chưa đăng ký chuỗi sự kiện này',
                    data: undefined
                };
            }
            throw error;
        }
    },

    /**
     * Get student series progress (Admin/Manager)
     * Endpoint: GET /api/series/{seriesId}/students/{studentId}/progress
     * 
     * Response includes the same fields as getMySeriesProgress
     * 
     * @param seriesId - ID of the series
     * @param studentId - ID of the student
     * @returns Response containing StudentSeriesProgress
     */
    getStudentSeriesProgress: async (seriesId: number, studentId: number): Promise<Response<StudentSeriesProgress>> => {
        try {
            const response = await api.get(`/api/series/${seriesId}/students/${studentId}/progress`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error fetching student series progress:', error);
            if (error.response?.status === 404) {
                return {
                    status: false,
                    message: 'Sinh viên chưa đăng ký chuỗi sự kiện này',
                    data: undefined
                };
            }
            return {
                status: false,
                message: error.response?.data?.message || 'Không thể tải tiến độ của sinh viên',
                data: undefined
            };
        }
    },

    // Calculate milestone (Admin)
    calculateMilestone: async (seriesId: number, studentId: number): Promise<Response<any>> => {
        try {
            const response = await api.post(`/api/series/${seriesId}/students/${studentId}/calculate-milestone`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error calculating milestone:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi tính điểm milestone',
                data: undefined
            };
        }
    },

    // Update series
    updateSeries: async (id: number, data: UpdateSeriesRequest): Promise<Response<SeriesResponse>> => {
        try {
            const response = await api.put(`/api/series/${id}`, data);
            const raw = response.data.body || response.data.data;
            return {
                status: response.data.status,
                message: mapSeriesError(response.data.message || ''),
                data: raw ? normalizeSeries(raw) : undefined
            };
        } catch (error: any) {
            console.error('Error updating series:', error);
            return {
                status: false,
                message: mapSeriesError(
                    error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật chuỗi sự kiện'
                ),
                data: undefined
            };
        }
    },

    // Delete series (soft delete)
    deleteSeries: async (id: number): Promise<Response<null>> => {
        try {
            const response = await api.delete(`/api/series/${id}`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: null
            };
        } catch (error: any) {
            console.error('Error deleting series:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi xóa chuỗi sự kiện',
                data: undefined
            };
        }
    },

    /**
     * Get series overview (Admin/Manager)
     * Endpoint: GET /api/series/{seriesId}/overview
     * 
     * Returns statistics and overview of the series including:
     * - Total activities, registered students, completed students
     * - Completion rate
     * - Milestone progress distribution
     * - Activity statistics
     */
    getSeriesOverview: async (seriesId: number): Promise<Response<SeriesOverviewResponse>> => {
        try {
            const response = await api.get(`/api/series/${seriesId}/overview`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error fetching series overview:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Không thể tải tổng quan chuỗi sự kiện',
                data: undefined
            };
        }
    },

    /**
     * Get series progress list (Admin/Manager)
     * Endpoint: GET /api/series/{seriesId}/progress?page={page}&size={size}&keyword={keyword}
     * 
     * Returns paginated list of student progress in the series
     * 
     * @param seriesId - ID of the series
     * @param params - Query parameters: page (0-based), size (default 20), keyword (search by name or code)
     */
    getSeriesProgress: async (
        seriesId: number,
        params?: {
            page?: number;
            size?: number;
            keyword?: string;
        }
    ): Promise<Response<SeriesProgressListResponse>> => {
        try {
            const queryParams = new URLSearchParams();
            if (params?.page !== undefined) queryParams.append('page', params.page.toString());
            if (params?.size !== undefined) queryParams.append('size', params.size.toString());
            if (params?.keyword) queryParams.append('keyword', params.keyword);

            const url = `/api/series/${seriesId}/progress${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const response = await api.get(url);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error fetching series progress:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Không thể tải tiến độ tham gia',
                data: undefined
            };
        }
    }
};

