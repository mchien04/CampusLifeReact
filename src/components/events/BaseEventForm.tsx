import React, { useState, useEffect, useCallback } from 'react';
import { ActivityType, ScoreType, ActivityScoreRuleRequest } from '../../types/activity';
import { ActivityPresetPreviewResponse, ActivityPresetDefinition, ActivityPresetCode } from '../../types/presets';
import { ActivityPresetConfig } from '../../types/activity';
import { uploadAPI } from '../../services/uploadAPI';
import { eventAPI } from '../../services/eventAPI';
import { departmentAPI } from '../../services/adminAPI';
import api from '../../services/api';
import { getImageUrl } from '../../utils/imageUtils';
import { toast } from 'react-toastify';
import OrganizerSelector from './OrganizerSelector';
import { ScoreRulesForm } from './ScoreRulesForm';
import { Department } from '../../types/admin';
import ActivityScoreRulePreview from './ActivityScoreRulePreview';
import PresetConfigPanel from '../presets/PresetConfigPanel';
import { validateActivityPresetConfig } from '../../utils/presetValidation';

export type FormMode = 'normal' | 'minigame' | 'series';

export interface BaseEventFormData {
    name: string;
    type: ActivityType;
    description?: string | null;
    startDate: string;
    endDate: string;
    location?: string | null;
    bannerUrl?: string | null;
    shareLink?: string | null;
    benefits?: string | null;
    requirements?: string | null;
    contactInfo?: string | null;
    organizerIds?: number[];
    
    // Optional fields used by some modes
    requiresSubmission?: boolean | null;
    scoreRules?: ActivityScoreRuleRequest[];
    registrationStartDate?: string | null;
    registrationDeadline?: string | null;
    isImportant?: boolean | null;
    isDraft?: boolean | null;
    ticketQuantity?: number | null;
    requiresApproval?: boolean | null;
    mandatoryForFacultyStudents?: boolean | null;
    presetCode?: string | null;
    presetConfig?: any | null;
    order?: number | null;
    bannerFile?: File;
}

interface BaseEventFormProps<T extends BaseEventFormData = BaseEventFormData> {
    mode: FormMode;
    onSubmit: (data: T) => void;
    loading?: boolean;
    initialData?: Partial<T>;
    title?: string;
    onCancel?: () => void;
    renderFields?: (props: RenderFieldsProps<T>) => React.ReactNode;
    inline?: boolean; // If true, render without wrapper (for modals)
    lockApprovalWhenImportant?: boolean;
    activeScoreEntryCount?: number;
}

export interface RenderFieldsProps<T extends BaseEventFormData = BaseEventFormData> {
    formData: T;
    errors: Record<string, string>;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    handleOrganizerChange: (ids: number[]) => void;
    unlimitedTickets: boolean;
    handleUnlimitedChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    originalBannerUrl: string;
    mode: FormMode;
    lockApprovalWhenImportant: boolean;
    isScoreLocked?: boolean;
}

