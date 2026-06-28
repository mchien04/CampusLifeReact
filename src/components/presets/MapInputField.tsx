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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <button
                    type="button"
                    onClick={validateAndAdd}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                    Thêm
                </button>
            </div>

            {(localError || error) && (
                <p className="text-red-500 text-sm">{localError || error}</p>
            )}

            {entries.length > 0 && (
                <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs font-medium text-gray-500 px-2">
                        <span>{keyLabel}</span>
                        <span>{valueLabel}</span>
                    </div>
                    {entries.map((entry) => (
                        <div key={entry.key} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                            <div className="grid grid-cols-2 gap-2 flex-1 text-sm">
                                <span className="font-medium">{entry.key}</span>
                                <span>{entry.value}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeEntry(entry.key)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium ml-2"
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
