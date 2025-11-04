import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

import api from "../services/api";
import {toast} from "react-toastify";

interface ActivitySeries {
    id: number;
    name: string;
    description: string;
    requiredParticipationCount: number;
    bonusPoints: number;
    startDate: string;
    endDate: string;
}

export default function SeriesDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [series, setSeries] = useState<ActivitySeries | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<ActivitySeries>>({});

    useEffect(() => {
        const fetchSeries = async () => {
            try {
                const res = await api.get(`/api/activity-series/${id}`);
                setSeries(res.data.body);
                setFormData(res.data.body);
            } catch (err) {
                console.error(err);
                toast.error("Không thể tải dữ liệu chuỗi sự kiện");
            }
        };
        fetchSeries();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };


    const handleSave = async () => {
        try {
            await api.put(`/api/activity-series/${id}`, formData);
            toast.success("Cập nhật thông tin chuỗi thành công");
            setIsEditing(false);
        } catch {
            toast.error("Lưu thất bại, vui lòng thử lại");
        }
    };
    const handleDelete = async () => {
        if (!window.confirm("Bạn có chắc muốn xóa chuỗi sự kiện này?")) return;

        try {
            await api.delete(`/api/activity-series/${id}`);
            toast.success("Xóa chuỗi sự kiện thành công");
            window.location.href = "/manager/event-series";
        } catch (err) {
            console.error(err);
            toast.error("Không thể xóa chuỗi, vui lòng thử lại");
        }
    };

    if (!series) {
        return <p className="text-center py-10 text-gray-500">Đang tải dữ liệu...</p>;
    }

    return (
        <div className="max-w-3xl mx-auto mt-8 p-6 bg-white shadow rounded-xl border">
            {/* Tiêu đề + nút quay lại */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Thông tin chuỗi sự kiện</h1>
                <Link
                    to="/manager/event-series"
                    className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded-md"
                >
                    ← Quay lại danh sách
                </Link>
            </div>

            {/* Form nội dung */}
            <div className="space-y-4">
                {/* Tên chuỗi */}
                <div>
                    <label htmlFor="name" className="block font-medium mb-1">
                        Tên chuỗi
                    </label>
                    <input
                        id="name"
                        name="name"
                        value={formData.name || ""}
                        disabled={!isEditing}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg p-2 disabled:bg-gray-100"
                    />
                </div>

                {/* Mô tả */}
                <div>
                    <label htmlFor="description" className="block font-medium mb-1">
                        Mô tả
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description || ""}
                        disabled={!isEditing}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg p-2 h-28 disabled:bg-gray-100"
                    />
                </div>

                {/* Số hoạt động yêu cầu */}
                <div>
                    <label htmlFor="requiredParticipationCount" className="block font-medium mb-1">
                        Số hoạt động yêu cầu
                    </label>
                    <input
                        type="number"
                        id="requiredParticipationCount"
                        name="requiredParticipationCount"
                        value={formData.requiredParticipationCount || ""}
                        disabled={!isEditing}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg p-2 disabled:bg-gray-100"
                    />
                </div>

                {/* Điểm thưởng */}
                <div>
                    <label htmlFor="bonusPoints" className="block font-medium mb-1">
                        Điểm thưởng
                    </label>
                    <input
                        type="number"
                        id="bonusPoints"
                        name="bonusPoints"
                        value={formData.bonusPoints || ""}
                        disabled={!isEditing}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg p-2 disabled:bg-gray-100"
                    />
                </div>

                {/* Ngày bắt đầu / kết thúc */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="startDate" className="block font-medium mb-1">
                            Ngày bắt đầu
                        </label>
                        <input
                            type="date"
                            id="startDate"
                            name="startDate"
                            value={formData.startDate || ""}
                            disabled={!isEditing}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg p-2 disabled:bg-gray-100"
                        />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block font-medium mb-1">
                            Ngày kết thúc
                        </label>
                        <input
                            type="date"
                            id="endDate"
                            name="endDate"
                            value={formData.endDate || ""}
                            disabled={!isEditing}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg p-2 disabled:bg-gray-100"
                        />
                    </div>
                </div>
            </div>

            {/* Nút hành động */}
            <div className="flex justify-between items-center mt-10 border-t pt-6">
                <button
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                >
                    🗑️ Xóa chuỗi
                </button>

                <div className="flex gap-3">
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                        >
                            Chỉnh sửa
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSave}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                            >
                                Lưu thay đổi
                            </button>
                        </>
                    )}
                </div>
            </div>


        </div>
    );
}
