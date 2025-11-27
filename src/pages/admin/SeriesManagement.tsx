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
                setSeries(response.data);
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#001C44]">Quản lý chuỗi sự kiện</h1>
                    <p className="text-gray-600 mt-1">Quản lý các chuỗi sự kiện và activities</p>
                </div>
                <Link
                    to="/manager/series/create"
                    className="btn-primary px-6 py-2 rounded-lg font-medium"
                >
                    + Tạo chuỗi mới
                </Link>
            </div>

            {/* Search */}
            <div className="card p-6">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm chuỗi sự kiện..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                />
            </div>

            {/* Series List */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tên chuỗi
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Số sự kiện
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Loại điểm
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ngày tạo
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredSeries.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        Không có chuỗi sự kiện nào
                                    </td>
                                </tr>
                            ) : (
                                filteredSeries.map((s) => (
                                    <tr key={s.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{s.name}</div>
                                            {s.description && (
                                                <div className="text-sm text-gray-500 line-clamp-1">
                                                    {s.description}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {s.activities?.length || s.totalActivities || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {s.scoreType}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(s.createdAt).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                <Link
                                                    to={`/manager/series/${s.id}`}
                                                    className="text-[#001C44] hover:text-[#002A66]"
                                                >
                                                    Xem
                                                </Link>
                                                <Link
                                                    to={`/manager/series/${s.id}/edit`}
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    Sửa
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(s.id, s.name)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SeriesManagement;

