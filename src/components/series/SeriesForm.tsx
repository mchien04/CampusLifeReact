import React, { useState, useEffect, useRef } from 'react';
import { CreateSeriesRequest } from '../../types/series';
import { ScoreType } from '../../types/activity';
import { seriesAPI } from '../../services/seriesAPI';
import { academicPublicAPI } from '../../services/academicPublicAPI';
import { SeriesPresetPreviewResponse, SeriesPresetDefinition, SeriesPresetCode, SeriesPresetConfig } from '../../types/presets';
import PresetConfigPanel from '../presets/PresetConfigPanel';

// Helper functions for preset initialization
const buildEnabledRules = (preset: SeriesPresetDefinition): Record<string, boolean> => {
    const rules: Record<string, boolean> = {};
    for (const rule of preset.supportedRules) {
        rules[rule.ruleKey] = rule.required ? true : rule.enabledByDefault;
    }
    return rules;
};

const buildInitialConfig = (preset: SeriesPresetDefinition): Record<string, unknown> => {
    const config: Record<string, unknown> = {};
    for (const rule of preset.supportedRules) {
        for (const field of rule.fieldDefinitions) {
            if (field.defaultValue !== undefined && field.defaultValue !== null) {
                config[field.fieldName] = field.defaultValue;
            }
        }
    }
    return config;
};

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
            milestonePoints: {},
            scoreType: ScoreType.REN_LUYEN,
            registrationStartDate: '',
            registrationDeadline: '',
            requiresApproval: true,
            ticketQuantity: undefined,
            minimumRequirementEnabled: false,
            minimumRequiredEvents: undefined,
            minimumPenaltyPoints: undefined,
            targetSemesterId: undefined,
            presetCode: (initialData.presetCode ?? '') as SeriesPresetCode,
            presetConfig: initialData.presetConfig ?? undefined
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
    const [presets, setPresets] = useState<SeriesPresetDefinition[]>([]);
    const [selectedPresetCode, setSelectedPresetCode] = useState<string>(
        initialData.presetCode && initialData.presetCode !== 'CUSTOM' ? initialData.presetCode : ''
    );
    const [enabledRules, setEnabledRules] = useState<Record<string, boolean>>({});
    const [presetPreview, setPresetPreview] = useState<SeriesPresetPreviewResponse | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [semesters, setSemesters] = useState<Array<{ id: number; name: string }>>([]);
    const isEditing = !!(initialData && Object.keys(initialData).length > 0);
    const hasInitializedPreset = useRef(false);

    // Load presets
    useEffect(() => {
        const fetchPresets = async () => {
            const res = await seriesAPI.getSeriesPresets();
            if (res.status && res.data) {
                setPresets(res.data as SeriesPresetDefinition[]);
            }
        };
        fetchPresets();
    }, []);

    // Initialize preset state from initialData when editing
    useEffect(() => {
        if (hasInitializedPreset.current || presets.length === 0 || !isEditing) return;

        if (initialData.presetCode && initialData.presetCode !== 'CUSTOM') {
            const preset = presets.find(p => p.code === initialData.presetCode);
            if (preset) {
                setSelectedPresetCode(initialData.presetCode);
                setEnabledRules(buildEnabledRules(preset));
                const initialConfig = initialData.presetConfig
                    ? { ...buildInitialConfig(preset), ...(initialData.presetConfig as Record<string, unknown>) }
                    : buildInitialConfig(preset);
                setFormData(prev => {
                    const updates: Partial<CreateSeriesRequest> = {
                        presetCode: initialData.presetCode as SeriesPresetCode,
                        presetConfig: initialConfig as SeriesPresetConfig
                    };
                    if (initialConfig.primaryScoreType !== undefined) {
                        updates.scoreType = initialConfig.primaryScoreType as ScoreType;
                    }
                    if (initialConfig.milestonePoints !== undefined && typeof initialConfig.milestonePoints === 'object') {
                        updates.milestonePoints = initialConfig.milestonePoints as Record<number, number>;
                    }
                    if (initialConfig.minimumRequirementEnabled !== undefined) {
                        updates.minimumRequirementEnabled = !!initialConfig.minimumRequirementEnabled;
                    }
                    if (initialConfig.minimumRequiredEvents !== undefined) {
                        updates.minimumRequiredEvents = initialConfig.minimumRequiredEvents as number;
                    }
                    if (initialConfig.minimumPenaltyPoints !== undefined) {
                        updates.minimumPenaltyPoints = initialConfig.minimumPenaltyPoints as number;
                    }
                    return { ...prev, ...updates };
                });
            } else {
                // Preset not found, fall back to custom mode
                setSelectedPresetCode('');
                setFormData(prev => ({
                    ...prev,
                    presetCode: 'CUSTOM' as SeriesPresetCode,
                    presetConfig: undefined
                }));
            }
        } else if (initialData.presetCode === 'CUSTOM' || !initialData.presetCode) {
            setSelectedPresetCode('');
            setFormData(prev => ({
                ...prev,
                presetCode: 'CUSTOM' as SeriesPresetCode,
                presetConfig: undefined
            }));
        }
        hasInitializedPreset.current = true;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [presets, isEditing]);

    // Load semesters
    useEffect(() => {
        const fetchSemesters = async () => {
            try {
                const res = await academicPublicAPI.getSemesters();
                if (res && Array.isArray(res)) {
                    setSemesters(res.map((s: any) => ({ id: s.id, name: s.name })));
                }
            } catch (error) {
                console.error('Lỗi khi tải danh sách học kỳ:', error);
            }
        };
        fetchSemesters();
    }, []);

    // Sync milestoneEntries from formData.milestonePoints
    useEffect(() => {
        if (formData.milestonePoints) {
            setMilestoneEntries(
                Object.entries(formData.milestonePoints)
                    .map(([count, points]) => ({ count: parseInt(count), points: points as number }))
                    .sort((a, b) => a.count - b.count)
            );
        } else {
            setMilestoneEntries([]);
        }
    }, [formData.milestonePoints]);

    const handlePresetCodeChange = (code: string) => {
        setSelectedPresetCode(code);
        if (!code) {
            // Custom mode
            setEnabledRules({});
            setPresetPreview(null);
            setFormData(prev => ({
                ...prev,
                presetCode: 'CUSTOM' as SeriesPresetCode,
                presetConfig: undefined
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                presetCode: code as SeriesPresetCode
            }));
        }
    };

    const handlePresetConfigChange = (config: Record<string, unknown>) => {
        setFormData(prev => {
            const updates: Partial<CreateSeriesRequest> = {
                presetConfig: config as SeriesPresetConfig
            };
            // Sync derived fields from config so existing UI still works as fallback
            if (config.primaryScoreType !== undefined) {
                updates.scoreType = config.primaryScoreType as ScoreType;
            }
            if (config.milestonePoints !== undefined && typeof config.milestonePoints === 'object') {
                updates.milestonePoints = config.milestonePoints as Record<number, number>;
            }
            if (config.minimumRequirementEnabled !== undefined) {
                updates.minimumRequirementEnabled = !!config.minimumRequirementEnabled;
            }
            if (config.minimumRequiredEvents !== undefined) {
                updates.minimumRequiredEvents = config.minimumRequiredEvents as number;
            }
            if (config.minimumPenaltyPoints !== undefined) {
                updates.minimumPenaltyPoints = config.minimumPenaltyPoints as number;
            }
            return { ...prev, ...updates };
        });
    };

    const handleRuleToggle = (ruleKey: string, enabled: boolean) => {
        setEnabledRules(prev => ({
            ...prev,
            [ruleKey]: enabled
        }));
    };

    const handlePreview = async () => {
        if (!selectedPresetCode) return;
        setPreviewLoading(true);
        try {
            const res = await seriesAPI.previewSeriesPreset({
                presetCode: selectedPresetCode as SeriesPresetCode,
                presetConfig: formData.presetConfig
            });
            if (res.status && res.data) {
                setPresetPreview(res.data);
                setFormData(prev => ({
                    ...prev,
                    scoreType: res.data!.scoreType,
                    milestonePoints: res.data!.milestonePoints,
                    minimumRequirementEnabled: res.data!.minimumRequirementEnabled ?? false,
                    minimumRequiredEvents: res.data!.minimumRequiredEvents ?? undefined,
                    minimumPenaltyPoints: res.data!.minimumPenaltyPoints !== undefined && res.data!.minimumPenaltyPoints !== null ? Number(res.data!.minimumPenaltyPoints) : undefined
                }));
            }
        } catch (error) {
            console.error('Lỗi khi xem trước mẫu cấu hình:', error);
        } finally {
            setPreviewLoading(false);
        }
    };

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

    const handleSemesterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setFormData(prev => ({
            ...prev,
            targetSemesterId: value === '' ? null : parseInt(value)
        }));
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
            milestonePoints: milestoneObj
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
            milestonePoints: milestoneObj
        }));
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Tên chuỗi sự kiện là bắt buộc';
        }

        const isPresetMode = !!selectedPresetCode;

        if (isPresetMode) {
            // Validate preset config fields using supportedRules metadata
            const selectedPreset = presets.find(p => p.code === selectedPresetCode);
            if (selectedPreset) {
                for (const rule of selectedPreset.supportedRules) {
                    const ruleEnabled = enabledRules[rule.ruleKey] ?? rule.enabledByDefault;
                    if (!ruleEnabled) continue;

                    for (const field of rule.fieldDefinitions) {
                        if (!field.required) continue;
                        // Skip fields hidden because the rule is disabled (shouldn't happen since we skip disabled rules above)
                        if (field.visibility === 'rule_enabled' && !ruleEnabled) continue;

                        const configValue = (formData.presetConfig as Record<string, unknown> | undefined)?.[field.fieldName];

                        if (field.inputType === 'NUMBER') {
                            if (configValue === undefined || configValue === null || configValue === '' || Number(configValue) < 0) {
                                newErrors[field.fieldName] = `${field.label} là bắt buộc và phải >= 0`;
                            }
                        } else if (field.inputType === 'MAP') {
                            if (!configValue || typeof configValue !== 'object' || Object.keys(configValue as object).length === 0) {
                                newErrors[field.fieldName] = `${field.label} không được để trống`;
                            }
                        } else if (field.inputType === 'SELECT') {
                            if (!configValue || configValue === '') {
                                newErrors[field.fieldName] = `Vui lòng chọn ${field.label.toLowerCase()}`;
                            }
                        }
                    }
                }
            }
        } else {
            // CUSTOM mode validation (keep existing behavior)
            if (!formData.milestonePoints || Object.keys(formData.milestonePoints).length === 0) {
                newErrors.milestonePoints = 'Vui lòng thêm ít nhất một mốc điểm';
            }

            if (formData.minimumRequirementEnabled) {
                if (!formData.minimumRequiredEvents || Number(formData.minimumRequiredEvents) < 1) {
                    newErrors.minimumRequiredEvents = 'Số sự kiện tối thiểu phải lớn hơn hoặc bằng 1';
                }
                if (formData.minimumPenaltyPoints === undefined || formData.minimumPenaltyPoints === null || Number(formData.minimumPenaltyPoints) < 0) {
                    newErrors.minimumPenaltyPoints = 'Điểm phạt phải lớn hơn hoặc bằng 0';
                }
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
        if (!validateForm()) return;

        const isCustomMode = !selectedPresetCode;

        if (!isCustomMode) {
            // Preset mode: strip direct fields to avoid backend conflict
            const payload = {
                ...formData,
                presetCode: selectedPresetCode as SeriesPresetCode,
                presetConfig: formData.presetConfig,
                milestonePoints: undefined,
                minimumRequirementEnabled: undefined,
                minimumRequiredEvents: undefined,
                minimumPenaltyPoints: undefined
            } as unknown as CreateSeriesRequest;
            onSubmit(payload);
        } else {
            // CUSTOM mode: keep current behavior
            const payload: CreateSeriesRequest = {
                ...formData,
                presetCode: 'CUSTOM' as SeriesPresetCode,
                presetConfig: undefined
            };
            onSubmit(payload);
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

    const isCustomMode = !selectedPresetCode;

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
                        {/* Preset Config Panel */}
                        {presets.length > 0 && (
                            <div className="md:col-span-2 mb-4 p-4 bg-blue-50 rounded-md border border-blue-100">
                                <PresetConfigPanel
                                    presets={presets as any}
                                    selectedPresetCode={selectedPresetCode}
                                    onPresetChange={handlePresetCodeChange}
                                    config={(formData.presetConfig as Record<string, unknown>) || {}}
                                    onConfigChange={handlePresetConfigChange}
                                    enabledRules={enabledRules}
                                    onRuleToggle={handleRuleToggle}
                                    onPreview={handlePreview}
                                    previewResponse={presetPreview}
                                    previewLoading={previewLoading}
                                    mode="series"
                                    errors={errors}
                                />
                            </div>
                        )}

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
                            <label htmlFor="targetSemesterId" className="block text-sm font-medium text-gray-700 mb-2">
                                Học kỳ cộng điểm milestone
                            </label>
                            <select
                                id="targetSemesterId"
                                name="targetSemesterId"
                                value={formData.targetSemesterId ?? ''}
                                onChange={handleSemesterChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                            >
                                <option value="">Tự động (theo thời gian sự kiện đầu tiên)</option>
                                {semesters.map(semester => (
                                    <option key={semester.id} value={semester.id}>
                                        {semester.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Chọn học kỳ để cộng điểm milestone. Bỏ trống để hệ thống tự suy luận.
                            </p>
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

                    {/* Milestone Points - only show in CUSTOM mode */}
                    {isCustomMode && (
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
                    )}

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

                    {/* Minimum Requirements - only show in CUSTOM mode */}
                    {isCustomMode && (
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Điều kiện tối thiểu</h3>
                            <div className="space-y-4">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        name="minimumRequirementEnabled"
                                        checked={formData.minimumRequirementEnabled || false}
                                        onChange={handleChange}
                                        className="rounded border-gray-300 text-[#001C44] focus:ring-[#001C44]"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Bật yêu cầu tối thiểu (Minimum Requirements)</span>
                                </label>

                                {formData.minimumRequirementEnabled && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                        <div>
                                            <label htmlFor="minimumRequiredEvents" className="block text-sm font-medium text-gray-700 mb-2">
                                                Số sự kiện tối thiểu cần hoàn thành
                                            </label>
                                            <input
                                                type="number"
                                                id="minimumRequiredEvents"
                                                name="minimumRequiredEvents"
                                                min="1"
                                                value={formData.minimumRequiredEvents || ''}
                                                onChange={handleChange}
                                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44] ${
                                                    errors.minimumRequiredEvents ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                                placeholder="Ví dụ: 2"
                                            />
                                            {errors.minimumRequiredEvents && (
                                                <p className="text-red-500 text-sm mt-1">{errors.minimumRequiredEvents}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label htmlFor="minimumPenaltyPoints" className="block text-sm font-medium text-gray-700 mb-2">
                                                Điểm phạt nếu không hoàn thành (điểm dương)
                                            </label>
                                            <input
                                                type="number"
                                                id="minimumPenaltyPoints"
                                                name="minimumPenaltyPoints"
                                                min="0"
                                                value={formData.minimumPenaltyPoints ?? ''}
                                                onChange={handleChange}
                                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44] ${
                                                    errors.minimumPenaltyPoints ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                                placeholder="Ví dụ: 5"
                                            />
                                            {errors.minimumPenaltyPoints && (
                                                <p className="text-red-500 text-sm mt-1">{errors.minimumPenaltyPoints}</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

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
