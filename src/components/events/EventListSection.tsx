import React from 'react';

interface EventListSectionProps {
    title: string;
    count: number;
    accent?: 'green' | 'blue' | 'gray' | 'amber';
    children: React.ReactNode;
}

const ACCENT_BAR: Record<NonNullable<EventListSectionProps['accent']>, string> = {
    green: 'bg-emerald-500',
    blue: 'bg-sky-500',
    gray: 'bg-gray-400',
    amber: 'bg-amber-500',
};

export const EventListSection: React.FC<EventListSectionProps> = ({
    title,
    count,
    accent = 'blue',
    children,
}) => (
    <section className="space-y-5">
        <div className="flex items-center gap-3">
            <span className={`h-8 w-1 rounded-full ${ACCENT_BAR[accent]}`} aria-hidden />
            <h2 className="text-xl font-bold text-primary-900 tracking-tight">
                {title}
                <span className="ml-2 text-sm font-normal text-gray-400 tabular-nums">({count})</span>
            </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {children}
        </div>
    </section>
);

export default EventListSection;
