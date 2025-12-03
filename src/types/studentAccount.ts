export interface ExcelStudentRow {
    studentCode: string;
    fullName: string;
    email: string;
}

export interface UploadExcelResponse {
    totalRows: number;
    validRows: ExcelStudentRow[];
    invalidRows: ExcelStudentRow[];
    errors: { [key: number]: string }; // Map<Integer, String> in Java
}

export interface BulkCreateStudentsRequest {
    students: ExcelStudentRow[];
}

export interface StudentAccountResponse {
    userId: number;
    studentId: number;
    username: string;
    email: string;
    studentCode: string;
    fullName: string;
    password: string | null; // Plain password (chỉ hiển thị khi chưa gửi email)
    isActivated: boolean;
    emailSent: boolean; // Đã gửi email chưa
    createdAt: string; // LocalDateTime in Java
}

export interface UpdateStudentAccountRequest {
    username?: string;
    email?: string;
    studentCode?: string;
    fullName?: string;
}

export interface BulkSendCredentialsRequest {
    studentIds: number[];
}

export interface BulkCreateResponse {
    createdAccounts: StudentAccountResponse[];
    errors: string[];
    successCount: number;
    errorCount: number;
}

export interface BulkSendCredentialsResponse {
    successList: string[];
    errorList: string[];
    successCount: number;
    errorCount: number;
}

