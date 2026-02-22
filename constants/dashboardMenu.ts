/**
 * Dashboard sidebar and searchable menu — single source of truth.
 * All 24 main modules and their submodules. Not stored in DB; visibility can be filtered by permissions.
 * Reference: Dashboard Page & Sidebar — Table Structures and Data Reference (Part I & II).
 */

export type SubmoduleItem = {
  label: string;
  path: string;
};

export type DashboardMenuItem = {
  label: string;
  path: string;
  /** Permission key for visibility (e.g. manage_staff). null = always visible. */
  permission: string | null;
  icon: string;
  /** Submodules; when present, clicking the main item expands to show these. */
  children?: SubmoduleItem[];
};

/** Main sidebar menu (24 items). Order matches document. */
export const DASHBOARD_MENU_ITEMS: DashboardMenuItem[] = [
  { label: 'Home', path: '', permission: null, icon: 'home' },
  {
    label: 'Institute Info',
    path: 'institute-info',
    permission: null,
    icon: 'business',
    children: [{ label: 'Basic Institute Info', path: 'institute-info' }],
  },
  {
    label: 'Admin Role Management',
    path: 'settings/roles',
    permission: null,
    icon: 'shield-checkmark',
  },
  { label: 'Password Manager', path: 'password', permission: 'manage_passwords', icon: 'key' },
  {
    label: 'Staff Management',
    path: 'staff-management',
    permission: 'manage_staff',
    icon: 'people',
    children: [
      { label: 'Staff Directory', path: 'staff-management' },
      { label: 'Add Staff', path: 'staff-management/add' },
      { label: 'Bulk Staff Import', path: 'staff-management/import' },
      { label: 'Bulk Photo Upload', path: 'staff-management' },
      { label: 'Staff Attendance', path: 'staff-management/attendance' },
      { label: 'Staff Attendance Marking Report', path: 'attendance' },
    ],
  },
  {
    label: 'Classes',
    path: 'classes',
    permission: 'manage_classes',
    icon: 'book',
    children: [
      { label: 'Classes Overview', path: 'classes' },
      { label: 'Modify Classes', path: 'classes' },
      { label: 'Subject Teachers', path: 'classes' },
      { label: 'Add/Modify Subjects', path: 'classes' },
    ],
  },
  {
    label: 'Student Management',
    path: 'students',
    permission: 'manage_students',
    icon: 'people',
    children: [
      { label: 'Add Student', path: 'students/add' },
      { label: 'Student Directory', path: 'students' },
      { label: 'Student Attendance', path: 'students/attendance' },
      { label: 'Mark Attendance', path: 'students/attendance' },
      { label: 'Bulk Import Students', path: 'students/import' },
      { label: 'Student Siblings', path: 'students' },
    ],
  },
  {
    label: 'Timetable',
    path: 'timetable',
    permission: 'manage_timetable',
    icon: 'calendar',
    children: [
      { label: 'Class Timetable', path: 'timetable' },
      { label: 'Teacher Timetable', path: 'timetable' },
      { label: 'Group Wise Timetable', path: 'timetable' },
    ],
  },
  {
    label: 'Event/Calendar',
    path: 'calendar',
    permission: 'manage_events',
    icon: 'calendar',
    children: [
      { label: 'Academic Calendar', path: 'calendar' },
      { label: 'Events', path: 'calendar' },
    ],
  },
  {
    label: 'Examinations',
    path: 'examinations',
    permission: 'manage_exams',
    icon: 'document-text',
    children: [
      { label: 'Examination Dashboard', path: 'examinations' },
      { label: 'Create Examination', path: 'examinations' },
      { label: 'Grade Scale', path: 'marks' },
      { label: 'Examination Reports', path: 'reports' },
    ],
  },
  {
    label: 'Report Card',
    path: 'report-card',
    permission: 'manage_exams',
    icon: 'ribbon',
    children: [
      { label: 'Generate Report Card', path: 'report-card' },
      { label: 'Report Card Dashboard', path: 'report-card' },
      { label: 'Customize Template', path: 'report-card' },
    ],
  },
  {
    label: 'Marks',
    path: 'marks',
    permission: 'manage_exams',
    icon: 'school',
    children: [
      { label: 'Marks Dashboard', path: 'marks' },
      { label: 'Mark Entry', path: 'marks' },
    ],
  },
  {
    label: 'Fees',
    path: 'fees',
    permission: 'manage_fees',
    icon: 'cash',
    children: [
      { label: 'Fee Dashboard', path: 'fees' },
      { label: 'Fee Heads', path: 'fees' },
      { label: 'Fee Structures', path: 'fees' },
      { label: 'Collect Payment', path: 'fees' },
      { label: 'Student Fee Statements', path: 'fees' },
      { label: 'Discounts & Fines', path: 'fees' },
      { label: 'Fee Reports', path: 'reports' },
    ],
  },
  {
    label: 'Library',
    path: 'library',
    permission: 'manage_library',
    icon: 'library',
    children: [
      { label: 'Library Dashboard', path: 'library' },
      { label: 'Library Basics', path: 'library' },
      { label: 'Library Catalogue', path: 'library' },
      { label: 'Library Transactions', path: 'library' },
    ],
  },
  {
    label: 'Transport',
    path: 'transport',
    permission: 'manage_transport',
    icon: 'bus',
    children: [
      { label: 'Transport Dashboard', path: 'transport' },
      { label: 'Vehicles', path: 'transport' },
      { label: 'Stops', path: 'transport' },
      { label: 'Routes', path: 'transport' },
      { label: 'Student Route Mapping', path: 'transport' },
    ],
  },
  {
    label: 'Leave Management',
    path: 'leave',
    permission: 'manage_leaves',
    icon: 'calendar',
    children: [
      { label: 'Leave Dashboard', path: 'leave' },
      { label: 'Student Leave', path: 'leave' },
      { label: 'Staff Leave', path: 'leave' },
      { label: 'Leave Basics', path: 'leave' },
    ],
  },
  {
    label: 'Communication',
    path: 'communication',
    permission: 'manage_communication',
    icon: 'chatbubbles',
  },
  { label: 'Report', path: 'reports', permission: 'view_reports', icon: 'bar-chart' },
  { label: 'Gallery', path: 'gallery', permission: null, icon: 'images' },
  {
    label: 'Certificate Management',
    path: 'certificates',
    permission: 'manage_certificates',
    icon: 'ribbon',
    children: [
      { label: 'Certificate Dashboard', path: 'certificates' },
      { label: 'New Certificate', path: 'certificates' },
    ],
  },
  { label: 'Digital Diary', path: 'homework', permission: 'manage_homework', icon: 'bookmark' },
  { label: 'Expense/income', path: 'expense-income', permission: 'manage_finances', icon: 'trending-up' },
  {
    label: 'Front Office management',
    path: 'front-office',
    permission: 'manage_gate_pass',
    icon: 'open',
    children: [
      { label: 'Front Office Dashboard', path: 'front-office' },
      { label: 'Gate pass', path: 'front-office' },
      { label: 'Visitor Management', path: 'front-office' },
    ],
  },
  { label: 'Copy Checking', path: 'copy-checking', permission: 'manage_copy_checking', icon: 'document-text' },
];

/** Flat list for search: all main + sub items with category. */
export function getSearchableMenuItems(): Array<{ label: string; path: string; category: string; icon: string }> {
  const flat: Array<{ label: string; path: string; category: string; icon: string }> = [];
  for (const item of DASHBOARD_MENU_ITEMS) {
    flat.push({ label: item.label, path: item.path, category: item.label, icon: item.icon });
    if (item.children) {
      for (const sub of item.children) {
        flat.push({ label: sub.label, path: sub.path, category: item.label, icon: item.icon });
      }
    }
  }
  return flat;
}
