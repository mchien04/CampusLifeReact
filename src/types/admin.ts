// Department Management Types
export interface Department {
    id: number;
    name: string;
    type: DepartmentType;
    description?: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    lastModifiedBy: string;
}

export enum DepartmentType {
    KHOA = 'KHOA',
    PHONG_BAN = 'PHONG_BAN'
}

export interface CreateDepartmentRequest {
    name: string;
    type: DepartmentType;
    description?: string;
}

export interface UpdateDepartmentRequest {
    name?: string;
    type?: DepartmentType;
    description?: string;
}

// Academic Year Management Types
export interface AcademicYear {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    lastModifiedBy: string;
}

export interface CreateAcademicYearRequest {
    name: string;
    startDate: string;
    endDate: string;
}

export interface UpdateAcademicYearRequest {
    name?: string;
    startDate?: string;
    endDate?: string;
}

// Semester Management Types
export interface Semester {
    id: number;
    yearId: number;
    yearName?: string; // For display
    name: string;
    startDate: string;
    endDate: string;
    open: boolean;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    lastModifiedBy: string;
}

export interface CreateSemesterRequest {
    yearId: number;
    name: string;
    startDate: string;
    endDate: string;
    open: boolean;
}

export interface UpdateSemesterRequest {
    yearId?: number;
    name?: string;
    startDate?: string;
    endDate?: string;
    open?: boolean;
}

// Criteria Group Management Types
export interface CriteriaGroup {
    id: number;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    lastModifiedBy: string;
}

export interface CreateCriteriaGroupRequest {
    name: string;
    description?: string;
}

export interface UpdateCriteriaGroupRequest {
    name?: string;
    description?: string;
}

// Criteria Item Management Types
export interface CriteriaItem {
    id: number;
    groupId: number;
    groupName?: string; // For display
    name: string;
    maxScore: number;
    minScore: number;
    departmentId?: number;
    departmentName?: string; // For display
    description?: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    lastModifiedBy: string;
}

export interface CreateCriteriaItemRequest {
    groupId: number;
    name: string;
    maxScore: number;
    minScore: number;
    departmentId?: number;
    description?: string;
}

export interface UpdateCriteriaItemRequest {
    groupId?: number;
    name?: string;
    maxScore?: number;
    minScore?: number;
    departmentId?: number;
    description?: string;
}
