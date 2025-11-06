import React, { useEffect, useMemo, useState } from 'react';
import { scoresAPI } from '../services/scoresAPI';
import { ProtectedRoute } from '../components/common';

type SortOrder = 'asc' | 'desc';

const semesters = [
    { id: 1, name: 'HK1 2024-2025' },
    { id: 2, name: 'HK2 2024-2025' },
];

const faculties = ['CNTT', 'Kinh tế', 'Du lịch'];
const classes = ['CNTT1', 'KT1', 'DL1'];

const ManagerScores: React.FC = () => {
    const [semesterId, setSemesterId] = useState<number>(semesters[0].id);
    const [faculty, setFaculty] = useState<string>('');
    const [className, setClassName] = useState<string>('');
    const [sort, setSort] = useState<SortOrder>('desc');
    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [loading, setLoading] = useState<boolean>(false);
    const [total, setTotal] = useState<number>(0);
    const [rows, setRows] = useState<any[]>([]);

    const load = async () => {
        setLoading(true);
        try {
            const res = await scoresAPI.listSemesterScores({ semesterId, facultyName: faculty || undefined, className: className || undefined, sort, page, pageSize });
            if (res.status && res.data) {
                setRows(res.data.items);
                setTotal(res.data.total);
            } else {
                setRows([]);
                setTotal(0);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [semesterId, faculty, className, sort, page, pageSize]);

    const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-6">
                        <h1 className="text-2xl font-bold text-gray-900">Điểm sinh viên theo học kỳ</h1>
                        <p className="text-sm text-gray-500">Xem, lọc và sắp xếp điểm tổng hợp</p>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="bg-white shadow rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Học kỳ</label>
                            <select className="w-full border rounded-md px-3 py-2" value={semesterId} onChange={e => { setPage(1); setSemesterId(Number(e.target.value)); }}>
                                {semesters.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Khoa</label>
                            <select className="w-full border rounded-md px-3 py-2" value={faculty} onChange={e => { setPage(1); setFaculty(e.target.value); }}>
                                <option value="">Tất cả</option>
                                {faculties.map(f => (
                                    <option key={f} value={f}>{f}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Lớp</label>
                            <select className="w-full border rounded-md px-3 py-2" value={className} onChange={e => { setPage(1); setClassName(e.target.value); }}>
                                <option value="">Tất cả</option>
                                {classes.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Sắp xếp</label>
                            <select className="w-full border rounded-md px-3 py-2" value={sort} onChange={e => setSort(e.target.value as SortOrder)}>
                                <option value="desc">Điểm cao → thấp</option>
                                <option value="asc">Điểm thấp → cao</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-md" onClick={() => { setPage(1); load(); }}>Làm mới</button>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">MSSV</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Họ tên</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lớp</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Khoa</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Học kỳ</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tổng điểm</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">Đang tải...</td></tr>
                                ) : rows.length === 0 ? (
                                    <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">Không có dữ liệu</td></tr>
                                ) : (
                                    rows.map((r, idx) => (
                                        <tr key={`${r.studentId}-${idx}`}>
                                            <td className="px-4 py-2 text-sm text-gray-900">{r.studentCode}</td>
                                            <td className="px-4 py-2 text-sm text-gray-900">{r.studentName}</td>
                                            <td className="px-4 py-2 text-sm text-gray-900">{r.className}</td>
                                            <td className="px-4 py-2 text-sm text-gray-900">{r.facultyName}</td>
                                            <td className="px-4 py-2 text-sm text-gray-900">{r.semesterName}</td>
                                            <td className="px-4 py-2 text-sm font-semibold text-blue-700">{r.totalScore}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between p-3 border-t">
                        <div className="text-sm text-gray-600">Tổng: {total}</div>
                        <div className="flex items-center space-x-2">
                            <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 border rounded disabled:opacity-50">Trước</button>
                            <span className="text-sm">Trang {page}/{totalPages}</span>
                            <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1 border rounded disabled:opacity-50">Sau</button>
                            <select className="ml-2 border rounded px-2 py-1 text-sm" value={pageSize} onChange={e => { setPage(1); setPageSize(Number(e.target.value)); }}>
                                {[10, 20, 50].map(s => <option key={s} value={s}>{s}/trang</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ManagerScores;


