import React, { useState, useRef, useEffect } from 'react';

interface Option {
    value: number | string;
    label: string;
}

interface SearchableSelectProps {
    id?: string;
    label: string;
    options: Option[];
    value: number | string;
    onChange: (value: number | string) => void;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    className?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
    id,
    label,
    options,
    value,
    onChange,
    placeholder = 'Tìm kiếm...',
    disabled = false,
    required = false,
    className = ''
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Get selected option label
    const selectedOption = options.find(opt => opt.value === value);
    // If value is 0 or empty, show placeholder instead of option label
    const displayValue = (value === 0 || value === '') ? '' : (selectedOption ? selectedOption.label : '');

    // Filter options based on search term (exclude placeholder option with value 0)
    const filteredOptions = options.filter(option =>
        option.value !== 0 && option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
                setHighlightedIndex(-1);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Scroll highlighted option into view
    useEffect(() => {
        if (isOpen && highlightedIndex >= 0 && dropdownRef.current) {
            const highlightedElement = dropdownRef.current.children[highlightedIndex] as HTMLElement;
            if (highlightedElement) {
                highlightedElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [highlightedIndex, isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setSearchTerm(term);
        setIsOpen(true);
        setHighlightedIndex(-1);
    };

    const handleInputFocus = () => {
        setIsOpen(true);
        setSearchTerm('');
    };

    const handleOptionClick = (optionValue: number | string) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (disabled) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setIsOpen(true);
                setHighlightedIndex(prev =>
                    prev < filteredOptions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
                    handleOptionClick(filteredOptions[highlightedIndex].value);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setSearchTerm('');
                setHighlightedIndex(-1);
                inputRef.current?.blur();
                break;
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(0);
        setSearchTerm('');
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
                <div className="relative">
                    <input
                        ref={inputRef}
                        id={id}
                        type="text"
                        value={isOpen ? searchTerm : displayValue}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        onKeyDown={handleKeyDown}
                        disabled={disabled}
                        placeholder={placeholder}
                        className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                        {value && !disabled && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="text-gray-400 hover:text-gray-600 mr-1"
                                tabIndex={-1}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                        <svg
                            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>

                {isOpen && !disabled && (
                    <div
                        ref={dropdownRef}
                        className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
                    >
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500">
                                Không tìm thấy kết quả
                            </div>
                        ) : (
                            filteredOptions.map((option, index) => (
                                <div
                                    key={option.value}
                                    onClick={() => handleOptionClick(option.value)}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                    className={`px-3 py-2 cursor-pointer text-sm transition-colors ${
                                        option.value === value
                                            ? 'bg-[#001C44] text-white'
                                            : highlightedIndex === index
                                            ? 'bg-gray-100'
                                            : 'hover:bg-gray-50'
                                    }`}
                                >
                                    {option.label}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchableSelect;

