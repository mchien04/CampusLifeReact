import React, { useState, useEffect } from 'react';
import { CreateActivityRequest, ActivityType, ScoreType } from '../../types/activity';
import { uploadAPI } from '../../services/uploadAPI';
import { eventAPI } from '../../services/eventAPI';
import { departmentAPI } from '../../services/adminAPI';
import { getImageUrl } from '../../utils/imageUtils';
import OrganizerSelector from './OrganizerSelector';
import { ScoreRulesForm } from './ScoreRulesForm';
import { Department } from '../../types/admin';

export type FormMode = 'normal' | 'minigame' | 'series';

interface BaseEventFormProps {
    mode: FormMode;
    onSubmit: (data: CreateActivityRequest) => void;
    loading?: boolean;
    initialData?: Partial<CreateActivityRequest>;
    title?: string;
    onCancel?: () => void;
    renderFields?: (props: RenderFieldsProps) => React.ReactNode;
    inline?: boolean; // If true, render without wrapper (for modals)
}

export interface RenderFieldsProps {
    formData: CreateActivityRequest;
    errors: Record<string, string>;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    handleOrganizerChange: (ids: number[]) => void;
    unlimitedTickets: boolean;
    handleUnlimitedChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    originalBannerUrl: string;
    mode: FormMode;
}

