import React, { useEffect, useState } from "react";

interface Props {
    onChange: (data: any) => void;
    showSubmit?: boolean;
    calculatedTotal?: number; // Nhận số lượng sự kiện con từ CreateEventSeries
}

const SeriesForm: React.FC<Props> = ({ onChange, showSubmit = true, calculatedTotal = 0 }) => {
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        requiredParticipationCount: "",
        bonusPoints: "",
        totalActivities: 0,
        isMandatorySeries: false,
        createdAt: "",
        updatedAt: "",
    });

    // Đồng bộ số lượng hoạt động con tính được
    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            totalActivities: calculatedTotal,
        }));
    }, [calculatedTotal]);

    // Đồng bộ dữ liệu ra ngoài (CreateEventSeries)
    useEffect(() => {
        onChange(formData);
    }, [formData]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, type, value, checked } = e.target as HTMLInputElement;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    return (
        <div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Thông tin chuỗi sự kiện</h2>

            <form className="space-y-4">
                {/* Thông tin cơ bản */}
                <div>
                    <label className="block text-sm font-medium mb-1">Tên chuỗi sự kiện *</label>
                    <input
                        type="text"
                        name="name"
                        className="w-full border rounded p-2"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Mô tả</label>
                    <textarea
                        name="description"
                        className="w-full border rounded p-2"
                        rows={3}
                        value={formData.description}
                        onChange={handleChange}
                    />
                </div>

                {/* Ngày bắt đầu - kết thúc */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Ngày bắt đầu *</label>
                        <input
                            type="date"
                            name="startDate"
                            className="w-full border rounded p-2"
                            value={formData.startDate}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Ngày kết thúc *</label>
                        <input
                            type="date"
                            name="endDate"
                            className="w-full border rounded p-2"
                            value={formData.endDate}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                {/* Điểm thưởng và số lượng yêu cầu */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Điểm thưởng khi hoàn thành chuỗi</label>
                        <input
                            type="number"
                            name="bonusPoints"
                            className="w-full border rounded p-2"
                            value={formData.bonusPoints}
                            onChange={handleChange}
                            placeholder="VD: 5"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Số lượng tối thiểu cần tham gia</label>
                        <input
                            type="number"
                            name="requiredParticipationCount"
                            className="w-full border rounded p-2"
                            value={formData.requiredParticipationCount}
                            onChange={handleChange}
                            placeholder="VD: 3"
                        />
                    </div>
                </div>

                {/* Tổng số hoạt động */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Tổng số sự kiện trong chuỗi</label>
                        <input
                            type="number"
                            name="totalActivities"
                            className="w-full border rounded p-2 bg-gray-100"
                            value={formData.totalActivities || 0}
                            readOnly
                        />
                    </div>

                </div>

                {/* Thông tin hệ thống */}
                {(formData.createdAt || formData.updatedAt) && (
                    <div className="border-t pt-4 mt-4 text-sm text-gray-600">
                        {formData.createdAt && (
                            <p>Ngày tạo: {new Date(formData.createdAt).toLocaleString()}</p>
                        )}
                        {formData.updatedAt && (
                            <p>Cập nhật gần nhất: {new Date(formData.updatedAt).toLocaleString()}</p>
                        )}
                    </div>
                )}

                {showSubmit && (
                    <div className="flex justify-end pt-6 border-t mt-6">
                        <button
                            type="submit"
                            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
                        >
                            Lưu chuỗi sự kiện
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
};

export default SeriesForm;
