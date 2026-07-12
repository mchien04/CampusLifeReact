import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { scoresAPI } from '../../services/scoresAPI';
import { studentAPI } from '../../services/studentAPI';
import {
    ScoreType,
    SCORE_TYPE_ORDER,
    getScoreTypeLabel,
    BulkManualScoreItemResult,
} from '../../types/score';
import { StudentResponse } from '../../types/student';

interface SemesterOption {
    id: number;
    name: string;
}

interface BulkEntryRow {
    studentId: number;
    label: string;
    points: string;
    reason: string;
}

interface ManualScoreEntryModalProps {
    open: boolean;
    semesters: SemesterOption[];
    defaultSemesterId?: number | null;
    defaultStudentId?: number | null;
    defaultStudentLabel?: string | null;
    defaultScoreType?: ScoreType | null;
    onClose: () => void;
    onSuccess?: (semesterId: number) => void;
}

const MAX_BULK = 200;

const inputClass =
    'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm transition-all focus:border-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-900/15';

const ManualScoreEntryModal: React.FC<ManualScoreEntryModalProps> = ({
    open,
    semesters,
    defaultSemesterId,
    defaultStudentId,
    defaultStudentLabel,
    defaultScoreType,
    onClose,
    onSuccess,
}) => {
    const [mode, setMode] = useState<'single' | 'bulk'>('single');
    const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(defaultSemesterId ?? null);
    const [studentId, setStudentId] = useState<number | null>(defaultStudentId ?? null);
    const [studentLabel, setStudentLabel] = useState(defaultStudentLabel ?? '');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchResults, setSearchResults] = useState<StudentResponse[]>([]);
    const [searching, setSearching] = useState(false);
    const [scoreType, setScoreType] = useState<ScoreType>(defaultScoreType ?? 'REN_LUYEN');
    const [points, setPoints] = useState('');
    const [defaultBulkPoints, setDefaultBulkPoints] = useState('');
    const [reason, setReason] = useState('');
    const [activityId, setActivityId] = useState('');
    const [bulkEntries, setBulkEntries] = useState<BulkEntryRow[]>([]);
    const [bulkResults, setBulkResults] = useState<BulkManualScoreItemResult[] | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open) return;
        setMode(defaultStudentId ? 'single' : 'single');
        setSelectedSemesterId(defaultSemesterId ?? (semesters[0]?.id ?? null));
        setStudentId(defaultStudentId ?? null);
        setStudentLabel(defaultStudentLabel ?? '');
        setSearchKeyword('');
        setSearchResults([]);
        setScoreType(defaultScoreType ?? 'REN_LUYEN');
        setPoints('');
        setDefaultBulkPoints('');
        setReason('');
        setActivityId('');
        setBulkEntries([]);
        setBulkResults(null);
    }, [open, defaultSemesterId, defaultStudentId, defaultStudentLabel, defaultScoreType, semesters]);

    useEffect(() => {
        if (!open || !searchKeyword.trim() || searchKeyword.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const response = await studentAPI.searchStudents(searchKeyword.trim(), 0, 8);
                if (response.status && response.data) {
                    setSearchResults(response.data.content ?? []);
                } else {
                    setSearchResults([]);
                }
            } catch {
                setSearchResults([]);
            } finally {
                setSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchKeyword, open]);

    if (!open) return null;

    const addBulkStudent = (s: StudentResponse) => {
        if (bulkEntries.some((e) => e.studentId === s.id)) {
            toast.warning('Sinh viên đã có trong danh sách');
            return;
        }
        if (bulkEntries.length >= MAX_BULK) {
            toast.warning(`Tối đa ${MAX_BULK} sinh viên mỗi lần`);
            return;
        }
        setBulkEntries((prev) => [
            ...prev,
            {
                studentId: s.id,
                label: `${s.studentCode} - ${s.fullName}`,
                points: defaultBulkPoints,
                reason: '',
            },
        ]);
        setSearchKeyword('');
        setSearchResults([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSemesterId) {
            toast.warning('Vui lòng chọn học kỳ tích điểm');
            return;
        }
        if (!reason.trim()) {
            toast.warning('Vui lòng nhập lý do');
            return;
        }

        if (mode === 'single') {
            if (!studentId) {
                toast.warning('Vui lòng chọn sinh viên');
                return;
            }
            if (!points.trim()) {
                toast.warning('Vui lòng nhập số điểm');
                return;
            }
        } else {
            if (bulkEntries.length === 0) {
                toast.warning('Vui lòng thêm ít nhất một sinh viên');
                return;
            }
            if (bulkEntries.some((row) => !row.points.trim())) {
                toast.warning('Vui lòng nhập điểm cho mọi sinh viên');
                return;
            }
        }

        const activityTrimmed = activityId.trim();
        const activityValue = activityTrimmed ? Number(activityTrimmed) : null;

        setSubmitting(true);
        setBulkResults(null);
        try {
            if (mode === 'single') {
                const response = await scoresAPI.createManualScore({
                    studentId: studentId!,
                    semesterId: selectedSemesterId,
                    scoreType,
                    points: points.trim(),
                    reason: reason.trim(),
                    activityId: activityValue,
                });
                if (response.status && response.data) {
                    toast.success(response.message || 'Đã nhập điểm thủ công');
                    onSuccess?.(selectedSemesterId);
                    onClose();
                } else {
                    toast.error(response.message || 'Không nhập được điểm');
                }
            } else {
                const response = await scoresAPI.createBulkManualScore({
                    semesterId: selectedSemesterId,
                    scoreType,
                    reason: reason.trim(),
                    activityId: activityValue,
                    entries: bulkEntries.map((row) => ({
                        studentId: row.studentId,
                        points: row.points.trim(),
                        reason: row.reason.trim() || null,
                    })),
                });
                if (response.status && response.data) {
                    const { successCount, failureCount, results } = response.data;
                    setBulkResults(results);
                    if (failureCount === 0) {
                        toast.success(`Đã nhập điểm cho ${successCount} sinh viên`);
                        onSuccess?.(selectedSemesterId);
                    } else if (successCount === 0) {
                        toast.error(`Không nhập được điểm (${failureCount} lỗi)`);
                    } else {
                        toast.warning(`Thành công ${successCount}, thất bại ${failureCount}`);
                        onSuccess?.(selectedSemesterId);
                    }
                } else {
                    toast.error(response.message || 'Không nhập được điểm hàng loạt');
                }
            }
        } catch (error: unknown) {
            const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(msg || 'Không có quyền hoặc dữ liệu không hợp lệ');
        } finally {
            setSubmitting(false);
        }
    };

    const studentSearchBlock = (onPick: (s: StudentResponse) => void) => (
        <div className="relative">
            <input
                className={inputClass}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm theo MSSV hoặc họ tên"
            />
            {(searching || searchResults.length > 0) && (
                <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-100 bg-white shadow-lg max-h-48 overflow-y-auto">
                    {searching && (
                        <p className="px-3 py-2 text-sm text-gray-400">Đang tìm...</p>
                    )}
                    {searchResults.map((s) => (
                        <button
                            key={s.id}
                            type="button"
                            className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                            onClick={() => onPick(s)}
                        >
                            <span className="font-mono text-gray-600">{s.studentCode}</span>
                            <span className="ml-2 text-gray-900">{s.fullName}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-primary-900/40 backdrop-blur-sm p-0 sm:p-4"
            role="dialog"
            aria-modal
            aria-labelledby="manual-score-title"
        >
            <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl shadow-2xl max-h-[92dvh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 sm:px-6 py-4">
                    <div>
                        <h2 id="manual-score-title" className="text-lg font-bold text-primary-900">
                            Nhập điểm thủ công
                        </h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Điểm ghi nhận ngay theo học kỳ đã chọn
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        aria-label="Đóng"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                    <div className="flex gap-2 rounded-xl bg-gray-100/80 p-1 w-fit">
                        <button
                            type="button"
                            onClick={() => { setMode('single'); setBulkResults(null); }}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                mode === 'single' ? 'bg-white text-primary-900 shadow-sm' : 'text-gray-600'
                            }`}
                        >
                            Một sinh viên
                        </button>
                        <button
                            type="button"
                            onClick={() => { setMode('bulk'); setBulkResults(null); }}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                mode === 'bulk' ? 'bg-white text-primary-900 shadow-sm' : 'text-gray-600'
                            }`}
                        >
                            Nhiều sinh viên
                        </button>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="manual-semester" className="block text-sm font-medium text-gray-700">
                            Học kỳ tích điểm
                        </label>
                        <select
                            id="manual-semester"
                            className={inputClass}
                            value={selectedSemesterId ?? ''}
                            onChange={(e) => setSelectedSemesterId(e.target.value ? Number(e.target.value) : null)}
                            required
                        >
                            <option value="">Chọn học kỳ</option>
                            {semesters.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="manual-score-type" className="block text-sm font-medium text-gray-700">
                            Loại điểm
                        </label>
                        <select
                            id="manual-score-type"
                            className={inputClass}
                            value={scoreType}
                            onChange={(e) => setScoreType(e.target.value as ScoreType)}
                        >
                            {SCORE_TYPE_ORDER.map((t) => (
                                <option key={t} value={t}>{getScoreTypeLabel(t)}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="manual-reason" className="block text-sm font-medium text-gray-700">
                            Lý do chung
                        </label>
                        <textarea
                            id="manual-reason"
                            className={inputClass}
                            rows={2}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Ví dụ: Hỗ trợ chuẩn bị sự kiện Open Day"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="manual-activity" className="block text-sm font-medium text-gray-700">
                            Mã hoạt động (không bắt buộc)
                        </label>
                        <input
                            id="manual-activity"
                            type="number"
                            className={inputClass}
                            value={activityId}
                            onChange={(e) => setActivityId(e.target.value)}
                            placeholder="ID hoạt động nếu có"
                        />
                    </div>

                    {mode === 'single' ? (
                        <>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Sinh viên</label>
                                {studentId ? (
                                    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                                        <span className="text-sm font-medium text-gray-900">
                                            {studentLabel || `ID ${studentId}`}
                                        </span>
                                        {!defaultStudentId && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setStudentId(null);
                                                    setStudentLabel('');
                                                }}
                                                className="text-xs font-medium text-primary-900 hover:underline"
                                            >
                                                Đổi
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    studentSearchBlock((s) => {
                                        setStudentId(s.id);
                                        setStudentLabel(`${s.studentCode} - ${s.fullName}`);
                                        setSearchKeyword('');
                                        setSearchResults([]);
                                    })
                                )}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="manual-points" className="block text-sm font-medium text-gray-700">
                                    Số điểm
                                </label>
                                <input
                                    id="manual-points"
                                    type="number"
                                    step="any"
                                    className={inputClass}
                                    value={points}
                                    onChange={(e) => setPoints(e.target.value)}
                                    placeholder="Dương để cộng, âm để trừ"
                                    required
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label htmlFor="bulk-default-points" className="block text-sm font-medium text-gray-700">
                                        Điểm mặc định khi thêm SV
                                    </label>
                                    <input
                                        id="bulk-default-points"
                                        type="number"
                                        step="any"
                                        className={inputClass}
                                        value={defaultBulkPoints}
                                        onChange={(e) => setDefaultBulkPoints(e.target.value)}
                                        placeholder="Áp dụng khi thêm mới"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Thêm sinh viên ({bulkEntries.length}/{MAX_BULK})
                                    </label>
                                    {studentSearchBlock(addBulkStudent)}
                                </div>
                            </div>

                            {bulkEntries.length > 0 && (
                                <div className="rounded-xl border border-gray-100 overflow-hidden">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-2 text-left font-medium text-gray-500">Sinh viên</th>
                                                <th className="px-3 py-2 text-left font-medium text-gray-500 w-28">Điểm</th>
                                                <th className="px-3 py-2 text-left font-medium text-gray-500 hidden sm:table-cell">Lý do riêng</th>
                                                <th className="px-3 py-2 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {bulkEntries.map((row) => (
                                                <tr key={row.studentId}>
                                                    <td className="px-3 py-2 text-gray-900">{row.label}</td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number"
                                                            step="any"
                                                            className={inputClass}
                                                            value={row.points}
                                                            onChange={(e) =>
                                                                setBulkEntries((prev) =>
                                                                    prev.map((r) =>
                                                                        r.studentId === row.studentId
                                                                            ? { ...r, points: e.target.value }
                                                                            : r
                                                                    )
                                                                )
                                                            }
                                                            required
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 hidden sm:table-cell">
                                                        <input
                                                            className={inputClass}
                                                            value={row.reason}
                                                            onChange={(e) =>
                                                                setBulkEntries((prev) =>
                                                                    prev.map((r) =>
                                                                        r.studentId === row.studentId
                                                                            ? { ...r, reason: e.target.value }
                                                                            : r
                                                                    )
                                                                )
                                                            }
                                                            placeholder="Không bắt buộc"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setBulkEntries((prev) =>
                                                                    prev.filter((r) => r.studentId !== row.studentId)
                                                                )
                                                            }
                                                            className="text-xs text-red-700 hover:underline"
                                                        >
                                                            Xóa
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {bulkResults && (
                                <div className="rounded-xl border border-gray-100 overflow-hidden">
                                    <p className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50">
                                        Kết quả từng sinh viên
                                    </p>
                                    <ul className="divide-y divide-gray-50 max-h-40 overflow-y-auto">
                                        {bulkResults.map((r) => {
                                            const label =
                                                bulkEntries.find((e) => e.studentId === r.studentId)?.label
                                                ?? `ID ${r.studentId}`;
                                            return (
                                                <li key={r.studentId} className="px-3 py-2 text-sm flex justify-between gap-2">
                                                    <span className="text-gray-800">{label}</span>
                                                    {r.success ? (
                                                        <span className="text-emerald-700 font-medium">Thành công</span>
                                                    ) : (
                                                        <span className="text-red-700 text-right">
                                                            {r.error || 'Thất bại'}
                                                        </span>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}
                        </>
                    )}

                    <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                            {bulkResults ? 'Đóng' : 'Hủy'}
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="rounded-xl bg-primary-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 active:scale-[0.98] disabled:opacity-50 transition-all"
                        >
                            {submitting ? 'Đang lưu...' : mode === 'bulk' ? 'Lưu hàng loạt' : 'Lưu điểm'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ManualScoreEntryModal;
