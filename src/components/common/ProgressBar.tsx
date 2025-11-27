import React from 'react';

interface ProgressBarProps {
    current: number;
    total: number;
    showLabel?: boolean;
    size?: 'small' | 'medium' | 'large';
    color?: 'primary' | 'green' | 'yellow' | 'blue';
}

const ProgressBar: React.FC<ProgressBarProps> = ({
    current,
    total,
    showLabel = true,
    size = 'medium',
    color = 'primary'
}) => {
    const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;

    const sizeClasses = {
        small: 'h-2',
        medium: 'h-3',
        large: 'h-4'
    };

    const colorClasses = {
        primary: 'bg-[#001C44]',
        green: 'bg-green-500',
        yellow: 'bg-[#FFD66D]',
        blue: 'bg-blue-500'
    };

    return (
        <div className="w-full">
            {showLabel && (
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">
                        {current} / {total}
                    </span>
                    <span className="text-sm text-gray-500">
                        {Math.round(percentage)}%
                    </span>
                </div>
            )}
            <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
                <div
                    className={`${colorClasses[color]} transition-all duration-300 ease-out ${sizeClasses[size]}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

export default ProgressBar;

