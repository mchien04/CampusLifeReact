import api from './api';
import {
    StudentClass,
    CreateClassRequest,
    UpdateClassRequest,
    ClassStudent,
    AddStudentToClassRequest,
    ClassFilters,
    ClassListResponse
} from '../types/class';
import { Response, StudentListResponse, StudentResponse } from '../types';

export const classAPI = {
    // Lấy danh sách tất cả lớp học
    getClasses: async (filters?: ClassFilters): Promise<ClassListResponse> => {
        const response = await api.get('/api/classes');
        const classes = response.data.body || [];

        // Filter by department if specified
        let filteredClasses = classes;
        if (filters?.departmentId) {
            filteredClasses = classes.filter((cls: any) => cls.department?.id === filters.departmentId);
        }

        // Filter by search if specified
        if (filters?.search) {
            const searchTerm = filters.search.toLowerCase();
            filteredClasses = filteredClasses.filter((cls: any) =>
                cls.className?.toLowerCase().includes(searchTerm) ||
                cls.description?.toLowerCase().includes(searchTerm)
            );
        }

        // Simple pagination
        const page = filters?.page || 0;
        const size = filters?.size || 10;
        const startIndex = page * size;
        const endIndex = startIndex + size;
        const paginatedClasses = filteredClasses.slice(startIndex, endIndex);

        return {
            content: paginatedClasses,
            totalElements: filteredClasses.length,
            totalPages: Math.ceil(filteredClasses.length / size),
            number: page,
            size: size,
            first: page === 0,
            last: page >= Math.ceil(filteredClasses.length / size) - 1
        };
    },

    // Lấy lớp theo khoa
    getClassesByDepartment: async (departmentId: number): Promise<StudentClass[]> => {
        const response = await api.get(`/api/classes/department/${departmentId}`);
        return response.data.body;
    },

    // Lấy chi tiết lớp học
    getClassById: async (classId: number): Promise<StudentClass> => {
        const response = await api.get(`/api/classes/${classId}`);
        return response.data.body;
    },

    // Tạo lớp học mới
    createClass: async (data: CreateClassRequest): Promise<StudentClass> => {
        const formData = new FormData();
        formData.append('className', data.name);
        if (data.description) {
            formData.append('description', data.description);
        }
        formData.append('departmentId', data.departmentId.toString());

        const response = await api.post('/api/classes', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.body;
    },

    // Cập nhật lớp học
    updateClass: async (classId: number, data: UpdateClassRequest): Promise<StudentClass> => {
        const formData = new FormData();
        formData.append('className', data.name);
        if (data.description) {
            formData.append('description', data.description);
        }

        const response = await api.put(`/api/classes/${classId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.body;
    },

    // Xóa lớp học
    deleteClass: async (classId: number): Promise<void> => {
        await api.delete(`/api/classes/${classId}`);
    },

    // Lấy danh sách sinh viên trong lớp (old method - deprecated)
    getClassStudents: async (classId: number): Promise<ClassStudent[]> => {
        const response = await api.get(`/api/classes/${classId}/students`);
        console.log('🔍 getClassStudents response:', response.data);

        // Handle different response structures
        if (response.data.body) {
            return response.data.body;
        } else if (Array.isArray(response.data)) {
            return response.data;
        } else {
            console.warn('Unexpected response format:', response.data);
            return [];
        }
    },

    // Lấy danh sách sinh viên trong lớp (new method với StudentResponse DTO)
    getStudentsInClass: async (classId: number): Promise<Response<StudentResponse[]>> => {
        const response = await api.get(`/api/classes/${classId}/students`);
        console.log('🔍 getStudentsInClass response:', response.data);
        return { status: response.data.status, message: response.data.message, data: response.data.body };
    },

    // Thêm sinh viên vào lớp
    addStudentToClass: async (classId: number, data: AddStudentToClassRequest): Promise<ClassStudent> => {
        const response = await api.post(`/api/classes/${classId}/students/${data.studentId}`, {});
        return response.data.body;
    },

    // Xóa sinh viên khỏi lớp
    removeStudentFromClass: async (classId: number, studentId: number): Promise<void> => {
        await api.delete(`/api/classes/${classId}/students/${studentId}`);
    },
};
