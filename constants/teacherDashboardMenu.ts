/**
 * Teacher dashboard menu: sections and modules. Aligned with staff portal module index (web paths = labels).
 * Merged menu = filtered base items + dynamic from GET /api/staff/[id]/menu (deduped).
 */

import type Ionicons from '@expo/vector-icons/Ionicons';
import type { StaffMenuModule } from '@/services/teacher.service';

export type TeacherModuleItem = {
  id: string;
  label: string;
  path: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** If set, user must have this RBAC permission key */
  permission?: string | null;
  permissionAny?: string[];
  /** Class teacher only (GET /api/classes/teacher non-empty). */
  requiresClassTeacher?: boolean;
  /** Marks entry / scholastic flows: class teacher OR teaching assignments. */
  requiresMarksAccess?: boolean;
};

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

/** Order matches staff portal menu index (Teaching column = visible to all teaching staff unless noted). */
export const TEACHER_DASHBOARD_SECTIONS: TeacherSectionConfig[] = [
  {
    id: 'core',
    title: 'Core',
    modules: [
      { id: 'home', label: 'Home', path: '', icon: 'home' },
      { id: 'academics', label: 'Academics', path: '', icon: 'school' },
      {
        id: 'mark-attendance',
        label: 'Mark Attendance',
        path: 'attendance',
        icon: 'calendar',
        requiresClassTeacher: true,
      },
      { id: 'my-attendance', label: 'My Attendance', path: 'attendance-staff', icon: 'calendar-outline' },
      { id: 'my-timetable', label: 'My Timetable', path: 'my-timetable', icon: 'time-outline' },
      {
        id: 'marks-entry',
        label: 'Marks Entry',
        path: 'marks',
        icon: 'document-text',
        requiresMarksAccess: true,
      },
      {
        id: 'non-scholastic-marks',
        label: 'Non-Scholastic Marks',
        path: 'non-scholastic-marks',
        icon: 'ribbon-outline',
        requiresClassTeacher: true,
      },
      {
        id: 'examinations',
        label: 'Examinations',
        path: 'examinations',
        icon: 'school-outline',
      },
      {
        id: 'my-class',
        label: 'My Class',
        path: 'my-class',
        icon: 'people',
        requiresClassTeacher: true,
      },
      { id: 'classes', label: 'Classes', path: 'classes', icon: 'book' },
      {
        id: 'students',
        label: 'Student Management',
        path: 'students',
        icon: 'people-outline',
      },
      {
        id: 'calendar',
        label: 'Academic Calendar',
        path: 'calendar',
        icon: 'calendar-number-outline',
      },
      { id: 'diary', label: 'Digital Diary', path: 'homework', icon: 'bookmark' },
      {
        id: 'copy-checking',
        label: 'Copy Checking',
        path: 'copy-checking',
        icon: 'document-text-outline',
      },
    ],
  },
  {
    id: 'leave-requests',
    title: 'Leave & requests',
    modules: [
      { id: 'apply-leave', label: 'Apply for Leave', path: 'apply-leave', icon: 'calendar-outline' },
      { id: 'my-leaves', label: 'My Leaves', path: 'my-leaves', icon: 'calendar' },
      {
        id: 'student-leave-approvals',
        label: 'Student Leave Approvals',
        path: 'student-leave-approvals',
        icon: 'checkmark-done-outline',
        requiresClassTeacher: true,
      },
    ],
  },
  {
    id: 'information',
    title: 'Information',
    modules: [
      { id: 'library', label: 'Library', path: 'library', icon: 'library' },
      {
        id: 'certificates',
        label: 'Certificate Management',
        path: 'certificates',
        icon: 'ribbon',
      },
      { id: 'gallery', label: 'Gallery', path: 'gallery', icon: 'images' },
      {
        id: 'staff-directory',
        label: 'Staff Information',
        path: 'staff-management/directory',
        icon: 'id-card-outline',
      },
      { id: 'communication', label: 'Communication', path: 'communication', icon: 'chatbubbles' },
    ],
  },
  {
    id: 'finance',
    title: 'Finance',
    modules: [
      {
        id: 'fee-management',
        label: 'Fee Management',
        path: 'fees',
        icon: 'cash',
        permissionAny: ['view_fees', 'manage_fees'],
      },
    ],
  },
  {
    id: 'account',
    title: 'Account',
    modules: [
      { id: 'institute-info', label: 'Institute Info', path: 'institute-info', icon: 'business' },
      { id: 'settings', label: 'Settings', path: 'settings', icon: 'settings' },
      { id: 'change-password', label: 'Change Password', path: 'change-password', icon: 'key' },
    ],
  },
];

const BASE_MODULE_IDS = new Set(
  TEACHER_DASHBOARD_SECTIONS.flatMap((s) => s.modules.map((m) => m.id))
);

function moduleVisible(
  m: TeacherModuleItem,
  isClassTeacher: boolean,
  hasTeachingAssignments: boolean,
  hasPermission: (key: string) => boolean
): boolean {
  if (m.path === '' && (m.id === 'home' || m.id === 'academics')) return false;
  if (m.requiresClassTeacher && !isClassTeacher) return false;
  if (m.requiresMarksAccess && !isClassTeacher && !hasTeachingAssignments) return false;
  if (m.permissionAny?.length) {
    if (!m.permissionAny.some((p) => hasPermission(p))) return false;
  } else if (m.permission && !hasPermission(m.permission)) return false;
  return true;
}

export function getMergedTeacherMenu(options: {
  staffMenuModules: StaffMenuModule[];
  isClassTeacher: boolean;
  hasTeachingAssignments: boolean;
  hasPermission: (key: string) => boolean;
  path: (suffix: string) => string;
}): { sectionId: string; sectionTitle: string; items: TeacherMenuItem[] }[] {
  const { staffMenuModules, isClassTeacher, hasTeachingAssignments, hasPermission, path } = options;
  const baseRoutes = new Set<string>();

  const sections: { sectionId: string; sectionTitle: string; items: TeacherMenuItem[] }[] = [];

  for (const section of TEACHER_DASHBOARD_SECTIONS) {
    const visible = section.modules.filter((m) =>
      moduleVisible(m, isClassTeacher, hasTeachingAssignments, hasPermission)
    );
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
