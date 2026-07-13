import React, { useState, useEffect } from 'react';

interface MapEntry {
    key: string;
    value: string;
}

interface MapInputFieldProps {
    label: string;
    value: Record<string, number>;
    onChange: (value: Record<string, number>) => void;
    required?: boolean;
    error?: string;
    keyLabel?: string;
    valueLabel?: string;
    keyPlaceholder?: string;
    valuePlaceholder?: string;
    minKey?: number;
    minValue?: number;
}

const MapInputField: React.FC<MapInputFieldProps> = ({
    label,
    value,
    onChange,
    required = false,
    error,
    keyLabel = 'Số buổi',
    valueLabel = 'Điểm thưởng',
    keyPlaceholder = 'Nhập số buổi',
    valuePlaceholder = 'Nhập điểm',
    minKey = 1,
    minValue = 0
}) => {
    const [entries, setEntries] = useState<MapEntry[]>([]);
    const [inputKey, setInputKey] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);

    useEffect(() => {
        const sorted = Object.entries(value)
            .map(([k, v]) => ({ key: k, value: String(v) }))
            .sort((a, b) => parseInt(a.key) - parseInt(b.key));
        setEntries(sorted);
    }, [value]);

    const validateAndAdd = () => {
        const keyNum = parseInt(inputKey, 10);
        const valNum = parseFloat(inputValue);

        if (isNaN(keyNum) || isNaN(valNum)) {
            setLocalError('Vui lòng nhập số hợp lệ cho cả hai trường');
            return;
        }

        if (keyNum < minKey) {
            setLocalError(`Số buổi phải >= ${minKey}`);
            return;
        }

        if (valNum < minValue) {
            setLocalError(`Điểm phải >= ${minValue}`);
            return;
        }

        if (value[String(keyNum)] !== undefined) {
            setLocalError('Mốc này đã tồn tại');
            return;
        }

        // Check ascending order
        const existingKeys = Object.keys(value).map(Number).sort((a, b) => a - b);
        if (existingKeys.length > 0 && keyNum <= existingKeys[existingKeys.length - 1]) {
            setLocalError('Số buổi phải tăng dần so với các mốc hiện có');
            return;
        }

        const newValue = { ...value, [String(keyNum)]: valNum };
        onChange(newValue);
        setInputKey('');
        setInputValue('');
        setLocalError(null);
    };

    const removeEntry = (key: string) => {
        const newValue = { ...value };
        delete newValue[key];
        onChange(newValue);
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>

            <div className="flex gap-2">
                <div className="flex-1">
                    <input
                        type="number"
                        min={minKey}
                        step="1"
                        value={inputKey}
                        onChange={(e) => setInputKey(e.target.value)}
                        placeholder={keyPlaceholder}
                        className="w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-900/25 focus:border-primary-900/40 border-gray-200 hover:border-gray-300"
                    />
                </div>
                <div className="flex-1">
                    <input
                        type="number"
                        min={minValue}
                        step="0.1"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={valuePlaceholder}
                        className="w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-900/25 focus:border-primary-900/40 border-gray-200 hover:border-gray-300"
                    />
                </div>
                <button
                    type="button"
                    onClick={validateAndAdd}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-900 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-800 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary-900/30"
                >
                    Thêm
                </button>
            </div>

            {(localError || error) && (
                <p className="text-rose-600 text-sm mt-1">{localError || error}</p>
            )}

            {entries.length > 0 && (
                <div className="space-y-2 mt-4">
                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-gray-500 px-4 uppercase tracking-wider">
                        <span>{keyLabel}</span>
                        <span>{valueLabel}</span>
                    </div>
                    {entries.map((entry) => (
                        <div key={entry.key} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3 transition-colors hover:bg-gray-50">
                            <div className="grid grid-cols-2 gap-2 flex-1 text-sm">
                                <span className="font-medium text-gray-900 tabular-nums">{entry.key}</span>
                                <span className="text-gray-900 tabular-nums">{entry.value}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeEntry(entry.key)}
                                className="inline-flex items-center gap-1 text-sm font-medium text-rose-600 hover:text-rose-800 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-200 rounded-lg px-2 py-1"
                            >
                                Xóa
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MapInputField;
