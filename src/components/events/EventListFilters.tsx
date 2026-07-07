import React from 'react';
import { ActivityType, ScoreType } from '../../types/activity';
import { getActivityTypeLabel, getActivityScoreTypeLabel } from '../../utils/eventDisplayUtils';

type FilterChipProps = {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    variant?: 'primary' | 'accent';
};

const FilterChip: React.FC<FilterChipProps> = ({ active, onClick, children, variant = 'primary' }) => (
    <button
        type="button"
        onClick={onClick}
        className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900 focus-visible:ring-offset-2 active:scale-[0.98] ${
            active
                ? variant === 'accent'
                    ? 'bg-accent text-primary-900 shadow-sm'
                    : 'bg-primary-900 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200/80'
        }`}
    >
        {children}
    </button>
);

interface EventListFiltersProps {
    searchTerm?: string;
    onSearchChange?: (v: string) => void;
    typeFilter: ActivityType | 'ALL';
    onTypeFilterChange: (v: ActivityType | 'ALL') => void;
    scoreTypeFilter: ScoreType | 'ALL';
    onScoreTypeFilterChange: (v: ScoreType | 'ALL') => void;
    statusFilter: string;
    onStatusFilterChange: (v: string) => void;
    statusOptions: Array<{ value: string; label: string; color?: string }>;
    showSearch?: boolean;
}

export const EventListFilters: React.FC<EventListFiltersProps> = ({
    searchTerm,
    onSearchChange,
    typeFilter,
    onTypeFilterChange,
    scoreTypeFilter,
    onScoreTypeFilterChange,
    statusFilter,
    onStatusFilterChange,
    statusOptions,
    showSearch = false,
}) => {
    const inputClass =
        'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-all focus:border-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-900/15';

    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-premium space-y-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Bộ lọc</p>

            {showSearch && onSearchChange && (
                <div>
                    <label htmlFor="event-search" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Tìm kiếm
                    </label>
                    <input
                        id="event-search"
                        type="search"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Tên hoặc mô tả sự kiện..."
                        className={inputClass}
                    />
                </div>
            )}

            <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Loại sự kiện</p>
                <div className="flex flex-wrap gap-2">
                    <FilterChip active={typeFilter === 'ALL'} onClick={() => onTypeFilterChange('ALL')}>
                        Tất cả
                    </FilterChip>
                    {[ActivityType.SUKIEN, ActivityType.MINIGAME, ActivityType.CONG_TAC_XA_HOI, ActivityType.CHUYEN_DE_DOANH_NGHIEP].map(type => (
                        <FilterChip key={type} active={typeFilter === type} onClick={() => onTypeFilterChange(type)}>
                            {getActivityTypeLabel(type)}
                        </FilterChip>
                    ))}
                </div>
            </div>

            <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Kiểu tính điểm</p>
                <div className="flex flex-wrap gap-2">
                    <FilterChip active={scoreTypeFilter === 'ALL'} onClick={() => onScoreTypeFilterChange('ALL')} variant="accent">
                        Tất cả
                    </FilterChip>
                    {[ScoreType.REN_LUYEN, ScoreType.CONG_TAC_XA_HOI, ScoreType.CHUYEN_DE].map(st => (
                        <FilterChip key={st} active={scoreTypeFilter === st} onClick={() => onScoreTypeFilterChange(st)} variant="accent">
                            {getActivityScoreTypeLabel(st)}
                        </FilterChip>
                    ))}
                </div>
            </div>

            <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Trạng thái</p>
                <div className="flex flex-wrap gap-2">
                    {statusOptions.map(opt => (
                        <FilterChip
                            key={opt.value}
                            active={statusFilter === opt.value}
                            onClick={() => onStatusFilterChange(opt.value)}
                        >
                            {opt.label}
                        </FilterChip>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EventListFilters;
