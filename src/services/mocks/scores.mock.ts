export interface ManagerScoreRow {
    studentId: number;
    studentCode: string;
    studentName: string;
    className: string;
    facultyName: string;
    semesterId: number;
    semesterName: string;
    totalScore: number;
}

export const mockSemesterScores: ManagerScoreRow[] = [
    { studentId: 1, studentCode: 'SV001', studentName: 'Nguyễn Văn A', className: 'CNTT1', facultyName: 'CNTT', semesterId: 1, semesterName: 'HK1 2024-2025', totalScore: 85 },
    { studentId: 2, studentCode: 'SV002', studentName: 'Trần Thị B', className: 'CNTT1', facultyName: 'CNTT', semesterId: 1, semesterName: 'HK1 2024-2025', totalScore: 92 },
    { studentId: 3, studentCode: 'SV003', studentName: 'Lê Văn C', className: 'KT1', facultyName: 'Kinh tế', semesterId: 1, semesterName: 'HK1 2024-2025', totalScore: 77 },
    { studentId: 4, studentCode: 'SV004', studentName: 'Phạm Thị D', className: 'KT1', facultyName: 'Kinh tế', semesterId: 1, semesterName: 'HK1 2024-2025', totalScore: 64 },
    { studentId: 5, studentCode: 'SV005', studentName: 'Đỗ Văn E', className: 'DL1', facultyName: 'Du lịch', semesterId: 1, semesterName: 'HK1 2024-2025', totalScore: 96 },
];


