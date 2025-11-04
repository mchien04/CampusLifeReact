import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreateActivityRequest, ActivityType, ScoreType } from "../../types/activity";
import { departmentAPI } from "../../services/departmentAPI";
import { Department } from "../../types/department";
import { eventAPI } from "../../services/eventAPI";
import { minigameAPI } from "../../services/minigameAPI";
import MiniGameConfigForm from "./MiniGameConfigForm";
import { MiniGameConfig, MiniGameType } from "../../types/minigame";

interface Props {
    seriesId: number;
}

const SeriesEventForm: React.FC<Props> = ({ seriesId }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loadingMiniGame, setLoadingMiniGame] = useState(false);

    const [formData, setFormData] = useState<CreateActivityRequest>({
        name: "",
        type: ActivityType.SUKIEN,
        scoreType: ScoreType.REN_LUYEN,
        description: "",
        startDate: "",
        endDate: "",
        requiresSubmission: false,
        maxPoints: "",
        penaltyPointsIncomplete: "",
        registrationStartDate: "",
        registrationDeadline: "",
        shareLink: "",
        isImportant: false,
        bannerUrl: "",
        location: "",
        ticketQuantity: undefined,
        benefits: "",
        requirements: "",
        contactInfo: "",
        mandatoryForFacultyStudents: false,
        organizerIds: [],
    });

    const [miniGameConfig, setMiniGameConfig] = useState<MiniGameConfig>({
        title: "",
        description: "",
        type: MiniGameType.QUIZ,
        questionCount: 0,
        requiredCorrectAnswers: 0,
        timeLimit: 0,
        rewardPoints: 0,
        questions: [],
    });

    // 🧭 Fetch danh sách đơn vị tổ chức
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const res = await departmentAPI.getAllDepartments();
                setDepartments(res || []);
            } catch (error) {
                console.error("❌ Không thể tải danh sách đơn vị tổ chức:", error);
                setDepartments([]);
            }
        };
        fetchDepartments();
    }, []);


    const handleChange = (
        eOrName:
            | React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
            >
            | string,
        value?: any
    ) => {
        if (typeof eOrName !== "string") {
            const e = eOrName;
            const target = e.target as
                | HTMLInputElement
                | HTMLSelectElement
                | HTMLTextAreaElement;
            const { name, type } = target;
            const val = type === "checkbox" ? (target as HTMLInputElement).checked : target.value;
            setFormData((prev) => ({
                ...prev,
                [name]: val,
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [eOrName]: value,
            }));
        }
    };

    // 🧭 Submit handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const payload = {
            ...formData,
            seriesId,
            ...(formData.type === ActivityType.MINIGAME ? { miniGameConfig } : {}),
        };

        try {
            console.log("📦 Payload gửi BE:", payload);
            const response = await eventAPI.addEventToSeries(seriesId, payload);




            if (response.status) {
                alert(`✅ Sự kiện trong chuỗi #${seriesId} đã được tạo thành công!`);

                if (formData.type === ActivityType.MINIGAME) {
                    alert("🎮 Tạo MiniGame thành công! Bạn có thể thêm câu hỏi Quiz.");
                } else {
                    navigate("/manager/events");
                }

                // Reset form
                setFormData({
                    name: "",
                    type: ActivityType.SUKIEN,
                    scoreType: ScoreType.REN_LUYEN,
                    description: "",
                    startDate: "",
                    endDate: "",
                    requiresSubmission: false,
                    maxPoints: "",
                    penaltyPointsIncomplete: "",
                    registrationStartDate: "",
                    registrationDeadline: "",
                    shareLink: "",
                    isImportant: false,
                    bannerUrl: "",
                    location: "",
                    ticketQuantity: undefined,
                    benefits: "",
                    requirements: "",
                    contactInfo: "",
                    mandatoryForFacultyStudents: false,
                    organizerIds: [],
                });

                setMiniGameConfig({
                    title: "",
                    description: "",
                    type: MiniGameType.QUIZ,
                    questionCount: 0,
                    requiredCorrectAnswers: 0,
                    timeLimit: 0,
                    rewardPoints: 0,
                    questions: [],
                });
            } else {
                setError(response.message || "Có lỗi xảy ra khi tạo sự kiện.");
            }
        } catch (err: any) {
            console.error("❌ Lỗi khi tạo sự kiện thuộc chuỗi:", err);
            setError(err.message || "Không thể tạo sự kiện, vui lòng thử lại!");
        } finally {
            setLoading(false);
        }
    };

    const formatDateForInput = (dateStr?: string) => {
        if (!dateStr) return "";
        try {
            const date = new Date(dateStr);
            return date.toISOString().slice(0, 16);
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">
                Tạo sự kiện thuộc chuỗi #{seriesId}
            </h2>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Thông tin chung */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Tên sự kiện *</label>
                        <input
                            name="name"
                            type="text"
                            className="w-full border rounded p-2"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Địa điểm</label>
                        <input
                            name="location"
                            type="text"
                            className="w-full border rounded p-2"
                            value={formData.location || ""}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {/* Loại hoạt động & điểm */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Loại hoạt động *</label>
                        <select
                            name="type"
                            className="w-full border rounded p-2"
                            value={formData.type}
                            onChange={handleChange}
                        >
                            <option value={ActivityType.SUKIEN}>Sự kiện</option>
                            <option value={ActivityType.MINIGAME}>Mini Game</option>
                            <option value={ActivityType.CONG_TAC_XA_HOI}>Công tác xã hội</option>
                            <option value={ActivityType.CHUYEN_DE_DOANH_NGHIEP}>
                                Chuyên đề doanh nghiệp
                            </option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Loại điểm *</label>
                        <select
                            name="scoreType"
                            className="w-full border rounded p-2"
                            value={formData.scoreType}
                            onChange={handleChange}
                        >
                            <option value={ScoreType.REN_LUYEN}>Điểm rèn luyện</option>
                            <option value={ScoreType.CONG_TAC_XA_HOI}>Công tác xã hội</option>
                            <option value={ScoreType.CHUYEN_DE}>Chuyên đề doanh nghiệp</option>
                        </select>
                    </div>
                </div>

                {/* MiniGame Config */}
                {formData.type === ActivityType.MINIGAME && (
                    <div className="mt-8 border-t pt-6">
                        {loadingMiniGame ? (
                            <p className="text-gray-500">Đang tải MiniGame...</p>
                        ) : (
                            <>
                                {miniGameConfig ? (
                                    <>
                                        <MiniGameConfigForm
                                            value={miniGameConfig}
                                            onChange={setMiniGameConfig}
                                        />
                                    </>
                                ) : (
                                    <p className="text-red-500 text-sm">Không tìm thấy cấu hình MiniGame.</p>
                                )}
                            </>
                        )}
                    </div>
                )}


                {/* Ban tổ chức */}
                <div>
                    <label className="block text-sm font-medium mb-1">Ban tổ chức</label>
                    <select
                        name="organizerIds"
                        multiple
                        className="w-full border rounded p-2 h-32"
                        value={formData.organizerIds?.map(String) || []}
                        onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions).map((opt) =>
                                parseInt(opt.value)
                            );
                            handleChange("organizerIds", selected);
                        }}
                    >
                        {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                                {dept.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Mô tả */}
                <div>
                    <label className="block text-sm font-medium mb-1">Mô tả</label>
                    <textarea
                        name="description"
                        className="w-full border rounded p-2"
                        rows={3}
                        value={formData.description || ""}
                        onChange={handleChange}
                    />
                </div>

                {/* Ngày bắt đầu & kết thúc */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Ngày bắt đầu *</label>
                        <input
                            name="startDate"
                            type="datetime-local"
                            className="w-full border rounded p-2"
                            value={formData.startDate || ""}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Ngày kết thúc *</label>
                        <input
                            name="endDate"
                            type="datetime-local"
                            className="w-full border rounded p-2"
                            value={formData.endDate || ""}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                {/* Điểm & đăng ký */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Điểm tối đa</label>
                        <input
                            name="maxPoints"
                            type="number"
                            className="w-full border rounded p-2"
                            value={formData.maxPoints || ""}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Điểm phạt nếu không hoàn thành
                        </label>
                        <input
                            name="penaltyPointsIncomplete"
                            type="number"
                            className="w-full border rounded p-2"
                            value={formData.penaltyPointsIncomplete || ""}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {/* Đăng ký */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Ngày bắt đầu đăng ký
                        </label>
                        <input
                            name="registrationStartDate"
                            type="datetime-local"
                            className="w-full border rounded p-2"
                            value={formData.registrationStartDate || ""}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Hạn chót đăng ký
                        </label>
                        <input
                            name="registrationDeadline"
                            type="datetime-local"
                            className="w-full border rounded p-2"
                            value={formData.registrationDeadline || ""}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {/* Banner + Link */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">
                            Ảnh banner sự kiện
                        </label>

                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const previewUrl = URL.createObjectURL(file);
                                    setFormData((prev) => ({
                                        ...prev,
                                        bannerUrl: previewUrl,
                                    }));
                                }
                            }}
                            className="w-full border rounded p-2"
                        />

                        {formData.bannerUrl && (
                            <div className="mt-3">
                                <p className="text-sm text-gray-500 mb-1">Xem trước:</p>
                                <img
                                    src={formData.bannerUrl}
                                    alt="Preview Banner"
                                    className="max-h-56 rounded shadow border"
                                />
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Link chia sẻ</label>
                        <input
                            name="shareLink"
                            type="text"
                            className="w-full border rounded p-2"
                            value={formData.shareLink || ""}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {/* Thông tin thêm */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Số vé tối đa</label>
                        <input
                            name="ticketQuantity"
                            type="number"
                            className="w-full border rounded p-2"
                            value={formData.ticketQuantity || ""}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Người phụ trách / Liên hệ
                        </label>
                        <input
                            name="contactInfo"
                            type="text"
                            className="w-full border rounded p-2"
                            value={formData.contactInfo || ""}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Yêu cầu</label>
                    <textarea
                        name="requirements"
                        className="w-full border rounded p-2"
                        value={formData.requirements || ""}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Lợi ích / Quyền lợi</label>
                    <textarea
                        name="benefits"
                        className="w-full border rounded p-2"
                        value={formData.benefits || ""}
                        onChange={handleChange}
                    />
                </div>

                {/* Checkbox */}
                <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center space-x-2">
                        <input
                            name="isImportant"
                            type="checkbox"
                            checked={formData.isImportant}
                            onChange={handleChange}
                        />
                        <span>Đánh dấu là sự kiện quan trọng</span>
                    </label>

                    <label className="flex items-center space-x-2">
                        <input
                            name="mandatoryForFacultyStudents"
                            type="checkbox"
                            checked={formData.mandatoryForFacultyStudents}
                            onChange={handleChange}
                        />
                        <span>Bắt buộc cho sinh viên khoa</span>
                    </label>
                </div>

                {/* Submit */}
                <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
                    <button
                        type="button"
                        onClick={() => navigate("/manager/events")}
                        className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
                    >
                        {loading ? "Đang lưu..." : "Lưu"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SeriesEventForm;
