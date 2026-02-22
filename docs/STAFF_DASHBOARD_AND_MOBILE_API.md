# Staff (Teacher) Dashboard — In-Depth Guide & Mobile API Reference

This document describes **how the staff/teacher dashboard works end-to-end**: authentication, **how modules are fetched from admin role management**, permanent vs extra modules, class teacher vs subject teacher logic, every API and table used, and how to replicate this behavior (e.g. for a mobile app or a new build).

**Audience:** Developers building a mobile app for the same backend, or anyone needing a Cursor-ready prompt to rebuild the staff dashboard.

---

## 1. Overview & Authentication

### 1.1 Login

- **URL:** `POST /api/auth/teacher/login` (or the same backend route used by `/teacher/login`).
- **Body:** Typically `{ school_code, staff_id (or admission_no / login id), password }`. The exact field names match the web login form (often `staff_id` is the display code e.g. STF001).
- **Success:** Returns staff object (including `id` UUID, `staff_id`, `school_code`, `full_name`, `role`, `designation`, etc.). Store this as `teacher` in session; set `role = 'teacher'` and `teacher_authenticated = '1'` so the dashboard recognizes the session.
- **Table:** `staff_login` (staff_id, school_code, password hash). Staff record from `staff` table is joined/resolved (by display code or UUID depending on how staff_login is populated).

### 1.2 Dashboard & modules (overview)

- **Staff dashboard** = Teacher dashboard. Staff log in at `/teacher/login` (or `/staff/login`). After login, the app stores `teacher` in `sessionStorage` and sets `sessionStorage.setItem('teacher_authenticated', '1')` and `sessionStorage.setItem('role', 'teacher')`.
- **Base URL for teacher routes:** All staff dashboard routes live under `/teacher/dashboard/*`.
- **Modules** shown in the sidebar are a **merge** of:
  1. **Permanent (base) items** — hardcoded in the layout; some are filtered by "class teacher" status.
  2. **Extra (role-based) items** — from admin **Role Management** and **Staff Access Control**: roles have permissions (sub-modules), and staff get roles or direct permission overrides. The staff menu API returns these as "dynamic" modules.
- **Class teacher** vs **subject teacher** vs **Vice Principal/Principal** change which **default** sub-modules the staff get before any role/permission assignment.

---

## 2. Where Modules Come From (Admin Role Management)

### 2.1 Database Tables (RBAC & Menu)

| Table | Purpose |
|-------|---------|
| **modules** | Top-level modules (e.g. Student Management, Fee Management, Staff Management). Columns include `id`, `module_key`, `module_name`, `display_order`, `is_active`. |
| **sub_modules** | Granular screens/features under a module. Columns: `id`, `module_id` (FK), `sub_module_key`, `sub_module_name`, `route_path`, `display_order`, `is_active`. `route_path` is the **admin** path (e.g. `/dashboard/[school]/students/directory`). |
| **permission_categories** | View vs Edit. Typical rows: `category_key` = `'view'`, `'edit'`; `category_type` = `'view'` or `'edit'`. |
| **role_permissions** | Links **roles** to **sub_modules** and **categories** with view/edit flags. Columns: `role_id`, `sub_module_id`, `category_id`, `view_access`, `edit_access`. |
| **roles** | Role definitions (e.g. "Academic Coordinator"). Columns: `id`, `role_name`, etc. |
| **staff_roles** | Assigns **staff** to **roles**. Columns: `staff_id` (staff UUID), `role_id`, `is_active`. |
| **staff_permissions** | **Direct** staff overrides: per-staff, per-sub-module, per-category. Columns: `staff_id`, `sub_module_id`, `category_id`, `view_access`, `edit_access`. Overrides or adds to role-based permissions. |
| **classes** | Used for class teacher check. Columns include `class_teacher_id` (staff UUID), `class_teacher_staff_id` (text staff_id), `school_code`, `class`, `section`, `academic_year`. |
| **staff_subjects** | Used for "subject teacher" check. Columns: `staff_id`, subject-related fields. |

