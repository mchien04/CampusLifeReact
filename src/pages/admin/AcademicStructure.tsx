import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types';
import AcademicYears from './AcademicYears';
import Departments from './Departments';
import ClassManagement from './ClassManagement';

export type StructureTab = 'years' | 'departments' | 'classes';

const TAB_META: Record<
    StructureTab,
    { label: string; description: string; adminOnly?: boolean }
> = {
    years: {
        label: 'Năm học',
        description: 'Năm học và học kỳ',
        adminOnly: true,
    },
    departments: {
        label: 'Phòng ban',
        description: 'Khoa và phòng ban',
        adminOnly: true,
    },
    classes: {
        label: 'Lớp học',
        description: 'Lớp theo khoa',
    },
};

const AcademicStructure: React.FC = () => {
    const { userRole } = useAuth();
    const isAdmin = userRole === Role.ADMIN;
    const [searchParams, setSearchParams] = useSearchParams();

    const availableTabs = useMemo(
        () =>
            (Object.keys(TAB_META) as StructureTab[]).filter(
                (key) => isAdmin || !TAB_META[key].adminOnly
            ),
        [isAdmin]
    );

    const rawTab = searchParams.get('tab') as StructureTab | null;
    const activeTab: StructureTab = availableTabs.includes(rawTab as StructureTab)
        ? (rawTab as StructureTab)
        : availableTabs[0];

    const setTab = (tab: StructureTab) => {
        setSearchParams({ tab }, { replace: true });
    };

    return (
        <div className="space-y-6">
            <header className="relative overflow-hidden rounded-2xl border border-primary-900/10 bg-primary-900 px-6 py-7 sm:px-8 text-white shadow-premium">
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.12]"
                    style={{
                        backgroundImage:
                            'radial-gradient(ellipse at 0% 0%, #FFD66D 0%, transparent 55%), radial-gradient(ellipse at 100% 100%, #4b88b6 0%, transparent 50%)',
                    }}
                />
                <div className="relative">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent/90">
                        Cấu hình học vụ
                    </p>
                    <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-balance">
                        Tổ chức năm học, khoa & lớp
                    </h1>
                    <p className="mt-2 max-w-xl text-sm text-white/70 leading-relaxed">
                        Gộp quản lý năm học, phòng ban và lớp học trong một màn — chuyển tab để thao tác nhanh, không đổi API backend.
                    </p>
                </div>
            </header>

            <nav
                className="flex flex-wrap gap-1 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-premium"
                aria-label="Phân hệ tổ chức"
            >
                {availableTabs.map((tab) => {
                    const meta = TAB_META[tab];
                    const active = activeTab === tab;
                    return (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setTab(tab)}
                            className={`flex-1 min-w-[8rem] rounded-xl px-4 py-3 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900 ${
                                active
                                    ? 'bg-primary-900 text-white shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <span className="block text-sm font-semibold tracking-tight">{meta.label}</span>
                            <span
                                className={`mt-0.5 block text-xs ${
                                    active ? 'text-white/65' : 'text-gray-400'
                                }`}
                            >
                                {meta.description}
                            </span>
                        </button>
                    );
                })}
            </nav>

            <section
                key={activeTab}
                className="animate-[fadeIn_200ms_ease-out]"
                aria-live="polite"
            >
                {activeTab === 'years' && <AcademicYears embedded />}
                {activeTab === 'departments' && <Departments embedded />}
                {activeTab === 'classes' && <ClassManagement embedded />}
            </section>
        </div>
    );
};

export default AcademicStructure;
