import api from './api';
import {
    CreateActivityTaskRequest,
    ActivityTaskResponse,
    TaskAssignmentRequest,
    TaskAssignmentResponse,
    Student
} from '../types/task';
import { Response } from '../types/auth';

export const taskAPI = {
    // Task Management
    createTask: async (data: CreateActivityTaskRequest): Promise<Response<ActivityTaskResponse>> => {
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

    getTaskById: async (taskId: number): Promise<Response<ActivityTaskResponse>> => {
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

    updateTask: async (taskId: number, data: CreateActivityTaskRequest): Promise<Response<ActivityTaskResponse>> => {
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

    deleteTask: async (taskId: number): Promise<Response<void>> => {
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
    assignTask: async (data: TaskAssignmentRequest): Promise<Response<TaskAssignmentResponse[]>> => {
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

    getTaskAssignments: async (taskId: number): Promise<Response<TaskAssignmentResponse[]>> => {
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

    getStudentTasks: async (studentId: number): Promise<Response<TaskAssignmentResponse[]>> => {
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
    }
};
