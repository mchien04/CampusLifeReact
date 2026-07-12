import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { registrationAPI } from "../../services/registrationAPI";
import { RegistrationStatus } from "../../types/registration";
import { downloadBlobResponse, getBlobErrorMessage } from "../../utils/downloadBlob";

interface ApproveScoresFormProps {
    activityId: number;
}

export default function ApproveScoresForm({ activityId }: ApproveScoresFormProps) {
    const [students, setStudents] = useState<{ attended: any[]; notAttended: any[] }>({
        attended: [],
        notAttended: [],
    });
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [selectAll, setSelectAll] = useState(false);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        fetchReport();
    }, [activityId]);

    const fetchReport = async () => {
        try {
            const data = await registrationAPI.getParticipationReport(activityId);
            setStudents(data);
            setSelected(new Set());
            setSelectAll(false);
        } catch (error) {
            console.error("❌ Lỗi fetch report:", error);
        }
    };

    const toggleSelect = (id: number) => {
        const newSet = new Set(selected);
        newSet.has(id) ? newSet.delete(id) : newSet.add(id);
        setSelected(newSet);
    };

    const toggleSelectAll = () => {
        if (selectAll) {
            setSelected(new Set());
            setSelectAll(false);
        } else {
            const allIds = [
                ...students.attended.map((s: any) => s.id),
                ...students.notAttended.map((s: any) => s.id),
            ];
            setSelected(new Set(allIds));
            setSelectAll(true);
        }
    };

    const handleApprove = async () => {
        try {
            for (const id of Array.from(selected)) {
                await registrationAPI.updateRegistrationStatus(id, RegistrationStatus.APPROVED);
            }
            await fetchReport();
            alert("✅ Duyệt thành công!");
        } catch (error) {
            console.error("❌ Lỗi duyệt:", error);
            alert("❌ Duyệt thất bại!");
        }
    };

    const handleExportParticipation = async () => {
        try {
            setExporting(true);
            const res = await registrationAPI.exportActivityParticipationExcel(activityId);
            await downloadBlobResponse(res, `ds_tham_gia_${activityId}.xlsx`);
            toast.success("Xuất danh sách tham gia thành công");
        } catch (error) {
            toast.error(await getBlobErrorMessage(error));
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow mb-6 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                    Báo cáo tham gia / Duyệt điểm sinh viên
                </h3>
                <button
                    type="button"
                    onClick={() => void handleExportParticipation()}
                    disabled={exporting}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium"
                >
                    {exporting ? "Đang xuất..." : "Xuất DS tham gia"}
                </button>
            </div>

            <div className="flex items-center mb-2">
                <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={toggleSelectAll}
                    className="mr-2"
                />
                <span className="text-gray-700">Chọn tất cả</span>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* Chưa tham gia */}
                <div>
                    <h4 className="font-medium text-red-600 mb-2">Chưa tham gia</h4>
                    <ul className="space-y-1">
                        {students.notAttended.map((s: any) => (
                            <li key={s.id} className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={selected.has(s.id)}
                                    onChange={() => toggleSelect(s.id)}
                                    className="mr-2"
                                />
                                <span>
                                    {s.fullName} ({s.studentCode})
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Đã tham gia */}
                <div>
                    <h4 className="font-medium text-green-600 mb-2">Đã tham gia</h4>
                    <ul className="space-y-1">
                        {students.attended.map((s: any) => (
                            <li key={s.id} className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={selected.has(s.id)}
                                    onChange={() => toggleSelect(s.id)}
                                    className="mr-2"
                                />
                                <span>
                                    {s.fullName} ({s.studentCode})
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="mt-4">
                <button
                    onClick={handleApprove}
                    disabled={selected.size === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                    Duyệt
                </button>
            </div>
        </div>
    );
}
