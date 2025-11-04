import React, { useState } from "react";
import { eventAPI } from "../services/eventAPI";
import SeriesForm from "../components/events/SeriesForm";
import { useNavigate } from "react-router-dom";

const CreateEventSeries: React.FC = () => {
    const [seriesData, setSeriesData] = useState<any>(null);
    const [createdSeries, setCreatedSeries] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const handleSeriesChange = (data: any) => setSeriesData(data);

    // 🟢 Tạo chuỗi sự kiện (gọi /api/activity-series)
    const handleCreateSeries = async () => {
        if (!seriesData) return alert("Vui lòng nhập thông tin chuỗi sự kiện");

        setLoading(true);
        setError("");

        try {
            const resSeries = await eventAPI.createSeriesEvent(seriesData);
            if (!resSeries.status || !resSeries.body?.id) {
                throw new Error(resSeries.message || "Không thể tạo chuỗi");
            }

            const created = resSeries.body;
            setCreatedSeries(created);

            alert(`Chuỗi "${created.name}" đã được tạo thành công!`);
        } catch (err: any) {
            console.error("Lỗi:", err);
            setError(err.message || "Lỗi không xác định khi  tạo chuỗi");
        } finally {
            setLoading(false);
        }
    };

    // 🟢 Khi bấm “Thêm sự kiện trong chuỗi” → chuyển sang form tạo event con
    const handleRedirectToCreateEvent = () => {
        if (!createdSeries?.id) {
            alert("Vui lòng tạo chuỗi sự kiện trước.");
            return;
        }

        // ✅ sửa đường dẫn sang đúng form sự kiện thuộc chuỗi
        navigate(`/manager/events/create-series/event?seriesId=${createdSeries.id}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <h1 className="text-2xl font-bold mb-4">
                Tạo chuỗi sự kiện và sự kiện con
            </h1>

            {/* Form tạo chuỗi */}
            {!createdSeries ? (
                <>
                    <SeriesForm
                        onChange={handleSeriesChange}
                        calculatedTotal={0}
                        showSubmit={false}
                    />
                    <div className="flex justify-end mt-6">
                        <button
                            onClick={handleCreateSeries}
                            disabled={loading}
                            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
                        >
                            {loading ? "Đang tạo chuỗi..." : "💾 Tạo chuỗi sự kiện"}
                        </button>
                    </div>
                </>
            ) : (
                <div className="max-w-4xl mx-auto px-6 mt-8 border-t pt-6">
                    <h2 className="text-lg font-semibold mb-3">
                        Chuỗi "{createdSeries.name}" đã được tạo thành công
                    </h2>
                    <button
                        onClick={handleRedirectToCreateEvent}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        ➕ Thêm sự kiện trong chuỗi
                    </button>
                </div>
            )}

            {error && <p className="text-red-600 mt-4">{error}</p>}
        </div>
    );
};

export default CreateEventSeries;
