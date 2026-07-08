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

export interface CreateStudentRequest {
    studentCode: string;
    fullName: string;
    email: string;
    departmentId?: number;
}

export interface CreateMultipleStudentsRequest {
    students: CreateStudentRequest[];
}

export interface ValidateStudentResponse {
    studentCodeAvailable: boolean;
    studentCode?: string;
    emailAvailable: boolean;
    email?: string;
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
    emailSent: boolean; 
    credentialsEmailSentAt: string | null; 
    lastLogin: string | null; 
    createdAt: string; 
    departmentId?: number;
    departmentName?: string;
}

export interface PendingAccountsPage {
    content: StudentAccountResponse[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
}

export interface UpdateStudentAccountRequest {
    username?: string;
    email?: string;
    studentCode?: string;
    fullName?: string;
    departmentId?: number;
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

