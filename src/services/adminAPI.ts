import api from './api';
import { Response } from '../types/auth';
import {
    Department, CreateDepartmentRequest, UpdateDepartmentRequest,
    AcademicYear, CreateAcademicYearRequest, UpdateAcademicYearRequest,
    Semester, CreateSemesterRequest, UpdateSemesterRequest,
    CriteriaGroup, CreateCriteriaGroupRequest, UpdateCriteriaGroupRequest,
    CriteriaItem, CreateCriteriaItemRequest, UpdateCriteriaItemRequest
} from '../types/admin';

// Department API
export const departmentAPI = {
    getDepartments: async (): Promise<Response<Department[]>> => {
        try {
            const response = await api.get('/api/admin/departments');
            return {
                status: response.data.status,
                message: response.data.message,
                data: response.data.body || response.data.data
            };
        } catch (error: any) {
            console.error('Department API: getDepartments failed:', error);
            return { status: false, message: 'Failed to fetch departments', data: [] };
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
