

export interface CreateActivityRequest {
    name: string;
    type: ActivityType;
    description?: string;
    startDate: string;
    endDate: string;
    departmentId: number;
    requiresSubmission: boolean;
    maxPoints?: number;
    registrationDeadline?: string;
    shareLink?: string;
    isImportant: boolean;
    bannerUrl?: string;
    bannerFile?: File; // Add support for file upload
    location: string;
}

export interface ActivityResponse {
    id: number;
    name: string;
    type: ActivityType;
    description?: string;
    startDate: string;
    endDate: string;
    departmentId: number;
    departmentName?: string;
    requiresSubmission: boolean;
    maxPoints?: number;
    registrationDeadline?: string;
    shareLink?: string;
    isImportant: boolean;
    bannerUrl?: string;
    location: string;
    status?: string;
    participantCount?: number;
    createdAt: string;
    updatedAt: string;
    createdBy?: string;
    lastModifiedBy?: string;
}

export enum ActivityType {
    SUKIEN = 'SUKIEN',
    MINIGAME = 'MINIGAME',
    CONG_TAC_XA_HOI = 'CONG_TAC_XA_HOI',
    CHUYEN_DE_DOANH_NGHIEP = 'CHUYEN_DE_DOANH_NGHIEP'
}

export interface Department {
    id: number;
    name: string;
    type: DepartmentType;
    description?: string;
}

export enum DepartmentType {
    PHONG_BAN = 'PHONG_BAN',
    KHOA = 'KHOA'
}
