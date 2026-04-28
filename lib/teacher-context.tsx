/**
 * Teacher dashboard context: teacher object, permissions (from GET /api/rbac/staff-permissions/{id}),
 * isClassTeacher (from GET /api/classes/teacher), staffMenuModules (from GET /api/staff/[id]/menu).
 * Menu = filtered teacherBaseItems + dynamic from staff menu API (deduped).
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuthStore } from './auth-store';
import { rbacService } from '@/services/rbac.service';
import { schoolService } from '@/services/school.service';
import {
  teacherService,
  hasTeachingAssignmentsData,
  type StaffMenuModule,
} from '@/services/teacher.service';

export type Teacher = {
  id: string;
  school_code: string;
  staff_id?: string;
  full_name?: string;
  role: string;
  [k: string]: unknown;
};

/** Map sub_module name to permission keys (view_*, manage_*). Same as web layout mapSubModuleToPermissions. */
function mapSubModuleToPermissions(subModuleName: string): string[] {
  const n = (subModuleName || '').toLowerCase().replace(/\s+/g, '-');
  const map: Record<string, string[]> = {
    'staff-directory': ['view_staff'],
    'add-staff': ['manage_staff'],
    'classes': ['view_classes'],
    'create-examination': ['view_exams', 'manage_exams'],
    'examinations': ['view_exams', 'manage_exams'],
    'marks-entry': ['view_exams', 'manage_exams'],
    'fees': ['view_fees', 'manage_fees'],
    'library': ['view_library', 'manage_library'],
    'transport': ['view_transport', 'manage_transport'],
    'communication': ['view_communication', 'manage_communication'],
    'reports': ['view_reports'],
    'certificates': ['view_certificates', 'manage_certificates'],
    'homework': ['view_homework', 'manage_homework'],
    'digital-diary': ['view_homework', 'manage_homework'],
    'expense-income': ['view_finances', 'manage_finances'],
    'finances': ['view_finances', 'manage_finances'],
    'gate-pass': ['view_gate_pass', 'manage_gate_pass'],
    'front-office': ['view_gate_pass', 'manage_gate_pass'],
    'password-manager': ['manage_passwords'],
    'passwords': ['manage_passwords'],
    'timetable': ['view_timetable', 'manage_timetable'],
    'events': ['view_events'],
    'calendar': ['view_events'],
    'academic-calendar': ['view_events'],
    'students': ['view_students', 'manage_students'],
    'student-management': ['view_students', 'manage_students'],
  };
  for (const [key, perms] of Object.entries(map)) {
    if (n.includes(key) || key.includes(n)) return perms;
  }
  return [];
}

type TeacherContextValue = {
  teacher: Teacher | null;
  schoolCode: string;
  /** Set of permission keys (view_staff, manage_staff, view_classes, etc.) */
  permissions: Set<string>;
  isClassTeacher: boolean;
  /** Non-empty GET /api/teachers/teaching-assignments `data.assignments` (marks entry with timetable). */
  hasTeachingAssignments: boolean;
  /** Modules from GET /api/staff/[id]/menu (dynamic sidebar items from role/staff_permissions) */
  staffMenuModules: StaffMenuModule[];
  permissionsLoading: boolean;
  /** Build path e.g. /teacher/dashboard/attendance */
  path: (suffix: string) => string;
  hasPermission: (key: string) => boolean;
};

const TeacherContext = createContext<TeacherContextValue | null>(null);

export function useTeacher(): TeacherContextValue {
  const ctx = useContext(TeacherContext);
  if (!ctx) throw new Error('useTeacher must be used inside TeacherProvider');
  return ctx;
}

export function useTeacherOrNull(): TeacherContextValue | null {
  return useContext(TeacherContext);
}

type TeacherProviderProps = {
  children: ReactNode;
};

