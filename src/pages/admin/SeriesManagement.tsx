import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { seriesAPI } from '../../services/seriesAPI';
import { SeriesResponse } from '../../types/series';
import { LoadingSpinner } from '../../components/common';
import { toast } from 'react-toastify';

const SeriesManagement: React.FC = () => {
    const navigate = useNavigate();
    const [series, setSeries] = useState<SeriesResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadSeries();
    }, []);

    const loadSeries = async () => {
        try {
            setLoading(true);
            const response = await seriesAPI.getSeries();
            if (response.status && response.data) {
                // Filter out deleted series (backend uses "deleted" field)
                const activeSeries = response.data.filter(s => !s.deleted);
                setSeries(activeSeries);
            } else {
                setError(response.message || 'Không thể tải danh sách chuỗi sự kiện');
            }
        } catch (err) {
            setError('Có lỗi xảy ra khi tải danh sách chuỗi sự kiện');
            console.error('Error loading series:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number, name: string) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa chuỗi sự kiện "${name}"?`)) {
            return;
        }

        try {
            const response = await seriesAPI.deleteSeries(id);
            if (response.status) {
                toast.success('Xóa chuỗi sự kiện thành công');
                await loadSeries();
            } else {
                toast.error(response.message || 'Xóa thất bại');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi xóa');
            console.error('Error deleting series:', err);
        }
    };

    const filteredSeries = series.filter(s => {
        const matchesSearch =
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.description?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="text-red-600 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-[#001C44] mb-2">Có lỗi xảy ra</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={loadSeries}
                        className="btn-primary px-6 py-3 rounded-lg font-medium"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    const getScoreTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            'REN_LUYEN': 'Rèn luyện',
            'CONG_TAC_XA_HOI': 'Công tác xã hội',
            'CHUYEN_DE': 'Chuyên đề'
        };
        return labels[type] || type;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 flex items-center">
                            <span className="mr-3 text-4xl">📋</span>
                            Quản lý chuỗi sự kiện
                        </h1>
                        <p className="text-gray-200 text-lg">Quản lý các chuỗi sự kiện và activities trong hệ thống</p>
                    </div>
                    <Link
                        to="/manager/series/create"
                        className="px-5 py-2.5 bg-[#FFD66D] text-[#001C44] rounded-lg hover:bg-[#FFC947] font-semibold shadow-lg hover:shadow-xl transition-all"
                    >
                        + Tạo chuỗi mới
                    </Link>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <div className="relative">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm kiếm chuỗi sự kiện theo tên hoặc mô tả..."
                        className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-all"
                    />
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">
                        🔍
                    </span>
                </div>
            </div>

            {/* Series List */}
            {filteredSeries.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
                    <div className="text-gray-400 text-6xl mb-4">📭</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Không có chuỗi sự kiện nào</h3>
                    <p className="text-gray-500 mb-6">
                        {searchTerm ? 'Thử tìm kiếm với từ khóa khác' : 'Tạo chuỗi sự kiện đầu tiên của bạn'}
                    </p>
                    {!searchTerm && (
                        <Link
                            to="/manager/series/create"
                            className="btn-primary inline-flex items-center px-5 py-2.5 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Tạo chuỗi sự kiện đầu tiên
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredSeries.map((s) => (
                        <div
                            key={s.id}
                            className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200 border-l-4 border-l-[#001C44]"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    {/* Series Title */}
                                    <div className="flex items-center mb-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-[#001C44] to-[#002A66] rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                                            <span className="text-white text-lg">📋</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                                                {s.name}
                                            </h3>
                                            {s.description && (
                                                <p className="text-sm text-gray-600 line-clamp-2">
                                                    {s.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Series Stats */}
                                    <div className="pl-12 flex flex-wrap gap-4 text-sm">
                                        <div className="flex items-center text-gray-600">
                                            <svg className="w-4 h-4 mr-1.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                            <span className="font-medium">{s.activities?.length || s.totalActivities || 0}</span>
                                            <span className="ml-1 text-gray-500">sự kiện</span>
                                        </div>
                                        <div className="flex items-center text-gray-600">
                                            <svg className="w-4 h-4 mr-1.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                            </svg>
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                                {getScoreTypeLabel(s.scoreType)}
                                            </span>
                                        </div>
                                        <div className="flex items-center text-gray-600">
                                            <svg className="w-4 h-4 mr-1.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span className="font-medium">
                                                {new Date(s.createdAt).toLocaleDateString('vi-VN', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col space-y-2 ml-4 flex-shrink-0">
                                    <Link
                                        to={`/manager/series/${s.id}`}
                                        className="px-4 py-2 bg-[#001C44] text-white rounded-lg hover:bg-[#002A66] transition-colors text-sm font-medium text-center flex items-center justify-center"
                                    >
                                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        Xem
                                    </Link>
                                    <Link
                                        to={`/manager/series/${s.id}/edit`}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-center flex items-center justify-center"
                                    >
                                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Sửa
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(s.id, s.name)}
                                        className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium flex items-center justify-center"
                                    >
                                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Xóa
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SeriesManagement;

