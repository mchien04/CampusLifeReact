import React from 'react';
import { PresetRuleDescriptor, FieldDefinition, InputType, VisibilityType } from '../../types/presets';
import { ScoreRuleTrigger } from '../../types/activity';
import MapInputField from './MapInputField';
import MultiSelectField from './MultiSelectField';
import {
    getCodeLabel,
    getFieldLabel,
    getOptionLabel,
    getRuleDescription,
    getRuleLabel,
} from '../../utils/vietnameseLabels';

const getSuggestedCombinationLabel = (trigger: string): string =>
    getCodeLabel(trigger, trigger);

interface PresetRuleCardProps {
    rule: PresetRuleDescriptor;
    enabled: boolean;
    onToggle: (ruleKey: string, enabled: boolean) => void;
    fieldValues: Record<string, unknown>;
    onFieldChange: (fieldName: string, value: unknown) => void;
    errors?: Record<string, string>;
    externalOptions?: Record<string, Array<{ value: string | number; label: string }>>;
    presetCode?: string;
    /** P6.1: disable toggle vì lý do dependency (vd TASK_OVERDUE tắt khi SUBMISSION_GRADED tắt). */
    toggleDisabled?: boolean;
}

const getInputTypeComponent = (
    field: FieldDefinition,
    value: unknown,
    onChange: (val: unknown) => void,
    error?: string,
    externalOptions?: Record<string, Array<{ value: string | number; label: string }>>
) => {
    // P6.1: BE chỉ ra editable=false → field read-only (vd enterprise participationPoints).
    const readOnly = field.editable === false;
    const baseClass = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : 'border-gray-300'} ${readOnly ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`;

    const resolveOptions = (): Array<{ value: string | number; label: string }> => {
        if (field.options && field.options.length > 0) {
            return field.options.map(opt => ({
                value: opt,
                label: getOptionLabel(opt, opt),
            }));
        }
        // Direct lookup
        if (externalOptions?.[field.fieldName]) {
            return externalOptions[field.fieldName].map((opt) => ({
                ...opt,
                label: getOptionLabel(opt.value, opt.label),
            }));
        }
        // Per-rule fallback: strip known trigger prefixes to find base externalOptions key
        // e.g. "submissionDepartmentIds" → "departmentIds", "noShowExplicitSemesterId" → "explicitSemesterId"
        const baseKey = field.fieldName
            .replace(/^(submission|participation|noShow|taskOverdue|bonus|minigamePassed|minigameExhausted)/, '')
            .replace(/^./, c => c.toLowerCase());
        return (externalOptions?.[baseKey] || []).map((opt) => ({
            ...opt,
            label: getOptionLabel(opt.value, opt.label),
        }));
    };

    switch (field.inputType) {
        case 'BOOLEAN':
            return (
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id={field.fieldName}
                        checked={!!value}
                        disabled={readOnly}
                        onChange={(e) => onChange(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    <label htmlFor={field.fieldName} className="ml-2 text-sm text-gray-700">
                        {getFieldLabel(field.fieldName, field.label)}
                    </label>
                </div>
            );
        case 'SELECT':
            return (
                <div>
                    <label htmlFor={field.fieldName} className="block text-sm font-medium text-gray-700 mb-1">
                        {getFieldLabel(field.fieldName, field.label)} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <select
                        id={field.fieldName}
                        value={(value as string) || ''}
                        disabled={readOnly}
                        onChange={(e) => onChange(e.target.value || null)}
                        className={baseClass}
                    >
                        <option value="">— Chọn —</option>
                        {resolveOptions().map(opt => (
                            <option key={String(opt.value)} value={String(opt.value)}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            );
        case 'NUMBER':
            return (
                <div>
                    <label htmlFor={field.fieldName} className="block text-sm font-medium text-gray-700 mb-1">
                        {getFieldLabel(field.fieldName, field.label)} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                        id={field.fieldName}
                        type="number"
                        min="0"
                        step="0.1"
                        readOnly={readOnly}
                        disabled={readOnly}
                        value={value !== undefined && value !== null ? String(value) : ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                                onChange(null);
                            } else {
                                const num = parseFloat(val);
                                onChange(isNaN(num) ? null : num);
                            }
                        }}
                        className={baseClass}
                        placeholder={`Nhập ${getFieldLabel(field.fieldName, field.label).toLowerCase()}`}
                    />
                </div>
            );
        case 'MAP':
            return (
                <MapInputField
                    label={getFieldLabel(field.fieldName, field.label)}
                    value={(value as Record<string, number>) || {}}
                    onChange={(val) => onChange(val)}
                    required={field.required}
                    error={error}
                />
            );
        case 'MULTI_SELECT':
            return (
                <MultiSelectField
                    label={getFieldLabel(field.fieldName, field.label)}
                    options={resolveOptions()}
                    value={(value as (number | string)[]) || []}
                    onChange={(val) => onChange(val)}
                    required={field.required}
                    error={error}
                />
            );
        default:
            return (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {getFieldLabel(field.fieldName, field.label)}
                    </label>
                    <input
                        type="text"
                        readOnly={readOnly}
                        disabled={readOnly}
                        value={value !== undefined && value !== null ? String(value) : ''}
                        onChange={(e) => onChange(e.target.value)}
                        className={baseClass}
                    />
                </div>
            );
    }
};

const shouldShowField = (field: FieldDefinition, isRuleEnabled: boolean, configValues: Record<string, unknown>): boolean => {
    if (field.visibility === 'ALWAYS') return true;
    if (field.visibility === 'rule_enabled') return isRuleEnabled;
    if (field.visibility === 'audience_department_scoped') {
        // Derive the per-rule audience field name from the departmentIds field name.
        // e.g. "submissionDepartmentIds" → "submissionAudience", "departmentIds" → "audience"
        const audienceKey = field.fieldName.replace(/DepartmentIds$/, 'Audience');
        const audienceVal = configValues[audienceKey];
        return audienceVal !== 'ALL_PARTICIPANTS' && audienceVal != null;
    }
    if (field.visibility === 'semester_policy_explicit') {
        // Derive the per-rule semesterPolicy field name from the explicitSemesterId field name.
        // e.g. "submissionExplicitSemesterId" → "submissionSemesterPolicy", "explicitSemesterId" → "semesterPolicy"
        const policyKey = field.fieldName.replace(/ExplicitSemesterId$/, 'SemesterPolicy');
        return configValues[policyKey] === 'EXPLICIT_SEMESTER';
    }
    return true;
};

const PresetRuleCard: React.FC<PresetRuleCardProps> = ({
    rule,
    enabled,
    onToggle,
    fieldValues,
    onFieldChange,
    errors = {},
    externalOptions,
    presetCode,
    toggleDisabled = false
}) => {
    // P6.1: required rule không cho tắt thủ công, nhưng nếu đang bị tắt do conflict
    // (vd PARTICIPATION_COMPLETED khi SUBMISSION_GRADED bật) thì cho phép bật lại.
    // P6.1: toggleDisabled cho TASK_OVERDUE khi SUBMISSION_GRADED tắt.
    const isDisabled = (rule.required && enabled) || toggleDisabled;

    const handleToggle = () => {
        if (!isDisabled) {
            onToggle(rule.ruleKey, !enabled);
        }
    };

    return (
        <div className={`border rounded-lg p-4 space-y-4 ${enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'}`}>
            {/* Header with Toggle */}
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            role="switch"
                            aria-checked={enabled}
                            onClick={handleToggle}
                            disabled={isDisabled}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                enabled ? 'bg-blue-600' : 'bg-gray-300'
                            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    enabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        </button>
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900">
                                {getRuleLabel(rule.ruleKey, rule.label)}
                            </h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                rule.required
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-600'
                            }`}>
                                {rule.required ? 'Bắt buộc' : 'Tùy chọn'}
                            </span>
                        </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 ml-14">
                        {getRuleDescription(rule.ruleKey, rule.description)}
                    </p>
                    {rule.suggestedCombinations && rule.suggestedCombinations.length > 0 && (
                        <div className="mt-2 ml-14 flex flex-wrap items-center gap-1.5">
                            <span className="text-xs text-gray-400">Có thể kết hợp với:</span>
                            {rule.suggestedCombinations.map((tr) => (
                                <span
                                    key={tr}
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                                >
                                    {getSuggestedCombinationLabel(tr)}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Fields */}
            {enabled && (
                <div className="ml-14 space-y-4">
                    {(() => {
                        // P6.1: phân loại fields — main (số điểm, scoreType) vs extended (đối tượng, học kỳ).
                        const isExtendedField = (fn: string) =>
                            fn.endsWith('Audience') || fn.endsWith('DepartmentIds') ||
                            fn.endsWith('SemesterPolicy') || fn.endsWith('ExplicitSemesterId');
                        const isNoShowEnabled = (fn: string) =>
                            rule.ruleKey === 'NO_SHOW' && fn === 'noShowPenaltyEnabled';

                        const mainFields = rule.fieldDefinitions.filter(f =>
                            !isNoShowEnabled(f.fieldName) && shouldShowField(f, enabled, fieldValues) && !isExtendedField(f.fieldName)
                        );
                        const extendedFields = rule.fieldDefinitions.filter(f =>
                            !isNoShowEnabled(f.fieldName) && shouldShowField(f, enabled, fieldValues) && isExtendedField(f.fieldName)
                        );

                        return (
                            <>
                                {mainFields.map(field => (
                                    <div key={field.fieldName}>
                                        {getInputTypeComponent(field, fieldValues[field.fieldName], (val) => onFieldChange(field.fieldName, val), errors[field.fieldName], externalOptions)}
                                    </div>
                                ))}
                                {extendedFields.length > 0 && (
                                    <details className="group border border-gray-200 rounded-lg">
                                        <summary className="cursor-pointer text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 list-none flex items-center gap-1.5">
                                            <span className="group-open:rotate-90 transition-transform">▶</span>
                                            Cấu hình mở rộng (đối tượng, học kỳ)
                                        </summary>
                                        <div className="px-3 pb-3 pt-2 space-y-3">
                                            {extendedFields.map(field => (
                                                <div key={field.fieldName}>
                                                    {getInputTypeComponent(field, fieldValues[field.fieldName], (val) => onFieldChange(field.fieldName, val), errors[field.fieldName], externalOptions)}
                                                </div>
                                            ))}
                                        </div>
                                    </details>
                                )}
                            </>
                        );
                    })()}
                </div>
            )}
        </div>
    );
};

export default PresetRuleCard;
