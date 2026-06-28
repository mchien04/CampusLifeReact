import { ActivityScoreRuleResponse, ActivityScoreRuleRequest, ActivityResponse, ActivityPresetConfig } from '../types/activity';
import { ActivityPresetDefinition } from '../types/presets';

/**
 * Maps a score rule response from the backend to a request payload format
 * suitable for editing forms.
 * 
 * Key transformations:
 * - targetDepartmentIds (Response) -> departmentIds (Request)
 */
export function mapScoreRuleResponseToRequest(
  rule: ActivityScoreRuleResponse
): ActivityScoreRuleRequest {
  return {
    scoreType: rule.scoreType,
    failScoreType: rule.failScoreType ?? null, // P6.1
    triggerType: rule.triggerType,
    calculation: rule.calculation,
    points: rule.points,
    failPoints: rule.failPoints ?? null,
    audience: rule.audience,
    semesterPolicy: rule.semesterPolicy,
    explicitSemesterId: rule.explicitSemesterId ?? null,
    departmentIds: rule.targetDepartmentIds ?? [],
    enabled: rule.enabled ?? true,
  };
}

function findRule(rules: ActivityScoreRuleResponse[], triggerType: string): ActivityScoreRuleResponse | undefined {
  return rules.find(r => r.triggerType === triggerType);
}

function toNum(val: number | null | undefined): number | string | null | undefined {
  return val ?? undefined;
}

/**
 * Reconstructs an ActivityPresetConfig from an activity's scoreRules.
 * Used when editing an activity whose presetConfig is null (backend doesn't persist it).
 * Merges preset defaults with runtime values from scoreRules.
 */
export function reconstructActivityPresetConfig(
  activity: ActivityResponse,
  preset: ActivityPresetDefinition
): ActivityPresetConfig {
  const rules = activity.scoreRules || [];
  const rule0 = rules[0];

  // Start with defaults from the preset descriptor
  const config: Record<string, unknown> = {};
  for (const rule of preset.supportedRules) {
    for (const field of rule.fieldDefinitions) {
      if (field.defaultValue !== undefined && field.defaultValue !== null) {
        config[field.fieldName] = field.defaultValue;
      }
    }
  }

  // Override audience/semester from first rule (all rules share same audience/semesterPolicy)
  if (rule0) {
    config.audience = rule0.audience;
    config.semesterPolicy = rule0.semesterPolicy;
    config.explicitSemesterId = rule0.explicitSemesterId ?? undefined;
    config.departmentIds = rule0.targetDepartmentIds ?? [];
  } else {
    config.audience = config.audience ?? 'ALL_PARTICIPANTS';
    config.semesterPolicy = config.semesterPolicy ?? 'ACTIVITY_SEMESTER';
  }

  // Reconstruct points/failPoints from individual rules
  const participationRule = findRule(rules, 'PARTICIPATION_COMPLETED');
  if (participationRule) {
    config.participationPoints = toNum(participationRule.points);
  }

  const noShowRule = findRule(rules, 'NO_SHOW');
  if (noShowRule && noShowRule.failPoints != null) {
    config.noShowPenaltyEnabled = true;
    config.noShowPenaltyPoints = noShowRule.failPoints;
    config.noShowPenaltyScoreType = noShowRule.scoreType;
  }

  const submissionRule = findRule(rules, 'SUBMISSION_GRADED');
  if (submissionRule) {
    config.submissionPassPoints = toNum(submissionRule.points);
    config.submissionFailPoints = toNum(submissionRule.failPoints);
    config.submissionFailScoreType = submissionRule.failScoreType ?? null; // P6.1
  }
  // P6-11: derive submissionEnabled từ sự tồn tại của SUBMISSION_GRADED rule.
  config.submissionEnabled = !!submissionRule;

  const overdueRule = findRule(rules, 'TASK_OVERDUE');
  if (overdueRule && overdueRule.failPoints != null) {
    config.taskOverduePenaltyPoints = overdueRule.failPoints;
  }

  const minigameExhaustedRule = findRule(rules, 'MINIGAME_EXHAUSTED_ATTEMPTS');
  if (minigameExhaustedRule && minigameExhaustedRule.failPoints != null) {
    config.minigameExhaustedPenaltyPoints = minigameExhaustedRule.failPoints;
  }

  const minigamePassedRule = findRule(rules, 'MINIGAME_PASSED');
  if (minigamePassedRule) {
    config.primaryScoreType = minigamePassedRule.scoreType;
  }

  return config as ActivityPresetConfig;
}
