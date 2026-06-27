import React from 'react';
import { ActivityPresetDefinition, ActivityPresetCode, SeriesPresetDefinition, SeriesPresetCode } from '../../types/presets';

type PresetDefinition = ActivityPresetDefinition | SeriesPresetDefinition;
type PresetCode = ActivityPresetCode | SeriesPresetCode;

interface PresetSelectorProps {
    presets: PresetDefinition[];
    selectedCode: string;
    onChange: (code: string) => void;
    disabled?: boolean;
    label?: string;
    placeholder?: string;
}

const PresetSelector: React.FC<PresetSelectorProps> = ({
    presets,
    selectedCode,
    onChange,
    disabled = false,
    label = 'Mẫu cấu hình điểm (Preset)',
    placeholder = '-- Tùy chỉnh (Không dùng mẫu) --'
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value as PresetCode;
        onChange(value);
    };

    const selectedPreset = presets.find(p => p.code === selectedCode);

    return (
        <div className="space-y-3">
            <div>
                <label htmlFor="preset-selector" className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                </label>
                <select
                    id="preset-selector"
                    value={selectedCode}
                    onChange={handleChange}
                    disabled={disabled}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                    <option value="">{placeholder}</option>
                    {presets.map(preset => (
                        <option key={preset.code} value={preset.code}>
                            {preset.displayName}
                        </option>
                    ))}
                </select>
            </div>

            {selectedPreset && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-900 space-y-2">
                    <p className="font-medium">{selectedPreset.displayName}</p>
                    <p className="text-blue-700">{selectedPreset.description}</p>
                    {selectedPreset.notes && selectedPreset.notes.length > 0 && (
                        <ul className="list-disc list-inside text-xs text-blue-700 space-y-1">
                            {selectedPreset.notes.map((note, idx) => (
                                <li key={idx}>{note}</li>
                            ))}
                        </ul>
                    )}
                    {'recommendedActivityTypes' in selectedPreset && selectedPreset.recommendedActivityTypes.length > 0 && (
                        <p className="text-xs text-blue-600">
                            Phù hợp: {selectedPreset.recommendedActivityTypes.join(', ')}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default PresetSelector;
