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
    isRuleEnabled: boolean
): string | null {
    // Check visibility
    if (field.visibility === 'rule_enabled' && !isRuleEnabled) {
        return null; // Field hidden, no validation needed
    }

    // Required check
    if (field.required) {
        if (value === undefined || value === null || value === '') {
            return `${field.label} là bắt buộc`;
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
                if (field.required && field.options && !field.options.includes(String(value))) {
                    return `${field.label} phải chọn một giá trị hợp lệ`;
                }
                break;
            }
            case 'BOOLEAN': {
                // No additional validation for boolean
                break;
            }
        }
    }

    return null;
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
            const error = validateField(field, config[field.fieldName], isRuleEnabled);
            if (error) {
                errors.push({ fieldName: field.fieldName, message: error });
            }
        }
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
            const error = validateField(field, config[field.fieldName], isRuleEnabled);
            if (error) {
                errors.push({ fieldName: field.fieldName, message: error });
            }
        }
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
