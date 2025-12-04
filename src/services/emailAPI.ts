import api from './api';
import { ApiResponse } from '../types/common';
import {
    SendEmailRequest,
    SendNotificationOnlyRequest,
    EmailHistoryResponse,
    EmailHistoryPage,
    EmailSendResult,
    NotificationSendResult
} from '../types/email';
import { studentAPI } from './studentAPI';
import { classAPI } from './classAPI';
import { departmentAPI } from './adminAPI';
import { eventAPI } from './eventAPI';
import { seriesAPI } from './seriesAPI';
import { registrationAPI } from './registrationAPI';
import { StudentResponse } from '../types/student';

export const emailAPI = {
    /**
     * Gửi email với attachments
     * POST /api/emails/send
     * Content-Type: multipart/form-data
     */
    sendEmail: async (
        request: SendEmailRequest,
        attachments?: File[]
    ): Promise<ApiResponse<EmailSendResult>> => {
        try {
            const formData = new FormData();
            
            // Convert request to JSON string
            formData.append('request', JSON.stringify(request));
            
            // Add attachments if any
            if (attachments && attachments.length > 0) {
                attachments.forEach((file) => {
                    formData.append('attachments', file);
                });
            }
            
            const response = await api.post('/api/emails/send', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            return {
                status: response.data.status,
                message: response.data.message,
                body: response.data.data || response.data.body || null
            };
        } catch (error: any) {
            console.error('Error sending email:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi gửi email',
                body: null
            };
        }
    },

    /**
     * Chỉ tạo notification (không gửi email)
     * POST /api/emails/notifications/send
     * Content-Type: application/json
     */
    sendNotificationOnly: async (
        request: SendNotificationOnlyRequest
    ): Promise<ApiResponse<NotificationSendResult>> => {
        try {
            const response = await api.post('/api/emails/notifications/send', request);
            
            return {
                status: response.data.status,
                message: response.data.message,
                body: response.data.data || response.data.body || null
            };
        } catch (error: any) {
            console.error('Error sending notification:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi gửi thông báo',
                body: null
            };
        }
    },

    /**
     * Lấy lịch sử email với pagination
     * GET /api/emails/history?page={page}&size={size}
     */
    getEmailHistory: async (
        page: number = 0,
        size: number = 20
    ): Promise<ApiResponse<EmailHistoryPage>> => {
        try {
            const response = await api.get(`/api/emails/history?page=${page}&size=${size}`);
            
            const data = response.data.data || response.data.body || response.data;
            
            // Ensure pagination structure
            if (data && data.content) {
                return {
                    status: response.data.status !== false,
                    message: response.data.message || 'Lấy lịch sử email thành công',
                    body: data
                };
            }
            
            // If backend returns array, wrap it
            if (Array.isArray(data)) {
                return {
                    status: true,
                    message: 'Lấy lịch sử email thành công',
                    body: {
                        content: data,
                        totalElements: data.length,
                        totalPages: Math.ceil(data.length / size),
                        size: size,
                        number: page
                    }
                };
            }
            
            return {
                status: response.data.status !== false,
                message: response.data.message || 'Lấy lịch sử email thành công',
                body: data
            };
        } catch (error: any) {
            console.error('Error fetching email history:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi lấy lịch sử email',
                body: null
            };
        }
    },

    /**
     * Lấy chi tiết email
     * GET /api/emails/history/{emailId}
     */
    getEmailDetail: async (emailId: number): Promise<ApiResponse<EmailHistoryResponse>> => {
        try {
            const response = await api.get(`/api/emails/history/${emailId}`);
            
            return {
                status: response.data.status,
                message: response.data.message,
                body: response.data.data || response.data.body || null
            };
        } catch (error: any) {
            console.error('Error fetching email detail:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi lấy chi tiết email',
                body: null
            };
        }
    },

    /**
     * Gửi lại email
     * POST /api/emails/history/{emailId}/resend
     */
    resendEmail: async (emailId: number): Promise<ApiResponse<EmailHistoryResponse>> => {
        try {
            const response = await api.post(`/api/emails/history/${emailId}/resend`);
            
            return {
                status: response.data.status,
                message: response.data.message,
                body: response.data.data || response.data.body || null
            };
        } catch (error: any) {
            console.error('Error resending email:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi gửi lại email',
                body: null
            };
        }
    },

    /**
     * Download attachment
     * GET /api/emails/attachments/{attachmentId}/download
     */
    downloadAttachment: async (attachmentId: number, fileName: string): Promise<void> => {
        try {
            const response = await api.get(`/api/emails/attachments/${attachmentId}/download`, {
                responseType: 'blob'
            });
            
            // Create blob URL and trigger download
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error: any) {
            console.error('Error downloading attachment:', error);
            throw new Error(error.response?.data?.message || 'Có lỗi xảy ra khi tải file đính kèm');
        }
    }
};

/**
 * Helper functions để lấy danh sách recipients
 */
export const recipientService = {
    /**
     * Lấy tất cả students (có phân trang và search)
     */
    getAllStudents: async (
        page: number = 0,
        size: number = 20,
        keyword?: string
    ): Promise<{ content: StudentResponse[], totalElements: number }> => {
        try {
            let response;
            if (keyword) {
                response = await studentAPI.searchStudents(keyword, page, size);
            } else {
                response = await studentAPI.getAllStudents(page, size);
            }
            
            if (response.status && response.data?.content) {
                return {
                    content: response.data.content,
                    totalElements: response.data.totalElements || 0
                };
            }
            return { content: [], totalElements: 0 };
        } catch (error) {
            console.error('Error fetching students:', error);
            return { content: [], totalElements: 0 };
        }
    },

    /**
     * Lấy students theo department
     */
    getStudentsByDepartment: async (
        departmentId: number,
        page: number = 0,
        size: number = 20
    ): Promise<{ content: StudentResponse[], totalElements: number }> => {
        try {
            const response = await studentAPI.getStudentsByDepartment(departmentId, page, size);
            if (response.status && response.data?.content) {
                return {
                    content: response.data.content,
                    totalElements: response.data.totalElements || 0
                };
            }
            return { content: [], totalElements: 0 };
        } catch (error) {
            console.error('Error fetching students by department:', error);
            return { content: [], totalElements: 0 };
        }
    },

    /**
     * Lấy students trong class
     */
    getStudentsInClass: async (classId: number): Promise<StudentResponse[]> => {
        try {
            const response = await classAPI.getStudentsInClass(classId);
            if (response.status && response.data) {
                return Array.isArray(response.data) ? response.data : [];
            }
            return [];
        } catch (error) {
            console.error('Error fetching students in class:', error);
            return [];
        }
    },

    /**
     * Lấy students đã đăng ký activity
     */
    getActivityRegistrations: async (activityId: number): Promise<number[]> => {
        try {
            const registrations = await registrationAPI.getActivityRegistrations(activityId);
            if (Array.isArray(registrations)) {
                // Extract userIds from registrations
                return registrations
                    .map((reg: any) => reg.student?.userId || reg.userId)
                    .filter((id: number) => id != null);
            }
            return [];
        } catch (error) {
            console.error('Error fetching activity registrations:', error);
            return [];
        }
    },

    /**
     * Lấy students đã đăng ký series
     */
    getSeriesRegistrations: async (seriesId: number): Promise<number[]> => {
        try {
            // Get all activities in series
            const seriesRes = await seriesAPI.getSeriesById(seriesId);
            if (!seriesRes.status || !seriesRes.data) {
                return [];
            }

            const activities = seriesRes.data.activities || [];
            const allUserIds = new Set<number>();

            // Get registrations for each activity
            for (const activity of activities) {
                const userIds = await recipientService.getActivityRegistrations(activity.id);
                userIds.forEach(id => allUserIds.add(id));
            }

            return Array.from(allUserIds);
        } catch (error) {
            console.error('Error fetching series registrations:', error);
            return [];
        }
    }
};

