import { ScoreRuleTrigger, ScoreRuleCalculation } from '../types/activity';

// Triggers that are purely for penalties (only failPoints make sense)
export const PENALTY_ONLY_TRIGGERS = [
  ScoreRuleTrigger.NO_SHOW,
  ScoreRuleTrigger.TASK_OVERDUE,
  ScoreRuleTrigger.MINIGAME_EXHAUSTED_ATTEMPTS,
];

// Triggers that can yield either success or failure points
export const PASS_FAIL_TRIGGERS = [
  ScoreRuleTrigger.SUBMISSION_GRADED,
];

// Triggers that only yield positive points
export const POSITIVE_ONLY_TRIGGERS = [
  ScoreRuleTrigger.PARTICIPATION_COMPLETED,
  ScoreRuleTrigger.MINIGAME_PASSED,
  ScoreRuleTrigger.SERIES_MILESTONE_REACHED,
];

// Triggers where failPoints are required (if they trigger, they must deduct points)
export const REQUIRES_FAIL_POINTS = [
  ScoreRuleTrigger.NO_SHOW,
  ScoreRuleTrigger.TASK_OVERDUE,
  ScoreRuleTrigger.MINIGAME_EXHAUSTED_ATTEMPTS,
];

// Determine the default calculation based on the trigger
export function getDefaultCalculationForTrigger(trigger: ScoreRuleTrigger): ScoreRuleCalculation {
  if (PENALTY_ONLY_TRIGGERS.includes(trigger)) return ScoreRuleCalculation.PENALTY_POINTS;
  if (trigger === ScoreRuleTrigger.SUBMISSION_GRADED) return ScoreRuleCalculation.PASS_FAIL_POINTS;
  if (trigger === ScoreRuleTrigger.SERIES_MILESTONE_REACHED) return ScoreRuleCalculation.SERIES_MILESTONE;
  return ScoreRuleCalculation.FIXED_POINTS;
}

// Get available calculations for a specific trigger type
export function getValidCalculationsForTrigger(trigger: ScoreRuleTrigger): ScoreRuleCalculation[] {
    if (PENALTY_ONLY_TRIGGERS.includes(trigger)) {
        return [ScoreRuleCalculation.PENALTY_POINTS];
    }
    
    if (trigger === ScoreRuleTrigger.SUBMISSION_GRADED) {
        return [ScoreRuleCalculation.PASS_FAIL_POINTS];
    }

    if (trigger === ScoreRuleTrigger.SERIES_MILESTONE_REACHED) {
        return [ScoreRuleCalculation.SERIES_MILESTONE];
    }

    // Default positive triggers (participation, minigame passed)
    return [
        ScoreRuleCalculation.FIXED_POINTS, 
        ScoreRuleCalculation.COUNT_COMPLETION
    ];
}
