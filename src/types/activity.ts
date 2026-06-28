import { Department } from './admin';
import { User } from './auth';
import { QuizConfigRequest } from './minigame';

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
    TASK_OVERDUE = 'TASK_OVERDUE',
    MINIGAME_EXHAUSTED_ATTEMPTS = 'MINIGAME_EXHAUSTED_ATTEMPTS'
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
    EXPLICIT_SEMESTER = 'EXPLICIT_SEMESTER'
}

export interface ActivityPresetConfig {
    primaryScoreType?: ScoreType | null;
    participationPoints?: number | string | null;
    participationFailPoints?: number | string | null; // legacy — PARTICIPATION_COMPLETED descriptor không còn expose (P6.1)
    noShowPenaltyEnabled?: boolean | null;
    noShowPenaltyPoints?: number | string | null;
    noShowPenaltyScoreType?: ScoreType | null;
    submissionPassPoints?: number | string | null;
    submissionFailPoints?: number | string | null;
    submissionFailScoreType?: ScoreType | null; // P6.1: chỉ expose cho enterprise SUBMISSION_GRADED; null → BE fallback về primaryScoreType
    taskOverduePenaltyPoints?: number | string | null;
    taskOverduePenaltyScoreType?: ScoreType | null; // P6.1: optional; null → BE fallback về scoreType chính; enterprise default REN_LUYEN
    minigameExhaustedPenaltyPoints?: number | string | null;
    bonusScoreType?: ScoreType | null;
    bonusPoints?: number | string | null;
    audience?: ScoreRuleAudience | null;
    semesterPolicy?: ScoreSemesterPolicy | null;
    explicitSemesterId?: number | null;
    departmentIds?: number[] | null;

    // Per-rule overrides (P5.1) — ưu tiên hơn top-level fields
    submissionAudience?: ScoreRuleAudience | null;
    submissionSemesterPolicy?: ScoreSemesterPolicy | null;
    submissionExplicitSemesterId?: number | null;
    submissionDepartmentIds?: number[] | null;

    participationAudience?: ScoreRuleAudience | null;
    participationSemesterPolicy?: ScoreSemesterPolicy | null;
    participationExplicitSemesterId?: number | null;
    participationDepartmentIds?: number[] | null;

    noShowAudience?: ScoreRuleAudience | null;
    noShowSemesterPolicy?: ScoreSemesterPolicy | null;
    noShowExplicitSemesterId?: number | null;
    noShowDepartmentIds?: number[] | null;

    taskOverdueAudience?: ScoreRuleAudience | null;
    taskOverdueSemesterPolicy?: ScoreSemesterPolicy | null;
    taskOverdueExplicitSemesterId?: number | null;
    taskOverdueDepartmentIds?: number[] | null;

    bonusAudience?: ScoreRuleAudience | null;
    bonusSemesterPolicy?: ScoreSemesterPolicy | null;
    bonusExplicitSemesterId?: number | null;
    bonusDepartmentIds?: number[] | null;

    minigamePassedAudience?: ScoreRuleAudience | null;
    minigamePassedSemesterPolicy?: ScoreSemesterPolicy | null;
    minigamePassedExplicitSemesterId?: number | null;
    minigamePassedDepartmentIds?: number[] | null;

    minigameExhaustedAudience?: ScoreRuleAudience | null;
    minigameExhaustedSemesterPolicy?: ScoreSemesterPolicy | null;
    minigameExhaustedExplicitSemesterId?: number | null;
    minigameExhaustedDepartmentIds?: number[] | null;

    /** P6-4: derive từ enabledRules.SUBMISSION_GRADED — true khi rule đó bật. */
    submissionEnabled?: boolean | null;
}

export interface ActivityScoreRuleRequest {
    scoreType: ScoreType;
    failScoreType?: ScoreType | null; // P6.1: loại điểm khi fail; null → fallback về scoreType
    triggerType: ScoreRuleTrigger;
    calculation: ScoreRuleCalculation;
    points: number;
    failPoints?: number | null;
    audience: ScoreRuleAudience;
    semesterPolicy: ScoreSemesterPolicy;
    explicitSemesterId?: number | null;
    departmentIds?: number[];
    enabled?: boolean | null;
    /** true nếu rule do preset sinh ra (KHÔNG gửi kèm `scoreRules` khi dùng preset thật). */
    isPresetGenerated?: boolean | null;
}

export interface ActivityScoreRuleResponse {
    id: number;
    activityId: number;
    scoreType: ScoreType;
    failScoreType?: ScoreType | null; // P6.1
    triggerType: ScoreRuleTrigger;
    calculation: ScoreRuleCalculation;
    points: number;
    failPoints?: number | null;
    audience: ScoreRuleAudience;
    semesterPolicy: ScoreSemesterPolicy;
    explicitSemesterId?: number | null;
    targetDepartmentIds: number[];
    enabled?: boolean | null;
    /** true nếu rule do preset sinh ra — dùng để hiển thị badge "Mẫu" trên UI. */
    isPresetGenerated?: boolean | null;
}

export interface StandardActivityCreateRequest {
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
    presetCode?: string | null;
    presetConfig?: ActivityPresetConfig | null;
}

