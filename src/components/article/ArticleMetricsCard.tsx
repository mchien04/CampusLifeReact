import React from 'react';

interface ArticleMetricsCardProps {
    title: string;
    viewCount: number;
    wishlistCount: number;
    clicksToRegistration?: number;
}

const ArticleMetricsCard: React.FC<ArticleMetricsCardProps> = ({
    title,
    viewCount,
    wishlistCount,
    clicksToRegistration,
}) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h3 className="font-bold text-[#001C44] mb-4 line-clamp-2 text-lg">{title}</h3>
            <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{viewCount.toLocaleString('vi-VN')}</div>
                    <p className="text-sm text-gray-600 mt-1">Lượt xem</p>
                </div>
                <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">{wishlistCount.toLocaleString('vi-VN')}</div>
                    <p className="text-sm text-gray-600 mt-1">Yêu thích</p>
                </div>
                <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{(clicksToRegistration ?? 0).toLocaleString('vi-VN')}</div>
                    <p className="text-sm text-gray-600 mt-1">Đăng ký</p>
                </div>
            </div>
        </div>
    );
};

export default ArticleMetricsCard;
