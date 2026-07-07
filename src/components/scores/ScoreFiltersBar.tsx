import React from 'react';
import { ScoreType, getScoreTypeLabel } from '../../types/score';

interface ScoreFiltersBarProps {
    yearId?: string;
    years?: Array<{ id: number; name: string }>;
    onYearChange?: (id: string) => void;
    semesterId?: string | number | null;
    semesters: Array<{ id: number; name: string }>;
    onSemesterChange: (id: string) => void;
    scoreType: 'ALL' | ScoreType | ScoreType | null;
    onScoreTypeChange: (type: 'ALL' | ScoreType | null) => void;
    showYearFilter?: boolean;
    showAllScoreTypes?: boolean;
    className?: string;
}

export const ScoreFiltersBar: React.FC<ScoreFiltersBarProps> = ({
    yearId,
    years = [],
    onYearChange,
    semesterId,
    semesters,
    onSemesterChange,
    scoreType,
    onScoreTypeChange,
    showYearFilter = false,
    showAllScoreTypes = true,
    className = '',
}) => {
    const selectClass =
        'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition-all duration-200 focus:border-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-900/15 hover:border-gray-300';

    return (
        <div className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-premium ${className}`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
                Bộ lọc
            </p>
            <div className={`grid grid-cols-1 gap-4 ${showYearFilter ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                {showYearFilter && onYearChange && (
                    <div>
                        <label htmlFor="score-filter-year" className="block text-sm font-medium text-gray-700 mb-1.5">
                            Năm học
                        </label>
                        <select
                            id="score-filter-year"
                            className={selectClass}
                            value={yearId}
                            onChange={(e) => onYearChange(e.target.value)}
                        >
                            {years.map(y => (
                                <option key={y.id} value={y.id}>{y.name}</option>
                            ))}
                        </select>
                    </div>
                )}
                <div>
                    <label htmlFor="score-filter-semester" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Học kỳ
                    </label>
                    <select
                        id="score-filter-semester"
                        className={selectClass}
                        value={semesterId ?? ''}
                        onChange={(e) => onSemesterChange(e.target.value)}
                    >
                        {semesters.length === 0 && (
                            <option value="">Chưa có học kỳ</option>
                        )}
                        {semesters.map(sem => (
                            <option key={sem.id} value={sem.id}>{sem.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="score-filter-type" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Loại điểm
                    </label>
                    <select
                        id="score-filter-type"
                        className={selectClass}
                        value={scoreType ?? ''}
                        onChange={(e) => {
                            const v = e.target.value;
                            if (!v) {
                                onScoreTypeChange(showAllScoreTypes ? 'ALL' : null);
                            } else {
                                onScoreTypeChange(v as ScoreType);
                            }
                        }}
                    >
                        {showAllScoreTypes && <option value="">Tất cả loại</option>}
                        {!showAllScoreTypes && <option value="">Tổng điểm</option>}
                        <option value="REN_LUYEN">{getScoreTypeLabel('REN_LUYEN')}</option>
                        <option value="CONG_TAC_XA_HOI">{getScoreTypeLabel('CONG_TAC_XA_HOI')}</option>
                        <option value="CHUYEN_DE">{getScoreTypeLabel('CHUYEN_DE')}</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

export default ScoreFiltersBar;
