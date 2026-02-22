# Student Dashboard – Mobile API Reference

This document is the **quick reference** for the Student Portal mobile app. It matches the web dashboard backend. For full request/response shapes and per-module behaviour, see the main **Student Dashboard – In-Depth Guide & Mobile API Reference**.

**Convention:** Send `school_code` and `student_id` (from logged-in student) on every student-scoped API. On **401**, clear session and redirect to login.

---

## Authentication

| Action   | Method | Path                           | Body / params |
|----------|--------|--------------------------------|---------------|
| Login    | POST   | `/api/auth/student/login`      | `school_code`, `admission_no`, `password` |
| Logout   | POST   | `/api/auth/logout`             | — |

**Login success:** `{ success: true, student: { id, admission_no, student_name, class, section, academic_year, school_code, photo_url, parent_name, parent_phone, parent_email, ... } }`

---

## Quick API Table (Student modules)

| Module / feature   | Method | Path (base: API_BASE_URL) | Key params / body |
|--------------------|--------|----------------------------|-------------------|
| Home stats         | GET    | `/api/student/stats` | `school_code`, `student_id` |
| Upcoming items     | GET    | `/api/student/upcoming-items` | `school_code`, `student_id`, `limit` |
| Weekly completion  | GET    | `/api/student/weekly-completion` | `school_code`, `student_id` |
| Class teacher      | GET    | `/api/student/class-teacher` | `school_code`, `class`, `section`, `academic_year` |
| Attendance         | GET    | `/api/attendance/student` or `/api/student/attendance` | `school_code`, `student_id`, `start_date`, `end_date` (YYYY-MM-DD) |
| Notices            | GET    | `/api/communication/notices` | `school_code`, `status=Active`, `limit`? |
| Timetable          | GET    | `/api/timetable/slots` | `school_code`, `class_id` |
| Classmates         | GET    | `/api/student/classmates` | `school_code`, `class`, `section`, `academic_year` |
| Examinations       | GET    | `/api/examinations/v2/student` | `school_code`, `student_id` |
| Marks (raw)        | GET    | `/api/marks` | `school_code`, `student_id` |
| Marks (by exam)     | GET    | `/api/student/marks` | `school_code`, `student_id` |
| Report card list   | GET    | `/api/marks/report-card/student` | `school_code`, `student_id` |
| Report card view   | GET    | `/api/marks/report-card/:id` | `student_id` (query) |
| Copy checking      | GET    | `/api/student/copy-checking` | `school_code`, `student_id` |
| Academic calendar  | GET    | `/api/calendar/academic` | `school_code`, `academic_year`, `include_events` |
| Diary list         | GET    | `/api/student/diary` | `school_code`, `student_id`, `class`, `section`, `academic_year` |
| Diary mark read    | POST   | `/api/diary/:id/read` | Body: `user_id`, `user_type: 'STUDENT'` |
| Library            | GET    | `/api/student/library` | `school_code`, `student_id` |
| Fees               | GET    | `/api/student/fees` | `school_code`, `student_id` |
| Fee receipts       | GET    | `/api/student/fees/receipts` | `school_code`, `student_id` |
| Receipt download   | GET    | `/api/fees/receipts/:paymentId/download` | `school_code` |
| Transport          | GET    | `/api/student/transport` | `school_code`, `student_id` |
| Leave types        | GET    | `/api/leave/types` | `school_code` |
| Leave submit       | POST   | `/api/leave/student-requests` | Body: `school_code`, `student_id`, `leave_type_id`, `leave_title`, `leave_start_date`, `leave_end_date`, `reason?` |
| My leaves          | GET    | `/api/leave/student-requests` | `school_code`, `student_id` |
| Certificates       | GET    | `/api/student/certificates` | `school_code`, `student_id` |
| Gallery            | GET    | `/api/gallery` | `school_code`, `category?` |
| Student profile    | GET    | `/api/students/:id` | `school_code` |
| Update profile     | PATCH  | `/api/students/:id` | `school_code`; body: `phone`, `email`, `address` |
| Student photo      | POST   | `/api/students/photo` | FormData: `file`, `school_code`, `student_id` |
| Change password    | POST   | `/api/students/change-password` | Body: `school_code`, `admission_no`, `current_password`, `new_password` |
| Schools (name)     | GET    | `/api/schools/accepted` | — (find by `school_code`) |

---

## Date format

Use **YYYY-MM-DD** for all date params: `start_date`, `end_date`, `leave_start_date`, `leave_end_date`, etc.

---

## Mobile service layer

- **Student-scoped calls:** `services/student.service.ts` (stats, attendance, class teacher, classmates, diary, copy-checking, certificates, library, fees, transport, report-card list/view, etc.)
- **Shared:** `services/communication.service.ts`, `services/calendar.service.ts`, `services/leave.service.ts`, `services/examination.service.ts`, `services/gallery.service.ts`, `services/marks.service.ts`, `services/password.service.ts`, `lib/api.ts` (401 handling).

All requests go through `lib/api`; 401 triggers logout and optional redirect to student login.
