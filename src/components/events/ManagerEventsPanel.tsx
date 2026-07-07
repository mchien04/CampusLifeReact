import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MagnifyingGlass, Plus, ArrowClockwise, Funnel } from '@phosphor-icons/react';
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
        className={`rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900 active:scale-[0.98] ${
            active
                ? variant === 'accent'
                    ? 'bg-accent text-primary-900'
                    : 'bg-primary-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80'
        }`}
    >
        {children}
    </button>
);

export interface ManagerEventsStats {
    total: number;
    ongoing: number;
    upcoming: number;
    ended: number;
    drafts: number;
}

interface ManagerEventsPanelProps {
    searchTerm: string;
    onSearchChange: (v: string) => void;
    typeFilter: ActivityType | 'ALL';
    onTypeFilterChange: (v: ActivityType | 'ALL') => void;
    scoreTypeFilter: ScoreType | 'ALL';
    onScoreTypeFilterChange: (v: ScoreType | 'ALL') => void;
    statusFilter: string;
    onStatusFilterChange: (v: string) => void;
    statusOptions: Array<{ value: string; label: string }>;
    stats: ManagerEventsStats;
    onRefresh: () => void;
    loading?: boolean;
}

export const ManagerEventsPanel: React.FC<ManagerEventsPanelProps> = ({
    searchTerm,
    onSearchChange,
    typeFilter,
    onTypeFilterChange,
    scoreTypeFilter,
    onScoreTypeFilterChange,
    statusFilter,
    onStatusFilterChange,
    statusOptions,
    stats,
    onRefresh,
    loading,
}) => {
    const [filtersOpen, setFiltersOpen] = useState(false);

    const statItems = [
        { label: 'Tổng', value: stats.total },
        { label: 'Đang diễn ra', value: stats.ongoing },
        { label: 'Sắp tới', value: stats.upcoming },
        { label: 'Nháp', value: stats.drafts },
    ];

    return (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex flex-col gap-3 p-4 border-b border-gray-100 lg:flex-row lg:items-center lg:gap-4">
                <div className="relative flex-1 min-w-0">
                    <MagnifyingGlass
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                    <input
                        type="search"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Tìm sự kiện..."
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-3 py-2 text-sm focus:border-primary-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-900/10"
                    />
                </div>

                <div className="hidden xl:flex items-center gap-2 shrink-0 flex-wrap">
                    {statItems.map(item => (
                        <div key={item.label} className="rounded-lg bg-gray-50 px-2.5 py-1.5 text-center min-w-[3.5rem]">
                            <p className="text-[10px] text-gray-500 leading-none">{item.label}</p>
                            <p className="text-sm font-bold text-primary-900 tabular-nums">{item.value}</p>
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-2 shrink-0 xl:hidden">
                    <div className="rounded-lg bg-gray-50 px-2.5 py-1.5 text-center">
                        <p className="text-[10px] text-gray-500 leading-none">Tổng</p>
                        <p className="text-sm font-bold text-primary-900 tabular-nums">{stats.total}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={() => setFiltersOpen(v => !v)}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                            filtersOpen ? 'border-primary-900/30 bg-primary-900/5 text-primary-900' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <Funnel size={16} />
                        Lọc
                    </button>
                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={loading}
                        className="inline-flex items-center justify-center rounded-xl border border-gray-200 p-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        title="Làm mới"
                    >
                        <ArrowClockwise size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <Link
                        to="/manager/events/create"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-primary-900 hover:bg-accent-hover transition-colors"
                    >
                        <Plus size={16} weight="bold" />
                        <span className="hidden sm:inline">Tạo</span>
                    </Link>
                </div>
            </div>

            {filtersOpen && (
                <div className="p-4 space-y-3 bg-gray-50/50 border-b border-gray-100">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-medium text-gray-500 w-16 shrink-0">Trạng thái</span>
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
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-medium text-gray-500 w-16 shrink-0">Loại</span>
                        <FilterChip active={typeFilter === 'ALL'} onClick={() => onTypeFilterChange('ALL')}>
                            Tất cả
                        </FilterChip>
                        {[ActivityType.SUKIEN, ActivityType.MINIGAME, ActivityType.CONG_TAC_XA_HOI, ActivityType.CHUYEN_DE_DOANH_NGHIEP].map(type => (
                            <FilterChip key={type} active={typeFilter === type} onClick={() => onTypeFilterChange(type)}>
                                {getActivityTypeLabel(type)}
                            </FilterChip>
                        ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-medium text-gray-500 w-16 shrink-0">Điểm</span>
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
            )}

            <div className="flex flex-wrap gap-2 px-4 py-2.5 text-xs">
                <Link to="/manager/series" className="text-primary-900 hover:underline">Chuỗi sự kiện</Link>
                <span className="text-gray-300">|</span>
                <Link to="/manager/minigames" className="text-primary-900 hover:underline">Mini Game</Link>
            </div>
        </div>
    );
};

export default ManagerEventsPanel;
