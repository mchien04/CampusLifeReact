import React from 'react';

interface ScoreSkeletonProps {
    variant?: 'overview' | 'history' | 'table';
}

export const ScoreSkeleton: React.FC<ScoreSkeletonProps> = ({ variant = 'overview' }) => {
    if (variant === 'table') {
        return (
            <div className="animate-pulse space-y-3 p-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex gap-4">
                        <div className="h-10 w-10 rounded-full bg-gray-200" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-1/3 rounded bg-gray-200" />
                            <div className="h-3 w-1/4 rounded bg-gray-100" />
                        </div>
                        <div className="h-6 w-16 rounded bg-gray-200" />
                    </div>
                ))}
            </div>
        );
    }

    if (variant === 'history') {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-28 rounded-2xl bg-gray-200" />
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-24 rounded-xl bg-gray-100" />
                ))}
            </div>
        );
    }

    return (
        <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-32 rounded-2xl bg-gray-200" />
                ))}
            </div>
            <div className="h-14 rounded-xl bg-gray-100" />
            {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-48 rounded-2xl bg-gray-100" />
            ))}
        </div>
    );
};

export default ScoreSkeleton;
