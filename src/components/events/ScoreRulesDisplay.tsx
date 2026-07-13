import React, { useState, useEffect } from 'react';
import {
    ActivityScoreRuleResponse,
    ScoreType,
    ScoreRuleTrigger,
    ScoreRuleCalculation,
} from '../../types/activity';
import api from '../../services/api';
import { getCodeLabel } from '../../utils/vietnameseLabels';

interface ScoreRulesDisplayProps {
    rules?: ActivityScoreRuleResponse[];
    /** Ẩn tiêu đề nội bộ khi parent đã có heading "Luật tính điểm" */
    hideTitle?: boolean;
}

const PENALTY_TRIGGERS = [
    ScoreRuleTrigger.NO_SHOW,
    ScoreRuleTrigger.TASK_OVERDUE,
    ScoreRuleTrigger.MINIGAME_EXHAUSTED_ATTEMPTS,
];

type ScoreTone = {
    chip: string;
    badge: string;
    points: string;
    dot: string;
};

function getTone(scoreType: ScoreType | string): ScoreTone {
    if (scoreType === ScoreType.REN_LUYEN) {
        return {
            chip: 'border-emerald-200/70 bg-white',
            badge: 'bg-emerald-50',
            points: 'text-emerald-700',
            dot: 'bg-emerald-500',
        };
    }
    if (scoreType === ScoreType.CONG_TAC_XA_HOI) {
        return {
            chip: 'border-sky-200/70 bg-white',
            badge: 'bg-sky-50',
            points: 'text-sky-700',
            dot: 'bg-sky-500',
        };
    }
    return {
        chip: 'border-amber-200/70 bg-white',
        badge: 'bg-amber-50',
        points: 'text-amber-800',
        dot: 'bg-amber-500',
    };
}

function formatPoints(rule: ActivityScoreRuleResponse): {
    primary: string;
    secondary?: string;
    isPenalty: boolean;
} {
    const isPenaltyOnly = PENALTY_TRIGGERS.includes(rule.triggerType);
    const isPassFail = rule.calculation === ScoreRuleCalculation.PASS_FAIL_POINTS;

    if (isPenaltyOnly) {
        return {
            primary: `−${rule.failPoints ?? rule.points ?? 0}`,
            isPenalty: true,
        };
    }
    if (isPassFail) {
        return {
            primary: `+${rule.points || 0}`,
            secondary: rule.failPoints != null ? `−${rule.failPoints}` : undefined,
            isPenalty: false,
        };
    }
    return {
        primary: `+${rule.points || 0}`,
        isPenalty: false,
    };
}

function buildAudienceText(
    rule: ActivityScoreRuleResponse,
    getDepartmentNames: (ids: number[]) => string
): string {
    const deptIds = rule.targetDepartmentIds || (rule as any).departmentIds || [];
    const audience = getCodeLabel(rule.audience);
    if (deptIds.length === 0) return audience;
    return `${audience} (${getDepartmentNames(deptIds)})`;
}

export const ScoreRulesDisplay: React.FC<ScoreRulesDisplayProps> = ({
    rules,
    hideTitle = false,
}) => {
    const [departments, setDepartments] = useState<any[]>([]);

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const deptRes = await api.get('/api/departments');
                if (deptRes.data) {
                    const raw = deptRes.data;
                    setDepartments(
                        Array.isArray(raw) ? raw : raw.body || raw.data || []
                    );
                }
            } catch (err) {
                console.error('Error fetching departments for rules', err);
            }
        };
        fetchDepartments();
    }, []);

    const getDepartmentNames = (ids: number[]) => {
        if (!ids || ids.length === 0) return '';
        return ids
            .map((id) => {
                const dept = departments.find((d) => d.id === id);
                return dept ? dept.name : `Khoa ${id}`;
            })
            .join(', ');
    };

    if (!rules || rules.length === 0) {
        return (
            <p className="text-sm text-gray-500 italic">Không có cấu hình điểm.</p>
        );
    }

    return (
        <div className="w-full space-y-2">
            {!hideTitle && (
                <h4 className="text-sm font-medium text-gray-700">Luật tính điểm:</h4>
            )}

            <div className="flex w-full flex-col gap-2.5">
                {rules.map((rule, index) => {
                    const tone = getTone(rule.scoreType);
                    const pts = formatPoints(rule);
                    const audienceText = buildAudienceText(rule, getDepartmentNames);
                    const key = rule.id ?? `${rule.triggerType}-${rule.scoreType}-${index}`;

                    return (
                        <div
                            key={key}
                            title={audienceText}
                            className={`flex w-full min-w-0 items-start gap-3 rounded-xl border ${tone.chip} p-2.5 shadow-sm`}
                        >
                            <div
                                className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg ${tone.badge}`}
                            >
                                <span
                                    className={`text-base font-bold tabular-nums leading-none ${
                                        pts.isPenalty ? 'text-rose-600' : tone.points
                                    }`}
                                >
                                    {pts.primary}
                                </span>
                                {pts.secondary && (
                                    <span className="mt-0.5 text-[10px] font-bold tabular-nums text-rose-500 leading-none">
                                        {pts.secondary}
                                    </span>
                                )}
                            </div>

                            <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot}`} />
                                    <span className="text-xs font-semibold text-gray-900">
                                        {getCodeLabel(rule.scoreType)}
                                    </span>
                                    <span className="text-[10px] text-gray-300">·</span>
                                    <span className="text-[11px] text-gray-600">
                                        {getCodeLabel(rule.triggerType)}
                                    </span>
                                </div>
                                <p className="text-[11px] leading-snug text-gray-500">
                                    <span className="text-gray-400">Đối tượng · </span>
                                    {audienceText}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
