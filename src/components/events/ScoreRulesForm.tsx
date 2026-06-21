import React from 'react';
import { 
    ActivityScoreRuleRequest, 
    ScoreType, 
    ScoreRuleTrigger, 
    ScoreRuleCalculation, 
    ScoreRuleAudience, 
    ScoreSemesterPolicy 
} from '../../types/activity';
import { Department } from '../../types/admin';

interface ScoreRulesFormProps {
    rules: ActivityScoreRuleRequest[];
    onChange: (rules: ActivityScoreRuleRequest[]) => void;
    departments?: Department[];
}

export const ScoreRulesForm: React.FC<ScoreRulesFormProps> = ({ rules = [], onChange, departments = [] }) => {
    
    const handleAddRule = () => {
        const newRule: ActivityScoreRuleRequest = {
            scoreType: ScoreType.REN_LUYEN,
            triggerType: ScoreRuleTrigger.PARTICIPATION_COMPLETED,
            calculation: ScoreRuleCalculation.FIXED_POINTS,
            points: '0',
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

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Luật tính điểm (Score Rules)</h3>
                <button 
                    type="button" 
                    onClick={handleAddRule}
                    className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 text-sm font-medium"
                >
                    + Thêm luật điểm
                </button>
            </div>

            {rules.length === 0 && (
                <div className="p-4 bg-gray-50 text-gray-500 rounded-md text-center text-sm">
                    Chưa có luật điểm nào được cấu hình cho hoạt động này.
                </div>
            )}

            <div className="space-y-6">
                {rules.map((rule, index) => (
                    <div key={index} className="p-4 border rounded-md shadow-sm bg-white relative">
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                    onChange={(e) => updateRule(index, 'triggerType', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value={ScoreRuleTrigger.PARTICIPATION_COMPLETED}>Hoàn thành tham gia</option>
                                    <option value={ScoreRuleTrigger.SUBMISSION_GRADED}>Được chấm bài</option>
                                    <option value={ScoreRuleTrigger.MINIGAME_PASSED}>Đạt minigame</option>
                                    <option value={ScoreRuleTrigger.SERIES_MILESTONE_REACHED}>Đạt mốc chuỗi sự kiện</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cách tính (Calculation)</label>
                                <select 
                                    value={rule.calculation}
                                    onChange={(e) => updateRule(index, 'calculation', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value={ScoreRuleCalculation.FIXED_POINTS}>Cộng điểm cố định</option>
                                    <option value={ScoreRuleCalculation.PENALTY_POINTS}>Trừ điểm (Penalty)</option>
                                    <option value={ScoreRuleCalculation.PASS_FAIL_POINTS}>Điểm Đạt/Trượt</option>
                                    <option value={ScoreRuleCalculation.COUNT_COMPLETION}>Tính số lần hoàn thành</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Số điểm (Points)</label>
                                <input 
                                    type="number"
                                    step="0.1"
                                    value={rule.points}
                                    onChange={(e) => updateRule(index, 'points', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ví dụ: 5.0"
                                />
                            </div>

                            {rule.calculation === ScoreRuleCalculation.PASS_FAIL_POINTS && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Điểm khi trượt (Fail points)</label>
                                    <input 
                                        type="number"
                                        step="0.1"
                                        value={rule.failPoints || ''}
                                        onChange={(e) => updateRule(index, 'failPoints', e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ví dụ: 0"
                                    />
                                </div>
                            )}

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
                                    <option value={ScoreSemesterPolicy.CURRENT_OPEN_SEMESTER}>Học kỳ hiện tại</option>
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Học kỳ (Explicit Semester ID)</label>
                                    <input 
                                        type="number"
                                        value={rule.explicitSemesterId || ''}
                                        onChange={(e) => updateRule(index, 'explicitSemesterId', parseInt(e.target.value) || null)}
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nhập ID học kỳ"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
