import { ActivityType, ScoreType, ActivityScoreRuleRequest, ActivityPresetConfig, ScoreRuleTrigger } from './activity';

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

export type InputType = 'NUMBER' | 'BOOLEAN' | 'SELECT' | 'MAP' | 'MULTI_SELECT';
export type VisibilityType = 'ALWAYS' | 'rule_enabled' | 'audience_department_scoped' | 'semester_policy_explicit';

export interface FieldDefinition {
    fieldName: string;
    label: string;
    inputType: InputType;
    required: boolean;
    defaultValue: any;
    visibility: VisibilityType;
    options?: string[] | null;
    /** P6.1: BE chỉ ra false cho field read-only (vd enterprise participationPoints). */
    editable?: boolean | null;
}

export interface PresetRuleDescriptor {
    ruleKey: string;
    label: string;
    description: string;
    required: boolean;
    enabledByDefault: boolean;
    fieldDefinitions: FieldDefinition[];
    /** P5.2: suggested trigger combinations for CUSTOM mode */
    suggestedCombinations?: ScoreRuleTrigger[];
    /** P6-1: rule keys mà khi bật rule này sẽ tự tắt (conflict hai chiều). */
    conflictsWith?: string[];
}

export interface ActivityPresetDefinition {
    code: ActivityPresetCode;
    displayName: string;
    description: string;
    /** P6-12: optional (BE có thể không trả cho một số preset). */
    defaultRequiresSubmission?: boolean | null;
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

export interface ScoreRulePreviewRow {
    triggerType: string;
    scenario: string;      // PASS | FAIL | PENALTY | BONUS | REWARD
    scoreType: string;
    points: number;
    audience: string;
    semester: string;
    description: string;
}

export interface ActivityPresetPreviewResponse {
    presetCode: ActivityPresetCode;
    activityType: ActivityType;
    requiresSubmission: boolean;
    scoreRules: ActivityScoreRuleRequest[];
    notes: string[];
    /** P6.1: display-ready rows, FE render thẳng không cần suy luận. */
    previewRows?: ScoreRulePreviewRow[] | null;
}

export interface SeriesPresetConfig {
    primaryScoreType?: ScoreType | null;
    milestonePoints?: Record<number, number> | null;
    minimumRequirementEnabled?: boolean | null;
    minimumRequiredEvents?: number | null;
    minimumPenaltyPoints?: number | string | null;
    audience?: import('./activity').ScoreRuleAudience | null;
    departmentIds?: number[] | null;
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