const BaseEventForm: React.FC<BaseEventFormProps> = ({
    mode,
    onSubmit,
    loading = false,
    initialData = {},
    title = "Tạo sự kiện mới",
    onCancel,
    renderFields,
    inline = false
}) => {
    const [formData, setFormData] = useState<CreateActivityRequest>(() => {
        const defaultData: CreateActivityRequest = {
            name: '',
            type: mode === 'minigame' ? ActivityType.MINIGAME : ActivityType.SUKIEN,
            description: '',
            startDate: '',
            endDate: '',
            requiresSubmission: false,
            scoreRules: [],
            registrationStartDate: mode === 'series' ? undefined : '',
            registrationDeadline: mode === 'series' ? undefined : '',
            shareLink: '',
            isImportant: false,
            isDraft: true,
            bannerUrl: '',
            location: '',
            ticketQuantity: mode === 'series' ? undefined : (mode === 'minigame' ? 0 : 0),
            benefits: '',
            requirements: '',
            contactInfo: '',
            requiresApproval: mode === 'series' ? undefined : true,
            mandatoryForFacultyStudents: false,
            organizerIds: [],
        };

        return {
            ...defaultData,
            ...Object.fromEntries(
                Object.entries(initialData).map(([key, value]) => [
                    key,
                    value !== undefined ? value : defaultData[key as keyof CreateActivityRequest]
                ])
            )
        };
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [originalBannerUrl, setOriginalBannerUrl] = useState<string>('');
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [unlimitedTickets, setUnlimitedTickets] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [presets, setPresets] = useState<any[]>([]);
    const [selectedPresetCode, setSelectedPresetCode] = useState<string>('');
    const [departments, setDepartments] = useState<Department[]>([]);
    const isEditing = !!(initialData && initialData.name);

    // Load presets on mount
    useEffect(() => {
        const fetchPresets = async () => {
            try {
                const res = await eventAPI.getActivityPresets();
                if (res.status && res.data) {
                    setPresets(res.data);
                    
                    // If mode is minigame and we are on initial load (not editing)
                    if (mode === 'minigame' && !isEditing) {
                        const hasMinigamePreset = res.data.some(p => p.code === 'MINIGAME_PASS_ONLY');
                        if (hasMinigamePreset) {
                            setSelectedPresetCode('MINIGAME_PASS_ONLY');
                            const previewRes = await eventAPI.previewActivityPreset({ presetCode: 'MINIGAME_PASS_ONLY' });
                            if (previewRes.status && previewRes.data) {
                                const presetData = previewRes.data;
                                setFormData(prev => ({
                                    ...prev,
                                    requiresSubmission: presetData.requiresSubmission,
                                    scoreRules: presetData.scoreRules || []
                                }));
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Lỗi khi tải mẫu cấu hình:', error);
            }
        };
        fetchPresets();
    }, [mode, isEditing]);

    // Load departments on mount
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const res = await departmentAPI.getDepartments();
                if (res.status && res.data) {
                    setDepartments(res.data);
                }
            } catch (err) {
                console.error('Error fetching departments:', err);
            }
        };
        fetchDepartments();
    }, []);

    const handlePresetChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = e.target.value;
        setSelectedPresetCode(code);
        if (!code) return;

        try {
            const previewRes = await eventAPI.previewActivityPreset({ presetCode: code });
            if (previewRes.status && previewRes.data) {
                const presetData = previewRes.data;
                setFormData(prev => ({
                    ...prev,
                    requiresSubmission: presetData.requiresSubmission,
                    scoreRules: presetData.scoreRules || []
                }));
            }
        } catch (error) {
            console.error('Lỗi khi tải mẫu cấu hình:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

    const handleUnlimitedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        setUnlimitedTickets(checked);
        if (checked) {
            setFormData(prev => ({ ...prev, ticketQuantity: undefined }));
        } else {
            setFormData(prev => ({ ...prev, ticketQuantity: 0 }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Tên sự kiện là bắt buộc';
        }

        // For series mode, startDate, endDate, and location are optional
        if (mode !== 'series') {
            if (!formData.startDate) {
                newErrors.startDate = 'Ngày bắt đầu là bắt buộc';
            }

            if (!formData.endDate) {
                newErrors.endDate = 'Ngày kết thúc là bắt buộc';
            }

            if (!formData.location || !formData.location.trim()) {
                newErrors.location = 'Địa điểm là bắt buộc';
            }
        }

        // Validate date logic if both dates are provided
        if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
            newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
        }

        // Validation for points has been moved to ScoreRulesForm or removed

        // Only validate organizerIds for normal and minigame modes
        if (mode !== 'series' && (!formData.organizerIds || formData.organizerIds.length === 0)) {
            newErrors.organizerIds = 'Phải chọn ít nhất một đơn vị tổ chức';
        }

        // Validate ticketQuantity for minigame mode (must be set if not unlimited)
        // Note: undefined/null means unlimited (no validation needed)
        // This validation will be skipped if isInSeries=true (ticketQuantity will be undefined, unlimitedTickets will be true)
        if (mode === 'minigame' && !unlimitedTickets) {
            if (formData.ticketQuantity === undefined || formData.ticketQuantity === null || formData.ticketQuantity <= 0) {
                newErrors.ticketQuantity = 'Phải nhập số lượng slot để cho phép đăng ký';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    useEffect(() => {
        if (Object.keys(initialData).length > 0) {
            setFormData(prev => {
                const merged = {
                    ...prev,
                    ...Object.fromEntries(
                        Object.entries(initialData).map(([key, value]) => [
                            key,
                            value !== undefined ? value : prev[key as keyof CreateActivityRequest]
                        ])
                    )
                };

                if (initialData.bannerUrl) {
                    setOriginalBannerUrl(initialData.bannerUrl);
                    merged.bannerUrl = '';
                }

                if (initialData.ticketQuantity === undefined || initialData.ticketQuantity === null) {
                    setUnlimitedTickets(true);
                } else {
                    setUnlimitedTickets(false);
                }

                return merged;
            });
            setIsInitialLoad(false);
        } else {
            setIsInitialLoad(false);
        }
    }, [initialData]);


    useEffect(() => {
        if (isInitialLoad) return;
        if (formData.isImportant || formData.mandatoryForFacultyStudents) {
            setUnlimitedTickets(true);
            setFormData(prev => ({
                ...prev,
                ticketQuantity: undefined
            }));
        }
    }, [formData.isImportant, formData.mandatoryForFacultyStudents, isInitialLoad]);

    useEffect(() => {
        if (isInitialLoad) return;
        if (formData.isImportant || formData.mandatoryForFacultyStudents) {
            setFormData(prev => ({
                ...prev,
                requiresApproval: false
            }));
        }
    }, [formData.isImportant, formData.mandatoryForFacultyStudents, isInitialLoad]);

    const handleOrganizerChange = (ids: number[]) => {
        setFormData(prev => ({
            ...prev,
            organizerIds: ids
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            try {
                setIsUploading(true);

                if (formData.bannerFile) {
                    const uploadResponse = await uploadAPI.uploadImage(formData.bannerFile);

                    if (uploadResponse.status && uploadResponse.data) {
                        const updatedFormData = {
                            ...formData,
                            bannerUrl: uploadResponse.data,
                            bannerFile: undefined
                        };
                        onSubmit(updatedFormData);
                    } else {
                        setErrors(prev => ({
                            ...prev,
                            banner: uploadResponse.message || 'Upload ảnh thất bại'
                        }));
                        setIsUploading(false);
                        return;
                    }
                } else {
                    const submitData = {
                        ...formData,
                        bannerUrl: formData.bannerUrl || (originalBannerUrl && formData.bannerUrl === '' ? originalBannerUrl : undefined)
                    };
                    onSubmit(submitData);
                }
            } catch (error) {
                setErrors(prev => ({
                    ...prev,
                    banner: 'Có lỗi xảy ra khi xử lý form'
                }));
            } finally {
                setIsUploading(false);
            }
        }
    };

    const renderFieldsProps: RenderFieldsProps = {
        formData,
        errors,
        handleChange,
        handleOrganizerChange,
        unlimitedTickets,
        handleUnlimitedChange,
        originalBannerUrl,
        mode
    };

    const formContent = (
        <form onSubmit={handleSubmit} className={inline ? "space-y-6" : "p-6 space-y-6"}>
            {!isEditing && mode !== 'series' && mode !== 'minigame' && presets.length > 0 && (
                <div className="p-4 bg-blue-50 rounded-md border border-blue-100">
                    <label htmlFor="preset" className="block text-sm font-medium text-[#001C44] mb-2">
                        Mẫu cấu hình (Preset) <span className="text-gray-500 font-normal">- Tự động điền yêu cầu nộp bài và các luật tính điểm</span>
                    </label>
                    <select
                        id="preset"
                        value={selectedPresetCode}
                        onChange={handlePresetChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                    >
                        <option value="">-- Tự do cấu hình (Không dùng mẫu) --</option>
                        {presets
                            .filter(preset => (mode as string) !== 'minigame' || preset.activityType === 'MINIGAME')
                            .map(preset => (
                                <option key={preset.code} value={preset.code}>
                                    {preset.name} - {preset.description}
                                </option>
                            ))}
                    </select>
                </div>
            )}

            {renderFields ? renderFields(renderFieldsProps) : null}

            {/* Score Rules Section */}
            {mode !== 'series' && (
                <div className="pt-6 border-t border-gray-200">
                    <ScoreRulesForm 
                        rules={formData.scoreRules || []}
                        onChange={(rules) => setFormData(prev => ({ ...prev, scoreRules: rules }))}
                        departments={departments}
                    />
                </div>
            )}

            {/* Submit Button */}
            <div className={`flex justify-end space-x-4 ${inline ? 'pt-6 border-t border-gray-200' : 'pt-6 border-t border-gray-200'}`}>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                    >
                        Hủy
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading || isUploading}
                    className="px-6 py-2 bg-[#001C44] text-white rounded-md hover:bg-[#002A66] focus:outline-none focus:ring-2 focus:ring-[#001C44] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isUploading ? 'Đang upload ảnh...' : loading ? 'Đang tạo...' : 'Tạo sự kiện'}
                </button>
            </div>
        </form>
    );

    if (inline) {
        return formContent;
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white shadow-lg rounded-lg">
                {title && (
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-2xl font-bold text-[#001C44]">{title}</h2>
                        <p className="text-gray-600 mt-1">Điền thông tin chi tiết về sự kiện</p>
                    </div>
                )}
                {formContent}
            </div>
        </div>
    );
};

export default BaseEventForm;

