/**
 * Teacher dashboard menu: sections and modules. Matches Teacher Portal Dashboard Menu.
 * Merged menu = filtered teacherBaseItems (by class teacher + permission) + dynamic from GET /api/staff/[id]/menu (deduped).
 */

import type Ionicons from '@expo/vector-icons/Ionicons';
import type { StaffMenuModule } from '@/services/teacher.service';

export type TeacherModuleItem = {
  id: string;
  label: string;
  path: string;
  icon: keyof typeof Ionicons.glyphMap;
  permission?: string | null;
  permissionAny?: string[];
  requiresClassTeacher?: boolean;
};

/** Flattened menu item with full route for navigation (path suffix for base, full URL for dynamic). */
export type TeacherMenuItem = {
  id: string;
  label: string;
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export type TeacherSectionConfig = {
  id: string;
  title: string;
  modules: TeacherModuleItem[];
};

export const TEACHER_DASHBOARD_SECTIONS: TeacherSectionConfig[] = [
  {
    id: 'core',
    title: 'Core',
    modules: [
      { id: 'home', label: 'Home', path: '', icon: 'home', requiresClassTeacher: false },
      { id: 'academics', label: 'Academics', path: '', icon: 'school', requiresClassTeacher: false },
      { id: 'mark-attendance', label: 'Mark Attendance', path: 'attendance', icon: 'calendar', requiresClassTeacher: false },
      { id: 'my-attendance', label: 'My Attendance', path: 'attendance-staff', icon: 'calendar-outline', requiresClassTeacher: false },
      { id: 'marks-entry', label: 'Marks Entry', path: 'marks', icon: 'document-text', requiresClassTeacher: true },
      { id: 'examinations', label: 'Examinations', path: 'examinations', icon: 'document-text', permissionAny: ['view_exams', 'manage_exams'], requiresClassTeacher: false },
      { id: 'my-class', label: 'My Class', path: 'my-class', icon: 'people', requiresClassTeacher: true },
      { id: 'classes', label: 'Classes', path: 'classes', icon: 'book', permission: 'view_classes', requiresClassTeacher: false },
      { id: 'calendar', label: 'Academic Calendar', path: 'calendar', icon: 'calendar', permission: 'view_events', requiresClassTeacher: false },
      { id: 'diary', label: 'Digital Diary', path: 'homework', icon: 'bookmark', permission: 'view_homework', requiresClassTeacher: false },
      { id: 'copy-checking', label: 'Copy Checking', path: 'copy-checking', icon: 'document-text-outline', requiresClassTeacher: false },
    ],
  },
  {
    id: 'leave-requests',
    title: 'Leave & Requests',
    modules: [
      { id: 'apply-leave', label: 'Apply for Leave', path: 'apply-leave', icon: 'calendar-outline', requiresClassTeacher: false },
      { id: 'my-leaves', label: 'My Leaves', path: 'my-leaves', icon: 'calendar', requiresClassTeacher: false },
      { id: 'student-leave-approvals', label: 'Student Leave Approvals', path: 'student-leave-approvals', icon: 'calendar-outline', requiresClassTeacher: true },
    ],
  },
  {
    id: 'information',
    title: 'Information',
    modules: [
      { id: 'students', label: 'Student Management', path: 'students', icon: 'school', permission: 'view_students', requiresClassTeacher: false },
      { id: 'library', label: 'Library', path: 'library', icon: 'library', permission: 'view_library', requiresClassTeacher: false },
      { id: 'certificates', label: 'Certificate Management', path: 'certificates', icon: 'ribbon', permission: 'view_certificates', requiresClassTeacher: false },
      { id: 'gallery', label: 'Gallery', path: 'gallery', icon: 'images', requiresClassTeacher: false },
      { id: 'staff-directory', label: 'Staff Information', path: 'staff-management/directory', icon: 'people', permission: 'view_staff', requiresClassTeacher: false },
      { id: 'communication', label: 'Communication', path: 'communication', icon: 'chatbubbles', requiresClassTeacher: false },
      { id: 'front-office', label: 'Front Office', path: 'gate-pass', icon: 'business', permissionAny: ['view_gate_pass', 'manage_gate_pass'], requiresClassTeacher: false },
    ],
  },
  {
    id: 'finance',
    title: 'Finance',
    modules: [
      { id: 'fee-management', label: 'Fee Management', path: 'fees', icon: 'cash', permissionAny: ['view_fees', 'manage_fees'], requiresClassTeacher: false },
    ],
  },
  {
    id: 'additional',
    title: 'Additional Modules',
    modules: [
      { id: 'fees', label: 'Fees', path: 'fees', icon: 'cash', permissionAny: ['view_fees', 'manage_fees'], requiresClassTeacher: false },
      { id: 'gate-pass', label: 'Gate pass', path: 'gate-pass', icon: 'open', permissionAny: ['view_gate_pass', 'manage_gate_pass'], requiresClassTeacher: false },
    ],
  },
  {
    id: 'account',
    title: 'Account',
    modules: [
      { id: 'institute-info', label: 'Institute Info', path: 'institute-info', icon: 'business', requiresClassTeacher: false },
      { id: 'settings', label: 'Settings', path: 'settings', icon: 'settings', requiresClassTeacher: false },
      { id: 'change-password', label: 'Change Password', path: 'change-password', icon: 'key', requiresClassTeacher: false },
    ],
  },
];

/** Base module ids used for deduplication when merging dynamic menu from API. */
const BASE_MODULE_IDS = new Set(
  TEACHER_DASHBOARD_SECTIONS.flatMap((s) => s.modules.map((m) => m.id))
);

/**
 * Build merged menu: filtered teacherBaseItems (by class teacher + permission) + dynamic from staff menu API (deduped).
 * Doc: Final sidebar = filtered teacherBaseItems + dynamicMenuItems (from API) + filtered dashboardMenuItems.
 */
export function getMergedTeacherMenu(options: {
  staffMenuModules: StaffMenuModule[];
  isClassTeacher: boolean;
  hasPermission: (key: string) => boolean;
  path: (suffix: string) => string;
}): { sectionId: string; sectionTitle: string; items: TeacherMenuItem[] }[] {
  const { staffMenuModules, isClassTeacher, hasPermission, path } = options;
  const baseRoutes = new Set<string>();

  const sections: { sectionId: string; sectionTitle: string; items: TeacherMenuItem[] }[] = [];

  for (const section of TEACHER_DASHBOARD_SECTIONS) {
    const visible = section.modules.filter((m) => {
      if (m.path === '' && (m.id === 'home' || m.id === 'academics')) return false;
      if (m.requiresClassTeacher && !isClassTeacher) return false;
      if (m.permissionAny?.length) {
        if (!m.permissionAny.some((p) => hasPermission(p))) return false;
      } else if (m.permission && !hasPermission(m.permission)) return false;
      return true;
    });
    if (visible.length === 0) continue;
    const items: TeacherMenuItem[] = visible.map((m) => {
      const route = path(m.path);
      baseRoutes.add(route);
      return { id: m.id, label: m.label, route, icon: m.icon };
    });
    sections.push({ sectionId: section.id, sectionTitle: section.title, items });
  }

  const dynamicItems: TeacherMenuItem[] = [];
  for (const mod of staffMenuModules) {
    const first = mod.sub_modules?.find((s) => s.has_view_access || s.has_edit_access);
    if (!first?.route) continue;
    if (baseRoutes.has(first.route)) continue;
    const id = mod.module_key || mod.module_name?.toLowerCase().replace(/\s+/g, '_') || `dynamic-${dynamicItems.length}`;
    if (BASE_MODULE_IDS.has(id)) continue;
    dynamicItems.push({
      id,
      label: mod.module_name || mod.module_key || 'Module',
      route: first.route,
      icon: 'folder-open',
    });
  }

  if (dynamicItems.length > 0) {
    sections.push({
      sectionId: 'from-role',
      sectionTitle: 'From role',
      items: dynamicItems,
    });
  }

  return sections;
}
