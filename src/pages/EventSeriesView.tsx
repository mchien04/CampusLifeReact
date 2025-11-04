import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

import { eventAPI } from "../services/eventAPI";
import { ActivityResponse } from "../types/activity";
import { getImageUrl } from "../utils/imageUtils";
import {toast} from "react-toastify";

const EventSeriesView: React.FC = () => {
    const { seriesId } = useParams<{ seriesId: string }>();
    const [events, setEvents] = useState<ActivityResponse[]>([]);
    const [loading, setLoading] = useState(true);

    // 🧩 Lấy danh sách sự kiện trong chuỗi
    useEffect(() => {
        fetchEvents();
    }, [seriesId]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            console.log(`🔍 Fetching events for seriesId=${seriesId}`);
            const res = await eventAPI.getEventsBySeries(Number(seriesId));
            console.log("📦 Event detail:", res);
            if (res.status && Array.isArray(res.data)) {
                setEvents(res.data);
            } else {
                setEvents([]);
                toast.info("Chuỗi này chưa có sự kiện nào");
            }
        } catch (err) {
            console.error("❌ Lỗi khi tải sự kiện trong chuỗi:", err);
            toast.error("Không thể tải danh sách sự kiện");
        } finally {
            setLoading(false);
        }
    };

    // 🗑️ Xóa sự kiện khỏi chuỗi
    const handleDelete = async (eventId: number) => {
        if (!window.confirm("Bạn có chắc muốn xóa sự kiện này khỏi chuỗi?")) return;

        try {
            const res = await eventAPI.deleteEventFromSeries(Number(seriesId), eventId);
            if (res.status) {
                toast.success("Đã xóa sự kiện khỏi chuỗi");
                setEvents((prev) => prev.filter((e) => e.id !== eventId));
            } else {
                toast.error(res.message || "Không thể xóa sự kiện");
            }
        } catch (err) {
            console.error("❌ Lỗi khi xóa sự kiện:", err);
            toast.error("Không thể xóa sự kiện, vui lòng thử lại");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen text-gray-600">
                Đang tải danh sách sự kiện...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 🔹 Header */}
            <div className="bg-white shadow">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-semibold text-gray-800">
                        Sự kiện thuộc chuỗi #{seriesId}
                    </h1>
                    <div className="flex gap-3">
                        <Link
                            to={`/manager/events/create-series/event?seriesId=${seriesId}`}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md"
                        >
                            ➕ Thêm sự kiện mới
                        </Link>
                        <Link
                            to="/manager/event-series"
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-4 py-2 rounded-md"
                        >
                            ← Quay lại danh sách chuỗi
                        </Link>
                    </div>
                </div>
            </div>

            {/* 🔹 Nội dung */}
            <div className="max-w-6xl mx-auto px-6 py-8">
                {events.length === 0 ? (
                    <div className="bg-white shadow p-8 rounded-lg text-center text-gray-500">
                        Chưa có sự kiện nào trong chuỗi này.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map((event) => (
                            <div
                                key={event.id}
                                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
                            >
                                {/* Banner */}
                                {event.bannerUrl && (
                                    <div
                                        className="h-40 bg-gray-200 rounded-t-lg bg-cover bg-center"
                                        style={{
                                            backgroundImage: `url(${getImageUrl(event.bannerUrl)})`,
                                        }}
                                    ></div>
                                )}

                                {/* Thông tin */}
                                <div className="p-5">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                        {event.name}
                                    </h3>
                                    <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                                        {event.description}
                                    </p>
                                    <p className="text-gray-500 text-xs mb-1">
                                        📅 {new Date(event.startDate).toLocaleDateString("vi-VN")}
                                        {" - "}
                                        {new Date(event.endDate).toLocaleDateString("vi-VN")}
                                    </p>
                                    <p className="text-gray-500 text-xs mb-3">📍 {event.location}</p>

                                    {/* Nút hành động */}
                                    <div className="flex gap-2 mt-2">
                                        <Link
                                            to={`/manager/events/${event.id}/edit`}
                                            className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm px-3 py-1.5 rounded"
                                        >
                                            ✏️ Sửa
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(event.id)}
                                            className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1.5 rounded"
                                        >
                                            🗑️ Xóa
                                        </button>
                                        <Link
                                            to={`/manager/events/${event.id}`}
                                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm px-3 py-1.5 rounded"
                                        >
                                            Xem
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventSeriesView;
