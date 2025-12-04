

import { Department } from './admin';
import { User } from './auth';

export interface CreateActivityRequest {
    name: string;
    type: ActivityType;
    scoreType: ScoreType;
    description?: string;
    startDate: string;
    endDate: string;
    requiresSubmission: boolean;
    maxPoints?: string; // Changed to string to match BigDecimal
    penaltyPointsIncomplete?: string; // Changed to string to match BigDecimal
    registrationStartDate?: string;
    registrationDeadline?: string;
    shareLink?: string;
    isImportant: boolean;
    isDraft?: boolean; // default true on backend
    bannerUrl?: string;
    bannerFile?: File; // Add support for file upload
    location: string;
    ticketQuantity?: number;
    benefits?: string;
    requirements?: string;
    contactInfo?: string;
    requiresApproval?: boolean; // default true on backend
    mandatoryForFacultyStudents: boolean;
    organizerIds: number[];
}

// New Activity interface matching backend
export interface Activity {
    id: number;
    name: string;
    description?: string;
    type: 'ACADEMIC' | 'CULTURAL' | 'SPORTS' | 'SOCIAL' | 'OTHER';
    location?: string;
    startDate: string;
    endDate: string;
    registrationDeadline: string;
    maxParticipants?: number;
    currentParticipants: number;
    isImportant: boolean;
    bannerUrl?: string;
    requiresSubmission: boolean;
    maxPoints?: number;
    ticketQuantity?: number;
    mandatoryForFacultyStudents: boolean;
    department: Department;
    createdBy: User;
    createdAt: string;
    updatedAt: string;
}

export interface ActivityResponse {
    id: number;
    name: string;
    type: ActivityType | null; // null if belongs to series
    scoreType: ScoreType | null; // null if belongs to series
    description?: string;
    startDate: string;
    endDate: string;
    requiresSubmission: boolean;
    maxPoints?: string | null; // null if belongs to series
    penaltyPointsIncomplete?: string; // Changed to string to match BigDecimal
    registrationStartDate?: string | null; // null if belongs to series
    registrationDeadline?: string | null; // null if belongs to series
    shareLink?: string;
    isImportant: boolean;
    isDraft?: boolean; // Type definition
    draft?: boolean; // API returns this field name
    bannerUrl?: string;
    location: string;
    ticketQuantity?: number | null; // null if belongs to series
    benefits?: string;
    requirements?: string;
    contactInfo?: string;
    checkInCode?: string; // QR code for check-in
    requiresApproval: boolean;
    mandatoryForFacultyStudents: boolean;
    organizerIds: number[];
    status?: string;
    participantCount?: number;
    createdAt: string;
    updatedAt: string;
    createdBy?: string;
    lastModifiedBy?: string;
    seriesId?: number | null; // ID of series if belongs to one
    seriesOrder?: number | null; // Order in series
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
    CHUYEN_DE = 'CHUYEN_DE'
}

export interface ActivityPhotoResponse {
    id: number;
    activityId: number;
    imageUrl: string;
    caption?: string;
    displayOrder: number;
    uploadedBy: string;
    createdAt: string;
}

