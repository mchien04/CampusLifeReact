import { User } from './auth';
import { StudentClass } from './class';
import { Address } from './address';

// DTO Response từ backend - tránh overfetching và lộ thông tin nhạy cảm
export interface StudentResponse {
    id: number;
    studentCode: string;
    fullName: string;
    email: string;
    phone: string;
    dob: string; // LocalDate từ backend
    avatarUrl?: string;
    departmentName?: string;
    className?: string;
    address?: string; // Địa chỉ đã format sẵn
    createdAt: string;
    updatedAt: string;
}

// Entity đầy đủ cho internal use
export interface Student {
    id: number;
    userId: number;
    studentCode: string;
    fullName: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    profileImageUrl?: string;
    isProfileComplete: boolean;
    studentClass: StudentClass;
    address?: Address;
    user: User;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateStudentProfileRequest {
    fullName: string;
    studentCode: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    profileImageUrl?: string;
    departmentId: number;
    classId: number;
}

export interface StudentFilters {
    departmentId?: number;
    classId?: number;
    search?: string;
    page?: number;
    size?: number;
}

export interface StudentListResponse {
    content: StudentResponse[]; // Sử dụng StudentResponse DTO thay vì Student entity
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
}

export const GENDER_OPTIONS = [
    { value: 'MALE', label: 'Nam' },
    { value: 'FEMALE', label: 'Nữ' },
    { value: 'OTHER', label: 'Khác' },
] as const;

export const getGenderLabel = (gender?: string): string => {
    switch (gender) {
        case 'MALE':
            return 'Nam';
        case 'FEMALE':
            return 'Nữ';
        case 'OTHER':
            return 'Khác';
        default:
            return 'Chưa cập nhật';
    }
};