export interface MinigameActivityCreateRequest {
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
    presetCode?: string | null;
    presetConfig?: ActivityPresetConfig | null;
    quiz?: QuizConfigRequest;
}

export interface StandardActivityUpdateRequest {
    name: string;
    type?: ActivityType | null;
    description?: string | null;
    startDate: string;
    endDate: string;
    location?: string | null;
    requiresSubmission?: boolean | null;
    scoreRules?: ActivityScoreRuleRequest[];
    registrationStartDate?: string | null;
    registrationDeadline?: string | null;
    shareLink?: string | null;
    isImportant?: boolean | null;
    isDraft?: boolean | null;
    bannerUrl?: string | null;
    ticketQuantity?: number | null;
    benefits?: string | null;
    requirements?: string | null;
    contactInfo?: string | null;
    requiresApproval?: boolean | null;
    mandatoryForFacultyStudents?: boolean | null;
    organizerIds?: number[];
    presetCode?: string | null;
    presetConfig?: ActivityPresetConfig | null;
}

// Standalone update request per backend contract (no extends)
// IMPORTANT: The activity `id` is provided in the URL path; do NOT include it in the request body.
export interface MinigameActivityUpdateRequest {
    name?: string | null;
    description?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    location?: string | null;
    organizerIds?: number[];
    requiresApproval?: boolean | null;
    ticketQuantity?: number | null;
    isImportant?: boolean | null;
    mandatoryForFacultyStudents?: boolean | null;
    isDraft?: boolean | null;
    registrationStartDate?: string | null;
    registrationDeadline?: string | null;
    bannerUrl?: string | null;
    shareLink?: string | null;
    scoreRules?: ActivityScoreRuleRequest[];
    presetCode?: string | null;
    presetConfig?: ActivityPresetConfig | null;
    quiz?: import('./minigame').QuizConfigRequest | null;
}

export interface StandardActivityResponse {
    id: number;
    name: string;
    type: ActivityType;
    description?: string | null;
    startDate: string;
    endDate: string;
    location?: string | null;
    organizerIds: number[];
    registrationStartDate?: string | null;
    registrationDeadline?: string | null;
    hasPreparation: boolean;
    requiresSubmission: boolean;
    requiresApproval: boolean;
    ticketQuantity?: number | null;
    isImportant: boolean;
    mandatoryForFacultyStudents: boolean;
    isDraft: boolean;
    bannerUrl?: string | null;
    shareLink?: string | null;
    benefits?: string | null;
    requirements?: string | null;
    contactInfo?: string | null;
    checkInCode?: string | null;
    scoreRules: ActivityScoreRuleResponse[];
    presetCode?: string | null;
    presetConfig?: ActivityPresetConfig | null;
    activeScoreEntryCount?: number;
    createdAt?: string | null;
    updatedAt?: string | null;
    createdBy?: string | null;
    lastModifiedBy?: string | null;
}

export interface MinigameActivityResponse {
    id: number;
    name: string;
    type: ActivityType; // Always MINIGAME
    description?: string | null;
    startDate: string;
    endDate: string;
    isDraft: boolean;
    bannerUrl?: string | null;
    shareLink?: string | null;
    isImportant: boolean;
    mandatoryForFacultyStudents?: boolean;
    checkInCode?: string | null;
    location?: string | null;
    organizerIds?: number[];
    ticketQuantity?: number | null;
    requiresApproval?: boolean;
    scoreRules: ActivityScoreRuleResponse[];
    presetCode?: string | null;
    presetConfig?: ActivityPresetConfig | null;
    activeScoreEntryCount?: number;
    quiz?: {
        id: number;
        title: string;
        description?: string | null;
        questionCount: number;
        timeLimit: number;
        requiredCorrectAnswers: number;
        maxAttempts: number;
        showAnswers: boolean;
        isActive: boolean;
    } | null;
    createdAt?: string | null;
    updatedAt?: string | null;
}

export interface SeriesChildActivityCreateRequest {
    name: string;
    description?: string | null;
    startDate: string;
    endDate: string;
    location?: string | null;
    order?: number | null; // seriesOrder
    bannerUrl?: string | null;
    shareLink?: string | null;
    benefits?: string | null;
    requirements?: string | null;
    contactInfo?: string | null;
    organizerIds?: number[];
    type: ActivityType;
}

// Standalone update request per backend contract (no extends, no type field)
// IMPORTANT: The activity `id` is provided in the URL path; do NOT include it in the request body.
export interface SeriesChildActivityUpdateRequest {
    name: string;
    description?: string | null;
    startDate: string;
    endDate: string;
    location?: string | null;
    order?: number | null;
    bannerUrl?: string | null;
    shareLink?: string | null;
    benefits?: string | null;
    requirements?: string | null;
    contactInfo?: string | null;
    organizerIds?: number[];
}

export interface SeriesChildActivityResponse {
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
    seriesName?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    createdBy?: string | null;
    lastModifiedBy?: string | null;
}


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
    important?: boolean; // API may return this field name
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
    presetCode?: string | null;
    presetConfig?: ActivityPresetConfig | null;
    activeScoreEntryCount?: number;
    createdAt?: string | null;
    updatedAt?: string | null;
    createdBy?: string | null;
    lastModifiedBy?: string | null;
    status?: string;
    participantCount?: number;
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