export function TeacherProvider({ children }: TeacherProviderProps) {
  const profile = useAuthStore((s) => s.profile);
  const user_id = useAuthStore((s) => s.user_id);
  const school_code = useAuthStore((s) => s.school_code);
  const role = useAuthStore((s) => s.role);

  const sessionStaffPk = user_id ?? (profile?.id as string) ?? '';
  const profileStaffCode = profile?.staff_id as string | undefined;

  /** Staff row UUID from GET /api/staff when session id is staff_login / wrong table */
  const [resolvedStaffUuid, setResolvedStaffUuid] = useState<string | null>(null);
  /** Name fields from matched staff row (session profile often has no full_name) */
  const [staffRowExtras, setStaffRowExtras] = useState<{
    full_name?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
  }>({});

  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [isClassTeacher, setIsClassTeacher] = useState(false);
  const [hasTeachingAssignments, setHasTeachingAssignments] = useState(false);
  const [staffMenuModules, setStaffMenuModules] = useState<StaffMenuModule[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  useEffect(() => {
    if (role !== 'teacher' || !school_code || !sessionStaffPk) {
      setResolvedStaffUuid(null);
      setStaffRowExtras({});
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r = await schoolService.getStaff(school_code);
        const raw = r.data;
        const list = (Array.isArray(raw) ? raw : (raw as { data?: unknown[] })?.data ?? []) as Record<string, unknown>[];
        const matchByUuid = list.find((x) => String(x.id) === String(sessionStaffPk));
        const code = profileStaffCode?.trim();
        const matchByCode = code
          ? list.find((x) => String(x.staff_id ?? '').toLowerCase() === code.toLowerCase())
          : undefined;
        const match = matchByUuid ?? matchByCode;
        if (cancelled) return;
        setResolvedStaffUuid(match?.id ? String(match.id) : null);
        if (match) {
          setStaffRowExtras({
            full_name: match.full_name as string | undefined,
            name: match.name as string | undefined,
            first_name: match.first_name as string | undefined,
            last_name: match.last_name as string | undefined,
          });
        } else {
          setStaffRowExtras({});
        }
      } catch {
        if (!cancelled) {
          setResolvedStaffUuid(null);
          setStaffRowExtras({});
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [role, school_code, sessionStaffPk, profileStaffCode]);

  const effectiveStaffId = (resolvedStaffUuid ?? sessionStaffPk) || '';

  const resolvedTeacherName = useMemo(() => {
    const s = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
    const fromRow =
      s(staffRowExtras.full_name) ||
      s(staffRowExtras.name) ||
      [s(staffRowExtras.first_name), s(staffRowExtras.last_name)].filter(Boolean).join(' ');
    if (fromRow) return fromRow;
    return s(profile?.full_name) || s(profile?.name) || s((profile as { teacher_name?: string } | null)?.teacher_name);
  }, [staffRowExtras, profile]);

  const teacher: Teacher | null =
    role === 'teacher' && school_code
      ? {
          ...profile,
          id: effectiveStaffId,
          school_code,
          staff_id: profileStaffCode ?? (profile?.staff_id as string | undefined),
          full_name: resolvedTeacherName || undefined,
          role: 'teacher',
        }
      : null;

  useEffect(() => {
    if (!teacher?.id || !school_code) {
      setPermissionsLoading(false);
      setStaffMenuModules([]);
      setHasTeachingAssignments(false);
      return;
    }
    let cancelled = false;
    setPermissionsLoading(true);
    Promise.allSettled([
      rbacService.getStaffPermissionsByStaff(school_code, teacher.id).then((r) => r.data),
      teacherService
        .getClasses({
          school_code,
          teacher_id: teacher.id,
          staff_id: teacher.staff_id,
          array: true,
        })
        .then((r) => r.data),
      teacherService.getTeachingAssignments({ school_code, teacher_id: teacher.id }).then((r) => r.data),
      teacherService.getStaffMenu(teacher.id).then((r) => {
        const data = (r as { data?: { data?: StaffMenuModule[] } })?.data;
        const list = Array.isArray(data) ? data : (data as { data?: StaffMenuModule[] })?.data ?? [];
        return Array.isArray(list) ? list : [];
      }),
    ])
      .then(([permsResult, classesResult, teachingAssignResult, menuResult]) => {
        if (cancelled) return;
        const perms = new Set<string>();
        const menuModules =
          menuResult.status === 'fulfilled' && Array.isArray(menuResult.value) ? menuResult.value : [];

        const data =
          permsResult.status === 'fulfilled'
            ? (permsResult.value as {
                data?: { modules?: { name?: string; sub_modules?: { name?: string; view_access?: boolean; edit_access?: boolean }[] }[] };
                modules?: { name?: string; sub_modules?: { name?: string; view_access?: boolean; edit_access?: boolean }[] }[];
              })
            : null;
        const rbacModules = data?.data?.modules ?? data?.modules ?? [];

        // Prefer explicit RBAC permissions; if RBAC endpoint fails, derive from menu access.
        const modulesForPermissions =
          rbacModules.length > 0
            ? rbacModules
            : menuModules.map((m) => ({
                name: m.module_name,
                sub_modules: m.sub_modules.map((s) => ({
                  name: s.name,
                  view_access: !!s.has_view_access,
                  edit_access: !!s.has_edit_access,
                })),
              }));

        for (const mod of modulesForPermissions as { name?: string; sub_modules?: { name?: string; view_access?: boolean; edit_access?: boolean }[] }[]) {
          for (const sub of mod.sub_modules ?? []) {
            const keys = mapSubModuleToPermissions(sub.name ?? '');
            if (sub.view_access) {
              keys.filter((k) => k.startsWith('view_')).forEach((k) => perms.add(k));
              keys.filter((k) => !k.startsWith('view_') && !k.startsWith('manage_')).forEach((k) => perms.add(k));
            }
            if (sub.edit_access) {
              keys.filter((k) => k.startsWith('manage_')).forEach((k) => perms.add(k));
            }
          }
        }
        setPermissions(perms);
        const classesData = classesResult.status === 'fulfilled' ? classesResult.value : [];
        const list = Array.isArray(classesData)
          ? classesData
          : (classesData as { data?: unknown[] })?.data ?? (classesData as { classes?: unknown[] })?.classes ?? [];
        setIsClassTeacher(Array.isArray(list) && list.length > 0);
        const teachingAssignData = teachingAssignResult.status === 'fulfilled' ? teachingAssignResult.value : null;
        setHasTeachingAssignments(hasTeachingAssignmentsData(teachingAssignData));
        setStaffMenuModules(menuModules);
      })
      .catch(() => {
        if (!cancelled) {
          setPermissions(new Set());
          setIsClassTeacher(false);
          setHasTeachingAssignments(false);
          setStaffMenuModules([]);
        }
      })
      .finally(() => {
        if (!cancelled) setPermissionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [teacher?.id, teacher?.staff_id, school_code]);

  const path = useCallback(
    (suffix: string) => {
      const base = '/teacher/dashboard';
      if (!suffix || suffix === 'index' || suffix === '') return base;
      return `${base}/${suffix.replace(/^\//, '')}`;
    },
    []
  );

  const hasPermission = useCallback(
    (key: string) => permissions.has(key),
    [permissions]
  );

  const value: TeacherContextValue = {
    teacher,
    schoolCode: school_code ?? '',
    permissions,
    isClassTeacher,
    hasTeachingAssignments,
    staffMenuModules,
    permissionsLoading,
    path,
    hasPermission,
  };

  return <TeacherContext.Provider value={value}>{children}</TeacherContext.Provider>;
}
