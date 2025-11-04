import React from "react";
import { MiniGameConfig } from "../../types/minigame";

interface Props {
    value: MiniGameConfig;
    onChange: (config: MiniGameConfig) => void;
}

const MiniGameConfigForm: React.FC<Props> = ({ value, onChange }) => {
    const updateConfig = (partial: Partial<MiniGameConfig>) => {
        onChange({ ...value, ...partial });
    };

    /** Cập nhật field chung (title, description, rewardPoints...) */
    const handleChange = (field: keyof MiniGameConfig, val: any) => {
        updateConfig({ [field]: val });
    };

    /** Cập nhật nội dung câu hỏi */
    const handleQuestionChange = (qIndex: number, field: string, val: any) => {
        const updated = [...(value.questions || [])];
        (updated[qIndex] as any)[field] = val;
        updateConfig({ questions: updated });
    };

    /** Cập nhật nội dung đáp án */
    const handleOptionChange = (
        qIndex: number,
        oIndex: number,
        field: string,
        val: any
    ) => {
        const updated = [...(value.questions || [])];
        (updated[qIndex].options[oIndex] as any)[field] = val;
        updateConfig({ questions: updated });
    };

    /** Thêm câu hỏi mới */
    const addQuestion = () => {
        const newQuestion = { questionText: "", options: [{ text: "", correct: false }] };
        updateConfig({ questions: [...(value.questions || []), newQuestion] });
    };

    /** Xóa câu hỏi */
    const deleteQuestion = (qIndex: number) => {
        const updated = [...(value.questions || [])];
        updated.splice(qIndex, 1);
        updateConfig({ questions: updated });
    };

    /** Thêm đáp án */
    const addOption = (qIndex: number) => {
        const updated = [...(value.questions || [])];
        updated[qIndex].options.push({ text: "", correct: false });
        updateConfig({ questions: updated });
    };

    /** Xóa đáp án */
    const deleteOption = (qIndex: number, oIndex: number) => {
        const updated = [...(value.questions || [])];
        updated[qIndex].options.splice(oIndex, 1);
        updateConfig({ questions: updated });
    };

    return (
        <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold text-indigo-700 mb-4">
                Cấu hình MiniGame
            </h3>

            {/* --- Thông tin chung --- */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Tiêu đề *</label>
                    <input
                        type="text"
                        value={value.title || ""}
                        onChange={(e) => handleChange("title", e.target.value)}
                        className="w-full border rounded p-2"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Mô tả</label>
                    <input
                        type="text"
                        value={value.description || ""}
                        onChange={(e) => handleChange("description", e.target.value)}
                        className="w-full border rounded p-2"
                    />
                </div>
            </div>

            {/* --- Cấu hình chung --- */}
            <div className="grid grid-cols-4 gap-4 mt-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Số câu hỏi</label>
                    <input
                        type="number"
                        value={value.questionCount ?? 0}
                        onChange={(e) =>
                            handleChange("questionCount", Number(e.target.value))
                        }
                        className="w-full border rounded p-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Số câu cần đúng</label>
                    <input
                        type="number"
                        value={value.requiredCorrectAnswers ?? 0}
                        onChange={(e) =>
                            handleChange("requiredCorrectAnswers", Number(e.target.value))
                        }
                        className="w-full border rounded p-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Điểm thưởng</label>
                    <input
                        type="number"
                        value={value.rewardPoints ?? 0}
                        onChange={(e) => handleChange("rewardPoints", Number(e.target.value))}
                        className="w-full border rounded p-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Thời gian (giây)</label>
                    <input
                        type="number"
                        value={value.timeLimit ?? 0}
                        onChange={(e) => handleChange("timeLimit", Number(e.target.value))}
                        className="w-full border rounded p-2"
                    />
                </div>
            </div>

            {/* --- Danh sách câu hỏi --- */}
            <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-md font-semibold text-gray-700">Danh sách câu hỏi</h4>
                    <button
                        type="button"
                        onClick={addQuestion}
                        className="bg-blue-600 text-white text-sm px-3 py-1 rounded"
                    >
                        + Thêm câu hỏi
                    </button>
                </div>

                {(value.questions || []).length === 0 && (
                    <p className="text-gray-500 italic">Chưa có câu hỏi nào.</p>
                )}

                {(value.questions || []).map((q, qIndex) => (
                    <div key={qIndex} className="border p-3 rounded mb-4 bg-gray-50">
                        <div className="flex justify-between items-center">
                            <label className="block text-sm font-medium mb-1">
                                Câu hỏi {qIndex + 1}
                            </label>
                            <button
                                type="button"
                                className="text-red-600 text-sm"
                                onClick={() => deleteQuestion(qIndex)}
                            >
                                Xóa
                            </button>
                        </div>

                        <input
                            type="text"
                            value={q.questionText || ""}
                            onChange={(e) =>
                                handleQuestionChange(qIndex, "questionText", e.target.value)
                            }
                            className="w-full border rounded p-2 mb-2"
                            placeholder="Nhập nội dung câu hỏi"
                        />

                        {/* Danh sách đáp án */}
                        {(q.options || []).map((opt, oIndex) => (
                            <div
                                key={oIndex}
                                className="flex items-center space-x-2 mb-1 ml-2"
                            >
                                <input
                                    type="text"
                                    value={opt.text || ""}
                                    onChange={(e) =>
                                        handleOptionChange(qIndex, oIndex, "text", e.target.value)
                                    }
                                    className="flex-1 border rounded p-1"
                                    placeholder={`Đáp án ${oIndex + 1}`}
                                />
                                <label className="flex items-center space-x-1 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={!!opt.correct}
                                        onChange={(e) =>
                                            handleOptionChange(
                                                qIndex,
                                                oIndex,
                                                "correct",
                                                e.target.checked
                                            )
                                        }
                                    />
                                    <span>Đúng</span>
                                </label>
                                <button
                                    type="button"
                                    className="text-red-500 text-xs"
                                    onClick={() => deleteOption(qIndex, oIndex)}
                                >
                                    Xóa
                                </button>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={() => addOption(qIndex)}
                            className="text-blue-600 text-sm mt-1 ml-2"
                        >
                            + Thêm đáp án
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MiniGameConfigForm;
