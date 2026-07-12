import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ActivityResponse } from '../../types';
import { taskAPI, eventAPI } from '../../services';
import { TaskAssignmentModal } from '../../components/task/TaskAssignmentModal';
import GradeSubmissionDrawer from '../../components/task/GradeSubmissionDrawer';
import {
    ActivityTaskResponse,
    TaskDashboardItem,
    TaskSubmissionSummary,
    getGradeBadgeClass,
    getGradeLabel,
    isSubmissionGraded,
} from '../../types/task';
import { getSubmissionStatusLabel } from '../../utils/submissionUtils';
import { SubmissionStatus } from '../../types/submission';
import { toast } from 'react-toastify';

type GradeFilter = 'all' | 'pending' | 'graded';

const selectClass =
    'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm transition-all focus:border-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-900/15';

const formatDate = (dateString?: string | null): string => {
    if (!dateString) return 'Không có hạn';
    return new Date(dateString).toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const toAssignmentTask = (task: TaskDashboardItem): ActivityTaskResponse => ({
    id: task.id,
    name: task.name,
    description: task.description ?? undefined,
    deadline: task.deadline ?? undefined,
    activityId: task.activityId,
    activityName: task.activityName,
    createdAt: task.createdAt,
    assignments: [],
    totalAssignments: 0,
    completedAssignments: 0,
    pendingAssignments: 0,
});

const applyLocalGrade = (
    tasks: TaskDashboardItem[],
    taskId: number,
    updated: TaskSubmissionSummary
): TaskDashboardItem[] =>
    tasks.map((task) => {
        if (task.id !== taskId) return task;
        const submissions = task.submissions.map((s) => (s.id === updated.id ? updated : s));
        const gradedCount = submissions.filter(isSubmissionGraded).length;
        const pendingGradeCount = submissions.length - gradedCount;
        return {
            ...task,
            submissions,
            gradedCount,
            pendingGradeCount,
            submissionCount: submissions.length,
        };
    });

const ActivityTaskDashboard: React.FC = () => {
    const [activities, setActivities] = useState<ActivityResponse[]>([]);
    const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
    const [tasks, setTasks] = useState<TaskDashboardItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
    const [assignmentModalTask, setAssignmentModalTask] = useState<ActivityTaskResponse | null>(null);
    const [selectedSubmission, setSelectedSubmission] = useState<{
        task: TaskDashboardItem;
        submission: TaskSubmissionSummary;
    } | null>(null);
    const [gradeFilter, setGradeFilter] = useState<GradeFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const loadActivities = useCallback(async () => {
        try {
            const response = await eventAPI.getActivitiesWithTasks();
            if (response.status && response.data) {
                setActivities(response.data);
            }
        } catch (err) {
            console.error('Error loading activities:', err);
            toast.error('Không tải được danh sách sự kiện');
        }
    }, []);

    useEffect(() => {
        loadActivities();
    }, [loadActivities]);

    const loadTasksForActivity = async (activityId: number) => {
        setLoading(true);
        setAccessDenied(false);
        setLoadError(null);
        try {
            const response = await taskAPI.getTaskDashboard(activityId);
            if (response.status && response.data) {
                const list = Array.isArray(response.data) ? response.data : [];
                setTasks(list);
                if (list.length === 1) {
                    setExpandedTaskId(list[0].id);
                }
            } else {
                const msg = response.message || 'Không thể tải dashboard nhiệm vụ';
                if (/access denied|không có quyền|403/i.test(msg)) {
                    setAccessDenied(true);
                    setTasks([]);
                } else {
                    setLoadError(msg);
                    setTasks([]);
                    toast.error(msg);
                }
            }
        } catch (err: unknown) {
            console.error('Error loading task dashboard:', err);
            const status = (err as { response?: { status?: number } })?.response?.status;
            if (status === 403) {
                setAccessDenied(true);
                setTasks([]);
            } else {
                setLoadError('Không thể tải dashboard nhiệm vụ');
                toast.error('Không thể tải dashboard nhiệm vụ');
                setTasks([]);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleActivityChange = (activityId: number | null) => {
        setSelectedActivityId(activityId);
        setExpandedTaskId(null);
        setTasks([]);
        setSelectedSubmission(null);
        setAccessDenied(false);
        setLoadError(null);
        setGradeFilter('all');
        setSearchQuery('');
        if (activityId) {
            loadTasksForActivity(activityId);
        }
    };

    const overview = useMemo(() => {
        const submissionCount = tasks.reduce((n, t) => n + (t.submissionCount || 0), 0);
        const gradedCount = tasks.reduce((n, t) => n + (t.gradedCount || 0), 0);
        const pendingGradeCount = tasks.reduce((n, t) => n + (t.pendingGradeCount || 0), 0);
        return {
            taskCount: tasks.length,
            submissionCount,
            gradedCount,
            pendingGradeCount,
        };
    }, [tasks]);

    const filterSubmissions = (submissions: TaskSubmissionSummary[]) => {
        const q = searchQuery.trim().toLowerCase();
        return submissions.filter((s) => {
            if (gradeFilter === 'pending' && isSubmissionGraded(s)) return false;
            if (gradeFilter === 'graded' && !isSubmissionGraded(s)) return false;
            if (!q) return true;
            return (
                s.studentName.toLowerCase().includes(q) ||
                s.studentCode.toLowerCase().includes(q)
            );
        });
    };

    const selectedActivity = activities.find((a) => a.id === selectedActivityId);

    const filterTabs: { value: GradeFilter; label: string }[] = [
        { value: 'all', label: 'Tất cả' },
        { value: 'pending', label: 'Chờ chấm' },
        { value: 'graded', label: 'Đã chấm' },
    ];

    return (
        <div className="space-y-6 pb-10">
            <header className="rounded-2xl bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 p-6 sm:p-8 text-white shadow-premium">
                <p className="text-sm font-medium text-white/55">Quản lý nhiệm vụ</p>
                <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-balance">
                    Dashboard nhiệm vụ & bài nộp
                </h1>
                <p className="mt-2 text-white/65 max-w-prose text-sm sm:text-base">
                    Một lần tải toàn bộ nhiệm vụ và bài nộp theo sự kiện. Chấm đạt / không đạt ngay trên danh sách.
                </p>
            </header>

            <section className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-premium">
                <label htmlFor="activity-select" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Chọn sự kiện
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                    <select
                        id="activity-select"
                        value={selectedActivityId ?? ''}
                        onChange={(e) =>
                            handleActivityChange(e.target.value ? parseInt(e.target.value, 10) : null)
                        }
                        className={selectClass}
                    >
                        <option value="">— Chọn sự kiện —</option>
                        {activities.map((activity) => (
                            <option key={activity.id} value={activity.id}>
                                {activity.name}
                            </option>
                        ))}
                    </select>
                    {selectedActivityId && (
                        <button
                            type="button"
                            onClick={() => loadTasksForActivity(selectedActivityId)}
                            disabled={loading}
                            className="shrink-0 rounded-xl bg-primary-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-800 disabled:opacity-50 active:scale-[0.98] transition-all"
                        >
                            Làm mới
                        </button>
                    )}
                </div>
                {selectedActivity && (
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                        <span className="font-medium text-primary-900">{selectedActivity.name}</span>
                        <span className="text-gray-300">·</span>
                        <span className="tabular-nums">{formatDate(selectedActivity.startDate)}</span>
                        {selectedActivity.location && (
                            <>
                                <span className="text-gray-300">·</span>
                                <span>{selectedActivity.location}</span>
                            </>
                        )}
                    </div>
                )}
            </section>

            {selectedActivityId && !accessDenied && !loadError && tasks.length > 0 && (
                <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                        { label: 'Nhiệm vụ', value: overview.taskCount },
                        { label: 'Bài nộp', value: overview.submissionCount },
                        { label: 'Đã chấm', value: overview.gradedCount },
                        { label: 'Chờ chấm', value: overview.pendingGradeCount },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm"
                        >
                            <p className="text-xs font-medium text-gray-400">{stat.label}</p>
                            <p className="mt-1 text-2xl font-semibold tracking-tight text-primary-900 tabular-nums">
                                {stat.value}
                            </p>
                        </div>
                    ))}
                </section>
            )}

            {selectedActivityId && (
                <section className="rounded-2xl border border-gray-100 bg-white shadow-premium overflow-hidden">
                    {loading ? (
                        <div className="p-6 space-y-4" aria-busy="true">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="animate-pulse space-y-3 rounded-xl border border-gray-50 p-4">
                                    <div className="h-4 w-1/3 rounded bg-gray-100" />
                                    <div className="h-3 w-2/3 rounded bg-gray-50" />
                                    <div className="flex gap-2">
                                        <div className="h-6 w-20 rounded-md bg-gray-100" />
                                        <div className="h-6 w-20 rounded-md bg-gray-100" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : accessDenied ? (
                        <div className="py-16 px-6 text-center">
                            <p className="text-base font-semibold text-red-800">Không có quyền truy cập</p>
                            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                                Bạn không thuộc khoa tổ chức sự kiện này, nên không thể xem dashboard nhiệm vụ.
                            </p>
                        </div>
                    ) : loadError ? (
                        <div className="py-16 px-6 text-center">
                            <p className="text-base font-semibold text-red-800">{loadError}</p>
                            <button
                                type="button"
                                onClick={() => loadTasksForActivity(selectedActivityId)}
                                className="mt-4 rounded-xl bg-primary-900 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800"
                            >
                                Thử lại
                            </button>
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="py-16 px-6 text-center text-gray-500">
                            <p className="font-medium text-gray-700">Sự kiện này chưa có nhiệm vụ</p>
                            <p className="mt-1 text-sm">Tạo nhiệm vụ từ trang chi tiết sự kiện để bắt đầu nhận bài nộp.</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-gray-100 px-4 py-3 sm:px-5 bg-gray-50/60">
                                <div className="flex rounded-xl border border-gray-200 bg-white p-0.5 w-fit">
                                    {filterTabs.map((tab) => (
                                        <button
                                            key={tab.value}
                                            type="button"
                                            onClick={() => setGradeFilter(tab.value)}
                                            className={`rounded-[10px] px-3 py-1.5 text-xs font-medium transition-colors ${
                                                gradeFilter === tab.value
                                                    ? 'bg-primary-900 text-white'
                                                    : 'text-gray-600 hover:text-primary-900'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="search"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Tìm theo tên hoặc MSSV..."
                                    className={`${selectClass} sm:max-w-xs sm:ml-auto`}
                                />
                            </div>

                            <div className="divide-y divide-gray-100">
                                {tasks.map((task) => {
                                    const filtered = filterSubmissions(task.submissions ?? []);
                                    const isOpen = expandedTaskId === task.id;
                                    const progress =
                                        task.submissionCount > 0
                                            ? Math.round((task.gradedCount / task.submissionCount) * 100)
                                            : 0;

                                    return (
                                        <div key={task.id}>
                                            <div
                                                className={`px-4 sm:px-5 py-4 flex flex-col lg:flex-row lg:items-center gap-3 cursor-pointer transition-colors ${
                                                    isOpen ? 'bg-primary-50/50' : 'hover:bg-gray-50/80'
                                                }`}
                                                onClick={() =>
                                                    setExpandedTaskId((prev) => (prev === task.id ? null : task.id))
                                                }
                                            >
                                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                                    <svg
                                                        className={`mt-0.5 h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 ${
                                                            isOpen ? 'rotate-90' : ''
                                                        }`}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M9 5l7 7-7 7"
                                                        />
                                                    </svg>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                                                            <h3 className="text-sm font-semibold text-gray-900">
                                                                {task.name}
                                                            </h3>
                                                            <span className="text-xs text-gray-400 tabular-nums">
                                                                {task.gradedCount}/{task.submissionCount} đã chấm
                                                                {task.pendingGradeCount > 0 && (
                                                                    <> · {task.pendingGradeCount} chờ</>
                                                                )}
                                                            </span>
                                                        </div>
                                                        {task.description && (
                                                            <p className="mt-0.5 text-sm text-gray-500 line-clamp-1">
                                                                {task.description}
                                                            </p>
                                                        )}
                                                        <p className="mt-1 text-xs text-gray-400 tabular-nums">
                                                            Hạn: {formatDate(task.deadline)}
                                                        </p>
                                                        {task.submissionCount > 0 && (
                                                            <div className="mt-2 h-1.5 max-w-xs rounded-full bg-gray-100 overflow-hidden">
                                                                <div
                                                                    className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                                                                    style={{ width: `${progress}%` }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div
                                                    className="flex flex-wrap items-center gap-2 lg:ml-4"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 tabular-nums">
                                                        {task.submissionCount} nộp
                                                    </span>
                                                    {task.gradedCount > 0 && (
                                                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200/80 tabular-nums">
                                                            {task.gradedCount} đã chấm
                                                        </span>
                                                    )}
                                                    {task.pendingGradeCount > 0 && (
                                                        <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200/80 tabular-nums">
                                                            {task.pendingGradeCount} chờ
                                                        </span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => setAssignmentModalTask(toAssignmentTask(task))}
                                                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary-900 hover:bg-primary-900/5 transition-colors"
                                                    >
                                                        Phân công
                                                    </button>
                                                </div>
                                            </div>

                                            {isOpen && (
                                                <div className="bg-gray-50/80 border-t border-gray-100 px-4 sm:px-5 py-4">
                                                    {(!task.submissions || task.submissions.length === 0) ? (
                                                        <p className="py-8 text-center text-sm text-gray-500">
                                                            Chưa có bài nộp nào cho nhiệm vụ này.
                                                        </p>
                                                    ) : filtered.length === 0 ? (
                                                        <p className="py-8 text-center text-sm text-gray-500">
                                                            Không có bài nộp khớp bộ lọc.
                                                        </p>
                                                    ) : (
                                                        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
                                                            <table className="min-w-full text-sm">
                                                                <thead>
                                                                    <tr className="border-b border-gray-100 bg-gray-50/80">
                                                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">
                                                                            Sinh viên
                                                                        </th>
                                                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 hidden md:table-cell">
                                                                            Trạng thái nộp
                                                                        </th>
                                                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">
                                                                            Kết quả
                                                                        </th>
                                                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 hidden lg:table-cell">
                                                                            Nộp lúc
                                                                        </th>
                                                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 hidden xl:table-cell">
                                                                            Tệp
                                                                        </th>
                                                                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500" />
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-50">
                                                                    {filtered.map((sub) => (
                                                                        <tr
                                                                            key={sub.id}
                                                                            className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                                                                            onClick={() =>
                                                                                setSelectedSubmission({
                                                                                    task,
                                                                                    submission: sub,
                                                                                })
                                                                            }
                                                                        >
                                                                            <td className="px-3 py-3">
                                                                                <p className="font-medium text-gray-900">
                                                                                    {sub.studentName}
                                                                                </p>
                                                                                <p className="text-xs font-mono text-gray-500 tabular-nums">
                                                                                    {sub.studentCode}
                                                                                </p>
                                                                                {sub.content && (
                                                                                    <p className="mt-1 text-xs text-gray-500 line-clamp-2 max-w-xs">
                                                                                        {sub.content}
                                                                                    </p>
                                                                                )}
                                                                                {isSubmissionGraded(sub) &&
                                                                                    sub.feedback && (
                                                                                        <p className="mt-1 text-xs text-emerald-700/80 line-clamp-1">
                                                                                            {sub.feedback}
                                                                                        </p>
                                                                                    )}
                                                                            </td>
                                                                            <td className="px-3 py-3 hidden md:table-cell">
                                                                                <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200/80">
                                                                                    {getSubmissionStatusLabel(
                                                                                        sub.status as SubmissionStatus
                                                                                    )}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-3 py-3">
                                                                                <span
                                                                                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${getGradeBadgeClass(sub)}`}
                                                                                >
                                                                                    {getGradeLabel(sub)}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-3 py-3 text-gray-500 tabular-nums hidden lg:table-cell">
                                                                                {formatDate(sub.submittedAt)}
                                                                            </td>
                                                                            <td className="px-3 py-3 hidden xl:table-cell">
                                                                                {sub.fileUrls &&
                                                                                sub.fileUrls.length > 0 ? (
                                                                                    <span className="text-xs text-gray-600 tabular-nums">
                                                                                        {sub.fileUrls.length} tệp
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="text-xs text-gray-300">
                                                                                        —
                                                                                    </span>
                                                                                )}
                                                                            </td>
                                                                            <td className="px-3 py-3 text-right">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setSelectedSubmission({
                                                                                            task,
                                                                                            submission: sub,
                                                                                        });
                                                                                    }}
                                                                                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary-900 hover:bg-primary-900/5 transition-colors"
                                                                                >
                                                                                    {isSubmissionGraded(sub)
                                                                                        ? 'Xem / chấm lại'
                                                                                        : 'Chấm bài'}
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </section>
            )}

            {!selectedActivityId && (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white/60 py-16 text-center">
                    <p className="text-sm font-medium text-gray-700">Chọn một sự kiện để bắt đầu</p>
                    <p className="mt-1 text-sm text-gray-400">
                        Dashboard sẽ tải nhiệm vụ và toàn bộ bài nộp trong một lần gọi API.
                    </p>
                </div>
            )}

            {assignmentModalTask && (
                <TaskAssignmentModal
                    task={assignmentModalTask}
                    onClose={() => setAssignmentModalTask(null)}
                    onRefresh={() => {
                        if (selectedActivityId) loadTasksForActivity(selectedActivityId);
                    }}
                />
            )}

            {selectedSubmission && (
                <GradeSubmissionDrawer
                    submission={selectedSubmission.submission}
                    taskName={selectedSubmission.task.name}
                    onClose={() => setSelectedSubmission(null)}
                    onGraded={(updated) => {
                        setTasks((prev) =>
                            applyLocalGrade(prev, selectedSubmission.task.id, updated)
                        );
                        setSelectedSubmission((cur) =>
                            cur ? { ...cur, submission: updated } : null
                        );
                    }}
                />
            )}
        </div>
    );
};

export default ActivityTaskDashboard;
