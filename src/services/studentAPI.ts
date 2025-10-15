import api from './api';
import { Response } from '../types/auth';
import {
    Student,
    StudentResponse,
    UpdateStudentProfileRequest,
    StudentFilters,
    StudentListResponse,
    StudentProfileResponse
} from '../types/student';

export const studentAPI = {
    // Lấy thông tin profile sinh viên hiện tại
    getMyProfile: async (): Promise<StudentProfileResponse> => {
        const response = await api.get('/api/student/profile');
        if (response.data.status && response.data.body) {
            return response.data.body;
        }
        throw new Error(response.data.message || 'Failed to get profile');
    },

    // Cập nhật profile sinh viên
    updateMyProfile: async (data: UpdateStudentProfileRequest): Promise<StudentProfileResponse> => {
        const response = await api.put('/api/student/profile', data);
        return response.data.body;
    },

    // Lấy profile sinh viên theo ID (Admin/Manager)
    getStudentProfile: async (studentId: number): Promise<Student> => {
        const response = await api.get(`/api/student/profile/${studentId}`);
        return response.data.body;
    },

    // Lấy danh sách tất cả sinh viên (có phân trang)
    getAllStudents: async (page: number = 0, size: number = 20, sortBy: string = 'id', sortDir: string = 'asc'): Promise<Response<StudentListResponse>> => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('size', size.toString());
        params.append('sortBy', sortBy);
        params.append('sortDir', sortDir);

        const response = await api.get(`/api/students?${params.toString()}`);
        return { status: response.data.status, message: response.data.message, data: response.data.body };
    },

    // Tìm kiếm sinh viên theo tên hoặc mã sinh viên
    searchStudents: async (keyword: string, page: number = 0, size: number = 20): Promise<Response<StudentListResponse>> => {
        const params = new URLSearchParams();
        params.append('keyword', keyword);
        params.append('page', page.toString());
        params.append('size', size.toString());

        const response = await api.get(`/api/students/search?${params.toString()}`);
        return { status: response.data.status, message: response.data.message, data: response.data.body };
    },

    // Lấy sinh viên chưa có lớp
    getStudentsWithoutClass: async (page: number = 0, size: number = 20): Promise<Response<StudentListResponse>> => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('size', size.toString());

        const response = await api.get(`/api/students/without-class?${params.toString()}`);
        return { status: response.data.status, message: response.data.message, data: response.data.body };
    },

    // Lấy sinh viên theo khoa
    getStudentsByDepartment: async (departmentId: number, page: number = 0, size: number = 20): Promise<Response<StudentListResponse>> => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('size', size.toString());

        const response = await api.get(`/api/students/department/${departmentId}?${params.toString()}`);
        return { status: response.data.status, message: response.data.message, data: response.data.body };
    },

    // Lấy thông tin sinh viên theo ID
    getStudentById: async (studentId: number): Promise<Student> => {
        const response = await api.get(`/api/students/${studentId}`);
        return response.data.body;
    },

    // Lấy thông tin sinh viên theo username
    getStudentByUsername: async (username: string): Promise<Student> => {
        const response = await api.get(`/api/students/username/${username}`);
        return response.data.body;
    },
};
