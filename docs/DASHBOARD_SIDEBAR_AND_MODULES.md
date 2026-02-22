# Dashboard Sidebar and Modules — Reference

This document describes where the **sidebar menu** and **module structure** are defined and how they work. Data and auth use **Supabase** only; no external API for dashboard data.

---

## 1. Where the sidebar and modules come from (code, not DB)

- **Sidebar menu:** `constants/dashboardMenu.ts` — `DASHBOARD_MENU_ITEMS` (24 main items with optional `children` for submodules).
- **Sidebar UI:** `components/dashboard/DashboardSidebar.tsx` — renders all items; items with `children` expand on click to show submodules.
- **Layout:** `app/dashboard/[schoolCode]/_layout.tsx` — wraps content in `SidebarProvider` and `DashboardWithSidebar` so the sidebar is visible (web: always; native: overlay when opened via menu button).
- **Home screen:** `app/dashboard/[schoolCode]/(tabs)/index.tsx` — shows a **menu (hamburger) button** on mobile that opens the sidebar; module grid uses the same `DASHBOARD_MENU_ITEMS` as the sidebar.

**Nothing from the sidebar or searchable list is stored in the database.** Visibility for non-admin users can later be filtered by permissions (roles/permissions from Supabase).

---

## 2. Main menu (24 items, order as in sidebar)

| # | Label | Path | Submodules |
|---|--------|------|------------|
| 1 | Home | `` | — |
| 2 | Institute Info | institute-info | Basic Institute Info |
| 3 | Admin Role Management | settings/roles | — |
| 4 | Password Manager | password | — |
| 5 | Staff Management | staff-management | Staff Directory, Add Staff, Bulk Import, Bulk Photo, Staff Attendance, Report |
| 6 | Classes | classes | Overview, Modify Classes, Subject Teachers, Add/Modify Subjects |
| 7 | Student Management | students | Add Student, Directory, Attendance, Mark Attendance, Bulk Import, Siblings |
| 8 | Timetable | timetable | Class, Teacher, Group Wise Timetable |
| 9 | Event/Calendar | calendar | Academic Calendar, Events |
| 10 | Examinations | examinations | Dashboard, Create, Grade Scale, Reports |
| 11 | Report Card | report-card | Generate, Dashboard, Customize Template |
| 12 | Marks | marks | Dashboard, Mark Entry |
| 13 | Fees | fees | Dashboard, Heads, Structures, Collect, Statements, Discounts, Reports |
| 14 | Library | library | Dashboard, Basics, Catalogue, Transactions |
| 15 | Transport | transport | Dashboard, Vehicles, Stops, Routes, Student Mapping |
| 16 | Leave Management | leave | Dashboard, Student Leave, Staff Leave, Basics |
| 17 | Communication | communication | — |
| 18 | Report | reports | — |
| 19 | Gallery | gallery | — |
| 20 | Certificate Management | certificates | Dashboard, New Certificate |
| 21 | Digital Diary | homework | — |
| 22 | Expense/income | expense-income | — |
| 23 | Front Office management | front-office | Dashboard, Gate pass, Visitors |
| 24 | Copy Checking | copy-checking | — |

---

## 3. Behaviour

- **Web:** Sidebar is always visible on the left; content area is to the right. Clicking a main item **with submodules** expands/collapses the list of submodules. Clicking a main item **without submodules** or any **submodule** navigates to that route.
- **Native (mobile):** Sidebar is hidden by default. Tapping the **menu (hamburger)** on the Home screen opens the sidebar as an overlay; tapping the backdrop or selecting a menu item closes it.
- **Routes:** All paths are relative to `/dashboard/[schoolCode]/`, e.g. `institute-info` → `/dashboard/SCH001/institute-info`. The `report-card` route exists; others match existing screens under `app/dashboard/[schoolCode]/`.

---

## 4. Files to change when adding/editing modules

- **Add or reorder main/subs:** `constants/dashboardMenu.ts` — edit `DASHBOARD_MENU_ITEMS` and optionally `getSearchableMenuItems()`.
- **Sidebar styling/UX:** `components/dashboard/DashboardSidebar.tsx`.
- **New screen:** Add a new file under `app/dashboard/[schoolCode]/` and register it in `_layout.tsx` with `<Stack.Screen name="your-route" />`.

---

## 5. Data and auth

- **Data:** When `EXPO_PUBLIC_USE_SUPABASE_DASHBOARD=true`, dashboard and module data (stats, classes, students, staff, institute, gallery, calendar, communication, fees, leave, transport, library, examinations, diary, timetable, etc.) are read/written **directly from Supabase** (see `services/*.supabase.ts` and the main services that switch on `env.USE_SUPABASE_DASHBOARD`).
- **Auth / login:** Use Supabase for authentication and login; no dependency on external APIs for auth.

This file is the single reference for **sidebar structure**, **module list**, and **where to edit** when adding or changing modules.
