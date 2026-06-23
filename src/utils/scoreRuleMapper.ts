import { ActivityScoreRuleResponse, ActivityScoreRuleRequest } from '../types/activity';

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
