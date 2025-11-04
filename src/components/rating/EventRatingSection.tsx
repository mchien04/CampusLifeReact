import React, { useEffect, useState } from 'react';
import { ratingAPI } from '../../services/ratingAPI';



/** Kiểu dữ liệu trả về từ API */
interface RatingStats {
    average: number;
    count: number;
    distribution: Record<number, number>;
    students: {
        studentName: string;
        studentCode: string;
        rating: number;
        comment: string;
    }[];
}

interface EventRatingSectionProps {
    activityId: number;
}

/**
 * 🔶 Component chỉ hiển thị thống kê sao và danh sách sinh viên đã đánh giá
 */
export const EventRatingSection: React.FC<EventRatingSectionProps> = ({ activityId }) => {
    const [stats, setStats] = useState<RatingStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('activityId gửi đi:', activityId);
        loadStats();
    }, [activityId]);


    const loadStats = async () => {
        try {
            const res = await ratingAPI.getStats(activityId);
            console.log('API rating stats response:', res);

            if (res.status && res.body) {
                setStats(res.body);
            }

        } catch (error) {
            console.error('Lỗi khi tải thống kê:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white shadow-sm rounded-lg p-4 mt-4 border border-gray-200 w-full max-w-md mx-auto text-sm">

            <p className="text-gray-500 text-sm">Đang tải thống kê...</p>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="bg-white shadow-sm rounded-lg p-4 mt-4 border border-gray-200 w-full max-w-md mx-auto text-sm">

            <p className="text-gray-500 text-sm">Không có dữ liệu đánh giá.</p>
            </div>
        );
    }

    return (
        <div className="mt-8">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">🌟 Đánh giá & Thống kê</h3>
                    <p className="text-sm text-gray-600 mt-1">Tổng quan các đánh giá của sinh viên cho hoạt động này</p>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading ? (
                        <p className="text-gray-500 text-sm">Đang tải thống kê...</p>
                    ) : !stats ? (
                        <p className="text-gray-500 text-sm">Không có dữ liệu đánh giá.</p>
                    ) : (
                        <>
                            {/* 🔸 Thống kê trung bình */}
                            <div className="mb-6">
                                <div className="flex items-center space-x-3 mb-3">
                                    <span className="text-4xl font-bold text-orange-600">{stats.average.toFixed(1)}</span>
                                    <span className="text-yellow-400 text-2xl">★</span>
                                    <span className="text-gray-600 text-sm">({stats.count} lượt đánh giá)</span>
                                </div>

                                {[5, 4, 3, 2, 1].map((s) => (
                                    <div key={s} className="flex items-center text-sm mb-1">
                                        <span className="w-8">{s}★</span>
                                        <div className="bg-gray-200 h-2 rounded-full overflow-hidden flex-1 mx-2">
                                            <div
                                                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                                                style={{
                                                    width:
                                                        stats && stats.count > 0
                                                            ? `${((stats.distribution?.[s] || 0) / stats.count) * 100}%`
                                                            : '0%',
                                                }}
                                            />
                                        </div>

                                        <span className="w-6 text-right text-gray-600">
                    {!(stats) || stats.distribution?.[s] || 0}
                  </span>
                                    </div>
                                ))}
                            </div>

                            {/* 🔸 Danh sách sinh viên */}
                            {stats.students?.length > 0 ? (
                                <div className="border-t pt-5 mt-6">
                                    <h4 className="text-md font-semibold text-gray-800 mb-3">
                                        Danh sách sinh viên đã đánh giá
                                    </h4>
                                    <div className="space-y-3 max-h-64 overflow-y-auto">
                                        {stats.students.map((s, idx) => (
                                            <div
                                                key={idx}
                                                className="border rounded-md p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between"
                                            >
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {s.studentName}{' '}
                                                        <span className="text-gray-500 text-xs">
                            ({s.studentCode})
                          </span>
                                                    </p>
                                                    {s.comment && (
                                                        <p className="text-gray-700 text-sm mt-1">{s.comment}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center mt-2 sm:mt-0">
                                                    <span className="text-yellow-400 text-lg">★</span>
                                                    <span className="ml-1 text-gray-800 font-semibold">
                          {s.rating}
                        </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">Chưa có sinh viên nào đánh giá.</p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );

};
