

export interface CreateActivityRequest {
    name: string;
    type: ActivityType;
    scoreType: ScoreType;
    description?: string;
    startDate: string;
    endDate: string;
    requiresSubmission: boolean;
    maxPoints?: number;
    penaltyPointsIncomplete?: number;
    registrationStartDate?: string;
    registrationDeadline?: string;
    shareLink?: string;
    isImportant: boolean;
    bannerUrl?: string;
    bannerFile?: File; // Add support for file upload
    location: string;
    ticketQuantity?: number;
    benefits?: string;
    requirements?: string;
    contactInfo?: string;
    mandatoryForFacultyStudents: boolean;
    organizerIds: number[];
}

export interface ActivityResponse {
    id: number;
    name: string;
    type: ActivityType;
    scoreType: ScoreType;
    description?: string;
    startDate: string;
    endDate: string;
    requiresSubmission: boolean;
    maxPoints?: number;
    penaltyPointsIncomplete?: number;
    registrationStartDate?: string;
    registrationDeadline?: string;
    shareLink?: string;
    isImportant: boolean;
    bannerUrl?: string;
    location: string;
    ticketQuantity?: number;
    benefits?: string;
    requirements?: string;
    contactInfo?: string;
    mandatoryForFacultyStudents: boolean;
    organizerIds: number[];
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

export enum ScoreType {
    REN_LUYEN = 'REN_LUYEN',
    CONG_TAC_XA_HOI = 'CONG_TAC_XA_HOI',
    CHUYEN_DE = 'CHUYEN_DE',
    KHAC = 'KHAC'
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
