import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

interface ActivitySeries {
    id: number;
    name: string;
    description: string;
    startDate?: string;
    endDate?: string;
    createdBy?: string;
}

const SeriesList: React.FC = () => {
    const [seriesList, setSeriesList] = useState<ActivitySeries[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSeries = async () => {
            try {
                const res = await api.get("/api/activity-series");
                setSeriesList(res.data.body || res.data.data || []);
            } catch (err) {
                console.error("❌ Lỗi khi tải chuỗi sự kiện:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSeries();
    }, []);

    if (loading) {
        return (
            <div className="text-center p-8 text-gray-500">
                Đang tải danh sách chuỗi sự kiện...
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Danh sách Chuỗi sự kiện</h1>
                <Link
                    to="/manager/events/create-series"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md"
                >
                    + Tạo chuỗi mới
                </Link>
            </div>

            {seriesList.length === 0 ? (
                <div className="bg-white p-8 text-center rounded-lg shadow">
                    <p>Chưa có chuỗi sự kiện nào được tạo.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {seriesList.map((series) => (
                        <div
                            key={series.id}
                            className="bg-white rounded-lg shadow hover:shadow-lg transition p-5"
                        >
                            <h2 className="text-lg font-semibold mb-2">{series.name}</h2>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {series.description}
                            </p>
                            <p className="text-xs text-gray-500 mb-4">
                                📅 {series.startDate} – {series.endDate}
                            </p>

                            <div className="flex gap-2">
                                {/* 🔹 Nút xem thông tin chuỗi */}
                                <Link
                                    to={`/manager/event-series/${series.id}`}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-3 py-1.5 rounded-md"
                                >
                                    Xem thông tin
                                </Link>

                                {/* 🔹 Nút xem danh sách sự kiện */}
                                <Link
                                    to={`/manager/event-series/${series.id}/events`}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded-md"
                                >
                                    Xem sự kiện
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SeriesList;
