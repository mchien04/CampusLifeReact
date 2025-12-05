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
import { departmentAPI, userAPI } from './adminAPI';
import { eventAPI } from './eventAPI';
import { seriesAPI } from './seriesAPI';
import { registrationAPI } from './registrationAPI';
import { StudentResponse } from '../types/student';
import { UserResponse } from '../types/auth';

export const emailAPI = {
    /**
     * Gửi email với JSON (không có attachments)
     * POST /api/emails/send-json
     * Content-Type: application/json
     */
    sendEmailJson: async (
        request: SendEmailRequest
    ): Promise<ApiResponse<EmailSendResult>> => {
        try {
            const response = await api.post('/api/emails/send-json', request, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            return {
                status: response.data.status,
                message: response.data.message,
                body: response.data.data || response.data.body || null
            };
        } catch (error: any) {
            console.error('Error sending email (JSON):', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi gửi email',
                body: null
            };
        }
    },

    /**
     * Gửi email với attachments (multipart/form-data)
     * POST /api/emails/send
     * Content-Type: multipart/form-data
     */
    sendEmail: async (
        request: SendEmailRequest,
        attachments?: File[]
    ): Promise<ApiResponse<EmailSendResult>> => {
        try {
            const formData = new FormData();
            
            // QUAN TRỌNG: Phải dùng Blob với Content-Type application/json
            const requestBlob = new Blob([JSON.stringify(request)], { 
                type: 'application/json' 
            });
            formData.append('request', requestBlob);
            
            // Add attachments if any
            if (attachments && attachments.length > 0) {
                attachments.forEach((file) => {
                    formData.append('attachments', file);
                });
            }
            
            // QUAN TRỌNG: Interceptor trong api.ts sẽ tự động xóa Content-Type khi detect FormData
            // Browser sẽ tự động set Content-Type với boundary cho FormData
            const response = await api.post('/api/emails/send', formData);
            
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
     * Lấy tất cả users (có phân trang và search)
     */
    getAllUsers: async (
        page: number = 0,
        size: number = 20,
        keyword?: string,
        role?: 'ADMIN' | 'MANAGER' | 'STUDENT'
    ): Promise<{ content: UserResponse[]; totalElements: number }> => {
        try {
            const response = await userAPI.getUsersPaginated({
                page,
                size,
                keyword,
                role,
                includeStudents: true // Luôn bao gồm students
            });

            console.log('🔍 recipientService.getAllUsers - response:', response);
            console.log('🔍 recipientService.getAllUsers - response.status:', response.status);
            console.log('🔍 recipientService.getAllUsers - response.data:', response.data);

            if (response.status && response.data) {
                // Handle both pagination format and array format
                if (response.data.content && Array.isArray(response.data.content)) {
                    console.log('🔍 recipientService.getAllUsers - Found content array, length:', response.data.content.length);
                    return {
                        content: response.data.content,
                        totalElements: response.data.totalElements ?? response.data.content.length ?? 0
                    };
                }
                // If data is directly an array
                if (Array.isArray(response.data)) {
                    console.log('🔍 recipientService.getAllUsers - Data is array, length:', response.data.length);
                    return {
                        content: response.data,
                        totalElements: response.data.length
                    };
                }
            }
            
            console.warn('🔍 recipientService.getAllUsers - No valid data found, returning empty');
            return { content: [], totalElements: 0 };
        } catch (error) {
            console.error('Error fetching users:', error);
            return { content: [], totalElements: 0 };
        }
    },

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
     * Lưu ý: Lấy TẤT CẢ registrations, không filter theo status (PENDING, APPROVED, REJECTED, CANCELLED)
     * Logic: Gửi cho tất cả đã đăng ký, dù chưa duyệt hay đã duyệt
     */
    getActivityRegistrations: async (activityId: number): Promise<number[]> => {
        try {
            const registrations = await registrationAPI.getActivityRegistrations(activityId);
            if (Array.isArray(registrations)) {
                // Extract userIds from registrations (không filter theo status)
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
     * Lưu ý: Lấy TẤT CẢ registrations, không filter theo status (PENDING, APPROVED, REJECTED, CANCELLED)
     * Logic: Gửi cho tất cả đã đăng ký, dù chưa duyệt hay đã duyệt
     */
    getSeriesRegistrations: async (seriesId: number): Promise<number[]> => {
        try {
            // Try to get series registrations from API if available
            try {
                const response = await api.get(`/api/registrations/series/${seriesId}`);
                // Response structure: { status, message, body: [...] }
                const registrations = response.data.body || response.data.data || [];
                if (response.data.status && Array.isArray(registrations)) {
                    const uniqueUserIds = new Set<number>();
                    registrations.forEach((reg: any) => {
                        const studentId = reg.studentId;
                        if (studentId) {
                            // Try to get userId from student object or use studentId directly
                            const userId = reg.student?.userId || reg.userId || studentId;
                            if (userId) {
                                uniqueUserIds.add(userId);
                            }
                        }
                    });
                    return Array.from(uniqueUserIds);
                }
            } catch (apiError) {
                console.log('Series registrations API not available, using fallback', apiError);
            }

            // Fallback: Get all activities in series
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
    },

    /**
     * Preview recipients cho activity (lấy danh sách students đã đăng ký)
     * Lưu ý: Lấy TẤT CẢ registrations, không filter theo status (PENDING, APPROVED, REJECTED, CANCELLED)
     * Logic: Gửi cho tất cả đã đăng ký, dù chưa duyệt hay đã duyệt
     */
    previewActivityRecipients: async (
        activityId: number
    ): Promise<{ totalCount: number; previewList: Array<{ id: number; name: string; code?: string; email?: string }> }> => {
        try {
            const registrations = await registrationAPI.getActivityRegistrations(activityId);
            if (!Array.isArray(registrations)) {
                return { totalCount: 0, previewList: [] };
            }

            // Lấy TẤT CẢ registrations, không filter theo status
            // Bao gồm: PENDING, APPROVED, REJECTED, CANCELLED
            const previewList = registrations.slice(0, 10).map((reg: any) => ({
                id: reg.studentId || reg.id,
                name: reg.studentName || reg.student?.fullName || 'N/A',
                code: reg.studentCode || reg.student?.studentCode,
                email: reg.student?.email || reg.email
            }));

            return {
                totalCount: registrations.length,
                previewList
            };
        } catch (error) {
            console.error('Error previewing activity recipients:', error);
            return { totalCount: 0, previewList: [] };
        }
    },

    /**
     * Preview recipients cho series (lấy danh sách unique students đã đăng ký)
     * Lưu ý: Lấy TẤT CẢ registrations, không filter theo status (PENDING, APPROVED, REJECTED, CANCELLED)
     * Logic: Gửi cho tất cả đã đăng ký, dù chưa duyệt hay đã duyệt
     */
    previewSeriesRecipients: async (
        seriesId: number
    ): Promise<{ totalCount: number; previewList: Array<{ id: number; name: string; code?: string; email?: string }> }> => {
        try {
            // Try to get series registrations from API if available
            try {
                const response = await api.get(`/api/registrations/series/${seriesId}`);
                // Response structure: { status, message, body: [...] }
                const registrations = response.data.body || response.data.data || [];
                if (response.data.status && Array.isArray(registrations)) {
                    const uniqueStudents = new Map<number, any>();
                    
                    registrations.forEach((reg: any) => {
                        const studentId = reg.studentId;
                        if (studentId && !uniqueStudents.has(studentId)) {
                            uniqueStudents.set(studentId, {
                                id: studentId,
                                name: reg.studentName || 'N/A',
                                code: reg.studentCode,
                                email: reg.student?.email
                            });
                        }
                    });

                    const previewList = Array.from(uniqueStudents.values()).slice(0, 10);
                    return {
                        totalCount: uniqueStudents.size,
                        previewList
                    };
                }
            } catch (apiError) {
                // Fallback to getting from activities
                console.log('Series registrations API not available, using fallback', apiError);
            }

            // Fallback: Get from activities in series
            const seriesRes = await seriesAPI.getSeriesById(seriesId);
            if (!seriesRes.status || !seriesRes.data) {
                return { totalCount: 0, previewList: [] };
            }

            const activities = seriesRes.data.activities || [];
            const uniqueStudents = new Map<number, any>();

            for (const activity of activities) {
                const registrations = await registrationAPI.getActivityRegistrations(activity.id);
                registrations.forEach((reg: any) => {
                    const studentId = reg.studentId;
                    if (studentId && !uniqueStudents.has(studentId)) {
                        uniqueStudents.set(studentId, {
                            id: studentId,
                            name: reg.studentName || reg.student?.fullName || 'N/A',
                            code: reg.studentCode || reg.student?.studentCode,
                            email: reg.student?.email
                        });
                    }
                });
            }

            const previewList = Array.from(uniqueStudents.values()).slice(0, 10);
            return {
                totalCount: uniqueStudents.size,
                previewList
            };
        } catch (error) {
            console.error('Error previewing series recipients:', error);
            return { totalCount: 0, previewList: [] };
        }
    },

    /**
     * Preview recipients cho class
     */
    previewClassRecipients: async (
        classId: number
    ): Promise<{ totalCount: number; previewList: Array<{ id: number; name: string; code?: string; email?: string }> }> => {
        try {
            const students = await recipientService.getStudentsInClass(classId);
            const previewList = students.slice(0, 10).map((student) => ({
                id: student.id,
                name: student.fullName || 'N/A',
                code: student.studentCode,
                email: student.email
            }));

            return {
                totalCount: students.length,
                previewList
            };
        } catch (error) {
            console.error('Error previewing class recipients:', error);
            return { totalCount: 0, previewList: [] };
        }
    },

    /**
     * Preview recipients cho department
     */
    previewDepartmentRecipients: async (
        departmentId: number
    ): Promise<{ totalCount: number; previewList: Array<{ id: number; name: string; code?: string; email?: string }> }> => {
        try {
            const result = await recipientService.getStudentsByDepartment(departmentId, 0, 10);
            const previewList = result.content.map((student) => ({
                id: student.id,
                name: student.fullName || 'N/A',
                code: student.studentCode,
                email: student.email
            }));

            return {
                totalCount: result.totalElements,
                previewList
            };
        } catch (error) {
            console.error('Error previewing department recipients:', error);
            return { totalCount: 0, previewList: [] };
        }
    }
};

