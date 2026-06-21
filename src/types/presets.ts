import { ActivityType, ScoreType, ActivityScoreRuleRequest } from './activity';

export type ActivityPresetCode =
    | "EVENT_BASIC"
    | "EVENT_WITH_SUBMISSION"
    | "ENTERPRISE_SEMINAR_BASIC"
    | "ENTERPRISE_SEMINAR_WITH_BONUS"
    | "MINIGAME_PASS_ONLY"
    | "CUSTOM";

export interface ActivityPresetPreviewResponse {
    presetCode: ActivityPresetCode;
    activityType: ActivityType;
    requiresSubmission: boolean;
    scoreRules: ActivityScoreRuleRequest[];
    notes: string[];
}

export type SeriesPresetCode =
    | "SERIES_MILESTONE_BASIC"
    | "ENTERPRISE_SERIES"
    | "CUSTOM";

export interface SeriesPresetPreviewResponse {
    presetCode: SeriesPresetCode;
    scoreType: ScoreType;
    milestonePoints: Record<number, number>;
    minimumRequirementEnabled?: boolean | null;
    minimumRequiredEvents?: number | null;
    minimumPenaltyPoints?: number | null;
    notes: string[];
}
