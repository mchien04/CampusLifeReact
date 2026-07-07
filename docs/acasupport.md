1. Năm học (Academic Year)
GET /api/academic/years (public) → Response: { status: true, message: "Years retrieved", body: [ AcademicYear... ] }

GET /api/admin/academics/years (admin) → Response: { status: true, message: "Success", body: [ AcademicYear... ] }

GET /api/admin/academics/years/{id} → Response: { status: true, message: "Success", body: AcademicYear }

POST /api/admin/academics/years

// Request
{ "name": "2025-2026", "startDate": "2025-09-01", "endDate": "2026-06-30" }
→ Response: { status: true, message: "Success", body: AcademicYear }

PUT /api/admin/academics/years/{id} → Request body same as create. Response: Success/404.

DELETE /api/admin/academics/years/{id} → Response: Success/404.

2. Học kỳ (Semester)
GET /api/academic/semesters (public) → Response: { status: true, message: "Semesters retrieved", body: [ Semester... ] }

GET /api/academic/years/{yearId}/semesters (public) → Response: { status: true, message: "Semesters retrieved", body: [ Semester... ] }

GET /api/admin/academics/years/{yearId}/semesters → Response: Success/404 với body: [ Semester... ]

GET /api/admin/academics/semesters/{id} → Response: Success/404

POST /api/admin/academics/semesters

// Request
{ "yearId": 1, "name": "HK1 2025-2026", "startDate": "2025-09-01", "endDate": "2026-01-15" }
→ Response: Success

PUT /api/admin/academics/semesters/{id} — Request body same as create DELETE /api/admin/academics/semesters/{id} — Response: Success/404

POST /api/admin/academics/semesters/{id}/toggle?open=true → Response: Bật/tắt mở học kỳ

3. Khoa (Department)
GET /api/departments (public) → Response: [ Department... ] (trả thẳng List, không wrap trong Response)

GET /api/departments/{id} (public) → Response: Department object hoặc 404

GET /api/admin/departments → Response: { status: true, message: "Success", body: [ Department... ] }

GET /api/admin/departments/{id} → Response: { status: true, message: "Success", body: Department } hoặc 404

POST /api/admin/departments

// Request
{ "name": "Công nghệ thông tin", "type": "FACULTY", "description": "Khoa CNTT" }
→ Response: Success

PUT /api/admin/departments/{id} — Request body same as create DELETE /api/admin/departments/{id} — Response: Success/404

4. Lớp (Student Class)
GET /api/classes → Response: { status: true, message: "Success", body: [ StudentClass... ] }

GET /api/classes/{classId} → Response: { status: true, message: "Success", body: StudentClass }

GET /api/classes/name/{className} → Response: { status: true, message: "Success", body: StudentClass }

GET /api/classes/department/{departmentId} → Response: { status: true, message: "Success", body: [ StudentClass... ] }

GET /api/classes/{classId}/students → Response: { status: true, message: "Success", body: [ Student... ] }

POST /api/classes?className=CTK47A&departmentId=1 → Response: Success

PUT /api/classes/{classId}?className=CTK47B&description=... DELETE /api/classes/{classId} POST /api/classes/{classId}/students/{studentId} — Thêm SV vào lớp DELETE /api/classes/{classId}/students/{studentId} — Xóa SV khỏi lớp

5. Sinh viên (Student)
GET /api/students?page=0&size=20&sortBy=id&sortDir=asc → Response: { status: true, message: "Success", body: Page<Student> }

GET /api/students/search?keyword=22110xxx&page=0&size=20 → Response: Tìm theo tên hoặc mã SV

GET /api/students/{studentId} → Response: { status: true, message: "Success", body: Student }

GET /api/students/username/{username} → Response: { status: true, message: "Success", body: Student }

GET /api/students/without-class?page=0&size=20 → Response: SV chưa được xếp lớp

GET /api/students/department/{departmentId}?page=0&size=20 → Response: SV theo khoa