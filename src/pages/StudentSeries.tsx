import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { seriesAPI } from '../services/seriesAPI';
import { SeriesResponse, StudentSeriesProgress } from '../types/series';
import { LoadingSpinner } from '../components/common';
import { SeriesCard } from '../components/series';
import StudentLayout from '../components/layout/StudentLayout';
import { toast } from 'react-toastify';

const StudentSeries: React.FC = () => {
    const { user } = useAuth();
    const [series, setSeries] = useState<SeriesResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [registeredSeriesIds, setRegisteredSeriesIds] = useState<Set<number>>(new Set());
    const [progressMap, setProgressMap] = useState<Map<number, StudentSeriesProgress>>(new Map());

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
                await loadProgressForAllSeries(activeSeries);
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

    const loadProgressForAllSeries = async (seriesList: SeriesResponse[]) => {
        const registeredIds = new Set<number>();
        const progress = new Map<number, StudentSeriesProgress>();

        for (const s of seriesList) {
            try {
                // Check registration status using new API
                const [registrationResponse, progressResponse] = await Promise.all([
                    seriesAPI.getMySeriesRegistrationStatus(s.id),
                    seriesAPI.getMySeriesProgress(s.id)
                ]);

                if (registrationResponse.status && registrationResponse.data?.isRegistered) {
                    registeredIds.add(s.id);
                }

                if (progressResponse.status && progressResponse.data) {
                    progress.set(s.id, progressResponse.data);
                }
            } catch (err) {
                // Ignore errors per series; treat as not registered / no progress
                // console.error('Error loading series registration/progress:', err);
            }
        }

        setRegisteredSeriesIds(registeredIds);
        setProgressMap(progress);
    };

    const handleRegister = async (seriesId: number) => {
        try {
            const response = await seriesAPI.registerForSeries(seriesId);
            if (response.status) {
                toast.success(response.message || 'Đăng ký thành công!');
                await loadSeries(); // Reload to update registration status
            } else {
                toast.error(response.message || 'Đăng ký thất bại');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi đăng ký');
            console.error('Error registering for series:', err);
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
            <StudentLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <LoadingSpinner />
                </div>
            </StudentLayout>
        );
    }

    if (error) {
        return (
            <StudentLayout>
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
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-xl p-6 text-white mb-6">
                    <h1 className="text-3xl font-bold mb-2">Chuỗi sự kiện</h1>
                    <p className="text-gray-200">
                        Khám phá và đăng ký tham gia các chuỗi sự kiện để nhận điểm milestone
                    </p>
                </div>

                {/* Search */}
                <div className="card p-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tìm kiếm
                        </label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm kiếm chuỗi sự kiện..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                        />
                    </div>
                </div>

                {/* Series List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSeries.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                            <div className="text-gray-400 text-6xl mb-4">📋</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Không có chuỗi sự kiện nào
                            </h3>
                            <p className="text-gray-500">
                                Không tìm thấy chuỗi sự kiện phù hợp với bộ lọc của bạn.
                            </p>
                        </div>
                    ) : (
                        filteredSeries.map((s) => {
                            const progress = progressMap.get(s.id);
                            const isRegistered = registeredSeriesIds.has(s.id);

                            return (
                                <SeriesCard
                                    key={s.id}
                                    series={s}
                                    progress={
                                        progress
                                            ? {
                                                  completedCount: progress.completedCount,
                                                  pointsEarned: progress.pointsEarned
                                              }
                                            : undefined
                                    }
                                    onRegister={handleRegister}
                                    isRegistered={isRegistered}
                                />
                            );
                        })
                    )}
                </div>
            </div>
        </StudentLayout>
    );
};

export default StudentSeries;

