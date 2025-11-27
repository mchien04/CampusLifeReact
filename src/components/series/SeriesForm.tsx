import React, { useState, useEffect } from 'react';
import { CreateSeriesRequest, formatMilestonePoints, parseMilestonePoints } from '../../types/series';
import { ScoreType } from '../../types/activity';

interface SeriesFormProps {
    onSubmit: (data: CreateSeriesRequest) => void;
    loading?: boolean;
    initialData?: Partial<CreateSeriesRequest>;
    title?: string;
    onCancel?: () => void;
}

const SeriesForm: React.FC<SeriesFormProps> = ({
    onSubmit,
    loading = false,
    initialData = {},
    title = 'Tạo chuỗi sự kiện mới',
    onCancel
}) => {
    const [formData, setFormData] = useState<CreateSeriesRequest>(() => {
        const defaultData: CreateSeriesRequest = {
            name: '',
            description: '',
            milestonePoints: '{}',
            scoreType: ScoreType.REN_LUYEN,
            registrationStartDate: '',
            registrationDeadline: '',
            requiresApproval: true,
            ticketQuantity: undefined
        };

        return {
            ...defaultData,
            ...initialData
        };
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [milestoneEntries, setMilestoneEntries] = useState<Array<{ count: number; points: number }>>([]);
    const [milestoneInput, setMilestoneInput] = useState({ count: '', points: '' });
    const [unlimitedTickets, setUnlimitedTickets] = useState(!formData.ticketQuantity);

    useEffect(() => {
        if (formData.milestonePoints) {
            try {
                const parsed = parseMilestonePoints(formData.milestonePoints);
                setMilestoneEntries(
                    Object.entries(parsed)
                        .map(([count, points]) => ({ count: parseInt(count), points: points as number }))
                        .sort((a, b) => a.count - b.count)
                );
            } catch {
                setMilestoneEntries([]);
            }
        }
    }, [formData.milestonePoints]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleUnlimitedTicketsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        setUnlimitedTickets(checked);
        if (checked) {
            setFormData(prev => ({ ...prev, ticketQuantity: undefined }));
        } else {
            setFormData(prev => ({ ...prev, ticketQuantity: 0 }));
        }
    };

    const addMilestone = () => {
        const count = parseInt(milestoneInput.count);
        const points = parseFloat(milestoneInput.points);

        if (!count || count < 1 || !points || points < 0) {
            alert('Vui lòng nhập số sự kiện và điểm hợp lệ');
            return;
        }

        if (milestoneEntries.some(e => e.count === count)) {
            alert('Mốc này đã tồn tại');
            return;
        }

        const newEntries = [...milestoneEntries, { count, points }].sort((a, b) => a.count - b.count);
        setMilestoneEntries(newEntries);

        const milestoneObj: Record<number, number> = {};
        newEntries.forEach(e => {
            milestoneObj[e.count] = e.points;
        });

        setFormData(prev => ({
            ...prev,
            milestonePoints: formatMilestonePoints(milestoneObj)
        }));

        setMilestoneInput({ count: '', points: '' });
    };

    const removeMilestone = (count: number) => {
        const newEntries = milestoneEntries.filter(e => e.count !== count);
        setMilestoneEntries(newEntries);

        const milestoneObj: Record<number, number> = {};
        newEntries.forEach(e => {
            milestoneObj[e.count] = e.points;
        });

        setFormData(prev => ({
            ...prev,
            milestonePoints: formatMilestonePoints(milestoneObj)
        }));
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Tên chuỗi sự kiện là bắt buộc';
        }

        if (!formData.milestonePoints || formData.milestonePoints === '{}') {
            newErrors.milestonePoints = 'Vui lòng thêm ít nhất một mốc điểm';
        } else {
            try {
                const parsed = parseMilestonePoints(formData.milestonePoints);
                if (Object.keys(parsed).length === 0) {
                    newErrors.milestonePoints = 'Vui lòng thêm ít nhất một mốc điểm';
                }
            } catch {
                newErrors.milestonePoints = 'Định dạng milestone points không hợp lệ';
            }
        }

        if (formData.registrationStartDate && formData.registrationDeadline) {
            if (new Date(formData.registrationStartDate) >= new Date(formData.registrationDeadline)) {
                newErrors.registrationDeadline = 'Hạn đăng ký phải sau ngày mở đăng ký';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(formData);
        }
    };

    const getScoreTypeLabel = (type: ScoreType) => {
        const labels: Record<ScoreType, string> = {
            [ScoreType.REN_LUYEN]: 'Rèn luyện',
            [ScoreType.CONG_TAC_XA_HOI]: 'Công tác xã hội',
            [ScoreType.CHUYEN_DE]: 'Chuyên đề'
        };
        return labels[type] || type;
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white shadow-lg rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                    <p className="text-gray-600 mt-1">Điền thông tin chi tiết về chuỗi sự kiện</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                Tên chuỗi sự kiện *
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44] ${
                                    errors.name ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Nhập tên chuỗi sự kiện"
                            />
                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                Mô tả
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description || ''}
                                onChange={handleChange}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                                placeholder="Nhập mô tả chuỗi sự kiện"
                            />
                        </div>

                        <div>
                            <label htmlFor="scoreType" className="block text-sm font-medium text-gray-700 mb-2">
                                Loại điểm *
                            </label>
                            <select
                                id="scoreType"
                                name="scoreType"
                                value={formData.scoreType}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                            >
                                <option value={ScoreType.REN_LUYEN}>Rèn luyện</option>
                                <option value={ScoreType.CONG_TAC_XA_HOI}>Công tác xã hội</option>
                                <option value={ScoreType.CHUYEN_DE}>Chuyên đề</option>
                            </select>
                        </div>

                        <div>
                            <label className="flex items-center space-x-2 mt-6">
                                <input
                                    type="checkbox"
                                    checked={formData.requiresApproval}
                                    onChange={(e) =>
                                        setFormData(prev => ({ ...prev, requiresApproval: e.target.checked }))
                                    }
                                    className="rounded border-gray-300 text-[#001C44] focus:ring-[#001C44]"
                                />
                                <span className="text-sm text-gray-700">Yêu cầu duyệt đăng ký</span>
                            </label>
                        </div>
                    </div>

                    {/* Milestone Points */}
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Điểm Milestone *</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Định nghĩa các mốc điểm thưởng khi hoàn thành số lượng sự kiện nhất định
                        </p>

                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    min="1"
                                    value={milestoneInput.count}
                                    onChange={(e) => setMilestoneInput(prev => ({ ...prev, count: e.target.value }))}
                                    placeholder="Số sự kiện"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                                />
                                <input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={milestoneInput.points}
                                    onChange={(e) => setMilestoneInput(prev => ({ ...prev, points: e.target.value }))}
                                    placeholder="Điểm thưởng"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                                />
                                <button
                                    type="button"
                                    onClick={addMilestone}
                                    className="px-4 py-2 bg-[#001C44] text-white rounded-md hover:bg-[#002A66] transition-colors"
                                >
                                    Thêm mốc
                                </button>
                            </div>

                            {errors.milestonePoints && (
                                <p className="text-red-500 text-sm">{errors.milestonePoints}</p>
                            )}

                            {milestoneEntries.length > 0 && (
                                <div className="space-y-2">
                                    {milestoneEntries.map((entry) => (
                                        <div
                                            key={entry.count}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                                        >
                                            <span className="text-sm font-medium text-gray-900">
                                                {entry.count} sự kiện → {entry.points} điểm{' '}
                                                {getScoreTypeLabel(formData.scoreType)}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeMilestone(entry.count)}
                                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Registration Dates */}
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Thời gian đăng ký</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="registrationStartDate" className="block text-sm font-medium text-gray-700 mb-2">
                                    Ngày mở đăng ký
                                </label>
                                <input
                                    type="datetime-local"
                                    id="registrationStartDate"
                                    name="registrationStartDate"
                                    value={formData.registrationStartDate || ''}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                                />
                            </div>

                            <div>
                                <label htmlFor="registrationDeadline" className="block text-sm font-medium text-gray-700 mb-2">
                                    Hạn đăng ký
                                </label>
                                <input
                                    type="datetime-local"
                                    id="registrationDeadline"
                                    name="registrationDeadline"
                                    value={formData.registrationDeadline || ''}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44] ${
                                        errors.registrationDeadline ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                                {errors.registrationDeadline && (
                                    <p className="text-red-500 text-sm mt-1">{errors.registrationDeadline}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Ticket Quantity */}
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Số lượng vé</h3>
                        <div className="space-y-4">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={unlimitedTickets}
                                    onChange={handleUnlimitedTicketsChange}
                                    className="rounded border-gray-300 text-[#001C44] focus:ring-[#001C44]"
                                />
                                <span className="text-sm text-gray-700">Không giới hạn số lượng vé</span>
                            </label>

                            {!unlimitedTickets && (
                                <div>
                                    <label htmlFor="ticketQuantity" className="block text-sm font-medium text-gray-700 mb-2">
                                        Số lượng vé
                                    </label>
                                    <input
                                        type="number"
                                        id="ticketQuantity"
                                        name="ticketQuantity"
                                        min="1"
                                        value={formData.ticketQuantity || 0}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end space-x-3 pt-6 border-t">
                        {onCancel && (
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Hủy
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-[#001C44] text-white rounded-md hover:bg-[#002A66] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Đang xử lý...' : 'Lưu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SeriesForm;