Admin defines **modules** and **sub_modules** (and optionally syncs them from app config; see `GET /api/modules`). In **Role Management**, admin assigns **sub_modules** (with view/edit) to **roles**. In **Staff Access Control**, admin either assigns **roles** to staff or sets **staff_permissions** per staff. The staff dashboard does **not** use a separate "permissions" table by key; it uses **sub_module_id + category_id** for view/edit.

### 2.2 Admin Flows

- **Role Management** (e.g. `/dashboard/[school]/role-management` or under Settings): Create/edit roles; assign to each role a set of sub_modules with view/edit. Stored in `role_permissions`.
- **Staff Access Control** (`/dashboard/[school]/staff-access-control`): List staff; open a staff to see/edit their permissions. Permissions come from:
  - **Roles:** staff's roles → those roles' `role_permissions` (sub_module_id + category_id + view_access + edit_access).
  - **Direct overrides:** `staff_permissions` for that staff (same structure).  
  API used: `GET /api/rbac/staff-permissions?school_code=...`, `GET /api/rbac/staff-permissions/[staffId]`, `POST /api/rbac/staff-permissions/[staffId]` (body: `category_id`, `permissions: [{ sub_module_id, view_access, edit_access }]`).

So: **modules and sub_modules** are the source of truth for "what exists"; **role_permissions** and **staff_permissions** define "who can see/edit what." The staff menu API converts these into a single menu list for the teacher layout.

---

## 3. Staff Menu API — How the Teacher Sidebar Is Built

**Endpoint:** `GET /api/staff/[id]/menu`  
**Parameter:** `id` = staff **UUID** (same as `teacher.id` after login).

This API returns the **list of modules and sub-modules** the staff is allowed to see, with routes **mapped to the teacher dashboard**. It is the single source for "dynamic" modules in the sidebar.

### 3.1 Steps Inside the API (In Order)

1. **Load staff:** From `staff` table: `id`, `staff_id`, `role`, `designation`, `school_code`.
2. **Class teacher check:** Query `classes` with `school_code` and `class_teacher_id = id` OR `class_teacher_staff_id = staff_id`. If any row exists → `isClassTeacher = true`.
3. **Subject teacher check:** Query `staff_subjects` for this `id`. If any row → `hasAssignedSubjects = true`.
4. **Vice Principal / Principal:** From `staff.role` / `staff.designation` or from `staff_roles` → `roles.role_name` (e.g. contains "vice principal", "principal", "admin"). If true → treat as VP/Principal.
5. **Default sub_module keys (permanent for "normal" teachers):**
   - **BASE_DEFAULT_SUB_MODULE_KEYS** (all staff): `attendance_staff`, `staff_leave`, `student_directory`, `gallery_main`, `staff_directory`.
   - **CLASS_TEACHER_SUB_MODULE_KEYS** (if `isClassTeacher`): `mark_attendance`, `marks_entry`, `classes_overview`.
   - **SUBJECT_TEACHER_SUB_MODULE_KEYS** (if `hasAssignedSubjects` and **not** class teacher): `marks_entry`.
   - **Vice Principal / Principal:** Default list is **empty**; they get **only** what is assigned via roles/staff_permissions.
6. **Fetch default sub_modules:** From DB `sub_modules` (join `modules`) where `sub_module_key` in the default keys above, `is_active = true`.
7. **Role permissions:** From `staff_roles` get `role_id`s for this staff; from `role_permissions` get rows with `view_access = true` and category_type = view, with joined `sub_modules` and `modules`. These add or override entries in a permissions map (by `sub_module_key`).
8. **Staff permissions:** From `staff_permissions` with `view_access = true`, joined to `sub_modules` and `modules`. These **override** role and defaults: if view_access is false for a non-default sub_module, that sub_module is removed; default sub_modules are never removed even if staff_permissions says view_access false.
9. **Route transformation:** Any `route_path` that starts with `/dashboard/[school]` or `/dashboard/` is converted to `/teacher/dashboard/...` (e.g. `/dashboard/[school]/students/directory` → `/teacher/dashboard/students` or the appropriate teacher path). Other root paths like `/institute-info` become `/teacher/dashboard/institute-info`.
10. **Group by module:** Group result by `module_key`, sort by `display_order`, sort sub_modules by name. Return `{ data: [ { module_name, module_key, display_order, sub_modules: [ { name, key, route, has_view_access, has_edit_access } ] } ] }`.

