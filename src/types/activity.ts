import { Department } from './admin';
import { User } from './auth';
import { MiniGameConfig } from "./minigame";

export enum ActivityType {
    SUKIEN = "SUKIEN",
    MINIGAME = "MINIGAME",
    SERIES_BONUS = "SERIES_BONUS",
    CONG_TAC_XA_HOI = "CONG_TAC_XA_HOI",
    CHUYEN_DE_DOANH_NGHIEP = "CHUYEN_DE_DOANH_NGHIEP",
}

export enum ScoreType {
    REN_LUYEN = "REN_LUYEN",
    CONG_TAC_XA_HOI = "CONG_TAC_XA_HOI",
    CHUYEN_DE = "CHUYEN_DE",
    KHAC = "KHAC",
}

export interface SeriesConfig {
    requiredParticipationCount: number;
    bonusPoints: number;
}



export interface CreateActivityRequest {

    id?: number;
    name: string;
    type: ActivityType;
    scoreType: ScoreType;
    description?: string;
    startDate: string;
    endDate: string;
    requiresSubmission: boolean;
    maxPoints?: string;
    penaltyPointsIncomplete?: string;
    registrationStartDate?: string;
    registrationDeadline?: string;
    shareLink?: string;
    isImportant?: boolean;
    bannerUrl?: string;
    location?: string;
    ticketQuantity?: number;
    benefits?: string;
    requirements?: string;
    contactInfo?: string;
    mandatoryForFacultyStudents?: boolean;
    organizerIds?: number[];
    requiredCorrectAnswers?:number;
    miniGameConfig?: any;
    miniGameTitle?: string;
    miniGameDescription?: string;
    miniGameQuestionCount?: number;
    miniGameTimeLimit?: number;
    miniGameRewardPoints?: number;
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
    maxPoints?: string;
    penaltyPointsIncomplete?: string;
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
export interface ActivitySeries {
    id: number;
    name: string;
    description?: string;
    totalActivities?: number;
    requiredParticipationCount?: number;
    bonusPoints?: number;
    startDate?: string;
    endDate?: string;
    mandatory?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

