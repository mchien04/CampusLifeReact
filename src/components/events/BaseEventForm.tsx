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
import { useFormDraft } from '../../hooks/useFormDraft';

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
    const isEditing = !!(initialData && initialData.name);

    const { 
        data: formData, 
        setData: setFormData,
        loadExternalData,
        hasDraft, 
        clearDraft, 
        draftSavedAt 
    } = useFormDraft<T>(
        `draft_${mode}_create`, 
        (() => {
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
        })(), 
        !isEditing
    );

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [originalBannerUrl, setOriginalBannerUrl] = useState<string>('');
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [unlimitedTickets, setUnlimitedTickets] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [presets, setPresets] = useState<ActivityPresetDefinition[]>([]);
    const [selectedPresetCode, setSelectedPresetCode] = useState<string>('');
    const [presetPreview, setPresetPreview] = useState<ActivityPresetPreviewResponse | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [enabledRules, setEnabledRules] = useState<Record<string, boolean>>({});
    const [presetConfigErrors, setPresetConfigErrors] = useState<Record<string, string>>({});
    const [departments, setDepartments] = useState<Department[]>([]);
    const [semesters, setSemesters] = useState<Array<{ id: number; name: string }>>([]);
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
                            // P6.1: reconstruct failScoreType (chỉ có giá trị cho enterprise).
                            reconstructed.submissionFailScoreType = submissionRule.failScoreType ?? undefined;
                        }
                        const overdueRule = rules.find((r: any) => r.triggerType === 'TASK_OVERDUE');
                        if (overdueRule && overdueRule.failPoints != null) reconstructed.taskOverduePenaltyPoints = overdueRule.failPoints;
                        const exhaustedRule = rules.find((r: any) => r.triggerType === 'MINIGAME_EXHAUSTED_ATTEMPTS');
                        if (exhaustedRule && exhaustedRule.failPoints != null) reconstructed.minigameExhaustedPenaltyPoints = exhaustedRule.failPoints;

                        // P6-11: reconstruct submissionEnabled + enabledRules.SUBMISSION_GRADED.
                        const hasSubmission = !!submissionRule;
                        reconstructed.submissionEnabled = hasSubmission;
                        if (hasSubmission) {
                            setEnabledRules(prev => ({ ...prev, SUBMISSION_GRADED: true }));
                        }

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
        const selectedPreset = presets.find(p => p.code === selectedPresetCode);
        const rule = selectedPreset?.supportedRules.find(r => r.ruleKey === ruleKey);

        // P6-2: khi bật rule → tự tắt các rule conflictsWith (mirror hai chiều).
        const conflictsToDisable = enabled ? (rule?.conflictsWith ?? []) : [];

        // P6.1: TASK_OVERDUE chỉ bật được khi SUBMISSION_GRADED bật.
        if (ruleKey === 'TASK_OVERDUE' && enabled) {
            const submissionGradedOn = enabledRules.SUBMISSION_GRADED;
            if (!submissionGradedOn) {
                return; // không cho toggle ON
            }
        }

        // P6.1: khi tắt SUBMISSION_GRADED → tự tắt TASK_OVERDUE.
        const cascadingTurnsOff = (ruleKey === 'SUBMISSION_GRADED' && !enabled) ? ['TASK_OVERDUE'] as const : [];

        setEnabledRules(prev => {
            const next = { ...prev, [ruleKey]: enabled };
            for (const conflictKey of conflictsToDisable) {
                next[conflictKey] = false;
            }
            for (const depKey of cascadingTurnsOff) {
                next[depKey] = false;
            }
            return next;
        });

        // Sync presetConfig: reflect toggle state cho field 'Enabled' của rule
        // + disable field của các rule bị conflict tắt.
        setFormData(prev => {
            const currentConfig = { ...(prev.presetConfig || {}) } as Record<string, unknown>;
            if (rule) {
                const toggleField = rule.fieldDefinitions.find(f => f.fieldName.toLowerCase().includes('enabled'));
                if (toggleField) {
                    currentConfig[toggleField.fieldName] = enabled;
                }
            }
            for (const conflictKey of conflictsToDisable) {
                const conflictRule = selectedPreset?.supportedRules.find(r => r.ruleKey === conflictKey);
                const conflictToggle = conflictRule?.fieldDefinitions.find(f => f.fieldName.toLowerCase().includes('enabled'));
                if (conflictToggle) {
                    currentConfig[conflictToggle.fieldName] = false;
                }
            }
            for (const depKey of cascadingTurnsOff) {
                const depRule = selectedPreset?.supportedRules.find(r => r.ruleKey === depKey);
                const depToggle = depRule?.fieldDefinitions.find(f => f.fieldName.toLowerCase().includes('enabled'));
                if (depToggle) {
                    currentConfig[depToggle.fieldName] = false;
                }
            }

            // P6-5: submissionEnabled derive từ enabledRules.SUBMISSION_GRADED (tránh duplicate state).
            const nextEnabledRules = { ...enabledRules, [ruleKey]: enabled } as Record<string, boolean>;
            for (const conflictKey of conflictsToDisable) {
                nextEnabledRules[conflictKey] = false;
            }
            for (const depKey of cascadingTurnsOff) {
                nextEnabledRules[depKey] = false;
            }
            const submissionOn = ruleKey === 'SUBMISSION_GRADED'
                ? enabled
                : (nextEnabledRules.SUBMISSION_GRADED ?? false);
            currentConfig.submissionEnabled = submissionOn;

            return {
                ...prev,
                presetConfig: currentConfig as ActivityPresetConfig
            } as T;
        });
    };

    const handlePresetConfigFieldChange = (fieldName: string, value: unknown) => {
        setFormData(prev => ({
            ...prev,
            presetConfig: { ...(prev.presetConfig || {}), [fieldName]: value }
        } as T));
    };

    const handlePreview = async () => {
        if (!selectedPresetCode || selectedPresetCode === 'CUSTOM') return;
        setPreviewLoading(true);
        setPresetPreview(null);
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
        } finally {
            setPreviewLoading(false);
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
                    toast.error('Vui lòng hoàn tất cấu hình mẫu bắt buộc');
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
                        if (!isEditing) clearDraft();
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
                    if (!isEditing) clearDraft();
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

    const scoreConfigPanel = mode !== 'series' ? (
        <div className="space-y-5">
            {isScoreLocked && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                    <p className="text-sm font-semibold text-rose-800">Cấu hình điểm đã bị khóa</p>
                    <p className="mt-1 text-sm text-rose-700 leading-relaxed">
                        Sự kiện đã có <strong className="tabular-nums">{activeScoreEntryCount}</strong> lượt tính điểm,
                        không thể sửa cấu hình điểm (loại điểm, mẫu cấu hình, luật điểm). Hãy hủy công bố sự kiện trước khi sửa.
                    </p>
                </div>
            )}

            {!isScoreLocked && presets.length > 0 && (
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
                    previewLoading={previewLoading}
                    mode="activity"
                    activityType={formData.type}
                    requiresSubmission={formData.requiresSubmission}
                    errors={presetConfigErrors}
                    externalOptions={externalOptions}
                    lockPreset={isEditing && !!formData.presetCode && formData.presetCode !== 'CUSTOM'}
                />
            )}

            {!isScoreLocked && (!formData.presetCode || formData.presetCode === 'CUSTOM') && (
                <ScoreRulesForm
                    rules={formData.scoreRules || []}
                    onChange={(rules) => setFormData(prev => ({ ...prev, scoreRules: rules } as T))}
                    departments={departments}
                    disabled={false}
                />
            )}
        </div>
    ) : null;

    const useSplitLayout = !inline && mode !== 'series';

    const formContent = (
        <form onSubmit={handleSubmit} className={inline ? 'space-y-6' : 'p-5 sm:p-6 space-y-6'}>
            {hasDraft && !isEditing && (
                <div className="flex items-center justify-between rounded-2xl bg-amber-50 p-4 border border-amber-200 shadow-sm mb-6">
                    <div className="flex items-center gap-3">
                        <span className="text-xl">📝</span>
                        <div>
                            <div className="text-amber-800 text-sm font-extrabold">Đã tự động khôi phục bản nháp chưa lưu</div>
                            {draftSavedAt && <div className="text-amber-600/80 text-xs font-semibold mt-0.5">Lưu lần cuối: {new Date(draftSavedAt).toLocaleString()}</div>}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            if (window.confirm('Bạn có chắc chắn muốn xóa bản nháp này và bắt đầu lại từ đầu?')) {
                                clearDraft();
                            }
                        }}
                        className="text-xs font-extrabold px-4 py-2 rounded-xl bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors shadow-sm"
                    >
                        Làm mới
                    </button>
                </div>
            )}
            {useSplitLayout ? (
                <>
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                        <div className="xl:col-span-7 space-y-6 min-w-0">
                            <div className="rounded-2xl border border-gray-100 bg-white shadow-premium p-5 sm:p-6 space-y-6">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                                        Thông tin sự kiện
                                    </p>
                                    <h3 className="mt-1 text-lg font-semibold tracking-tight text-primary-900">
                                        Chi tiết cơ bản
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Điền tên, thời gian, địa điểm và các tùy chọn tổ chức.
                                    </p>
                                </div>
                                {renderFields ? renderFields(renderFieldsProps) : null}
                            </div>
                        </div>

                        <aside className="xl:col-span-5 min-w-0">
                            <div className="xl:sticky xl:top-24 rounded-2xl border border-primary-900/10 bg-white shadow-premium overflow-hidden">
                                <div className="border-b border-gray-100 bg-primary-900 px-5 py-4 text-white">
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent/90">
                                        Điểm & mẫu cấu hình
                                    </p>
                                    <h3 className="mt-1 text-lg font-semibold tracking-tight">
                                        Cấu hình điểm
                                    </h3>
                                    <p className="mt-1 text-sm text-white/65 leading-relaxed">
                                        Chọn mẫu sẵn có hoặc tùy chỉnh luật điểm riêng cho sự kiện.
                                    </p>
                                </div>
                                <div className="p-5 space-y-5 max-h-[min(70vh,720px)] overflow-y-auto">
                                    {scoreConfigPanel}
                                </div>
                            </div>
                        </aside>
                    </div>
                </>
            ) : (
                <>
                    {isScoreLocked && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                            <p className="text-sm font-semibold text-rose-800">Cấu hình điểm đã bị khóa</p>
                            <p className="mt-1 text-sm text-rose-700">
                                Sự kiện đã có <strong>{activeScoreEntryCount}</strong> lượt tính điểm, không thể sửa cấu hình điểm.
                            </p>
                        </div>
                    )}
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
                            previewLoading={previewLoading}
                            mode="activity"
                            activityType={formData.type}
                            requiresSubmission={formData.requiresSubmission}
                            errors={presetConfigErrors}
                            externalOptions={externalOptions}
                            lockPreset={isEditing && !!formData.presetCode && formData.presetCode !== 'CUSTOM'}
                        />
                    )}
                    {renderFields ? renderFields(renderFieldsProps) : null}
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
                </>
            )}

            <div className={`flex flex-wrap justify-end gap-3 ${inline ? 'pt-6 border-t border-gray-200' : 'pt-2'}`}>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900"
                    >
                        Hủy
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading || isUploading}
                    className="rounded-xl bg-primary-900 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-800 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isUploading
                        ? 'Đang tải ảnh lên...'
                        : loading
                            ? (isEditing ? 'Đang lưu...' : 'Đang tạo...')
                            : (isEditing ? 'Lưu thay đổi' : 'Tạo sự kiện')}
                </button>
            </div>
        </form>
    );

    if (inline) {
        return formContent;
    }

    return (
        <div className="mx-auto max-w-7xl">
            <header className="mb-6 relative overflow-hidden rounded-2xl border border-primary-900/10 bg-primary-900 px-6 py-7 sm:px-8 text-white shadow-premium">
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.12]"
                    style={{
                        backgroundImage:
                            'radial-gradient(ellipse at 0% 0%, #FFD66D 0%, transparent 55%), radial-gradient(ellipse at 100% 100%, #4b88b6 0%, transparent 50%)',
                    }}
                />
                <div className="relative">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent/90">
                        Quản lý sự kiện
                    </p>
                    <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-balance">
                        {title || 'Tạo sự kiện mới'}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm text-white/70 leading-relaxed">
                        Thông tin sự kiện bên trái — cấu hình điểm và mẫu sẵn có bên phải để dễ đối chiếu.
                    </p>
                </div>
            </header>
            {formContent}
        </div>
    );
};

export default BaseEventForm;

