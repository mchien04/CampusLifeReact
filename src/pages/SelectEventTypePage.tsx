import React from "react";
import { useNavigate } from "react-router-dom";

const SelectEventTypePage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md text-center">
                <h1 className="text-2xl font-bold mb-4 text-gray-800">
                    Chọn loại sự kiện bạn muốn tạo
                </h1>
                <p className="text-gray-600 mb-8">
                    Bạn có thể tạo một sự kiện đơn lẻ hoặc một chuỗi sự kiện liên tiếp.
                </p>

                <div className="flex flex-col gap-4">
                    <button
                        onClick={() => navigate("/manager/events/create")}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
                    >
                        ➕ Tạo sự kiện đơn
                    </button>

                    <button
                        onClick={() => navigate("/manager/events/create-series")}
                        className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
                    >
                        🔁 Tạo chuỗi sự kiện
                    </button>
                </div>

                <div className="mt-8">
                    <button
                        onClick={() => navigate("/manager/events")}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        ← Quay lại danh sách sự kiện
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SelectEventTypePage;
