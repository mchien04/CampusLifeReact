import { useState, useEffect, useCallback } from 'react';
import { eventAPI } from '../services/eventAPI';
import { ActivityPresetDefinition, ActivityPresetCode } from '../types/presets';
import { ActivityType, ActivityPresetConfig } from '../types/activity';


export interface UseActivityPresetsReturn {
    presets: ActivityPresetDefinition[];
    loading: boolean;
    error: string | null;
    selectedPresetCode: ActivityPresetCode | '';
    selectedPreset: ActivityPresetDefinition | null;
    enabledRules: Record<string, boolean>;
    presetConfig: ActivityPresetConfig;
    setSelectedPresetCode: (code: ActivityPresetCode | '') => void;
    setEnabledRule: (ruleKey: string, enabled: boolean) => void;
    setPresetConfigField: (fieldName: string, value: unknown) => void;
    setPresetConfig: (config: ActivityPresetConfig) => void;
    reset: () => void;
}

const buildEnabledRules = (preset: ActivityPresetDefinition): Record<string, boolean> => {
    const rules: Record<string, boolean> = {};
    for (const rule of preset.supportedRules) {
        rules[rule.ruleKey] = rule.required ? true : rule.enabledByDefault;
    }
    return rules;
};

const buildInitialConfig = (preset: ActivityPresetDefinition): ActivityPresetConfig => {
    const config: Record<string, unknown> = {};
    for (const rule of preset.supportedRules) {
        for (const field of rule.fieldDefinitions) {
            if (field.defaultValue !== undefined && field.defaultValue !== null) {
                config[field.fieldName] = field.defaultValue;
            }
        }
    }
    return config as ActivityPresetConfig;
};

export const useActivityPresets = (): UseActivityPresetsReturn => {
    const [presets, setPresets] = useState<ActivityPresetDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPresetCode, setSelectedPresetCode] = useState<ActivityPresetCode | ''>('');
    const [enabledRules, setEnabledRules] = useState<Record<string, boolean>>({});
    const [presetConfig, setPresetConfig] = useState<ActivityPresetConfig>({});

    useEffect(() => {
        const fetchPresets = async () => {
            try {
                setLoading(true);
                const res = await eventAPI.getActivityPresets();
                if (res.status && res.data) {
                    setPresets(res.data);
                } else {
                    setError(res.message || 'Không thể tải danh sách mẫu sự kiện');
                }
            } catch (err) {
                setError('Lỗi kết nối khi tải danh sách mẫu sự kiện');
            } finally {
                setLoading(false);
            }
        };
        fetchPresets();
    }, []);

    const selectedPreset = selectedPresetCode
        ? presets.find(p => p.code === selectedPresetCode) || null
        : null;

    const handleSetSelectedPresetCode = useCallback((code: ActivityPresetCode | '') => {
        setSelectedPresetCode(code);
        if (code) {
            const preset = presets.find(p => p.code === code);
            if (preset) {
                setEnabledRules(buildEnabledRules(preset));
                setPresetConfig(buildInitialConfig(preset));
            }
        } else {
            setEnabledRules({});
            setPresetConfig({});
        }
    }, [presets]);

    const setEnabledRule = useCallback((ruleKey: string, enabled: boolean) => {
        setEnabledRules(prev => ({ ...prev, [ruleKey]: enabled }));
    }, []);

    const setPresetConfigField = useCallback((fieldName: string, value: unknown) => {
        setPresetConfig((prev: ActivityPresetConfig) => ({ ...prev, [fieldName]: value }));
    }, []);

    const reset = useCallback(() => {
        setSelectedPresetCode('');
        setEnabledRules({});
        setPresetConfig({});
    }, []);

    return {
        presets,
        loading,
        error,
        selectedPresetCode,
        selectedPreset,
        enabledRules,
        presetConfig,
        setSelectedPresetCode: handleSetSelectedPresetCode,
        setEnabledRule,
        setPresetConfigField,
        setPresetConfig,
        reset
    };
};