So: **Permanent modules** = those from the default sub_module keys (plus class/subject teacher extras). **Extra modules** = everything that comes from `role_permissions` and `staff_permissions` (and not already in the base list). The layout then merges "base menu items," "dynamic menu items" (from this API), and "dashboard menu items" that pass permission checks.

### 3.2 Response Shape (Summary)

```json
{
  "data": [
    {
      "module_name": "Student Management",
      "module_key": "student_management",
      "display_order": 1,
      "sub_modules": [
        {
          "name": "Student Directory",
          "key": "student_directory",
          "route": "/teacher/dashboard/students",
          "has_view_access": true,
          "has_edit_access": false
        }
      ]
    }
  ]
}
```

Use `route` for navigation; `has_view_access` / `has_edit_access` can drive read-only vs editable UI.

---

## 4. Teacher Layout — What Shows in the Sidebar

**File:** `app/teacher/layout.tsx`

### 4.1 Three Menu Sources

| Source | Description |
|--------|-------------|
| **teacherBaseItems** | Hardcoded list of ~22 items (Home, Mark Attendance, My Attendance, Marks Entry, Examinations, My Class, Classes, Apply for Leave, My Leaves, Student Leave Approvals, Institute Info, Student Management, Library, Certificate Management, Gallery, Academic Calendar, Digital Diary, Copy Checking, Settings, Change Password, Staff Information, Communication). Some have `requiresClassTeacher: true` (Marks Entry, My Class, Student Leave Approvals). |
| **dashboardMenuItems** | Same conceptual list as admin dashboard but with teacher paths and permission keys (e.g. `manage_staff`, `view_staff`). Used only for items **not** already in teacherBaseItems and **not** in dynamic modules. |
| **dynamicModules** | From `GET /api/staff/[id]/menu`. Converted to sidebar items (one per module, link = first accessible sub_module's route). |

### 4.2 Filtering Logic

- **Class teacher:** Items with `requiresClassTeacher: true` are shown **only** if `isClassTeacher` is true (from `GET /api/classes/teacher`).
- **Permissions:** For dashboard-style items, `hasPermission(item)` checks:
  - Permission keys from the menu API response (mapped from sub_module names to keys like `view_staff`, `manage_staff`, etc.).
  - Or module-level access: if `staffPermissions.modules` (derived from menu API) contains a module whose name/id matches the item (e.g. examination, fee, library), and any sub_module has view or edit access, the item is shown.
- **Deduplication:** If a dynamic module corresponds to an item already in teacherBaseItems (by id or label), it is not added again. Same for dashboardMenuItems.

Final sidebar = **filtered teacherBaseItems** + **dynamicMenuItems** (from API) + **filtered dashboardMenuItems**.

### 4.3 Class Teacher Check (Used by Layout)

**API:** `GET /api/classes/teacher?school_code=...&teacher_id=...` (optional: `&staff_id=...`, `&array=true`)

- **Returns:** If the teacher is class teacher of at least one class: `{ data: <class or array of classes> }` (with optional `student_count`). If not class teacher: `{ data: [] }` or `{ data: null }`.
- **Tables:** `classes` (filter by `class_teacher_id` or `class_teacher_staff_id`).

---

## 5. Class Teacher vs Subject Teacher vs VP/Principal (Summary)

| Type | How determined | Default extra sub_modules (from menu API) |
|------|----------------|-------------------------------------------|
| **Class teacher** | `classes.class_teacher_id` or `classes.class_teacher_staff_id` matches staff | `mark_attendance`, `marks_entry`, `classes_overview` |
| **Subject teacher (not class teacher)** | Has rows in `staff_subjects` | `marks_entry` |
| **Vice Principal / Principal** | `staff.role`/`designation` or role name contains "vice principal" / "principal" / "admin" | None (only role/staff_permissions) |
| **Normal teacher** | Otherwise | Only base: `attendance_staff`, `staff_leave`, `student_directory`, `gallery_main`, `staff_directory` |

So: **permanent** modules for a normal teacher are the base five; **extra** modules come from class teacher flag, subject teacher flag, and then **all** other modules from role_permissions and staff_permissions (via the menu API).

---

## 6. Teacher Dashboard Routes and APIs (Complete Table)

Below: every staff dashboard **route** and the **APIs** that page uses. Use this for the mobile app or to rebuild the dashboard.

| # | Route | Purpose | APIs used (GET unless noted) |
|---|--------|--------|-------------------------------|
| 1 | `/teacher/dashboard` | Home | `GET /api/students?school_code=`, `GET /api/classes/teacher?school_code=&teacher_id=&staff_id=&array=true`, `GET /api/timetable/slots?school_code=&teacher_id=`, `GET /api/teacher/grade-distribution?school_code=&teacher_id=`, `GET /api/teacher/todos?school_code=&teacher_id=&status=...`, `POST/PATCH/DELETE /api/teacher/todos`, `GET /api/timetable/daily-agenda?school_code=&teacher_id=`, `GET /api/attendance/staff?school_code=&staff_id=&start_date=&end_date=`, `GET /api/examinations/v2/teacher?school_code=&teacher_id=`, `GET /api/communication/notices?school_code=&status=Active&...`, `GET /api/calendar/notifications?school_code=&user_type=teacher&user_id=`, `GET /api/staff-subjects/:teacherId?school_code=`, `GET /api/students?school_code=&...`, `GET /api/leave/student-requests?school_code=&status=pending` |
| 2 | `/teacher/dashboard/attendance` | Mark attendance (class) | `GET /api/attendance/class?class_id=&date=&school_code=`, `GET /api/students?school_code=&class=&section=`, `GET /api/classes/teacher?school_code=&teacher_id=&staff_id=&array=true`, `POST /api/attendance/mark`, `PUT /api/attendance/update` |
| 3 | `/teacher/dashboard/attendance-staff` | My attendance | `GET /api/attendance/staff?school_code=&staff_id=&start_date=&end_date=` |
| 4 | `/teacher/dashboard/marks` | Marks entry | `GET /api/examinations/v2/teacher?school_code=&teacher_id=`, `GET /api/classes/teacher?school_code=&teacher_id=&staff_id=`, `GET /api/classes?school_code=&id=`, `GET /api/students?school_code=&class=&section=&status=active`, `GET /api/examinations/marks?exam_id=&student_id=`, `GET /api/examinations/marks/status?exam_id=&student_id=`, `POST /api/examinations/marks`, `POST /api/examinations/marks/submit` |
| 5 | `/teacher/dashboard/examinations` | Examinations list | `GET /api/examinations/v2/teacher?school_code=&teacher_id=` |
| 6 | `/teacher/dashboard/examinations/grade-scale` | Grade scale | `GET /api/grade-scales?school_code=` |
| 7 | `/teacher/dashboard/examinations/v2/marks-entry` | Marks entry (v2) | Same as marks + `GET /api/classes?school_code=&id=` |
| 8 | `/teacher/dashboard/examinations/[examId]` | Exam detail | `GET /api/examinations/:examId?school_code=`, `GET /api/classes/teacher?...`, `GET /api/students?school_code=&class=&section=&status=active`, `GET /api/examinations/summary?school_code=&exam_id=&student_id=` |
| 9 | `/teacher/dashboard/examinations/[examId]/student/[studentId]` | Student exam marks | `GET /api/examinations/:examId?school_code=`, `GET /api/students/:studentId?school_code=`, `GET /api/examinations/marks?exam_id=&student_id=`, `POST/PUT /api/examinations/marks` |
| 10 | `/teacher/dashboard/my-class` | My class (class teacher) | `GET /api/classes/teacher?school_code=&teacher_id=&staff_id=&array=true`, `GET /api/students?school_code=&class=&section=&academic_year=` |
| 11 | `/teacher/dashboard/classes` | Classes list | `GET /api/classes?school_code=`, `GET /api/students?school_code=&class=&section=&academic_year=` |
| 12 | `/teacher/dashboard/apply-leave` | Apply for leave | `GET /api/leave/types?school_code=`, `POST /api/leave/requests` |
| 13 | `/teacher/dashboard/my-leaves` | My leaves | `GET /api/leave/types?school_code=`, `GET /api/leave/requests?school_code=&staff_id=`, `POST /api/leave/requests/:id/withdraw` |
| 14 | `/teacher/dashboard/student-leave-approvals` | Student leave (class teacher) | `GET /api/leave/student-requests/class-teacher?school_code=&...`, `POST /api/leave/student-requests/:id/class-teacher-approval` |
| 15 | `/teacher/dashboard/institute-info` | Institute info | `GET /api/schools/accepted` |
| 16 | `/teacher/dashboard/students` | Student management | `GET /api/students?school_code=`, `GET /api/student/fees?school_code=&student_id=`, `GET /api/student/transport?school_code=&student_id=` |
| 17 | `/teacher/dashboard/library` | Library | `GET /api/library/books?school_code=` |
| 18 | `/teacher/dashboard/certificates` | Certificates | `GET /api/classes/teacher?...`, `GET /api/students?school_code=&class=&section=`, `GET /api/certificates/simple?school_code=`, `POST /api/certificates/simple/upload` |
| 19 | `/teacher/dashboard/gallery` | Gallery | `GET /api/gallery?school_code=&category=` |
| 20 | `/teacher/dashboard/calendar` | Academic calendar | `GET /api/calendar/academic?school_code=&academic_year=` |
| 21 | `/teacher/dashboard/homework` | Digital diary | `GET /api/classes/academic-years?school_code=`, `GET /api/diary?school_code=&...`, `GET /api/diary/stats?...`, `GET /api/diary/:id`, `PUT/DELETE /api/diary/:id`, `GET /api/classes?school_code=`, `POST /api/diary/upload`, `POST /api/diary` |
| 22 | `/teacher/dashboard/copy-checking` | Copy checking | `GET /api/classes/teacher?school_code=&teacher_id=&staff_id=&array=true`, `GET /api/timetable/slots?school_code=&teacher_id=` |
| 23 | `/teacher/dashboard/settings` | Settings | `GET/PATCH /api/staff/:teacherId`, `GET /api/staff/photos/self`, `POST /api/staff/change-password` |
| 24 | `/teacher/dashboard/change-password` | Change password | `POST /api/staff/change-password` |
| 25 | `/teacher/dashboard/staff-management/directory` | Staff directory | `GET /api/staff?school_code=` |
| 26 | `/teacher/dashboard/staff-management` | Staff management (admin-style) | Same as directory when used |
| 27 | `/teacher/dashboard/communication` | Communication | `GET /api/communication/notices?school_code=&status=Active&category=all&priority=all` |
| 28 | `/teacher/dashboard/fees` | Fees | `GET /api/staff/:id/menu` (for sub-nav) + fee APIs as in admin fees |
| 29 | `/teacher/dashboard/timetable` | Timetable | `GET /api/staff/:id/menu` + timetable APIs |
| 30 | `/teacher/dashboard/reports` | Reports | Report APIs (see admin reports) |
| 31 | `/teacher/dashboard/expense-income` | Expense/income | `GET /api/staff/:id/menu` + finance APIs |
| 32 | `/teacher/dashboard/transport` | Transport | Transport APIs (same as admin) |
| 33 | `/teacher/dashboard/gate-pass` | Gate pass | Front office / gate pass APIs |

All teacher APIs that take `school_code` expect the logged-in staff's `school_code`; those that take `teacher_id` or `staff_id` expect the logged-in staff's `id` (UUID) or `staff_id` (text).

---

## 7. Database Tables Used by Staff Dashboard (Summary)

| Table | Used for |
|-------|----------|
| staff | Login, profile, school_code, role, designation; staff_id for class_teacher_staff_id match |
| staff_roles | Which roles a staff has (menu API) |
| staff_permissions | Direct view/edit overrides per sub_module (menu API) |
| roles | Role names (VP/Principal check, menu API) |
| role_permissions | Sub_module + category view/edit for roles (menu API) |
| modules | Module names and order (menu API, /api/modules) |
| sub_modules | Sub-module keys, names, route_path (menu API, route → teacher path) |
| permission_categories | View vs edit category (menu API) |
| classes | Class teacher check (class_teacher_id, class_teacher_staff_id) |
| staff_subjects | Subject teacher check |
| students | Student lists, fees, transport (per student) |
| (attendance, examinations, marks, leave, diary, etc.) | As per the API table above for each feature |

---

## 8. Quick Reference: Key APIs for Mobile or Rebuild

| Purpose | API | Params / body |
|--------|-----|----------------|
| **Staff login** | `POST /api/auth/teacher/login` | Body: `school_code`, `staff_id` (or login id), `password` |
| Staff menu (what to show) | `GET /api/staff/[id]/menu` | `id` = staff UUID |
| Class teacher? | `GET /api/classes/teacher` | `school_code`, `teacher_id` or `staff_id`, optional `array=true` |
| Staff permissions (admin UI) | `GET /api/rbac/staff-permissions?school_code=` | — |
| Staff permissions for one | `GET /api/rbac/staff-permissions/[staffId]` | optional `category_id` |
| Save staff permissions | `POST /api/rbac/staff-permissions/[staffId]` | `{ category_id, permissions: [{ sub_module_id, view_access, edit_access }] }` |
| All modules (admin) | `GET /api/modules` | — |
| Change password (staff) | `POST /api/staff/change-password` | Body: `school_code`, `staff_id`, `current_password`, `new_password` |

---

## 9. Cursor Prompt: Rebuild Staff Dashboard / Mobile

Use the following as a **Cursor prompt** to implement the staff dashboard (or mobile equivalent) with the same behavior.

**Context:** We have a school ERP. Staff (teachers) log in and see a dashboard. Modules are a mix of (1) permanent items, some visible only to class teachers, and (2) extra modules from admin role management (roles + staff_permissions). The backend exposes `GET /api/staff/[staffId]/menu` returning modules and sub_modules with teacher routes and view/edit flags.

**Requirements:**

1. **Auth:** After staff login, store staff object (including `id` UUID, `staff_id`, `school_code`, `role`, `designation`) in session. Use `id` for all "staff UUID" params in APIs.

2. **Menu / sidebar:**
   - Call `GET /api/staff/[id]/menu` with the logged-in staff's `id`.
   - Call `GET /api/classes/teacher?school_code=...&teacher_id=...&staff_id=...` to know if the staff is a class teacher.
   - **Permanent items:** Implement the same base list as in the codebase (`teacherBaseItems`): Home, Mark Attendance, My Attendance, Marks Entry (class teacher only), Examinations, My Class (class teacher only), Classes, Apply for Leave, My Leaves, Student Leave Approvals (class teacher only), Institute Info, Student Management, Library, Certificate Management, Gallery, Academic Calendar, Digital Diary, Copy Checking, Settings, Change Password, Staff Information, Communication. Hide Marks Entry, My Class, Student Leave Approvals if the class-teacher API returns no classes.
   - **Extra items:** From the menu API response, for each module with at least one sub_module with view or edit access, add one entry (e.g. label = module_name, route = first accessible sub_module's `route`). Do not duplicate items that are already in the permanent list (match by module_key or label).
   - **Route mapping:** Backend already returns teacher paths (e.g. `/teacher/dashboard/students`). Use them as-is for navigation.

3. **Per-screen APIs:** For each screen, use the **exact** APIs listed in the "Teacher Dashboard Routes and APIs" table in `docs/STAFF_DASHBOARD_AND_MOBILE_API.md`. Pass `school_code` and `teacher_id`/`staff_id` from the logged-in staff. Handle loading, errors, and empty states.

4. **Permissions:** Use `has_view_access` and `has_edit_access` from the menu API's sub_modules to show read-only vs editable UI where applicable (e.g. hide "Edit" or "Submit" when only view is true).

5. **Database (reference):** Modules and visibility are driven by `modules`, `sub_modules`, `permission_categories`, `role_permissions`, `staff_roles`, `staff_permissions`; class teacher by `classes`; subject teacher by `staff_subjects`. Do not duplicate this logic in the client; rely on `GET /api/staff/[id]/menu` and `GET /api/classes/teacher`.

This gives you an in-depth, single-doc reference for how the staff dashboard works, how modules are fetched from admin role management, permanent vs extra modules, class vs subject teacher, and every API and table to rebuild or build a mobile app against the same backend.
