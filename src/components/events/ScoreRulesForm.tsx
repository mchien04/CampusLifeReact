import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
    ActivityScoreRuleRequest, 
    ScoreType, 
    ScoreRuleTrigger, 
    ScoreRuleCalculation, 
    ScoreRuleAudience, 
    ScoreSemesterPolicy 
} from '../../types/activity';
import { Department } from '../../types/admin';
import { ScoreRulesDisplay } from './ScoreRulesDisplay';
import { 
    PENALTY_ONLY_TRIGGERS, 
    PASS_FAIL_TRIGGERS, 
    POSITIVE_ONLY_TRIGGERS, 
    REQUIRES_FAIL_POINTS, 
    getDefaultCalculationForTrigger, 
    getValidCalculationsForTrigger 
} from '../../utils/scoreRuleHelpers';

interface Semester {
    id: number;
    name: string;
    open: boolean;
}

interface ScoreRulesFormProps {
    rules: ActivityScoreRuleRequest[];
    onChange: (rules: ActivityScoreRuleRequest[]) => void;
    departments?: Department[];
    /** Khi true (đang dùng preset thật): khóa toàn bộ chỉnh sửa, rule do backend quyết định. */
    disabled?: boolean;
}

export const ScoreRulesForm: React.FC<ScoreRulesFormProps> = ({ rules = [], onChange, departments = [], disabled = false }) => {
    
    const [semesters, setSemesters] = useState<Semester[]>([]);

    useEffect(() => {
        api.get('/api/academic/semesters')
            .then(res => setSemesters(res.data?.body || []))
            .catch(err => console.error("Failed to load semesters", err));
    }, []);
    const handleAddRule = () => {
        const newRule: ActivityScoreRuleRequest = {
            scoreType: ScoreType.REN_LUYEN,
            triggerType: ScoreRuleTrigger.PARTICIPATION_COMPLETED,
            calculation: ScoreRuleCalculation.FIXED_POINTS,
            points: 0,
            audience: ScoreRuleAudience.ALL_PARTICIPANTS,
            semesterPolicy: ScoreSemesterPolicy.ACTIVITY_SEMESTER,
            enabled: true
        };
        onChange([...rules, newRule]);
    };

    const handleRemoveRule = (index: number) => {
        onChange(rules.filter((_, i) => i !== index));
    };

    const updateRule = (index: number, field: keyof ActivityScoreRuleRequest, value: any) => {
        const updated = [...rules];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    const handleTriggerChange = (index: number, trigger: ScoreRuleTrigger) => {
        const calc = getDefaultCalculationForTrigger(trigger);
        const updated = [...rules];
        updated[index] = { 
            ...updated[index], 
            triggerType: trigger,
            calculation: calc,
            points: PENALTY_ONLY_TRIGGERS.includes(trigger) ? 0 : updated[index].points,
            failPoints: POSITIVE_ONLY_TRIGGERS.includes(trigger) ? null : updated[index].failPoints
        };
        onChange(updated);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="text-base font-semibold tracking-tight text-primary-900">Luật tính điểm</h3>
                    <p className="mt-0.5 text-sm text-gray-500">Tùy chỉnh thủ công khi không dùng mẫu cấu hình</p>
                </div>
                {!disabled && (
                    <button
                        type="button"
                        onClick={handleAddRule}
                        className="rounded-xl bg-primary-50 px-3 py-2 text-sm font-medium text-primary-900 transition-all hover:bg-primary-100 active:scale-[0.98]"
                    >
                        Thêm luật điểm
                    </button>
                )}
            </div>

            {disabled && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-900 leading-relaxed">
                    Điểm được quyết định bởi <strong>mẫu cấu hình</strong> đã chọn ở trên.
                    Chọn <em>Tùy chỉnh (không dùng mẫu)</em> để tự thêm/sửa luật điểm thủ công.
                </div>
            )}

            {/* Live Preview Card */}
            {rules.length > 0 && (
                <div className="rounded-xl border border-primary-100 bg-primary-50/40 p-4">
                    <h4 className="text-sm font-semibold text-primary-900 mb-2">
                        Bản xem trước tổng hợp điểm
                    </h4>
                    <ScoreRulesDisplay rules={rules as any} />
                </div>
            )}

            {rules.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-6 text-center text-sm text-gray-500">
                    Chưa có luật điểm nào được cấu hình cho hoạt động này.
                </div>
            )}

            <div className="space-y-6">
                {rules.map((rule, index) => (
                    <div key={index} className="p-4 border rounded-md shadow-sm bg-white relative">
                        {!disabled && (
                        <button
                            type="button"
                            onClick={() => handleRemoveRule(index)}
                            className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1"
                            title="Xóa luật này"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        )}

                        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Loại điểm</label>
                                <select 
                                    value={rule.scoreType}
                                    onChange={(e) => updateRule(index, 'scoreType', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value={ScoreType.REN_LUYEN}>Điểm rèn luyện</option>
                                    <option value={ScoreType.CONG_TAC_XA_HOI}>Điểm công tác xã hội</option>
                                    <option value={ScoreType.CHUYEN_DE}>Điểm chuyên đề</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sự kiện kích hoạt (Trigger)</label>
                                <select 
                                    value={rule.triggerType}
                                    onChange={(e) => handleTriggerChange(index, e.target.value as ScoreRuleTrigger)}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value={ScoreRuleTrigger.PARTICIPATION_COMPLETED}>Hoàn thành tham gia</option>
                                    <option value={ScoreRuleTrigger.NO_SHOW}>Không tham gia (Vắng)</option>
                                    <option value={ScoreRuleTrigger.SUBMISSION_GRADED}>Được chấm bài</option>
                                    <option value={ScoreRuleTrigger.MINIGAME_PASSED}>Đạt minigame</option>
                                    <option value={ScoreRuleTrigger.SERIES_MILESTONE_REACHED}>Đạt mốc chuỗi sự kiện</option>
                                    <option value={ScoreRuleTrigger.TASK_OVERDUE}>Quá hạn nhiệm vụ</option>
                                    <option value={ScoreRuleTrigger.MINIGAME_EXHAUSTED_ATTEMPTS}>Hết lượt minigame</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cách tính (Calculation)</label>
                                <select 
                                    value={rule.calculation}
                                    onChange={(e) => updateRule(index, 'calculation', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                >
                                    {getValidCalculationsForTrigger(rule.triggerType).map(calc => (
                                        <option key={calc} value={calc}>
                                            {calc === ScoreRuleCalculation.FIXED_POINTS ? 'Cộng điểm cố định' :
                                             calc === ScoreRuleCalculation.PENALTY_POINTS ? 'Trừ điểm (Penalty)' :
                                             calc === ScoreRuleCalculation.PASS_FAIL_POINTS ? 'Điểm Đạt/Trượt' :
                                             calc === ScoreRuleCalculation.SERIES_MILESTONE ? 'Mốc chuỗi sự kiện' :
                                             calc === ScoreRuleCalculation.COUNT_COMPLETION ? 'Tính số lần hoàn thành' : calc}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {(() => {
                                const isPenaltyOnly = PENALTY_ONLY_TRIGGERS.includes(rule.triggerType);
                                const isPassFail = rule.triggerType === ScoreRuleTrigger.SUBMISSION_GRADED;
                                const isPositiveOnly = POSITIVE_ONLY_TRIGGERS.includes(rule.triggerType);

                                return (
                                    <>
                                        {/* Số điểm cộng (points) */}
                                        {!isPenaltyOnly && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Điểm khi {isPassFail ? 'đạt (Pass)' : 'hoàn thành'}
                                                </label>
                                                <input 
                                                    type="number"
                                                    step="0.1"
                                                    value={rule.points}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value);
                                                        updateRule(index, 'points', isNaN(val) ? 0 : val);
                                                    }}
                                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Ví dụ: 5.0"
                                                />
                                                <p className="text-xs text-green-600 mt-1">→ Backend ghi +{rule.points || 0} điểm</p>
                                            </div>
                                        )}

                                        {/* Điểm phạt (failPoints) */}
                                        {(isPenaltyOnly || isPassFail) && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    {isPenaltyOnly ? 'Điểm phạt (nhập số dương)' : 'Điểm khi trượt (Fail)'}
                                                    {REQUIRES_FAIL_POINTS.includes(rule.triggerType) && <span className="text-red-500">*</span>}
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={rule.failPoints || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value ? parseFloat(e.target.value) : null;
                                                        updateRule(index, 'failPoints', val !== null && isNaN(val) ? null : val);
                                                    }}
                                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                        !rule.failPoints && REQUIRES_FAIL_POINTS.includes(rule.triggerType) ? 'border-red-500' : ''
                                                    }`}
                                                    placeholder="Ví dụ: 5"
                                                />
                                                <p className="text-xs text-red-500 mt-1">→ Backend ghi -{rule.failPoints || 0} điểm</p>
                                            </div>
                                        )}

                                        {/* P6.1: failScoreType — chỉ dùng cho SUBMISSION_GRADED (Pass/Fail) */}
                                        {isPassFail && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Loại điểm phạt (để trống để mặc định theo Loại điểm chính)
                                                </label>
                                                <select
                                                    value={rule.failScoreType || ''}
                                                    onChange={(e) => updateRule(index, 'failScoreType', e.target.value || null)}
                                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">-- Mặc định ({rule.scoreType}) --</option>
                                                    <option value={ScoreType.REN_LUYEN}>Điểm rèn luyện</option>
                                                    <option value={ScoreType.CONG_TAC_XA_HOI}>Điểm công tác xã hội</option>
                                                    <option value={ScoreType.CHUYEN_DE}>Điểm chuyên đề</option>
                                                </select>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Khuyên dùng Rèn luyện để không trừ ngược điểm Chuyên đề.
                                                </p>
                                            </div>
                                        )}

                                        {/* Hidden points cho penalty-only */}
                                        {isPenaltyOnly && (
                                            <input type="hidden" value="0" />
                                        )}
                                    </>
                                );
                            })()}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Đối tượng áp dụng</label>
                                <select 
                                    value={rule.audience}
                                    onChange={(e) => updateRule(index, 'audience', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value={ScoreRuleAudience.ALL_PARTICIPANTS}>Tất cả người tham gia</option>
                                    <option value={ScoreRuleAudience.DEPARTMENT_ONLY}>Chỉ sinh viên Khoa/Ngành</option>
                                    <option value={ScoreRuleAudience.OUTSIDE_DEPARTMENTS_ONLY}>Sinh viên ngoài Khoa/Ngành</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Chính sách Học kỳ</label>
                                <select 
                                    value={rule.semesterPolicy}
                                    onChange={(e) => updateRule(index, 'semesterPolicy', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value={ScoreSemesterPolicy.ACTIVITY_SEMESTER}>Học kỳ của hoạt động</option>
                                    <option value={ScoreSemesterPolicy.EXPLICIT_SEMESTER}>Chỉ định học kỳ</option>
                                </select>
                            </div>
                            
                            {(rule.audience === ScoreRuleAudience.DEPARTMENT_ONLY || rule.audience === ScoreRuleAudience.OUTSIDE_DEPARTMENTS_ONLY) && (
                                <div className="col-span-full">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Chọn Khoa/Ngành áp dụng</label>
                                    <div className="max-h-32 overflow-y-auto border rounded-md p-2 grid grid-cols-2 gap-2">
                                        {departments?.map(dept => (
                                            <label key={dept.id} className="flex items-center space-x-2 text-sm">
                                                <input 
                                                    type="checkbox"
                                                    checked={rule.departmentIds?.includes(dept.id) || false}
                                                    onChange={(e) => {
                                                        const current = rule.departmentIds || [];
                                                        if (e.target.checked) {
                                                            updateRule(index, 'departmentIds', [...current, dept.id]);
                                                        } else {
                                                            updateRule(index, 'departmentIds', current.filter(id => id !== dept.id));
                                                        }
                                                    }}
                                                    className="rounded text-blue-600 focus:ring-blue-500"
                                                />
                                                <span>{dept.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {rule.semesterPolicy === ScoreSemesterPolicy.EXPLICIT_SEMESTER && (
                                <div className="col-span-full">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Học kỳ áp dụng</label>
                                    <select 
                                        value={rule.explicitSemesterId || ''}
                                        onChange={(e) => updateRule(index, 'explicitSemesterId', parseInt(e.target.value) || null)}
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">-- Chọn học kỳ --</option>
                                        {semesters.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.name} {s.open ? '(Đang mở)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
