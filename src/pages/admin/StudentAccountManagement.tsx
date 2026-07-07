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

type TabType = 'upload' | 'review' | 'create' | 'manage' | 'manual_create';

const StudentAccountManagement: React.FC = () => {
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
            loadAccounts();
        }
    }, [activeTab]);

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

    const loadAccounts = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await studentAccountAPI.getPendingAccounts();
            if (response.status && response.data) {
                setAccounts(response.data);
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
                loadAccounts();
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
                loadAccounts();
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
        const matchesEmailSent = emailSentFilter === 'ALL' ||
            (emailSentFilter === 'SENT' && account.emailSent) ||
            (emailSentFilter === 'NOT_SENT' && !account.emailSent);
        return matchesSearch && matchesEmailSent;
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
            <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-xl shadow-lg p-6 text-white">
                <div>
                    <h1 className="text-3xl font-bold mb-2 flex items-center">
                        <span className="mr-3 text-4xl">🎓</span>
                        Quản lý tài khoản sinh viên
                    </h1>
                    <p className="text-gray-200 text-lg">Upload Excel, tạo tài khoản hàng loạt và quản lý tài khoản sinh viên</p>
                </div>
            </div>

            <div>
                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-lg mb-6 border border-gray-100">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => setActiveTab('upload')}
                                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'upload'
                                    ? 'border-[#001C44] text-[#001C44]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Upload Excel
                            </button>
                            {uploadResponse && (
                                <button
                                    onClick={() => setActiveTab('review')}
                                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'review'
                                        ? 'border-[#001C44] text-[#001C44]'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    Review Data
                                </button>
                            )}
                            {createResponse && (
                                <button
                                    onClick={() => setActiveTab('create')}
                                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'create'
                                        ? 'border-[#001C44] text-[#001C44]'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'manage'
                                    ? 'border-[#001C44] text-[#001C44]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Manage Accounts
                            </button>
                            <button
                                onClick={() => setActiveTab('manual_create')}
                                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'manual_create'
                                    ? 'border-[#001C44] text-[#001C44]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Tạo thủ công
                            </button>
                        </nav>
                    </div>
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
                            className="w-full py-3.5 mt-5 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-medium hover:border-[#001C44] hover:text-[#001C44] hover:bg-[#001C44]/5 transition-all flex items-center justify-center gap-2 outline-none focus:ring-2 focus:ring-[#001C44]"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Thêm một sinh viên khác
                        </button>

                        <div className="flex justify-end mt-8 pt-6 border-t border-gray-100">
                            <button
                                onClick={handleManualCreate}
                                disabled={loading || manualStudents.filter(s => s.studentCode.trim() && s.fullName.trim() && s.email.trim()).length === 0}
                                className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-sm font-semibold rounded-xl text-white bg-[#001C44] hover:bg-[#002A66] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#001C44] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Đang tạo...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 mr-2 -ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Tạo {manualStudents.filter(s => s.studentCode.trim() && s.fullName.trim() && s.email.trim()).length} tài khoản
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Upload Excel Tab */}
                {activeTab === 'upload' && (
                    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
                        <h2 className="text-xl font-semibold text-[#001C44] mb-4">Upload File Excel</h2>
                        <p className="text-gray-600 mb-4">
                            File Excel phải có 3 cột: Mã số sinh viên, Họ tên, Email
                        </p>

                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${isDragging
                                ? 'border-[#001C44] bg-[#001C44] bg-opacity-5'
                                : 'border-gray-300 hover:border-[#001C44]'
                                }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={(e) => handleFileSelect(e.target.files)}
                                className="hidden"
                            />
                            <svg
                                className="mx-auto h-12 w-12 text-gray-400"
                                stroke="currentColor"
                                fill="none"
                                viewBox="0 0 48 48"
                            >
                                <path
                                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            <div className="mt-4">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#001C44] hover:bg-[#002A66] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#001C44]"
                                >
                                    Chọn file Excel
                                </button>
                                <p className="mt-2 text-sm text-gray-600">
                                    hoặc kéo thả file vào đây
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                    Chỉ chấp nhận file .xlsx hoặc .xls
                                </p>
                            </div>
                        </div>

                        {loading && (
                            <div className="mt-4 flex justify-center">
                                <LoadingSpinner text="Đang upload và parse file..." />
                            </div>
                        )}
                    </div>
                )}

                {/* Review Parsed Data Tab */}
                {activeTab === 'review' && uploadResponse && (
                    <div className="space-y-6">
                        {/* Summary */}
                        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
                            <h2 className="text-xl font-semibold text-[#001C44] mb-4">Kết quả Parse</h2>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">Tổng số dòng</p>
                                    <p className="text-2xl font-bold text-[#001C44]">{uploadResponse.totalRows}</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">Dòng hợp lệ</p>
                                    <p className="text-2xl font-bold text-green-600">{uploadResponse.validRows.length}</p>
                                </div>
                                <div className="bg-red-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">Dòng không hợp lệ</p>
                                    <p className="text-2xl font-bold text-red-600">{uploadResponse.invalidRows.length}</p>
                                </div>
                            </div>
                        </div>

                        {/* Valid Rows */}
                        {uploadResponse.validRows.length > 0 && (
                            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-[#001C44]">
                                        Dòng hợp lệ ({uploadResponse.validRows.length})
                                    </h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={toggleSelectAllValid}
                                            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                                        >
                                            {selectedValidRows.size === uploadResponse.validRows.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                                        </button>
                                        <button
                                            onClick={handleBulkCreate}
                                            disabled={selectedValidRows.size === 0 || loading}
                                            className="px-4 py-1 text-sm bg-[#001C44] text-white rounded hover:bg-[#002A66] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Tạo tài khoản ({selectedValidRows.size})
                                        </button>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedValidRows.size === uploadResponse.validRows.length && uploadResponse.validRows.length > 0}
                                                        onChange={toggleSelectAllValid}
                                                        className="rounded border-gray-300 text-[#001C44] focus:ring-[#001C44]"
                                                    />
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã số SV</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ tên</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {uploadResponse.validRows.map((row, index) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedValidRows.has(index)}
                                                            onChange={() => toggleRowSelection(index)}
                                                            className="rounded border-gray-300 text-[#001C44] focus:ring-[#001C44]"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{row.studentCode}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{row.fullName}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{row.email}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Invalid Rows */}
                        {uploadResponse.invalidRows.length > 0 && (
                            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
                                <h3 className="text-lg font-semibold text-[#001C44] mb-4">
                                    Dòng không hợp lệ ({uploadResponse.invalidRows.length})
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã số SV</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ tên</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lỗi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {uploadResponse.invalidRows.map((row, index) => {
                                                // Find error for this row (errors are keyed by row number)
                                                const rowNumber = uploadResponse.validRows.length + index + 1;
                                                const error = uploadResponse.errors[rowNumber] || 'Không xác định';
                                                return (
                                                    <tr key={index} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{row.studentCode || '-'}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{row.fullName || '-'}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{row.email || '-'}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-red-600">{error}</td>
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
                        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
                            <h2 className="text-xl font-semibold text-[#001C44] mb-4">Kết quả tạo tài khoản</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">Thành công</p>
                                    <p className="text-2xl font-bold text-green-600">{createResponse.successCount}</p>
                                </div>
                                <div className="bg-red-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">Lỗi</p>
                                    <p className="text-2xl font-bold text-red-600">{createResponse.errorCount}</p>
                                </div>
                            </div>
                        </div>

                        {/* Created Accounts */}
                        {createResponse.createdAccounts.length > 0 && (
                            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
                                <h3 className="text-lg font-semibold text-[#001C44] mb-4">
                                    Tài khoản đã tạo ({createResponse.createdAccounts.length})
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã số SV</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ tên</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Password</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {createResponse.createdAccounts.map((account) => (
                                                <tr key={account.studentId} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{account.username}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{account.email}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{account.studentCode}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{account.fullName}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900">
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
                        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
                            <h3 className="text-lg font-semibold text-[#001C44] mb-4">Bộ lọc</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Tìm kiếm theo username, email, mã số SV, họ tên..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái email</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setEmailSentFilter('ALL')}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${emailSentFilter === 'ALL'
                                                ? 'bg-[#001C44] text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            Tất cả
                                        </button>
                                        <button
                                            onClick={() => setEmailSentFilter('SENT')}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${emailSentFilter === 'SENT'
                                                ? 'bg-[#001C44] text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            Đã gửi
                                        </button>
                                        <button
                                            onClick={() => setEmailSentFilter('NOT_SENT')}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${emailSentFilter === 'NOT_SENT'
                                                ? 'bg-[#001C44] text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            Chưa gửi
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bulk Actions */}
                        {selectedAccounts.size > 0 && (
                            <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-100">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">
                                        Đã chọn {selectedAccounts.size} tài khoản
                                    </span>
                                    <button
                                        onClick={handleBulkSendCredentials}
                                        disabled={loading}
                                        className="px-4 py-2 bg-[#001C44] text-white rounded-lg hover:bg-[#002A66] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                    >
                                        Gửi email hàng loạt
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
                            <div className="bg-white rounded-lg shadow-lg border border-gray-100">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedAccounts.size === filteredAccounts.length && filteredAccounts.length > 0}
                                                        onChange={toggleSelectAllAccounts}
                                                        className="rounded border-gray-300 text-[#001C44] focus:ring-[#001C44]"
                                                    />
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã số SV</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ tên</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    <div className="flex flex-col">
                                                        <span>Email Sent</span>
                                                    </div>
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    <div className="flex flex-col">
                                                        <span>Trạng thái</span>
                                                    </div>
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredAccounts.length === 0 ? (
                                                <tr>
                                                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                                                        Không có tài khoản nào
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredAccounts.map((account) => (
                                                    <tr key={account.studentId} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedAccounts.has(account.studentId)}
                                                                onChange={() => toggleAccountSelection(account.studentId)}
                                                                className="rounded border-gray-300 text-[#001C44] focus:ring-[#001C44]"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{account.username}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{account.email}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{account.studentCode}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{account.fullName}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            {account.emailSent ? (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                    ✓ Đã gửi
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                                    ✗ Chưa gửi
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            {account.lastLogin ? (
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                        ✓ Đã đăng nhập
                                                                    </span>
                                                                    <span className="text-xs text-gray-500">
                                                                        {formatDate(account.lastLogin)}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                                    ✗ Chưa đăng nhập
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(account.createdAt)}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingAccount(account);
                                                                        setShowEditModal(true);
                                                                    }}
                                                                    className="text-[#001C44] hover:text-[#002A66]"
                                                                >
                                                                    Sửa
                                                                </button>
                                                                <button
                                                                    onClick={() => handleSendCredentials(account.studentId)}
                                                                    disabled={sendingCredentials.has(account.studentId)}
                                                                    className="text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    {sendingCredentials.has(account.studentId) ? 'Đang gửi...' : 'Gửi email'}
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
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Edit Account Modal */}
            {showEditModal && editingAccount && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-[#001C44]">Chỉnh sửa tài khoản</h3>
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-red-600">Xác nhận xóa</h3>
                        </div>
                        <div className="px-6 py-4">
                            <p className="text-gray-700 mb-4">
                                Bạn có chắc chắn muốn xóa tài khoản này?
                            </p>
                            <div className="bg-gray-50 p-3 rounded mb-4">
                                <p className="text-sm text-gray-600"><strong>Username:</strong> {showDeleteConfirm.account.username}</p>
                                <p className="text-sm text-gray-600"><strong>Email:</strong> {showDeleteConfirm.account.email}</p>
                                <p className="text-sm text-gray-600"><strong>Mã số SV:</strong> {showDeleteConfirm.account.studentCode}</p>
                                <p className="text-sm text-gray-600"><strong>Họ tên:</strong> {showDeleteConfirm.account.fullName}</p>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowDeleteConfirm({ show: false, account: null })}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={loading}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Đang xóa...' : 'Xóa'}
                                </button>
                            </div>
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
        <form onSubmit={handleSubmit} className="px-6 py-4">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input
                        type="text"
                        value={formData.username || ''}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã số sinh viên</label>
                    <input
                        type="text"
                        value={formData.studentCode || ''}
                        onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
                    <input
                        type="text"
                        value={formData.fullName || ''}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Khoa</label>
                    <select
                        value={formData.departmentId || ''}
                        onChange={(e) => setFormData({ ...formData, departmentId: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                    >
                        <option value="">Chọn khoa (Tùy chọn)</option>
                        {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                    Hủy
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-[#001C44] text-white rounded-lg hover:bg-[#002A66]"
                >
                    Lưu
                </button>
            </div>
        </form>
    );
};

export default StudentAccountManagement;

