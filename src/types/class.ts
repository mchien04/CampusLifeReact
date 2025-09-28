export interface ClassDepartment {
    id: number;
    name: string;
    description?: string;
    type: 'ACADEMIC' | 'ADMINISTRATIVE' | 'SUPPORT';
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface StudentClass {
    id: number;
    className: string;
    description?: string;
    department: ClassDepartment;
    studentCount?: number;
    students?: any[]; // Students array từ backend (optional)
    createdAt: string;
    updatedAt: string;
}

export interface CreateClassRequest {
    name: string;
    description?: string;
    departmentId: number;
}

export interface UpdateClassRequest {
    name: string;
    description?: string;
    departmentId: number;
}

export interface ClassStudent {
    id: number;
    studentCode: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    profileImageUrl?: string;
    addedAt: string;
}

export interface AddStudentToClassRequest {
    studentId: number;
}

export interface ClassFilters {
    departmentId?: number;
    search?: string;
    page?: number;
    size?: number;
}

export interface ClassListResponse {
    content: StudentClass[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
}
