import React from 'react';
import { ActivityPresetDefinition, ActivityPresetCode, SeriesPresetDefinition, SeriesPresetCode } from '../../types/presets';
import { getPresetDisplayName, getPresetDescription, getPresetNotes, getActivityTypeLabel } from '../../utils/vietnameseLabels';

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
    label = 'Mẫu cấu hình điểm',
    placeholder = '— Tùy chỉnh (không dùng mẫu) —',
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value as PresetCode;
        onChange(value);
    };

    const selectedPreset = presets.find((p) => p.code === selectedCode);

    return (
        <div className="space-y-3">
            <div>
                <label
                    htmlFor="preset-selector"
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400"
                >
                    {label}
                </label>
                <select
                    id="preset-selector"
                    value={selectedCode}
                    onChange={handleChange}
                    disabled={disabled}
                    className={`w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-900/15 focus:border-primary-900 ${
                        disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                    }`}
                >
                    <option value="">{placeholder}</option>
                    {presets.map((preset) => (
                        <option key={preset.code} value={preset.code}>
                            {getPresetDisplayName(preset.code, preset.displayName)}
                        </option>
                    ))}
                </select>
            </div>

            {selectedPreset && (
                <div className="rounded-xl border border-primary-100 bg-primary-50/50 px-3.5 py-3 text-sm text-primary-900 space-y-1.5">
                    <p className="font-semibold tracking-tight">
                        {getPresetDisplayName(selectedPreset.code, selectedPreset.displayName)}
                    </p>
                    <p className="text-primary-800/80 leading-relaxed">
                        {getPresetDescription(selectedPreset.code, selectedPreset.description)}
                    </p>
                    {selectedPreset.notes && selectedPreset.notes.length > 0 && (
                        <ul className="list-disc list-inside text-xs text-primary-800/70 space-y-0.5">
                            {getPresetNotes(selectedPreset.notes).map((note, idx) => (
                                <li key={idx}>{note}</li>
                            ))}
                        </ul>
                    )}
                    {'recommendedActivityTypes' in selectedPreset &&
                        selectedPreset.recommendedActivityTypes.length > 0 && (
                            <p className="text-xs text-primary-700/70">
                                Phù hợp:{' '}
                                {selectedPreset.recommendedActivityTypes
                                    .map((t) => getActivityTypeLabel(String(t)))
                                    .join(', ')}
                            </p>
                        )}
                </div>
            )}
        </div>
    );
};

export default PresetSelector;
