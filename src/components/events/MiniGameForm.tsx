import React, { useState } from "react";
import { minigameAPI } from "../../services/minigameAPI";

interface MiniGameFormProps {
    activityId: number;
}

const MiniGameForm: React.FC<MiniGameFormProps> = ({ activityId }) => {
    const [miniGame, setMiniGame] = useState({
        title: "",
        description: "",
        type: "QUIZ",
        questionCount: 3,
        timeLimit: 60,
        rewardPoints: 10,
        requiredCorrectAnswers:3,
        activityId,
    });

    const [createdMiniGameId, setCreatedMiniGameId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    // Danh sách câu hỏi sau khi tạo minigame
    const [questions, setQuestions] = useState([
        { questionText: "", options: [{ text: "", correct: false }] },
    ]);

    // === 1️⃣ Gửi tạo MiniGame ===
    const handleCreateMiniGame = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const res = await minigameAPI.createMiniGame(miniGame);
            alert("Tạo MiniGame thành công!");
            setCreatedMiniGameId(res.id); // backend trả về id
        } catch (err) {
            alert("Lỗi khi tạo MiniGame!");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // === 2️⃣ Quản lý câu hỏi ===
    const handleAddQuestion = () => {
        setQuestions([...questions, { questionText: "", options: [{ text: "", correct: false }] }]);
    };

    const handleQuestionChange = (index: number, field: string, value: string) => {
        const updated = [...questions];
        (updated[index] as any)[field] = value;
        setQuestions(updated);
    };

    const handleAddOption = (qIndex: number) => {
        const updated = [...questions];
        updated[qIndex].options.push({ text: "", correct: false });
        setQuestions(updated);
    };

    const handleOptionChange = (qIndex: number, oIndex: number, field: string, value: any) => {
        const updated = [...questions];
        (updated[qIndex].options[oIndex] as any)[field] = value;
        setQuestions(updated);
    };

    const handleRemoveQuestion = (qIndex: number) => {
        setQuestions(questions.filter((_, i) => i !== qIndex));
    };

    // === 3️⃣ Gửi quiz ===
    const handleSubmitQuiz = async () => {
        if (!createdMiniGameId) return alert("Bạn cần tạo MiniGame trước!");
        try {
            await minigameAPI.addQuiz(createdMiniGameId, { questions });
            alert("Thêm câu hỏi quiz thành công!");
        } catch (err) {
            alert("Lỗi khi thêm quiz!");
            console.error(err);
        }
    };

    return (
        <div className="mt-8 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold text-indigo-700 mb-4">Thông tin MiniGame</h3>

            {/* Tạo MiniGame */}
            {!createdMiniGameId && (
                <form onSubmit={handleCreateMiniGame} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Tiêu đề *</label>
                        <input
                            type="text"
                            name="title"
                            value={miniGame.title}
                            onChange={(e) => setMiniGame({ ...miniGame, title: e.target.value })}
                            className="w-full border rounded p-2"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Mô tả</label>
                        <textarea
                            name="description"
                            value={miniGame.description}
                            onChange={(e) => setMiniGame({ ...miniGame, description: e.target.value })}
                            className="w-full border rounded p-2"
                            rows={2}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Số câu hỏi</label>
                            <input
                                type="number"
                                name="questionCount"
                                value={miniGame.questionCount}
                                onChange={(e) => setMiniGame({ ...miniGame, questionCount: Number(e.target.value) })}
                                className="w-full border rounded p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Số câu cần trả lời đúng</label>
                            <input
                                type="number"
                                name="requiredCorrectAnswers"
                                value={miniGame.requiredCorrectAnswers}
                                onChange={(e) => setMiniGame({ ...miniGame, questionCount: Number(e.target.value) })}
                                className="w-full border rounded p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Thời gian (giây)</label>
                            <input
                                type="number"
                                name="timeLimit"
                                value={miniGame.timeLimit}
                                onChange={(e) => setMiniGame({ ...miniGame, timeLimit: Number(e.target.value) })}
                                className="w-full border rounded p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Điểm thưởng</label>
                            <input
                                type="number"
                                name="rewardPoints"
                                value={miniGame.rewardPoints}
                                onChange={(e) => setMiniGame({ ...miniGame, rewardPoints: Number(e.target.value) })}
                                className="w-full border rounded p-2"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                    >
                        {loading ? "Đang tạo..." : "Tạo MiniGame"}
                    </button>
                </form>
            )}

            {/* Form câu hỏi quiz */}
            {createdMiniGameId && (
                <div className="mt-8">
                    <h4 className="text-md font-semibold mb-2 text-green-700">Danh sách câu hỏi Quiz</h4>

                    {questions.map((q, qIndex) => (
                        <div key={qIndex} className="border p-3 rounded mb-4 bg-white">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium">Câu hỏi {qIndex + 1}</label>
                                <button
                                    type="button"
                                    className="text-red-500 text-sm"
                                    onClick={() => handleRemoveQuestion(qIndex)}
                                >
                                    Xóa
                                </button>
                            </div>

                            <input
                                type="text"
                                value={q.questionText}
                                onChange={(e) => handleQuestionChange(qIndex, "questionText", e.target.value)}
                                className="w-full border rounded p-2 mb-2"
                                placeholder="Nhập nội dung câu hỏi"
                            />

                            {q.options.map((opt, oIndex) => (
                                <div key={oIndex} className="flex items-center space-x-2 mb-1">
                                    <input
                                        type="text"
                                        value={opt.text}
                                        onChange={(e) =>
                                            handleOptionChange(qIndex, oIndex, "text", e.target.value)
                                        }
                                        className="flex-1 border rounded p-1"
                                        placeholder={`Đáp án ${oIndex + 1}`}
                                    />
                                    <label className="flex items-center space-x-1">
                                        <input
                                            type="checkbox"
                                            checked={opt.correct}
                                            onChange={(e) =>
                                                handleOptionChange(qIndex, oIndex, "correct", e.target.checked)
                                            }
                                        />
                                        <span>Đúng</span>
                                    </label>
                                </div>
                            ))}

                            <button
                                type="button"
                                className="text-blue-600 text-sm mt-1"
                                onClick={() => handleAddOption(qIndex)}
                            >
                                + Thêm đáp án
                            </button>
                        </div>
                    ))}

                    <div className="flex justify-between items-center mt-4">
                        <button
                            type="button"
                            onClick={handleAddQuestion}
                            className="bg-gray-200 text-gray-800 px-3 py-1 rounded"
                        >
                            + Thêm câu hỏi
                        </button>

                        <button
                            type="button"
                            onClick={handleSubmitQuiz}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                            Lưu Quiz
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MiniGameForm;