const BaseEventForm = <T extends BaseEventFormData>({
    mode,
    onSubmit,
    loading = false,
    initialData = {},
    title = "Tạo sự kiện mới",
    onCancel,
    renderFields,
    inline = false,
    lockApprovalWhenImportant = true,
    activeScoreEntryCount = 0
}: BaseEventFormProps<T>) => {
    const [formData, setFormData] = useState<T>(() => {
        const defaultData: BaseEventFormData = {
            name: '',
            type: mode === 'minigame' ? ActivityType.MINIGAME : ActivityType.SUKIEN,
            description: '',
            startDate: '',
            endDate: '',
            location: '',
            bannerUrl: '',
            shareLink: '',
            benefits: '',
            requirements: '',
            contactInfo: '',
            organizerIds: [],
            requiresSubmission: mode === 'series' ? undefined : false,
            scoreRules: mode === 'series' ? undefined : [],
            registrationStartDate: mode === 'series' ? undefined : '',
            registrationDeadline: mode === 'series' ? undefined : '',
            isImportant: false,
            isDraft: true,
            ticketQuantity: mode === 'series' ? undefined : (mode === 'minigame' ? 0 : 0),
            requiresApproval: mode === 'series' ? undefined : true,
            mandatoryForFacultyStudents: false,
        };

        return {
            ...defaultData,
            ...Object.fromEntries(
                Object.entries(initialData).map(([key, value]) => [
                    key,
                    value !== undefined ? value : (defaultData as any)[key]
                ])
            )
        } as T;
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [originalBannerUrl, setOriginalBannerUrl] = useState<string>('');
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [unlimitedTickets, setUnlimitedTickets] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [presets, setPresets] = useState<ActivityPresetDefinition[]>([]);
    const [selectedPresetCode, setSelectedPresetCode] = useState<string>('');
    const [presetPreview, setPresetPreview] = useState<ActivityPresetPreviewResponse | null>(null);
    const [enabledRules, setEnabledRules] = useState<Record<string, boolean>>({});
    const [presetConfigErrors, setPresetConfigErrors] = useState<Record<string, string>>({});
    const [departments, setDepartments] = useState<Department[]>([]);
    const [semesters, setSemesters] = useState<Array<{ id: number; name: string }>>([]);
    const isEditing = !!(initialData && initialData.name);
    const isScoreLocked = (activeScoreEntryCount ?? 0) > 0;

    // Sync selectedPresetCode and enabledRules when formData.presetCode changes (e.g. from initialData or preset selection)
    useEffect(() => {
        if (formData.presetCode && formData.presetCode !== 'CUSTOM') {
            setSelectedPresetCode(formData.presetCode);
            const preset = presets.find(p => p.code === formData.presetCode);
            if (preset) {
                const newRules = buildEnabledRules(preset);
                setEnabledRules(newRules);

                // Reconstruct presetConfig from scoreRules if presetConfig is null (edit mode read-back)
                if (!formData.presetConfig || Object.keys(formData.presetConfig as object).length === 0) {
                    const rules = formData.scoreRules;
                    if (rules && rules.length > 0) {
                        const reconstructed = buildInitialConfig(preset);
                        const rule0 = rules[0];
                        reconstructed.audience = rule0.audience;
                        reconstructed.semesterPolicy = rule0.semesterPolicy;
                        reconstructed.explicitSemesterId = rule0.explicitSemesterId ?? undefined;
                        reconstructed.departmentIds = rule0.departmentIds ?? [];
                        const participationRule = rules.find((r: any) => r.triggerType === 'PARTICIPATION_COMPLETED');
                        if (participationRule) reconstructed.participationPoints = participationRule.points;
                        const noShowRule = rules.find((r: any) => r.triggerType === 'NO_SHOW');
                        if (noShowRule && noShowRule.failPoints != null) {
                            reconstructed.noShowPenaltyEnabled = true;
                            reconstructed.noShowPenaltyPoints = noShowRule.failPoints;
                            reconstructed.noShowPenaltyScoreType = noShowRule.scoreType;
                        }
                        const submissionRule = rules.find((r: any) => r.triggerType === 'SUBMISSION_GRADED');
                        if (submissionRule) {
                            reconstructed.submissionPassPoints = submissionRule.points;
                            reconstructed.submissionFailPoints = submissionRule.failPoints ?? undefined;
                        }
                        const overdueRule = rules.find((r: any) => r.triggerType === 'TASK_OVERDUE');
                        if (overdueRule && overdueRule.failPoints != null) reconstructed.taskOverduePenaltyPoints = overdueRule.failPoints;
                        const exhaustedRule = rules.find((r: any) => r.triggerType === 'MINIGAME_EXHAUSTED_ATTEMPTS');
                        if (exhaustedRule && exhaustedRule.failPoints != null) reconstructed.minigameExhaustedPenaltyPoints = exhaustedRule.failPoints;
                        setFormData((prev: any) => ({
                            ...prev,
                            presetConfig: reconstructed
                        }));
                    }
                }
            }
        } else {
            setSelectedPresetCode('');
            setEnabledRules({});
        }
    }, [formData.presetCode, presets]);

    // Automatically load preview whenever presetCode changes (not on every presetConfig change)
    useEffect(() => {
        const loadPresetPreview = async () => {
            if (formData.presetCode && formData.presetCode !== 'CUSTOM') {
                try {
                    const previewRes = await eventAPI.previewActivityPreset({ 
                        presetCode: formData.presetCode,
                        presetConfig: formData.presetConfig || {}
                    });
                    if (previewRes.status && previewRes.data) {
                        const presetData = previewRes.data;
                        setPresetPreview(presetData);
                        // Also sync requiresSubmission from preset data if it differs
                        if (presetData.requiresSubmission !== formData.requiresSubmission) {
                            setFormData(prev => ({
                                ...prev,
                                requiresSubmission: presetData.requiresSubmission
                            } as T));
                        }
                    }
                } catch (error) {
                    console.error('Lỗi khi tải bản xem trước preset:', error);
                }
            } else {
                setPresetPreview(null);
            }
        };
        loadPresetPreview();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.presetCode]);

    // Load presets on mount
    useEffect(() => {
        const fetchPresets = async () => {
            try {
                const res = await eventAPI.getActivityPresets();
                if (res.status && res.data) {
                    // Filter presets based on mode:
                    // MINIGAME_PASS_ONLY is only for minigame mode, hide from standard event form
                    // Minigame mode: only show MINIGAME_PASS_ONLY + CUSTOM
                    // Backend v5 descriptor currently omits NO_SHOW from MINIGAME_PASS_ONLY's supportedRules.
                    // Patch it in so the rule card renders and behaves consistently with other presets.
                    const patchedPresets = res.data.map(p => {
                        if (p.code !== 'MINIGAME_PASS_ONLY') return p;
                        const alreadyHasNoShow = p.supportedRules.some(r => r.ruleKey === 'NO_SHOW');
                        if (alreadyHasNoShow) return p;
                        const noShowRule: ActivityPresetDefinition['supportedRules'][number] = {
                            ruleKey: 'NO_SHOW',
                            label: 'Phạt vắng mặt (No-show)',
                            description: 'Trừ điểm khi sinh viên đã đăng ký nhưng không đến tham gia sự kiện.',
                            required: false,
                            enabledByDefault: true,
                            fieldDefinitions: [
                                {
                                    fieldName: 'noShowPenaltyEnabled',
                                    label: 'Bật phạt vắng mặt',
                                    inputType: 'BOOLEAN',
                                    required: true,
                                    defaultValue: true,
                                    visibility: 'ALWAYS',
                                    options: null
                                },
                                {
                                    fieldName: 'noShowPenaltyPoints',
                                    label: 'Số điểm phạt',
                                    inputType: 'NUMBER',
                                    required: true,
                                    defaultValue: 5,
                                    visibility: 'rule_enabled',
                                    options: null
                                },
                                {
                                    fieldName: 'noShowPenaltyScoreType',
                                    label: 'Loại điểm phạt (để trống để mặc định theo Loại điểm chính)',
                                    inputType: 'SELECT',
                                    required: false,
                                    defaultValue: null,
                                    visibility: 'rule_enabled',
                                    options: ['REN_LUYEN', 'CONG_TAC_XA_HOI', 'CHUYEN_DE']
                                }
                            ],
                            suggestedCombinations: []
                        };
                        return { ...p, supportedRules: [...p.supportedRules, noShowRule] };
                    });

                    const filteredPresets = mode === 'normal'
                        ? patchedPresets.filter(p => p.code !== 'MINIGAME_PASS_ONLY')
                        : mode === 'minigame'
                            ? patchedPresets.filter(p => p.code === 'MINIGAME_PASS_ONLY' || p.code === 'CUSTOM')
                            : patchedPresets;
                    setPresets(filteredPresets);

                    // If mode is minigame and we are on initial load (not editing)
                    if (mode === 'minigame' && !isEditing) {
                        const minigamePreset = filteredPresets.find(p => p.code === 'MINIGAME_PASS_ONLY');
                        if (minigamePreset) {
                            // MUST use buildInitialConfig to populate default field values.
                            // Using {} causes preset validation to fail (required fields missing)
                            // and silently blocks form submission with no visible error.
                            const initialConfig = buildInitialConfig(minigamePreset);
                            const initialEnabledRules = buildEnabledRules(minigamePreset);
                            setEnabledRules(initialEnabledRules);
                            setFormData(prev => ({
                                ...prev,
                                presetCode: 'MINIGAME_PASS_ONLY',
                                presetConfig: initialConfig,
                                scoreRules: []
                            } as T));
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

    // Load semesters on mount
    useEffect(() => {
        const fetchSemesters = async () => {
            try {
                const res = await api.get('/api/academic/semesters');
                const data = res.data?.body || res.data?.data || [];
                if (Array.isArray(data)) {
                    setSemesters(data.map((s: any) => ({ id: s.id, name: s.name })));
                }
            } catch (err) {
                console.error('Error fetching semesters:', err);
            }
        };
        fetchSemesters();
    }, []);

    const externalOptions = {
        departmentIds: departments.map(d => ({ value: d.id, label: d.name })),
        explicitSemesterId: semesters.map(s => ({ value: s.id, label: s.name })),
    };

    const buildEnabledRules = useCallback((preset: ActivityPresetDefinition): Record<string, boolean> => {
        const rules: Record<string, boolean> = {};
        for (const rule of preset.supportedRules) {
            rules[rule.ruleKey] = rule.required ? true : rule.enabledByDefault;
        }
        return rules;
    }, []);

    const buildInitialConfig = useCallback((preset: ActivityPresetDefinition): ActivityPresetConfig => {
        const config: Record<string, unknown> = {};
        for (const rule of preset.supportedRules) {
            for (const field of rule.fieldDefinitions) {
                if (field.defaultValue !== undefined && field.defaultValue !== null) {
                    config[field.fieldName] = field.defaultValue;
                } else if (field.required) {
                    switch (field.inputType) {
                        case 'NUMBER':
                            config[field.fieldName] = 0;
                            break;
                        case 'BOOLEAN':
                            config[field.fieldName] = false;
                            break;
                        case 'SELECT':
                            if (field.options && field.options.length > 0) {
                                config[field.fieldName] = field.options[0];
                            }
                            break;
                        case 'MULTI_SELECT':
                            config[field.fieldName] = [];
                            break;
                        case 'MAP':
                            config[field.fieldName] = {};
                            break;
                    }
                }
            }
        }
        return config as ActivityPresetConfig;
    }, []);

    const handlePresetChange = (code: string) => {
        setSelectedPresetCode(code);
        setPresetConfigErrors({});

        if (!code) {
            setFormData(prev => ({
                ...prev,
                presetCode: 'CUSTOM',
                presetConfig: null,
                scoreRules: presetPreview?.scoreRules || prev.scoreRules || []
            } as T));
            setEnabledRules({});
            setPresetPreview(null);
            return;
        }

        const preset = presets.find(p => p.code === code);
        if (preset) {
            const newEnabledRules = buildEnabledRules(preset);
            const newConfig = buildInitialConfig(preset);
            setEnabledRules(newEnabledRules);
            setFormData(prev => ({
                ...prev,
                presetCode: code as ActivityPresetCode,
                presetConfig: newConfig,
                scoreRules: undefined
            } as T));
        }
    };

    const handleRuleToggle = (ruleKey: string, enabled: boolean) => {
        setEnabledRules(prev => ({ ...prev, [ruleKey]: enabled }));
        // Update formData to reflect toggle state for special fields like noShowPenaltyEnabled
        const selectedPreset = presets.find(p => p.code === selectedPresetCode);
        if (selectedPreset) {
            const rule = selectedPreset.supportedRules.find(r => r.ruleKey === ruleKey);
            if (rule) {
                const toggleField = rule.fieldDefinitions.find(f => f.fieldName.toLowerCase().includes('enabled'));
                if (toggleField) {
                    setFormData(prev => ({
                        ...prev,
                        presetConfig: { ...(prev.presetConfig || {}), [toggleField.fieldName]: enabled }
                    } as T));
                }
            }
        }
    };

    const handlePresetConfigFieldChange = (fieldName: string, value: unknown) => {
        setFormData(prev => ({
            ...prev,
            presetConfig: { ...(prev.presetConfig || {}), [fieldName]: value }
        } as T));
    };

    const handlePreview = async () => {
        if (!selectedPresetCode || selectedPresetCode === 'CUSTOM') return;
        try {
            const res = await eventAPI.previewActivityPreset({
                presetCode: selectedPresetCode as ActivityPresetCode,
                type: formData.type,
                requiresSubmission: formData.requiresSubmission,
                presetConfig: formData.presetConfig || {}
            });
            if (res.status && res.data) {
                setPresetPreview(res.data);
                if (res.data.requiresSubmission !== formData.requiresSubmission) {
                    setFormData(prev => ({
                        ...prev,
                        requiresSubmission: res.data!.requiresSubmission
                    } as T));
                }
            }
        } catch (error) {
            console.error('Lỗi khi xem trước preset:', error);
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
            setFormData(prev => ({ ...prev, ticketQuantity: undefined } as T));
        } else {
            setFormData(prev => ({ ...prev, ticketQuantity: 0 } as T));
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

        // Port from EventForm: requiresSubmission must have PASS_FAIL_POINTS with failPoints.
        // Chỉ áp dụng cho chế độ CUSTOM (preset mode do backend quyết định rule).
        const isCustomMode = !formData.presetCode || formData.presetCode === 'CUSTOM';
        if (isCustomMode && formData.requiresSubmission) {
            const hasPassFailWithFailPoints = formData.scoreRules?.some(
                rule => rule.calculation === 'PASS_FAIL_POINTS' && rule.failPoints !== undefined && rule.failPoints !== null
            );
            if (!hasPassFailWithFailPoints) {
                newErrors.scoreRules = 'Sự kiện yêu cầu nộp bài thu hoạch phải có ít nhất một luật tính điểm Đạt/Trượt và có cấu hình điểm trượt hợp lệ.';
            }
        }

        // Port from EventForm: CHUYEN_DE events cannot have NO_SHOW penalty with CHUYEN_DE score type.
        // Chỉ áp dụng cho chế độ CUSTOM.
        if (isCustomMode && formData.type === ActivityType.CHUYEN_DE_DOANH_NGHIEP) {
            const hasInvalidNoShowPenalty = formData.scoreRules?.some(
                rule => rule.triggerType === 'NO_SHOW' && rule.scoreType === ScoreType.CHUYEN_DE
            );
            if (hasInvalidNoShowPenalty) {
                newErrors.scoreRules = 'Sự kiện Chuyên đề doanh nghiệp không được cấu hình luật phạt vắng mặt (No-show) bằng điểm Chuyên đề. Vui lòng chọn loại điểm phạt khác (ví dụ: Rèn luyện).';
            }
        }

        // Validate preset config fields when using a preset
        const presetErrs: Record<string, string> = {};
        const isPresetMode = formData.presetCode && formData.presetCode !== 'CUSTOM';
        if (isPresetMode) {
            const selectedPreset = presets.find(p => p.code === formData.presetCode);
            if (selectedPreset) {
                const result = validateActivityPresetConfig(
                    selectedPreset,
                    enabledRules,
                    (formData.presetConfig || {}) as Record<string, unknown>
                );
                for (const e of result.errors) {
                    presetErrs[e.fieldName] = e.message;
                }
                if (result.errors.length > 0) {
                    toast.error('Vui lòng hoàn tất cấu hình preset bắt buộc');
                    console.warn('Preset validation errors:', result.errors);
                }
            }
        }

        setErrors(newErrors);
        setPresetConfigErrors(presetErrs);
        if (Object.keys(newErrors).length > 0 || Object.keys(presetErrs).length > 0) {
            console.warn('BaseEventForm validation failed', { formErrors: newErrors, presetErrors: presetErrs });
            return false;
        }
        return true;
    };

    useEffect(() => {
        if (Object.keys(initialData).length > 0) {
            setFormData(prev => {
                const merged = {
                    ...prev,
                    ...Object.fromEntries(
                        Object.entries(initialData).map(([key, value]) => [
                            key,
                            value !== undefined ? value : prev[key as keyof T]
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

                return merged as T;
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
            } as T));
        }
    }, [formData.isImportant, formData.mandatoryForFacultyStudents, isInitialLoad]);

    useEffect(() => {
        if (isInitialLoad) return;
        if (lockApprovalWhenImportant && (formData.isImportant || formData.mandatoryForFacultyStudents)) {
            setFormData(prev => ({
                ...prev,
                requiresApproval: false
            } as T));
        }
    }, [formData.isImportant, formData.mandatoryForFacultyStudents, isInitialLoad, lockApprovalWhenImportant]);

    const handleOrganizerChange = (ids: number[]) => {
        setFormData(prev => ({
            ...prev,
            organizerIds: ids
        } as T));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            try {
                setIsUploading(true);

                const isPresetMode = formData.presetCode && formData.presetCode !== 'CUSTOM';
                const baseSubmitData = isScoreLocked
                    ? {
                        ...formData,
                        scoreRules: undefined,
                        presetConfig: undefined,
                        presetCode: undefined,
                        type: undefined,
                    }
                    : {
                        ...formData,
                        scoreRules: isPresetMode ? undefined : formData.scoreRules,
                        presetConfig: isPresetMode ? formData.presetConfig : undefined,
                        presetCode: isPresetMode ? formData.presetCode : 'CUSTOM'
                    };

                if (formData.bannerFile) {
                    const uploadResponse = await uploadAPI.uploadImage(formData.bannerFile);

                    if (uploadResponse.status && uploadResponse.data) {
                        const updatedFormData = {
                            ...baseSubmitData,
                            bannerUrl: uploadResponse.data,
                            bannerFile: undefined
                        } as T;
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
                        ...baseSubmitData,
                        bannerUrl: formData.bannerUrl || (originalBannerUrl && formData.bannerUrl === '' ? originalBannerUrl : undefined)
                    } as T;
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

    const renderFieldsProps: RenderFieldsProps<T> = {
        formData,
        errors,
        handleChange,
        handleOrganizerChange,
        unlimitedTickets,
        handleUnlimitedChange,
        originalBannerUrl,
        mode,
        lockApprovalWhenImportant,
        isScoreLocked
    };

    const formContent = (
        <form onSubmit={handleSubmit} className={inline ? "space-y-6" : "p-6 space-y-6"}>
            {/* Score Lock Banner */}
            {isScoreLocked && (
                <div className="p-4 bg-red-50 border border-red-300 rounded-md">
                    <div className="flex items-start">
                        <svg className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <p className="text-sm font-semibold text-red-800">Cấu hình điểm đã bị khóa</p>
                            <p className="text-sm text-red-700 mt-1">
                                Sự kiện đã có <strong>{activeScoreEntryCount}</strong> lượt tính điểm, không thể sửa cấu hình điểm (loại điểm, preset, luật điểm).
                                Unpublish sự kiện trước để sửa.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Preset Config Panel (Standard & Minigame) */}
            {mode !== 'series' && presets.length > 0 && !isScoreLocked && (
                <PresetConfigPanel
                    presets={presets}
                    selectedPresetCode={selectedPresetCode}
                    onPresetChange={handlePresetChange}
                    config={(formData.presetConfig || {}) as Record<string, unknown>}
                    onConfigChange={(config) => {
                        setFormData(prev => ({
                            ...prev,
                            presetConfig: config as ActivityPresetConfig
                        } as T));
                    }}
                    enabledRules={enabledRules}
                    onRuleToggle={handleRuleToggle}
                    onPreview={handlePreview}
                    previewResponse={presetPreview}
                    previewLoading={false}
                    mode="activity"
                    activityType={formData.type}
                    requiresSubmission={formData.requiresSubmission}
                    errors={presetConfigErrors}
                    externalOptions={externalOptions}
                />
            )}

            {renderFields ? renderFields(renderFieldsProps) : null}

            {/* Score Rules Section - only shown in CUSTOM mode and not locked */}
            {mode !== 'series' && (!formData.presetCode || formData.presetCode === 'CUSTOM') && !isScoreLocked && (
                <div className="pt-6 border-t border-gray-200">
                    <ScoreRulesForm
                        rules={formData.scoreRules || []}
                        onChange={(rules) => setFormData(prev => ({ ...prev, scoreRules: rules } as T))}
                        departments={departments}
                        disabled={false}
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
                    {isUploading ? 'Đang upload ảnh...' : loading ? (isEditing ? 'Đang lưu...' : 'Đang tạo...') : (isEditing ? 'Lưu thay đổi' : 'Tạo sự kiện')}
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

