import api from './api';
import {
    ActivityTask,
    TaskAssignment,
    CreateTaskRequest,
    UpdateTaskRequest,
    AssignTaskRequest,
    UpdateAssignmentStatusRequest,
    TaskFilters,
    TaskListResponse,
    AssignmentListResponse,
    // New interfaces for updated backend
    CreateActivityTaskRequest,
    ActivityTaskResponse,
    TaskAssignmentRequest,
    TaskAssignmentResponse,
    RegisteredStudent,
    TaskDashboardItem,
} from '../types/task';
import { Student } from '../types/student';
import { Response } from '../types/auth';

export const taskAPI = {
    // Original API methods (keeping existing functionality)
    // Lấy danh sách nhiệm vụ
    getTasks: async (filters?: TaskFilters): Promise<TaskListResponse> => {
        const params = new URLSearchParams();
        if (filters?.activityId) params.append('activityId', filters.activityId.toString());
        if (filters?.status) params.append('status', filters.status);
        if (filters?.search) params.append('search', filters.search);
        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.size) params.append('size', filters.size.toString());

        const response = await api.get(`/api/tasks?${params.toString()}`);
        return response.data.body;
    },

    // Lấy chi tiết nhiệm vụ
    getTaskById: async (taskId: number): Promise<ActivityTask> => {
        const response = await api.get(`/api/tasks/${taskId}`);
        return response.data.body;
    },

    // Tạo nhiệm vụ mới
    createTask: async (data: CreateTaskRequest): Promise<ActivityTask> => {
        const response = await api.post('/api/tasks', data);
        return response.data.body;
    },

    // Cập nhật nhiệm vụ
    updateTask: async (taskId: number, data: UpdateTaskRequest): Promise<ActivityTask> => {
        const response = await api.put(`/api/tasks/${taskId}`, data);
        return response.data.body;
    },

    // Xóa nhiệm vụ
    deleteTask: async (taskId: number): Promise<void> => {
        await api.delete(`/api/tasks/${taskId}`);
    },

    // Lấy nhiệm vụ của sinh viên
    getStudentTasks: async (studentId: number): Promise<AssignmentListResponse> => {
        const response = await api.get(`/api/assignments/student/${studentId}`);
        return response.data.body;
    },

    // Lấy nhiệm vụ của sinh viên hiện tại
    getMyTasks: async (): Promise<AssignmentListResponse> => {
        const response = await api.get('/api/assignments/my');
        return response.data.body;
    },

    // Cập nhật trạng thái nhiệm vụ
    updateAssignmentStatus: async (assignmentId: number, data: UpdateAssignmentStatusRequest): Promise<TaskAssignment> => {
        const response = await api.put(`/api/assignments/${assignmentId}/status`, data);
        return response.data.body;
    },

    // Hủy phân công
    removeAssignment: async (assignmentId: number): Promise<void> => {
        await api.delete(`/api/assignments/${assignmentId}`);
    },

    // Phân công nhiệm vụ
    assignTask: async (data: AssignTaskRequest): Promise<TaskAssignment[]> => {
        console.log('🔍 API: assignTask called with data:', data);
        const response = await api.post('/api/tasks/assign', data);
        console.log('🔍 API: assignTask response:', response.data);
        return response.data.body;
    },

    // Lấy danh sách phân công của nhiệm vụ
    getTaskAssignments: async (taskId: number): Promise<AssignmentListResponse> => {
        const response = await api.get(`/api/assignments/task/${taskId}`);
        return response.data.body;
    },

    // New API methods for updated backend
    // Task Management
    createTaskNew: async (data: CreateActivityTaskRequest): Promise<Response<ActivityTaskResponse>> => {
        try {
            const response = await api.post('/api/tasks', data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error creating task:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi tạo nhiệm vụ',
                data: undefined
            };
        }
    },

    getTasksByActivity: async (activityId: number): Promise<Response<ActivityTaskResponse[]>> => {
        try {
            const response = await api.get(`/api/tasks/activity/${activityId}`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error fetching tasks by activity:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi lấy danh sách nhiệm vụ',
                data: undefined
            };
        }
    },

    getTaskDashboard: async (activityId: number): Promise<Response<TaskDashboardItem[]>> => {
        try {
            const response = await api.get(`/api/tasks/activity/${activityId}/dashboard`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error fetching task dashboard:', error);
            const httpStatus = error.response?.status;
            const apiMessage = error.response?.data?.message;
            return {
                status: false,
                message:
                    httpStatus === 403
                        ? (apiMessage || 'Bạn không có quyền xem dashboard nhiệm vụ của sự kiện này')
                        : (apiMessage || 'Có lỗi xảy ra khi lấy dashboard nhiệm vụ'),
                data: undefined
            };
        }
    },

    getTaskByIdNew: async (taskId: number): Promise<Response<ActivityTaskResponse>> => {
        try {
            const response = await api.get(`/api/tasks/${taskId}`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error fetching task:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi lấy thông tin nhiệm vụ',
                data: undefined
            };
        }
    },

    updateTaskNew: async (taskId: number, data: CreateActivityTaskRequest): Promise<Response<ActivityTaskResponse>> => {
        try {
            const response = await api.put(`/api/tasks/${taskId}`, data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error updating task:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật nhiệm vụ',
                data: undefined
            };
        }
    },

    deleteTaskNew: async (taskId: number): Promise<Response<void>> => {
        try {
            const response = await api.delete(`/api/tasks/${taskId}`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error deleting task:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi xóa nhiệm vụ',
                data: undefined
            };
        }
    },

    // Task Assignment Management
    assignTaskNew: async (data: TaskAssignmentRequest): Promise<Response<TaskAssignmentResponse[]>> => {
        try {
            const response = await api.post('/api/tasks/assign', data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error assigning task:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi phân công nhiệm vụ',
                data: undefined
            };
        }
    },

    getTaskAssignmentsNew: async (taskId: number): Promise<Response<TaskAssignmentResponse[]>> => {
        try {
            const response = await api.get(`/api/tasks/${taskId}/assignments`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error fetching task assignments:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi lấy danh sách phân công',
                data: undefined
            };
        }
    },

    getStudentTasksNew: async (studentId: number): Promise<Response<TaskAssignmentResponse[]>> => {
        try {
            const response = await api.get(`/api/assignments/student/${studentId}`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error fetching student tasks:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi lấy nhiệm vụ của sinh viên',
                data: undefined
            };
        }
    },

    updateTaskStatus: async (assignmentId: number, status: string): Promise<Response<TaskAssignmentResponse>> => {
        try {
            const response = await api.put(`/api/assignments/${assignmentId}/status?status=${status}`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error updating task status:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái nhiệm vụ',
                data: undefined
            };
        }
    },

    removeTaskAssignment: async (assignmentId: number): Promise<Response<void>> => {
        try {
            const response = await api.delete(`/api/assignments/${assignmentId}`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error removing task assignment:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi hủy phân công nhiệm vụ',
                data: undefined
            };
        }
    },

    autoAssignMandatoryTasks: async (activityId: number): Promise<Response<void>> => {
        try {
            const response = await api.post(`/api/tasks/auto-assign/${activityId}`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error auto-assigning mandatory tasks:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi tự động phân công nhiệm vụ bắt buộc',
                data: undefined
            };
        }
    },

    // Get registered students for activity
    getRegisteredStudentsForActivity: async (activityId: number): Promise<Response<RegisteredStudent[]>> => {
        try {
            console.log('🔍 API: Fetching registered students for activity:', activityId);
            const response = await api.get(`/api/tasks/activity/${activityId}/registered-students`);
            console.log('🔍 API: Registered students response:', response.data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('🔍 API: Error fetching registered students:', error);
            console.error('🔍 API: Error response:', error.response?.data);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi lấy danh sách sinh viên đăng ký',
                data: undefined
            };
        }
    },

    // Assign task to registered students
    assignTaskToRegisteredStudents: async (activityId: number, taskId: number): Promise<Response<TaskAssignmentResponse[]>> => {
        try {
            const response = await api.post(`/api/tasks/assign-to-registered/${activityId}?taskId=${taskId}`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error assigning task to registered students:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi phân công nhiệm vụ cho sinh viên đăng ký',
                data: undefined
            };
        }
    },

    // Trigger check overdue tasks (Quartz)
    checkOverdueTasks: async (): Promise<Response<{ updatedCount: number }>> => {
        try {
            const response = await api.post('/api/tasks/check-overdue');
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error checking overdue tasks:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái nhiệm vụ quá hạn',
                data: undefined
            };
        }
    },

    // Trigger check overdue tasks for specific task
    checkOverdueTaskById: async (taskId: number): Promise<Response<{ updatedCount: number }>> => {
        try {
            const response = await api.post(`/api/tasks/${taskId}/check-overdue`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Error checking overdue task:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Có lỗi xảy ra khi kiểm tra nhiệm vụ quá hạn',
                data: undefined
            };
        }
    }
};
