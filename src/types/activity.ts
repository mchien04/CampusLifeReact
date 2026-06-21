import { Department } from './admin';
import { User } from './auth';

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

export enum ScoreRuleTrigger {
    PARTICIPATION_COMPLETED = 'PARTICIPATION_COMPLETED',
    NO_SHOW = 'NO_SHOW',
    SUBMISSION_GRADED = 'SUBMISSION_GRADED',
    MINIGAME_PASSED = 'MINIGAME_PASSED',
    SERIES_MILESTONE_REACHED = 'SERIES_MILESTONE_REACHED',
    TASK_OVERDUE = 'TASK_OVERDUE'
}

export enum ScoreRuleCalculation {
    FIXED_POINTS = 'FIXED_POINTS',
    COUNT_COMPLETION = 'COUNT_COMPLETION',
    PASS_FAIL_POINTS = 'PASS_FAIL_POINTS',
    PENALTY_POINTS = 'PENALTY_POINTS',
    SERIES_MILESTONE = 'SERIES_MILESTONE'
}

export enum ScoreRuleAudience {
    ALL_PARTICIPANTS = 'ALL_PARTICIPANTS',
    DEPARTMENT_ONLY = 'DEPARTMENT_ONLY',
    OUTSIDE_DEPARTMENTS_ONLY = 'OUTSIDE_DEPARTMENTS_ONLY'
}

export enum ScoreSemesterPolicy {
    ACTIVITY_SEMESTER = 'ACTIVITY_SEMESTER',
    CURRENT_OPEN_SEMESTER = 'CURRENT_OPEN_SEMESTER',
    EXPLICIT_SEMESTER = 'EXPLICIT_SEMESTER'
}

export interface ActivityScoreRuleRequest {
    scoreType: ScoreType;
    triggerType: ScoreRuleTrigger;
    calculation: ScoreRuleCalculation;
    points: string;
    failPoints?: string | null;
    audience: ScoreRuleAudience;
    semesterPolicy: ScoreSemesterPolicy;
    explicitSemesterId?: number | null;
    departmentIds?: number[];
    enabled?: boolean | null;
}

export interface ActivityScoreRuleResponse {
    id: number;
    activityId: number;
    scoreType: ScoreType;
    triggerType: ScoreRuleTrigger;
    calculation: ScoreRuleCalculation;
    points: string;
    failPoints?: string | null;
    audience: ScoreRuleAudience;
    semesterPolicy: ScoreSemesterPolicy;
    explicitSemesterId?: number | null;
    targetDepartmentIds: number[];
    enabled?: boolean | null;
}

export interface CreateActivityRequest {
    name: string;
    type: ActivityType;
    description?: string | null;
    startDate: string;
    endDate: string;
    requiresSubmission?: boolean | null;
    scoreRules?: ActivityScoreRuleRequest[];
    registrationStartDate?: string | null;
    registrationDeadline?: string | null;
    shareLink?: string | null;
    isImportant?: boolean | null;
    isDraft?: boolean | null;
    bannerUrl?: string | null;
    bannerFile?: File; // Frontend only
    location?: string | null;
    ticketQuantity?: number | null;
    benefits?: string | null;
    requirements?: string | null;
    contactInfo?: string | null;
    requiresApproval?: boolean | null;
    mandatoryForFacultyStudents?: boolean | null;
    organizerIds?: number[];
    
    // Legacy transition fields
    scoreType?: ScoreType;}

export interface ActivityResponse {
    id: number;
    name: string;
    type: ActivityType;
    description?: string | null;
    startDate: string;
    endDate: string;
    hasPreparation: boolean;
    requiresSubmission: boolean;
    scoreRules: ActivityScoreRuleResponse[];
    registrationStartDate?: string | null;
    registrationDeadline?: string | null;
    shareLink?: string | null;
    isImportant: boolean;
    isDraft: boolean;
    draft?: boolean; // API returns this field name
    bannerUrl?: string | null;
    location?: string | null;
    ticketQuantity?: number | null;
    benefits?: string | null;
    requirements?: string | null;
    contactInfo?: string | null;
    checkInCode?: string | null;
    requiresApproval: boolean;
    mandatoryForFacultyStudents: boolean;
    organizerIds: number[];
    seriesId?: number | null;
    seriesOrder?: number | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    createdBy?: string | null;
    lastModifiedBy?: string | null;
    status?: string;
    participantCount?: number;

    // Legacy transition fields
    scoreType?: ScoreType | null;}

// Keeping legacy interface that is used across the app until fully removed
export interface Activity {
    id: number;
    name: string;
    description?: string;
    type: string;
    location?: string;
    startDate: string;
    endDate: string;
    registrationDeadline: string;
    maxParticipants?: number;
    currentParticipants: number;
    isImportant: boolean;
    bannerUrl?: string;
    requiresSubmission: boolean;    ticketQuantity?: number;
    mandatoryForFacultyStudents: boolean;
    department: Department;
    createdBy: User;
    createdAt: string;
    updatedAt: string;
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
