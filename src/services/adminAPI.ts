import api from './api';
import { Response, UserResponse, CreateUserRequest, UpdateUserRequest } from '../types/auth';
import {
    Department, CreateDepartmentRequest, UpdateDepartmentRequest,
    AcademicYear, CreateAcademicYearRequest, UpdateAcademicYearRequest,
    Semester, CreateSemesterRequest, UpdateSemesterRequest,
    CriteriaGroup, CreateCriteriaGroupRequest, UpdateCriteriaGroupRequest,
    CriteriaItem, CreateCriteriaItemRequest, UpdateCriteriaItemRequest
} from '../types/admin';
import {
    ExcelStudentRow,
    UploadExcelResponse,
    BulkCreateStudentsRequest,
    StudentAccountResponse,
    UpdateStudentAccountRequest,
    BulkSendCredentialsRequest,
    BulkCreateResponse,
    BulkSendCredentialsResponse
} from '../types/studentAccount';

// Department API
export const departmentAPI = {
    getDepartments: async (): Promise<Response<Department[]>> => {
        try {
            const response = await api.get('/api/admin/departments');
            console.log('Department API raw response:', response.data);
            
            // Handle different response formats
            let departments: Department[] = [];
            if (response.data) {
                if (Array.isArray(response.data)) {
                    departments = response.data;
                } else if (response.data.body && Array.isArray(response.data.body)) {
                    departments = response.data.body;
                } else if (response.data.data && Array.isArray(response.data.data)) {
                    departments = response.data.data;
                } else if (response.data.content && Array.isArray(response.data.content)) {
                    departments = response.data.content;
                }
            }
            
            return {
                status: response.data?.status !== false,
                message: response.data?.message || 'Departments retrieved successfully',
                data: departments
            };
        } catch (error: any) {
            console.error('Department API: getDepartments failed:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch departments';
            return { status: false, message: errorMessage, data: [] };
        }
    },

    getDepartment: async (id: number): Promise<Response<Department>> => {
        try {
            const response = await api.get(`/api/admin/departments/${id}`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Department API: getDepartment failed:', error);
            return { status: false, message: 'Failed to fetch department', data: undefined };
        }
    },

    createDepartment: async (data: CreateDepartmentRequest): Promise<Response<Department>> => {
        try {
            const response = await api.post('/api/admin/departments', data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Department API: createDepartment failed:', error);
            return { status: false, message: error.response?.data?.message || 'Failed to create department', data: undefined };
        }
    },

    updateDepartment: async (id: number, data: UpdateDepartmentRequest): Promise<Response<Department>> => {
        try {
            const response = await api.put(`/api/admin/departments/${id}`, data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Department API: updateDepartment failed:', error);
            return { status: false, message: error.response?.data?.message || 'Failed to update department', data: undefined };
        }
    },

    deleteDepartment: async (id: number): Promise<Response<void>> => {
        try {
            const response = await api.delete(`/api/admin/departments/${id}`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Department API: deleteDepartment failed:', error);
            return { status: false, message: error.response?.data?.message || 'Failed to delete department', data: undefined };
        }
    }
};

// Academic Year API
export const academicYearAPI = {
    getAcademicYears: async (): Promise<Response<AcademicYear[]>> => {
        try {
            const response = await api.get('/api/admin/academics/years');
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Academic Year API: getAcademicYears failed:', error);
            return { status: false, message: 'Failed to fetch academic years', data: [] };
        }
    },

    getAcademicYear: async (id: number): Promise<Response<AcademicYear>> => {
        try {
            const response = await api.get(`/api/admin/academics/years/${id}`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Academic Year API: getAcademicYear failed:', error);
            return { status: false, message: 'Failed to fetch academic year', data: undefined };
        }
    },

    createAcademicYear: async (data: CreateAcademicYearRequest): Promise<Response<AcademicYear>> => {
        try {
            const response = await api.post('/api/admin/academics/years', data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Academic Year API: createAcademicYear failed:', error);
            return { status: false, message: error.response?.data?.message || 'Failed to create academic year', data: undefined };
        }
    },

    updateAcademicYear: async (id: number, data: UpdateAcademicYearRequest): Promise<Response<AcademicYear>> => {
        try {
            const response = await api.put(`/api/admin/academics/years/${id}`, data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Academic Year API: updateAcademicYear failed:', error);
            return { status: false, message: error.response?.data?.message || 'Failed to update academic year', data: undefined };
        }
    },

    deleteAcademicYear: async (id: number): Promise<Response<void>> => {
        try {
            const response = await api.delete(`/api/admin/academics/years/${id}`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Academic Year API: deleteAcademicYear failed:', error);
            return { status: false, message: error.response?.data?.message || 'Failed to delete academic year', data: undefined };
        }
    }
};

// Semester API
export const semesterAPI = {
    getSemestersByYear: async (yearId: number): Promise<Response<Semester[]>> => {
        try {
            const response = await api.get(`/api/admin/academics/years/${yearId}/semesters`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Semester API: getSemestersByYear failed:', error);
            return { status: false, message: 'Failed to fetch semesters', data: [] };
        }
    },

    getSemester: async (id: number): Promise<Response<Semester>> => {
        try {
            const response = await api.get(`/api/admin/academics/semesters/${id}`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Semester API: getSemester failed:', error);
            return { status: false, message: 'Failed to fetch semester', data: undefined };
        }
    },

    createSemester: async (data: CreateSemesterRequest): Promise<Response<Semester>> => {
        try {
            const response = await api.post('/api/admin/academics/semesters', data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Semester API: createSemester failed:', error);
            return { status: false, message: error.response?.data?.message || 'Failed to create semester', data: undefined };
        }
    },

    updateSemester: async (id: number, data: UpdateSemesterRequest): Promise<Response<Semester>> => {
        try {
            const response = await api.put(`/api/admin/academics/semesters/${id}`, data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Semester API: updateSemester failed:', error);
            return { status: false, message: error.response?.data?.message || 'Failed to update semester', data: undefined };
        }
    },

    deleteSemester: async (id: number): Promise<Response<void>> => {
        try {
            const response = await api.delete(`/api/admin/academics/semesters/${id}`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Semester API: deleteSemester failed:', error);
            return { status: false, message: error.response?.data?.message || 'Failed to delete semester', data: undefined };
        }
    },

    toggleSemester: async (id: number, open: boolean): Promise<Response<Semester>> => {
        try {
            const response = await api.post(`/api/admin/academics/semesters/${id}/toggle?open=${open}`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Semester API: toggleSemester failed:', error);
            return { status: false, message: error.response?.data?.message || 'Failed to toggle semester', data: undefined };
        }
    }
};

// Criteria Group API
export const criteriaGroupAPI = {
    getCriteriaGroups: async (): Promise<Response<CriteriaGroup[]>> => {
        try {
            const response = await api.get('/api/admin/criteria/groups');
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Criteria Group API: getCriteriaGroups failed:', error);
            return { status: false, message: 'Failed to fetch criteria groups', data: [] };
        }
    },

    getCriteriaGroup: async (id: number): Promise<Response<CriteriaGroup>> => {
        try {
            const response = await api.get(`/api/admin/criteria/groups/${id}`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Criteria Group API: getCriteriaGroup failed:', error);
            return { status: false, message: 'Failed to fetch criteria group', data: undefined };
        }
    },

    createCriteriaGroup: async (data: CreateCriteriaGroupRequest): Promise<Response<CriteriaGroup>> => {
        try {
            const response = await api.post('/api/admin/criteria/groups', data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Criteria Group API: createCriteriaGroup failed:', error);
            return { status: false, message: error.response?.data?.message || 'Failed to create criteria group', data: undefined };
        }
    },

    updateCriteriaGroup: async (id: number, data: UpdateCriteriaGroupRequest): Promise<Response<CriteriaGroup>> => {
        try {
            const response = await api.put(`/api/admin/criteria/groups/${id}`, data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Criteria Group API: updateCriteriaGroup failed:', error);
            return { status: false, message: error.response?.data?.message || 'Failed to update criteria group', data: undefined };
        }
    },

    deleteCriteriaGroup: async (id: number): Promise<Response<void>> => {
        try {
            const response = await api.delete(`/api/admin/criteria/groups/${id}`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Criteria Group API: deleteCriteriaGroup failed:', error);
            return { status: false, message: error.response?.data?.message || 'Failed to delete criteria group', data: undefined };
        }
    }
};

// Criteria Item API
export const criteriaItemAPI = {
    getCriteriaItemsByGroup: async (groupId: number): Promise<Response<CriteriaItem[]>> => {
        try {
            const response = await api.get(`/api/admin/criteria/groups/${groupId}/items`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Criteria Item API: getCriteriaItemsByGroup failed:', error);
            return { status: false, message: 'Failed to fetch criteria items', data: [] };
        }
    },

    getCriteriaItem: async (id: number): Promise<Response<CriteriaItem>> => {
        try {
            const response = await api.get(`/api/admin/criteria/items/${id}`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Criteria Item API: getCriteriaItem failed:', error);
            return { status: false, message: 'Failed to fetch criteria item', data: undefined };
        }
    },

    createCriteriaItem: async (data: CreateCriteriaItemRequest): Promise<Response<CriteriaItem>> => {
        try {
            const response = await api.post('/api/admin/criteria/items', data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Criteria Item API: createCriteriaItem failed:', error);
            return { status: false, message: error.response?.data?.message || 'Failed to create criteria item', data: undefined };
        }
    },

    updateCriteriaItem: async (id: number, data: UpdateCriteriaItemRequest): Promise<Response<CriteriaItem>> => {
        try {
            const response = await api.put(`/api/admin/criteria/items/${id}`, data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Criteria Item API: updateCriteriaItem failed:', error);
            return { status: false, message: error.response?.data?.message || 'Failed to update criteria item', data: undefined };
        }
    },

    deleteCriteriaItem: async (id: number): Promise<Response<void>> => {
        try {
            const response = await api.delete(`/api/admin/criteria/items/${id}`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Criteria Item API: deleteCriteriaItem failed:', error);
            return { status: false, message: error.response?.data?.message || 'Failed to delete criteria item', data: undefined };
        }
    }
};

// User Management API
export const userAPI = {
    getUsers: async (role?: 'ADMIN' | 'MANAGER'): Promise<Response<UserResponse[]>> => {
        try {
            const url = role ? `/api/admin/users?role=${role}` : '/api/admin/users';
            const response = await api.get(url);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('User API: getUsers failed:', error);
            return { status: false, message: error.response?.data?.message || 'Failed to fetch users', data: [] };
        }
    },

    getUser: async (userId: number): Promise<Response<UserResponse>> => {
        try {
            const response = await api.get(`/api/admin/users/${userId}`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('User API: getUser failed:', error);
            return { status: false, message: error.response?.data?.message || 'Failed to fetch user', data: undefined };
        }
    },

    createUser: async (data: CreateUserRequest): Promise<Response<UserResponse>> => {
        try {
            const response = await api.post('/api/admin/users', data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('User API: createUser failed:', error);
            return { status: false, message: error.response?.data?.message || 'Failed to create user', data: undefined };
        }
    },

    updateUser: async (userId: number, data: UpdateUserRequest): Promise<Response<UserResponse>> => {
        try {
            const response = await api.put(`/api/admin/users/${userId}`, data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('User API: updateUser failed:', error);
            return { status: false, message: error.response?.data?.message || 'Failed to update user', data: undefined };
        }
    },

    deleteUser: async (userId: number): Promise<Response<void>> => {
        try {
            const response = await api.delete(`/api/admin/users/${userId}`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('User API: deleteUser failed:', error);
            return { status: false, message: error.response?.data?.message || 'Failed to delete user', data: undefined };
        }
    }
};

// Student Account Management API
export const studentAccountAPI = {
    uploadExcel: async (file: File): Promise<Response<UploadExcelResponse>> => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post('/api/admin/students/upload-excel', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Student Account API: uploadExcel failed:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Failed to upload Excel file',
                data: undefined
            };
        }
    },

    bulkCreate: async (data: BulkCreateStudentsRequest): Promise<Response<BulkCreateResponse>> => {
        try {
            const response = await api.post('/api/admin/students/bulk-create', data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Student Account API: bulkCreate failed:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Failed to create student accounts',
                data: undefined
            };
        }
    },

    getPendingAccounts: async (): Promise<Response<StudentAccountResponse[]>> => {
        try {
            const response = await api.get('/api/admin/students/pending');
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Student Account API: getPendingAccounts failed:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Failed to fetch pending accounts',
                data: []
            };
        }
    },

    updateAccount: async (studentId: number, data: UpdateStudentAccountRequest): Promise<Response<StudentAccountResponse>> => {
        try {
            const response = await api.put(`/api/admin/students/${studentId}/account`, data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Student Account API: updateAccount failed:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Failed to update student account',
                data: undefined
            };
        }
    },

    deleteAccount: async (studentId: number): Promise<Response<void>> => {
        try {
            const response = await api.delete(`/api/admin/students/${studentId}/account`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Student Account API: deleteAccount failed:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Failed to delete student account',
                data: undefined
            };
        }
    },

    sendCredentials: async (studentId: number): Promise<Response<void>> => {
        try {
            const response = await api.post(`/api/admin/students/${studentId}/send-credentials`);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Student Account API: sendCredentials failed:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Failed to send credentials',
                data: undefined
            };
        }
    },

    bulkSendCredentials: async (data: BulkSendCredentialsRequest): Promise<Response<BulkSendCredentialsResponse>> => {
        try {
            const response = await api.post('/api/admin/students/bulk-send-credentials', data);
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Student Account API: bulkSendCredentials failed:', error);
            return {
                status: false,
                message: error.response?.data?.message || 'Failed to send credentials',
                data: undefined
            };
        }
    }
};
