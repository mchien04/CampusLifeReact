import React, { useState } from 'react';

interface MultiSelectFieldProps {
    label: string;
    options: Array<{ value: number | string; label: string }>;
    value: (number | string)[];
    onChange: (value: (number | string)[]) => void;
    required?: boolean;
    error?: string;
}

const MultiSelectField: React.FC<MultiSelectFieldProps> = ({
    label,
    options,
    value = [],
    onChange,
    required = false,
    error
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const selectedValues = new Set(value.map(String));
    const selectedCount = selectedValues.size;
    const allSelected = options.length > 0 && selectedCount === options.length;

    const toggleOption = (val: string) => {
        if (selectedValues.has(val)) {
            onChange(value.filter(v => String(v) !== val));
        } else {
            onChange([...value, isNaN(Number(val)) ? val : Number(val)]);
        }
    };

    const toggleAll = () => {
        if (allSelected) {
            onChange([]);
        } else {
            onChange(options.map(o => o.value));
        }
    };

    const getSelectedLabel = () => {
        if (selectedCount === 0) return '-- Chọn --';
        if (allSelected) return `Tất cả (${selectedCount})`;
        const selectedOptions = options.filter(o => selectedValues.has(String(o.value)));
        if (selectedOptions.length <= 2) {
            return selectedOptions.map(o => o.label).join(', ');
        }
        return `${selectedOptions[0].label} +${selectedCount - 1} khác`;
    };

    return (
        <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>

            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full px-3 py-2 border rounded-md text-left focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        error ? 'border-red-500' : 'border-gray-300'
                    }`}
                >
                    <span className={selectedCount === 0 ? 'text-gray-400' : 'text-gray-900'}>
                        {getSelectedLabel()}
                    </span>
                </button>

                {isOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {options.length > 3 && (
                            <label className="flex items-center px-3 py-2 border-b border-gray-200 hover:bg-gray-50 cursor-pointer text-sm font-medium text-blue-600">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={toggleAll}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                                />
                                {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                            </label>
                        )}
                        {options.map(opt => (
                            <label
                                key={String(opt.value)}
                                className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedValues.has(String(opt.value))}
                                    onChange={() => toggleOption(String(opt.value))}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                                />
                                <span className="text-gray-700">{opt.label}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
    );
};

export default MultiSelectField;
