import { ActivityPresetDefinition, SeriesPresetDefinition, PresetRuleDescriptor, FieldDefinition, InputType } from '../types/presets';

export interface ValidationError {
    fieldName: string;
    message: string;
}

export interface PresetValidationResult {
    valid: boolean;
    errors: ValidationError[];
}

function validateField(
    field: FieldDefinition,
    value: unknown,
    isRuleEnabled: boolean,
    configValues: Record<string, unknown>
): string | null {
    // Check visibility
    if (field.visibility === 'rule_enabled' && !isRuleEnabled) {
        return null;
    }
    if (field.visibility === 'audience_department_scoped') {
        if (configValues.audience === 'ALL_PARTICIPANTS' || configValues.audience == null) {
            return null;
        }
    }
    if (field.visibility === 'semester_policy_explicit') {
        if (configValues.semesterPolicy !== 'EXPLICIT_SEMESTER') {
            return null;
        }
    }

    // Required check
    if (field.required) {
        if (value === undefined || value === null || value === '') {
            return `${field.label} là bắt buộc`;
        }
        if (field.inputType === 'MULTI_SELECT' && Array.isArray(value) && value.length === 0) {
            return `Vui lòng chọn ít nhất một ${field.label.toLowerCase()}`;
        }
    }

    // Type-specific validation
    if (value !== undefined && value !== null && value !== '') {
        switch (field.inputType) {
            case 'NUMBER': {
                const num = Number(value);
                if (isNaN(num)) {
                    return `${field.label} phải là số`;
                }
                if (num < 0) {
                    return `${field.label} phải >= 0`;
                }
                break;
            }
            case 'MAP': {
                if (typeof value !== 'object' || value === null || Array.isArray(value)) {
                    return `${field.label} phải là danh sách cặp giá trị`;
                }
                const map = value as Record<string, unknown>;
                if (Object.keys(map).length === 0 && field.required) {
                    return `${field.label} phải có ít nhất một mốc`;
                }
                // Validate MAP keys are ascending positive integers
                const keys = Object.keys(map).map(Number).filter(k => !isNaN(k)).sort((a, b) => a - b);
                for (let i = 0; i < keys.length; i++) {
                    if (keys[i] < 1) {
                        return `${field.label}: các mốc phải >= 1`;
                    }
                    if (i > 0 && keys[i] <= keys[i - 1]) {
                        return `${field.label}: các mốc phải tăng dần`;
                    }
                    const val = Number(map[keys[i]]);
                    if (isNaN(val) || val < 0) {
                        return `${field.label}: điểm phải >= 0`;
                    }
                }
                break;
            }
            case 'SELECT': {
                if (field.required && field.options && field.options.length > 0 && !field.options.includes(String(value))) {
                    return `${field.label} phải chọn một giá trị hợp lệ`;
                }
                break;
            }
            case 'BOOLEAN': {
                // No additional validation for boolean
                break;
            }
            case 'MULTI_SELECT': {
                if (!Array.isArray(value)) {
                    return `${field.label} phải là danh sách`;
                }
                break;
            }
        }
    }

    return null;
}

function validateCrossFields(
    rule: PresetRuleDescriptor,
    config: Record<string, unknown>
): ValidationError[] {
    const errors: ValidationError[] = [];
    const departmentField = rule.fieldDefinitions.find(f => f.fieldName.endsWith('DepartmentIds'));
    const explicitSemesterField = rule.fieldDefinitions.find(f => f.fieldName.endsWith('ExplicitSemesterId'));

    if (departmentField) {
        // Derive the per-rule audience field name from the DepartmentIds field name.
        const audienceKey = departmentField.fieldName.replace(/DepartmentIds$/, 'Audience');
        const audience = config[audienceKey];
        const deptIds = config[departmentField.fieldName];
        if (audience && audience !== 'ALL_PARTICIPANTS') {
            if (!Array.isArray(deptIds) || deptIds.length === 0) {
                errors.push({ fieldName: departmentField.fieldName, message: 'Vui lòng chọn ít nhất một khoa khi giới hạn đối tượng' });
            }
        }
    }

    if (explicitSemesterField) {
        // Derive the per-rule semesterPolicy field name from the ExplicitSemesterId field name.
        const policyKey = explicitSemesterField.fieldName.replace(/ExplicitSemesterId$/, 'SemesterPolicy');
        const semesterPolicy = config[policyKey];
        const explicitSemesterId = config[explicitSemesterField.fieldName];
        if (semesterPolicy === 'EXPLICIT_SEMESTER') {
            if (explicitSemesterId === null || explicitSemesterId === undefined || explicitSemesterId === '') {
                errors.push({ fieldName: explicitSemesterField.fieldName, message: 'Vui lòng chọn học kỳ chỉ định khi chính sách là EXPLICIT_SEMESTER' });
            }
        }
    }

    return errors;
}

export function validateActivityPresetConfig(
    preset: ActivityPresetDefinition,
    enabledRules: Record<string, boolean>,
    config: Record<string, unknown>
): PresetValidationResult {
    const errors: ValidationError[] = [];

    for (const rule of preset.supportedRules) {
        const isRuleEnabled = enabledRules[rule.ruleKey] ?? rule.enabledByDefault;
        for (const field of rule.fieldDefinitions) {
            const error = validateField(field, config[field.fieldName], isRuleEnabled, config);
            if (error) {
                errors.push({ fieldName: field.fieldName, message: error });
            }
        }
        const crossErrors = validateCrossFields(rule, config);
        errors.push(...crossErrors);
    }

    return { valid: errors.length === 0, errors };
}

export function validateSeriesPresetConfig(
    preset: SeriesPresetDefinition,
    enabledRules: Record<string, boolean>,
    config: Record<string, unknown>
): PresetValidationResult {
    const errors: ValidationError[] = [];

    for (const rule of preset.supportedRules) {
        const isRuleEnabled = enabledRules[rule.ruleKey] ?? rule.enabledByDefault;
        for (const field of rule.fieldDefinitions) {
            const error = validateField(field, config[field.fieldName], isRuleEnabled, config);
            if (error) {
                errors.push({ fieldName: field.fieldName, message: error });
            }
        }
        const crossErrors = validateCrossFields(rule, config);
        errors.push(...crossErrors);
    }

    return { valid: errors.length === 0, errors };
}

export function validateMapEntries(
    entries: Array<{ key: string; value: number }>,
    label: string
): string | null {
    if (entries.length === 0) {
        return `${label} phải có ít nhất một mốc`;
    }

    const keys = entries.map(e => Number(e.key)).filter(k => !isNaN(k)).sort((a, b) => a - b);
    for (let i = 0; i < keys.length; i++) {
        if (keys[i] < 1) {
            return `${label}: các mốc phải >= 1`;
        }
        if (i > 0 && keys[i] <= keys[i - 1]) {
            return `${label}: các mốc phải tăng dần`;
        }
        if (entries[i].value < 0) {
            return `${label}: điểm phải >= 0`;
        }
    }

    return null;
}

export function validateNoShowPenaltyScoreType(
    primaryScoreType: string | null | undefined,
    noShowPenaltyScoreType: string | null | undefined
): string | null {
    if (primaryScoreType === 'CHUYEN_DE' && noShowPenaltyScoreType === 'CHUYEN_DE') {
        return 'Loại điểm phạt vắng mặt không được trùng với loại điểm chính (Chuyên đề). Vui lòng chọn loại điểm khác.';
    }
    return null;
}
