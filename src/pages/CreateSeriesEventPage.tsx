// src/pages/CreateSeriesEventPage.tsx
import React from "react";
import { useSearchParams } from "react-router-dom";
import SeriesEventForm from "../components/events/SeriesEventForm";

const CreateSeriesEventPage: React.FC = () => {
    const [params] = useSearchParams();
    const seriesId = Number(params.get("seriesId"));

    if (!seriesId) {
        return (
            <div className="p-6 text-center text-red-600">
                ❌ Không tìm thấy mã chuỗi sự kiện trong URL.
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <h1 className="text-2xl font-bold mb-4">
                Tạo sự kiện trong chuỗi #{seriesId}
            </h1>
            <SeriesEventForm seriesId={seriesId} />
        </div>
    );
};

export default CreateSeriesEventPage;
