import React from 'react';
import { PresetRuleDescriptor, FieldDefinition, InputType, VisibilityType } from '../../types/presets';
import MapInputField from './MapInputField';

interface PresetRuleCardProps {
    rule: PresetRuleDescriptor;
    enabled: boolean;
    onToggle: (ruleKey: string, enabled: boolean) => void;
    fieldValues: Record<string, unknown>;
    onFieldChange: (fieldName: string, value: unknown) => void;
    errors?: Record<string, string>;
}

const getInputTypeComponent = (
    field: FieldDefinition,
    value: unknown,
    onChange: (val: unknown) => void,
    error?: string
) => {
    const baseClass = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : 'border-gray-300'}`;

    switch (field.inputType) {
        case 'BOOLEAN':
            return (
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id={field.fieldName}
                        checked={!!value}
                        onChange={(e) => onChange(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={field.fieldName} className="ml-2 text-sm text-gray-700">
                        {field.label}
                    </label>
                </div>
            );
        case 'SELECT':
            return (
                <div>
                    <label htmlFor={field.fieldName} className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <select
                        id={field.fieldName}
                        value={(value as string) || ''}
                        onChange={(e) => onChange(e.target.value || null)}
                        className={baseClass}
                    >
                        <option value="">-- Chọn --</option>
                        {field.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>
            );
        case 'NUMBER':
            return (
                <div>
                    <label htmlFor={field.fieldName} className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                        id={field.fieldName}
                        type="number"
                        min="0"
                        step="0.1"
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
                        placeholder={`Nhập ${field.label.toLowerCase()}`}
                    />
                </div>
            );
        case 'MAP':
            return (
                <MapInputField
                    label={field.label}
                    value={(value as Record<string, number>) || {}}
                    onChange={(val) => onChange(val)}
                    required={field.required}
                    error={error}
                />
            );
        default:
            return (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                    </label>
                    <input
                        type="text"
                        value={value !== undefined && value !== null ? String(value) : ''}
                        onChange={(e) => onChange(e.target.value)}
                        className={baseClass}
                    />
                </div>
            );
    }
};

const shouldShowField = (field: FieldDefinition, isRuleEnabled: boolean): boolean => {
    if (field.visibility === 'ALWAYS') return true;
    if (field.visibility === 'rule_enabled') return isRuleEnabled;
    return true;
};

const PresetRuleCard: React.FC<PresetRuleCardProps> = ({
    rule,
    enabled,
    onToggle,
    fieldValues,
    onFieldChange,
    errors = {}
}) => {
    const isDisabled = rule.required;

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
                            <h4 className="text-sm font-semibold text-gray-900">{rule.label}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                rule.required
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-600'
                            }`}>
                                {rule.required ? 'Bắt buộc' : 'Tùy chọn'}
                            </span>
                        </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 ml-14">{rule.description}</p>
                </div>
            </div>

            {/* Fields */}
            {enabled && (
                <div className="ml-14 space-y-4">
                    {rule.fieldDefinitions.map(field => {
                        if (!shouldShowField(field, enabled)) {
                            return null;
                        }
                        return (
                            <div key={field.fieldName}>
                                {getInputTypeComponent(
                                    field,
                                    fieldValues[field.fieldName],
                                    (val) => onFieldChange(field.fieldName, val),
                                    errors[field.fieldName]
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default PresetRuleCard;
