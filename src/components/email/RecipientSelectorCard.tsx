import React from 'react';
import { RecipientType, getRecipientTypeLabel } from '../../types/email';

interface RecipientSelectorCardProps {
    recipientType: RecipientType;
    isSelected: boolean;
    onSelect: (type: RecipientType) => void;
    selectedCount?: number;
    description?: string;
}

const RecipientSelectorCard: React.FC<RecipientSelectorCardProps> = ({
    recipientType,
    isSelected,
    onSelect,
    selectedCount,
    description
}) => {
    const getIcon = () => {
        switch (recipientType) {
            case RecipientType.INDIVIDUAL:
                return (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                );
            case RecipientType.BULK:
                return (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                );
            case RecipientType.CUSTOM_LIST:
                return (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                );
            case RecipientType.ACTIVITY_REGISTRATIONS:
                return (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                );
            case RecipientType.SERIES_REGISTRATIONS:
                return (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                );
            case RecipientType.ALL_STUDENTS:
                return (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                );
            case RecipientType.BY_CLASS:
                return (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                );
            case RecipientType.BY_DEPARTMENT:
                return (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                );
        }
    };

    const getColorClass = () => {
        if (isSelected) {
            return 'border-[#001C44] bg-[#001C44] bg-opacity-5';
        }
        return 'border-gray-200 hover:border-[#001C44] hover:bg-gray-50';
    };

    return (
        <button
            type="button"
            onClick={() => onSelect(recipientType)}
            className={`
                relative w-full p-4 rounded-lg border-2 transition-all duration-200
                ${getColorClass()}
                focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:ring-offset-2
            `}
        >
            <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 ${isSelected ? 'text-[#001C44]' : 'text-gray-600'}`}>
                    {getIcon()}
                </div>
                <div className="flex-1 text-left">
                    <div className="flex items-center justify-between">
                        <h3 className={`text-sm font-semibold ${isSelected ? 'text-[#001C44]' : 'text-gray-900'}`}>
                            {getRecipientTypeLabel(recipientType)}
                        </h3>
                        {isSelected && (
                            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#001C44] text-white text-xs">
                                ✓
                            </span>
                        )}
                    </div>
                    {description && (
                        <p className="mt-1 text-xs text-gray-500">{description}</p>
                    )}
                    {selectedCount !== undefined && selectedCount > 0 && (
                        <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                {selectedCount} người đã chọn
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </button>
    );
};

export default RecipientSelectorCard;

