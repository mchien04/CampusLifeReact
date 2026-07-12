import React, { useState, useEffect, useRef } from 'react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { studentAccountAPI, departmentAPI } from '../../services/adminAPI';
import { Department } from '../../types/admin';
import {
    ExcelStudentRow,
    UploadExcelResponse,
    StudentAccountResponse,
    UpdateStudentAccountRequest,
    BulkCreateResponse,
    BulkSendCredentialsResponse,
    CreateStudentRequest
} from '../../types/studentAccount';
import { 
    MagnifyingGlass, 
    PencilSimple, 
    Trash, 
    PaperPlaneRight, 
    CheckCircle, 
    XCircle,
    UserFocus,
    X,
    UploadSimple,
    Eye,
    Plus,
    FileCsv,
    UserPlus,
    List,
    Warning
} from '@phosphor-icons/react';

type TabType = 'upload' | 'review' | 'create' | 'manage' | 'manual_create';

interface StudentAccountManagementProps {
    isNested?: boolean;
}

const StudentAccountManagement: React.FC<StudentAccountManagementProps> = ({ isNested = false }) => {
    const [activeTab, setActiveTab] = useState<TabType>('upload');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Upload Excel state
    const [uploadResponse, setUploadResponse] = useState<UploadExcelResponse | null>(null);
    const [selectedValidRows, setSelectedValidRows] = useState<Set<number>>(new Set());
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Create accounts state
    const [createResponse, setCreateResponse] = useState<BulkCreateResponse | null>(null);

    // Manual create state
    const [manualStudents, setManualStudents] = useState<CreateStudentRequest[]>([
        { studentCode: '', fullName: '', email: '', departmentId: undefined }
    ]);
    const [validationErrors, setValidationErrors] = useState<{ [index: number]: { studentCode?: string, email?: string } }>({});

    // Manage accounts state
    const [accounts, setAccounts] = useState<StudentAccountResponse[]>([]);
    const [pageData, setPageData] = useState<import('../../types/studentAccount').PendingAccountsPage | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [emailSentFilter, setEmailSentFilter] = useState<'ALL' | 'SENT' | 'NOT_SENT'>('ALL');
    const [selectedAccounts, setSelectedAccounts] = useState<Set<number>>(new Set());
    const [editingAccount, setEditingAccount] = useState<StudentAccountResponse | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ show: boolean; account: StudentAccountResponse | null }>({
        show: false,
        account: null
    });
    const [sendingCredentials, setSendingCredentials] = useState<Set<number>>(new Set());

    const [departments, setDepartments] = useState<Department[]>([]);

    useEffect(() => {
        if (activeTab === 'manage') {
            loadAccounts(0);
        }
    }, [activeTab, emailSentFilter]);

    useEffect(() => {
        const loadDepartments = async () => {
            try {
                const response = await departmentAPI.getDepartments();
                if (response.status && response.data) {
                    setDepartments(response.data);
                }
            } catch (err) {
                console.error('Error loading departments:', err);
            }
        };
        loadDepartments();
    }, []);

    const loadAccounts = async (page = 0) => {
        setLoading(true);
        setError('');
        try {
            let credentialsSent: boolean | undefined;
            if (emailSentFilter === 'SENT') credentialsSent = true;
            if (emailSentFilter === 'NOT_SENT') credentialsSent = false;
            
            const response = await studentAccountAPI.getPendingAccounts({ page, size: 20, credentialsSent });
            if (response.status && response.data) {
                setAccounts(response.data.content);
                setPageData(response.data);
            } else {
                setError(response.message || 'Không thể tải danh sách tài khoản');
            }
        } catch (err) {
            console.error('Error loading accounts:', err);
            setError('Có lỗi xảy ra khi tải danh sách tài khoản');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const file = files[0];
        if (!file.name.match(/\.(xlsx|xls)$/i)) {
            setError('Chỉ chấp nhận file Excel (.xlsx hoặc .xls)');
            return;
        }

        uploadFile(file);
    };

    const uploadFile = async (file: File) => {
        setLoading(true);
        setError('');
        setSuccess('');
        setUploadResponse(null);
        setSelectedValidRows(new Set());

        try {
            const response = await studentAccountAPI.uploadExcel(file);
            if (response.status && response.data) {
                setUploadResponse(response.data);
                setSuccess(`Đã parse ${response.data.totalRows} dòng. ${response.data.validRows.length} dòng hợp lệ, ${response.data.invalidRows.length} dòng không hợp lệ.`);
                setActiveTab('review');
            } else {
                setError(response.message || 'Không thể upload file Excel');
            }
        } catch (err) {
            console.error('Error uploading file:', err);
            setError('Có lỗi xảy ra khi upload file');
        } finally {
            setLoading(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileSelect(e.dataTransfer.files);
    };

    const toggleRowSelection = (index: number) => {
        const newSelected = new Set(selectedValidRows);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedValidRows(newSelected);
    };

    const toggleSelectAllValid = () => {
        if (!uploadResponse) return;
        if (selectedValidRows.size === uploadResponse.validRows.length) {
            setSelectedValidRows(new Set());
        } else {
            setSelectedValidRows(new Set(uploadResponse.validRows.map((_, index) => index)));
        }
    };

    const handleBulkCreate = async () => {
        if (!uploadResponse || selectedValidRows.size === 0) {
            setError('Vui lòng chọn ít nhất một dòng hợp lệ để tạo tài khoản');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        const studentsToCreate = Array.from(selectedValidRows).map(index => uploadResponse.validRows[index]);

        try {
            const response = await studentAccountAPI.bulkCreate({ students: studentsToCreate });
            if (response.status && response.data) {
                setCreateResponse(response.data);
                setSuccess(`Đã tạo ${response.data.successCount} tài khoản thành công. ${response.data.errorCount} lỗi.`);
                setActiveTab('create');
                // Clear upload state
                setUploadResponse(null);
                setSelectedValidRows(new Set());
            } else {
                setError(response.message || 'Không thể tạo tài khoản');
            }
        } catch (err) {
            console.error('Error creating accounts:', err);
            setError('Có lỗi xảy ra khi tạo tài khoản');
        } finally {
            setLoading(false);
        }
    };

    const handleManualStudentChange = (index: number, field: keyof CreateStudentRequest, value: any) => {
        const newStudents = [...manualStudents];
        newStudents[index] = { ...newStudents[index], [field]: value };
        setManualStudents(newStudents);
        
        // Clear error when user types
        if (validationErrors[index]?.[field as keyof typeof validationErrors[0]]) {
            setValidationErrors(prev => ({
                ...prev,
                [index]: { ...prev[index], [field]: undefined }
            }));
        }
    };

    const handleValidateField = async (index: number, studentCode?: string, email?: string) => {
        if (!studentCode && !email) return;
        
        try {
            const response = await studentAccountAPI.validateStudent(studentCode, email);
            const responseData = response.data;
            if (response.status && responseData) {
                setValidationErrors(prev => {
                    const newErrors = { ...prev };
                    if (!newErrors[index]) newErrors[index] = {};
                    
                    if (studentCode) {
                        if (!responseData.studentCodeAvailable) {
                            newErrors[index].studentCode = 'Mã số sinh viên đã tồn tại';
                        } else {
                            newErrors[index].studentCode = undefined;
                        }
                    }
                    if (email) {
                        if (!responseData.emailAvailable) {
                            newErrors[index].email = 'Email đã tồn tại';
                        } else {
                            newErrors[index].email = undefined;
                        }
                    }
                    return newErrors;
                });
            }
        } catch (err) {
            console.error('Validation error:', err);
        }
    };

    const addManualStudentRow = () => {
        setManualStudents([...manualStudents, { studentCode: '', fullName: '', email: '', departmentId: undefined }]);
    };

    const removeManualStudentRow = (index: number) => {
        const newStudents = manualStudents.filter((_, i) => i !== index);
        setManualStudents(newStudents);
    };

    const handleManualCreate = async () => {
        // Prevent creation if there are validation errors
        const hasErrors = Object.values(validationErrors).some(err => err.studentCode || err.email);
        if (hasErrors) {
            setError('Vui lòng kiểm tra lại thông tin, có lỗi trong dữ liệu nhập.');
            return;
        }

        const validStudents = manualStudents.filter(s => s.studentCode.trim() && s.fullName.trim() && s.email.trim());
        
        if (validStudents.length === 0) {
            setError('Vui lòng nhập đầy đủ thông tin cho ít nhất một sinh viên');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            let response;
            if (validStudents.length === 1) {
                // Call create single student API
                const singleResponse = await studentAccountAPI.createStudent(validStudents[0]);
                if (singleResponse.status && singleResponse.data) {
                    setSuccess('Tạo tài khoản thành công!');
                    setManualStudents([{ studentCode: '', fullName: '', email: '', departmentId: undefined }]);
                    loadAccounts(); // reload accounts for manage tab
                } else {
                    setError(singleResponse.message || 'Không thể tạo tài khoản');
                }
            } else {
                // Call create multiple students API
                response = await studentAccountAPI.createMultipleStudents({ students: validStudents });
                if (response.status && response.data) {
                    setCreateResponse(response.data);
                    setSuccess(`Đã tạo ${response.data.successCount} tài khoản thành công. ${response.data.errorCount} lỗi.`);
                    setActiveTab('create');
                    setManualStudents([{ studentCode: '', fullName: '', email: '', departmentId: undefined }]);
                } else {
                    setError(response.message || 'Không thể tạo tài khoản');
                }
            }
        } catch (err) {
            console.error('Error creating accounts manually:', err);
            setError('Có lỗi xảy ra khi tạo tài khoản');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateAccount = async (data: UpdateStudentAccountRequest) => {
        if (!editingAccount) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await studentAccountAPI.updateAccount(editingAccount.studentId, data);
            if (response.status) {
                setShowEditModal(false);
                setEditingAccount(null);
                setSuccess('Cập nhật tài khoản thành công!');
                loadAccounts();
            } else {
                setError(response.message || 'Không thể cập nhật tài khoản');
            }
        } catch (err) {
            console.error('Error updating account:', err);
            setError('Có lỗi xảy ra khi cập nhật tài khoản');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!showDeleteConfirm.account) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await studentAccountAPI.deleteAccount(showDeleteConfirm.account.studentId);
            if (response.status) {
                setShowDeleteConfirm({ show: false, account: null });
                setSuccess('Xóa tài khoản thành công!');
                loadAccounts();
            } else {
                setError(response.message || 'Không thể xóa tài khoản');
            }
        } catch (err) {
            console.error('Error deleting account:', err);
            setError('Có lỗi xảy ra khi xóa tài khoản');
        } finally {
            setLoading(false);
        }
    };

    const handleSendCredentials = async (studentId: number) => {
        setSendingCredentials(prev => new Set(prev).add(studentId));
        setError('');
        setSuccess('');

        try {
            const response = await studentAccountAPI.sendCredentials(studentId);
            if (response.status) {
                setSuccess('Đã gửi email credentials thành công!');
                loadAccounts(pageData?.number || 0);
            } else {
                setError(response.message || 'Không thể gửi email');
            }
        } catch (err) {
            console.error('Error sending credentials:', err);
            setError('Có lỗi xảy ra khi gửi email');
        } finally {
            setSendingCredentials(prev => {
                const newSet = new Set(prev);
                newSet.delete(studentId);
                return newSet;
            });
        }
    };

    const handleBulkSendCredentials = async () => {
        if (selectedAccounts.size === 0) {
            setError('Vui lòng chọn ít nhất một tài khoản để gửi email');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await studentAccountAPI.bulkSendCredentials({
                studentIds: Array.from(selectedAccounts)
            });
            if (response.status && response.data) {
                setSuccess(`Đã gửi email cho ${response.data.successCount} tài khoản. ${response.data.errorCount} lỗi.`);
                setSelectedAccounts(new Set());
                loadAccounts(pageData?.number || 0);
            } else {
                setError(response.message || 'Không thể gửi email hàng loạt');
            }
        } catch (err) {
            console.error('Error bulk sending credentials:', err);
            setError('Có lỗi xảy ra khi gửi email hàng loạt');
        } finally {
            setLoading(false);
        }
    };

    const toggleAccountSelection = (studentId: number) => {
        const newSelected = new Set(selectedAccounts);
        if (newSelected.has(studentId)) {
            newSelected.delete(studentId);
        } else {
            newSelected.add(studentId);
        }
        setSelectedAccounts(newSelected);
    };

    const toggleSelectAllAccounts = () => {
        if (selectedAccounts.size === filteredAccounts.length) {
            setSelectedAccounts(new Set());
        } else {
            setSelectedAccounts(new Set(filteredAccounts.map(a => a.studentId)));
        }
    };

    const filteredAccounts = accounts.filter(account => {
        const matchesSearch = searchTerm === '' ||
            account.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            account.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            account.fullName.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            {!isNested && (
                <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-xl shadow-lg p-6 text-white">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 flex items-center">
                            <span className="mr-3 text-4xl">🎓</span>
                            Quản lý tài khoản sinh viên
                        </h1>
                        <p className="text-gray-200 text-lg">Upload Excel, tạo tài khoản hàng loạt và quản lý tài khoản sinh viên</p>
                    </div>
                </div>
            )}

            <div>
                {/* Tabs */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100 p-2 mb-6 inline-flex overflow-x-auto max-w-full">
                    <nav className="flex gap-2 min-w-max">
                        <button
                            onClick={() => setActiveTab('upload')}
                            className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${activeTab === 'upload'
                                ? 'bg-[#001C44] text-white shadow-md'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                        >
                            Upload Excel
                        </button>
                        {uploadResponse && (
                            <button
                                onClick={() => setActiveTab('review')}
                                className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${activeTab === 'review'
                                    ? 'bg-[#001C44] text-white shadow-md'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                            >
                                Review Data
                            </button>
                        )}
                        {createResponse && (
                            <button
                                onClick={() => setActiveTab('create')}
                                className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${activeTab === 'create'
                                    ? 'bg-[#001C44] text-white shadow-md'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                            >
                                Create Results
                            </button>
                        )}
                        <button
                            onClick={() => {
                                setActiveTab('manage');
                                loadAccounts();
                            }}
                            className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${activeTab === 'manage'
                                ? 'bg-[#001C44] text-white shadow-md'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                        >
                            Manage Accounts
                        </button>
                        <button
                            onClick={() => setActiveTab('manual_create')}
                            className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${activeTab === 'manual_create'
                                ? 'bg-[#001C44] text-white shadow-md'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                        >
                            Tạo thủ công
                        </button>
                    </nav>
                </div>

                {/* Messages */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                        {success}
                    </div>
                )}
                {/* Manual Create Tab */}
                {activeTab === 'manual_create' && (
                    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-[#001C44]">Tạo tài khoản thủ công</h2>
                            <p className="text-gray-500 mt-2">Nhập thông tin sinh viên để tạo tài khoản trực tiếp trên hệ thống.</p>
                        </div>
                        
                        <div className="space-y-4">
                            {manualStudents.map((student, index) => (
                                <div key={index} className="flex flex-col md:flex-row gap-5 items-start md:items-center bg-gray-50 p-5 rounded-xl border border-gray-200 transition-all hover:shadow-md hover:border-[#001C44]/30">
                                    <div className="flex-1 w-full">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mã số SV</label>
                                        <input
                                            type="text"
                                            value={student.studentCode}
                                            onChange={e => handleManualStudentChange(index, 'studentCode', e.target.value)}
                                            onBlur={() => handleValidateField(index, student.studentCode, undefined)}
                                            className={`w-full px-4 py-2.5 bg-white border rounded-lg outline-none transition-all shadow-sm ${validationErrors[index]?.studentCode ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-gray-300 focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]'}`}
                                            placeholder="VD: 20110001"
                                        />
                                        {validationErrors[index]?.studentCode && (
                                            <p className="mt-1 text-xs text-red-500">{validationErrors[index].studentCode}</p>
                                        )}
                                    </div>
                                    <div className="flex-1 w-full">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Họ tên</label>
                                        <input
                                            type="text"
                                            value={student.fullName}
                                            onChange={e => handleManualStudentChange(index, 'fullName', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] outline-none transition-all shadow-sm"
                                            placeholder="VD: Nguyễn Văn A"
                                        />
                                    </div>
                                    <div className="flex-1 w-full">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email</label>
                                        <input
                                            type="email"
                                            value={student.email}
                                            onChange={e => handleManualStudentChange(index, 'email', e.target.value)}
                                            onBlur={() => handleValidateField(index, undefined, student.email)}
                                            className={`w-full px-4 py-2.5 bg-white border rounded-lg outline-none transition-all shadow-sm ${validationErrors[index]?.email ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-gray-300 focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]'}`}
                                            placeholder="email@student.hcmute.edu.vn"
                                        />
                                        {validationErrors[index]?.email && (
                                            <p className="mt-1 text-xs text-red-500">{validationErrors[index].email}</p>
                                        )}
                                    </div>
                                    <div className="flex-1 w-full">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Khoa</label>
                                        <select
                                            value={student.departmentId || ''}
                                            onChange={e => handleManualStudentChange(index, 'departmentId', e.target.value ? parseInt(e.target.value) : undefined)}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] outline-none transition-all shadow-sm"
                                        >
                                            <option value="">Chọn khoa (Tùy chọn)</option>
                                            {departments.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mt-6 md:mt-0 pt-1 md:pt-6 flex-shrink-0">
                                        <button
                                            onClick={() => removeManualStudentRow(index)}
                                            disabled={manualStudents.length === 1}
                                            className="p-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
                                            title="Xóa dòng"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={addManualStudentRow}
                            className="w-full py-4 mt-6 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 font-medium hover:border-[#001C44]/30 hover:text-[#001C44] hover:bg-[#001C44]/5 transition-all flex items-center justify-center gap-2 outline-none focus:ring-2 focus:ring-[#001C44]/20"
                        >
                            <Plus weight="bold" className="w-5 h-5" />
                            Thêm một sinh viên khác
                        </button>

                        <div className="flex justify-end mt-8 pt-6 border-t border-gray-100">
                            <button
                                onClick={handleManualCreate}
                                disabled={loading || manualStudents.filter(s => s.studentCode.trim() && s.fullName.trim() && s.email.trim()).length === 0}
                                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-[#001C44] hover:bg-[#002A66] shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#001C44] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {loading ? (
                                    <>
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></span>
                                        Đang tạo...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus weight="bold" className="w-5 h-5 mr-2" />
                                        Tạo {manualStudents.filter(s => s.studentCode.trim() && s.fullName.trim() && s.email.trim()).length} tài khoản
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Upload Excel Tab */}
                {activeTab === 'upload' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-[#001C44] mb-2">Upload File Excel</h2>
                            <p className="text-gray-500 text-sm">
                                File Excel phải có 3 cột bắt buộc: <span className="font-medium text-gray-700">Mã số sinh viên</span>, <span className="font-medium text-gray-700">Họ tên</span>, <span className="font-medium text-gray-700">Email</span>.
                            </p>
                        </div>

                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${isDragging
                                ? 'border-[#001C44] bg-[#001C44]/5 scale-[0.99]'
                                : 'border-gray-200 hover:border-[#001C44]/50 bg-gray-50/50 hover:bg-gray-50'
                                }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={(e) => handleFileSelect(e.target.files)}
                                className="hidden"
                            />
                            <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 text-gray-400">
                                <UploadSimple weight="bold" className="w-8 h-8" />
                            </div>
                            <div>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="inline-flex items-center px-6 py-2.5 shadow-sm text-sm font-semibold rounded-xl text-white bg-[#001C44] hover:bg-[#002A66] transition-all hover:shadow-md active:scale-95"
                                >
                                    Chọn file Excel
                                </button>
                                <p className="mt-4 text-sm text-gray-500">
                                    hoặc kéo thả file vào đây
                                </p>
                                <p className="mt-2 text-xs text-gray-400 font-medium">
                                    Hỗ trợ định dạng .xlsx, .xls
                                </p>
                            </div>
                        </div>

                        {loading && (
                            <div className="mt-8 flex justify-center">
                                <LoadingSpinner text="Đang xử lý file..." />
                            </div>
                        )}
                    </div>
                )}

                {/* Review Parsed Data Tab */}
                {activeTab === 'review' && uploadResponse && (
                    <div className="space-y-6">
                        {/* Summary */}
                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                            <h2 className="text-xl font-bold text-[#001C44] mb-6">Tổng quan dữ liệu</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 mb-1">Tổng số dòng</p>
                                        <p className="text-3xl font-bold text-[#001C44]">{uploadResponse.totalRows}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                                        <List weight="bold" className="w-6 h-6 text-gray-400" />
                                    </div>
                                </div>
                                <div className="bg-green-50/50 rounded-xl p-5 border border-green-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-green-600 mb-1">Dòng hợp lệ</p>
                                        <p className="text-3xl font-bold text-green-600">{uploadResponse.validRows.length}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-green-100">
                                        <CheckCircle weight="fill" className="w-6 h-6 text-green-500" />
                                    </div>
                                </div>
                                <div className="bg-red-50/50 rounded-xl p-5 border border-red-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-red-600 mb-1">Dòng không hợp lệ</p>
                                        <p className="text-3xl font-bold text-red-600">{uploadResponse.invalidRows.length}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-red-100">
                                        <Warning weight="fill" className="w-6 h-6 text-red-500" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Valid Rows */}
                        {uploadResponse.validRows.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
                                    <h3 className="text-lg font-bold text-[#001C44] flex items-center gap-2">
                                        Dòng hợp lệ <span className="bg-green-100 text-green-700 py-0.5 px-2 rounded-full text-xs font-semibold">{uploadResponse.validRows.length}</span>
                                    </h3>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={toggleSelectAllValid}
                                            className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all active:scale-95"
                                        >
                                            {selectedValidRows.size === uploadResponse.validRows.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                                        </button>
                                        <button
                                            onClick={handleBulkCreate}
                                            disabled={selectedValidRows.size === 0 || loading}
                                            className="px-5 py-2 text-sm font-semibold bg-[#001C44] text-white rounded-xl hover:bg-[#002A66] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2 active:scale-95"
                                        >
                                            <UserPlus weight="bold" />
                                            Tạo tài khoản ({selectedValidRows.size})
                                        </button>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-100">
                                        <thead className="bg-gray-50/80">
                                            <tr>
                                                <th className="px-6 py-4 text-left">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedValidRows.size === uploadResponse.validRows.length && uploadResponse.validRows.length > 0}
                                                        onChange={toggleSelectAllValid}
                                                        className="w-4 h-4 rounded border-gray-300 text-[#001C44] focus:ring-[#001C44]"
                                                    />
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mã số SV</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Họ tên</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-100">
                                            {uploadResponse.validRows.map((row, index) => (
                                                <tr key={index} className={`hover:bg-gray-50 transition-colors ${selectedValidRows.has(index) ? 'bg-blue-50/30' : ''}`}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedValidRows.has(index)}
                                                            onChange={() => toggleRowSelection(index)}
                                                            className="w-4 h-4 rounded border-gray-300 text-[#001C44] focus:ring-[#001C44]"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.studentCode}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{row.fullName}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.email}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Invalid Rows */}
                        {uploadResponse.invalidRows.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-6 py-5 border-b border-gray-100 bg-white">
                                    <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                                        <Warning weight="bold" />
                                        Dòng không hợp lệ <span className="bg-red-100 text-red-700 py-0.5 px-2 rounded-full text-xs font-semibold">{uploadResponse.invalidRows.length}</span>
                                    </h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-100">
                                        <thead className="bg-red-50/30">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mã số SV</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Họ tên</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Lý do lỗi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-100">
                                            {uploadResponse.invalidRows.map((row, index) => {
                                                const rowNumber = uploadResponse.validRows.length + index + 1;
                                                const error = uploadResponse.errors[rowNumber] || 'Không xác định';
                                                return (
                                                    <tr key={index} className="hover:bg-red-50/20 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.studentCode || '-'}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{row.fullName || '-'}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.email || '-'}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                                                                {error}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Create Results Tab */}
                {activeTab === 'create' && createResponse && (
                    <div className="space-y-6">
                        {/* Summary */}
                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                            <h2 className="text-xl font-bold text-[#001C44] mb-6">Kết quả tạo tài khoản</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-green-50/50 rounded-xl p-5 border border-green-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-green-600 mb-1">Tạo thành công</p>
                                        <p className="text-3xl font-bold text-green-600">{createResponse.successCount}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-green-100">
                                        <CheckCircle weight="fill" className="w-6 h-6 text-green-500" />
                                    </div>
                                </div>
                                <div className="bg-red-50/50 rounded-xl p-5 border border-red-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-red-600 mb-1">Có lỗi</p>
                                        <p className="text-3xl font-bold text-red-600">{createResponse.errorCount}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-red-100">
                                        <Warning weight="fill" className="w-6 h-6 text-red-500" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Created Accounts */}
                        {createResponse.createdAccounts.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-6 py-5 border-b border-gray-100 bg-white">
                                    <h3 className="text-lg font-bold text-[#001C44] flex items-center gap-2">
                                        Danh sách tài khoản được tạo <span className="bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full text-xs font-semibold">{createResponse.createdAccounts.length}</span>
                                    </h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-100">
                                        <thead className="bg-gray-50/80">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Username</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mã số SV</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Họ tên</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Khoa</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mật khẩu khởi tạo</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-100">
                                            {createResponse.createdAccounts.map((account) => (
                                                <tr key={account.studentId} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{account.username}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{account.email}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{account.studentCode}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{account.fullName}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {account.departmentName ? (
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                                                                {account.departmentName}
                                                            </span>
                                                        ) : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-[#001C44]">
                                                        {account.password || 'Đã ẩn'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Errors */}
                        {createResponse.errors.length > 0 && (
                            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
                                <h3 className="text-lg font-semibold text-red-600 mb-4">Lỗi ({createResponse.errors.length})</h3>
                                <ul className="list-disc list-inside space-y-1">
                                    {createResponse.errors.map((error, index) => (
                                        <li key={index} className="text-sm text-red-600">{error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                onClick={() => {
                                    setActiveTab('manage');
                                    loadAccounts();
                                }}
                                className="px-4 py-2 bg-[#001C44] text-white rounded-lg hover:bg-[#002A66] transition-colors"
                            >
                                Xem danh sách tài khoản
                            </button>
                        </div>
                    </div>
                )}

                {/* Manage Accounts Tab */}
                {activeTab === 'manage' && (
                    <div className="space-y-6">
                        {/* Filters */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                            <div className="flex flex-col lg:flex-row lg:items-end gap-6">
                                {/* Search */}
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tìm kiếm</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <MagnifyingGlass className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Username, email, mã số SV, họ tên..."
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001C44]/20 focus:border-[#001C44] transition-all duration-300"
                                        />
                                    </div>
                                </div>
                                
                                {/* Email Filter */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Trạng thái email</label>
                                    <div className="flex bg-gray-100/80 p-1 rounded-xl">
                                        {[
                                            { id: 'ALL', label: 'Tất cả' },
                                            { id: 'SENT', label: 'Đã gửi' },
                                            { id: 'NOT_SENT', label: 'Chưa gửi' }
                                        ].map((status) => (
                                            <button
                                                key={status.id}
                                                onClick={() => setEmailSentFilter(status.id as any)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                                                    emailSentFilter === status.id
                                                        ? 'bg-white text-[#001C44] shadow-sm'
                                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                                                }`}
                                            >
                                                {status.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bulk Actions */}
                        {selectedAccounts.size > 0 && (
                            <div className="bg-[#001C44] rounded-2xl shadow-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-bottom-2 fade-in duration-300">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                                        {selectedAccounts.size}
                                    </div>
                                    <span className="text-white/90 font-medium text-sm">
                                        tài khoản đang được chọn
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={handleBulkSendCredentials}
                                        disabled={loading}
                                        className="px-4 py-2 bg-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/20 active:scale-95 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <PaperPlaneRight weight="bold" /> Gửi email hàng loạt
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Accounts Table */}
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <LoadingSpinner text="Đang tải danh sách tài khoản..." />
                            </div>
                        ) : (
                            <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-100">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-100">
                                        <thead className="bg-gray-50/50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedAccounts.size === filteredAccounts.length && filteredAccounts.length > 0}
                                                        onChange={toggleSelectAllAccounts}
                                                        className="rounded border-gray-300 text-[#001C44] focus:ring-[#001C44] transition-colors"
                                                    />
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã số SV</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Họ tên</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Khoa</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                    Email Sent
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                    Trạng thái
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created At</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-100">
                                            {filteredAccounts.length === 0 ? (
                                                <tr>
                                                    <td colSpan={10} className="px-12 py-20 text-center">
                                                        <div className="flex flex-col items-center justify-center">
                                                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                                                <UserFocus className="w-10 h-10 text-gray-400" weight="light" />
                                                            </div>
                                                            <p className="text-gray-500 font-medium text-lg">Không tìm thấy tài khoản nào</p>
                                                            <p className="text-gray-400 text-sm mt-1">Vui lòng điều chỉnh bộ lọc.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredAccounts.map((account) => (
                                                    <tr key={account.studentId} className="hover:bg-gray-50/80 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedAccounts.has(account.studentId)}
                                                                onChange={() => toggleAccountSelection(account.studentId)}
                                                                className="rounded border-gray-300 text-[#001C44] focus:ring-[#001C44] transition-colors"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{account.username}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{account.email}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{account.studentCode}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{account.fullName}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{account.departmentName || '-'}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {account.emailSent ? (
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                                                    <CheckCircle weight="fill" className="text-green-500" /> Đã gửi
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                                                                    <XCircle weight="fill" className="text-yellow-500" /> Chưa gửi
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {account.lastLogin ? (
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 w-fit">
                                                                        <CheckCircle weight="fill" className="text-blue-500" /> Đã đăng nhập
                                                                    </span>
                                                                    <span className="text-xs text-gray-500 font-medium">
                                                                        {formatDate(account.lastLogin)}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                                                    <XCircle weight="fill" className="text-gray-400" /> Chưa đăng nhập
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(account.createdAt)}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingAccount(account);
                                                                        setShowEditModal(true);
                                                                    }}
                                                                    className="p-2 text-gray-400 hover:text-[#001C44] hover:bg-gray-100 rounded-lg transition-all"
                                                                    title="Sửa"
                                                                >
                                                                    <PencilSimple weight="bold" className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        if (window.confirm('Bạn có chắc chắn muốn gửi lại thông tin đăng nhập cho tài khoản này?')) {
                                                                            handleSendCredentials(account.studentId);
                                                                        }
                                                                    }}
                                                                    disabled={sendingCredentials.has(account.studentId)}
                                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    title="Gửi lại thông tin đăng nhập"
                                                                >
                                                                    {sendingCredentials.has(account.studentId) ? (
                                                                        <span className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin inline-block"></span>
                                                                    ) : (
                                                                        <PaperPlaneRight weight="bold" className="w-4 h-4" />
                                                                    )}
                                                                </button>
                                                                <button
                                                                    onClick={() => setShowDeleteConfirm({ show: true, account })}
                                                                    className="text-red-600 hover:text-red-800"
                                                                >
                                                                    Xóa
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {pageData && pageData.totalPages > 1 && (
                                    <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between sm:px-6 rounded-b-lg">
                                        <div className="flex-1 flex justify-between sm:hidden">
                                            <button
                                                onClick={() => loadAccounts(pageData.number - 1)}
                                                disabled={pageData.first}
                                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                Trước
                                            </button>
                                            <button
                                                onClick={() => loadAccounts(pageData.number + 1)}
                                                disabled={pageData.last}
                                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                Sau
                                            </button>
                                        </div>
                                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-sm text-gray-700">
                                                    Hiển thị <span className="font-medium">{pageData.number * pageData.size + 1}</span> đến <span className="font-medium">{Math.min((pageData.number + 1) * pageData.size, pageData.totalElements)}</span> trong số <span className="font-medium">{pageData.totalElements}</span> kết quả
                                                </p>
                                            </div>
                                            <div>
                                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                                    <button
                                                        onClick={() => loadAccounts(pageData.number - 1)}
                                                        disabled={pageData.first}
                                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                                    >
                                                        <span className="sr-only">Previous</span>
                                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                                        Trang {pageData.number + 1} / {pageData.totalPages}
                                                    </span>
                                                    <button
                                                        onClick={() => loadAccounts(pageData.number + 1)}
                                                        disabled={pageData.last}
                                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                                    >
                                                        <span className="sr-only">Next</span>
                                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </nav>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Edit Account Modal */}
            {showEditModal && editingAccount && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-[#001C44]">Chỉnh sửa tài khoản</h3>
                            <button onClick={() => {
                                setShowEditModal(false);
                                setEditingAccount(null);
                            }} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200">
                                <X weight="bold" className="w-5 h-5" />
                            </button>
                        </div>
                        <EditAccountForm
                            account={editingAccount}
                            departments={departments}
                            onSave={handleUpdateAccount}
                            onCancel={() => {
                                setShowEditModal(false);
                                setEditingAccount(null);
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm.show && showDeleteConfirm.account && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center animate-in fade-in duration-200 p-4">
                    <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
                            <Trash weight="bold" className="w-6 h-6 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Xác nhận xóa tài khoản</h3>
                        <p className="text-gray-600 mb-6 leading-relaxed">
                            Bạn có chắc chắn muốn xóa tài khoản này? Thao tác này không thể hoàn tác.
                        </p>
                        
                        <div className="bg-gray-50/80 p-4 rounded-xl mb-6 border border-gray-100">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-gray-500 font-medium">Username:</span> <span className="font-semibold text-gray-900">{showDeleteConfirm.account.username}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500 font-medium">Email:</span> <span className="font-semibold text-gray-900">{showDeleteConfirm.account.email}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500 font-medium">Mã số SV:</span> <span className="font-semibold text-gray-900">{showDeleteConfirm.account.studentCode}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500 font-medium">Họ tên:</span> <span className="font-semibold text-gray-900">{showDeleteConfirm.account.fullName}</span></div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm({ show: false, account: null })}
                                className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 active:scale-95 transition-all duration-200"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={loading}
                                className="px-5 py-2.5 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 active:scale-95 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin inline-block"></span>
                                ) : (
                                    <Trash weight="bold" />
                                )}
                                Xóa tài khoản
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Edit Account Form Component
interface EditAccountFormProps {
    account: StudentAccountResponse;
    departments: Department[];
    onSave: (data: UpdateStudentAccountRequest) => void;
    onCancel: () => void;
}

const EditAccountForm: React.FC<EditAccountFormProps> = ({ account, departments, onSave, onCancel }) => {
    const [formData, setFormData] = useState<UpdateStudentAccountRequest>({
        username: account.username,
        email: account.email,
        studentCode: account.studentCode,
        fullName: account.fullName,
        departmentId: account.departmentId
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="px-8 py-6">
            <div className="space-y-5">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
                    <input
                        type="text"
                        value={formData.username || ''}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001C44]/20 focus:border-[#001C44] transition-all duration-300"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                    <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001C44]/20 focus:border-[#001C44] transition-all duration-300"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mã số sinh viên</label>
                    <input
                        type="text"
                        value={formData.studentCode || ''}
                        onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001C44]/20 focus:border-[#001C44] transition-all duration-300"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Họ tên</label>
                    <input
                        type="text"
                        value={formData.fullName || ''}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001C44]/20 focus:border-[#001C44] transition-all duration-300"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Khoa</label>
                    <select
                        value={formData.departmentId || ''}
                        onChange={(e) => setFormData({ ...formData, departmentId: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001C44]/20 focus:border-[#001C44] transition-all duration-300"
                    >
                        <option value="">Chọn khoa (Tùy chọn)</option>
                        {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 active:scale-95 transition-all duration-200"
                >
                    Hủy
                </button>
                <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#001C44] text-white font-medium rounded-xl hover:bg-[#002A66] active:scale-95 transition-all duration-200 shadow-md flex items-center gap-2"
                >
                    <CheckCircle weight="bold" />
                    Lưu thay đổi
                </button>
            </div>
        </form>
    );
};

export default StudentAccountManagement;

