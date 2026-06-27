import { ActivityType, ScoreType, ActivityScoreRuleRequest, ActivityPresetConfig } from './activity';

export type ActivityPresetCode =
    | "EVENT_BASIC"
    | "EVENT_WITH_SUBMISSION"
    | "ENTERPRISE_SEMINAR_BASIC"
    | "ENTERPRISE_SEMINAR_WITH_BONUS"
    | "MINIGAME_PASS_ONLY"
    | "CUSTOM";

export type SeriesPresetCode =
    | "SERIES_MILESTONE_BASIC"
    | "ENTERPRISE_SERIES"
    | "CUSTOM";

export type InputType = 'NUMBER' | 'BOOLEAN' | 'SELECT' | 'MAP';
export type VisibilityType = 'ALWAYS' | 'rule_enabled';

export interface FieldDefinition {
    fieldName: string;
    label: string;
    inputType: InputType;
    required: boolean;
    defaultValue: any;
    visibility: VisibilityType;
    options?: string[];
}

export interface PresetRuleDescriptor {
    ruleKey: string;
    label: string;
    description: string;
    required: boolean;
    enabledByDefault: boolean;
    fieldDefinitions: FieldDefinition[];
}

export interface ActivityPresetDefinition {
    code: ActivityPresetCode;
    displayName: string;
    description: string;
    defaultRequiresSubmission: boolean;
    recommendedActivityTypes: ActivityType[];
    notes: string[];
    supportedRules: PresetRuleDescriptor[];
}

export interface SeriesPresetDefinition {
    code: SeriesPresetCode;
    displayName: string;
    description: string;
    notes: string[];
    supportedRules: PresetRuleDescriptor[];
}

export interface ActivityPresetPreviewRequest {
    presetCode: ActivityPresetCode;
    type?: ActivityType | null;
    requiresSubmission?: boolean | null;
    presetConfig?: ActivityPresetConfig | null;
}

export interface ActivityPresetPreviewResponse {
    presetCode: ActivityPresetCode;
    activityType: ActivityType;
    requiresSubmission: boolean;
    scoreRules: ActivityScoreRuleRequest[];
    notes: string[];
}

export interface SeriesPresetConfig {
    primaryScoreType?: ScoreType | null;
    milestonePoints?: Record<number, number> | null;
    minimumRequirementEnabled?: boolean | null;
    minimumRequiredEvents?: number | null;
    minimumPenaltyPoints?: number | string | null;
}

export interface SeriesPresetPreviewRequest {
    presetCode: SeriesPresetCode;
    presetConfig?: SeriesPresetConfig | null;
}

export interface SeriesPresetPreviewResponse {
    presetCode: SeriesPresetCode;
    scoreType: ScoreType;
    milestonePoints: Record<number, number>;
    minimumRequirementEnabled?: boolean | null;
    minimumRequiredEvents?: number | null;
    minimumPenaltyPoints?: number | string | null;
    notes: string[];
}
