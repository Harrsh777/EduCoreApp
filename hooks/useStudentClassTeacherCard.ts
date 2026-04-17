/**
 * Class teacher + class labels for dashboard "My Class" card.
 * Mirrors app/(student)/student/dashboard/class.tsx: REST vs Supabase paths.
 */

import { env } from '@/lib/env';
import { useStudent } from '@/lib/student-context';
import { getClassByExactMatch, getStaffById, getStudentByAdmissionNo } from '@/services/school.service';
import { studentService } from '@/services/student.service';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

function toStr(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object' && typeof (v as { name?: string }).name === 'string') {
    return (v as { name: string }).name;
  }
  return '';
}

export type ClassTeacherCardData = {
  classLabel: string;
  sectionLabel: string;
  teacherName: string;
  teacherDesignation: string;
  isLoading: boolean;
};

export function useStudentClassTeacherCard(): ClassTeacherCardData {
  const { student, schoolCode } = useStudent();
  const studentId = student?.id ?? '';
  const clsFromProfile = toStr(student?.class);
  const sectionFromProfile = toStr(student?.section);
  const academicFromProfile = toStr(student?.academic_year);

  const needStudentFetch = Boolean(
    schoolCode &&
      (!clsFromProfile || !sectionFromProfile) &&
      (env.USE_SUPABASE_DASHBOARD ? !!student?.admission_no : !!studentId)
  );

  const { data: studentProfileRes, isLoading: loadingProfile } = useQuery({
    queryKey: [
      'student',
      'profile',
      'class-teacher-card',
      schoolCode,
      env.USE_SUPABASE_DASHBOARD ? student?.admission_no : studentId,
    ],
    queryFn: async () => {
      if (env.USE_SUPABASE_DASHBOARD && student?.admission_no) {
        const r = await getStudentByAdmissionNo(schoolCode, student.admission_no);
        const row = (r as { data?: Record<string, unknown> })?.data;
        return (typeof row === 'object' && row !== null ? row : {}) as Record<string, unknown>;
      }
      const r = await studentService.getById(studentId, schoolCode);
      const raw = r.data ?? r;
      const body = raw as Record<string, unknown>;
      const obj = body?.data ?? body?.student ?? body;
      return (typeof obj === 'object' && obj !== null ? obj : body) as Record<string, unknown>;
    },
    enabled: needStudentFetch,
  });

  const profileObj = studentProfileRes as Record<string, unknown> | undefined;
  const clsFromStudent =
    toStr(profileObj?.class) || toStr(profileObj?.class_name) || clsFromProfile;
  const sectionFromStudent =
    toStr(profileObj?.section) || toStr(profileObj?.section_name) || sectionFromProfile;
  const academicYearFromStudent =
    toStr(profileObj?.academic_year) || toStr(profileObj?.academic_year_name) || academicFromProfile;

  const useSupabaseClass = env.USE_SUPABASE_DASHBOARD && Boolean(schoolCode && clsFromStudent && sectionFromStudent);

  const { data: supabaseClassRow, isLoading: loadingSupabaseClass } = useQuery({
    queryKey: ['supabase', 'class', schoolCode, clsFromStudent, sectionFromStudent, academicYearFromStudent],
    queryFn: async () => {
      const r = await getClassByExactMatch(
        schoolCode,
        clsFromStudent,
        sectionFromStudent,
        academicYearFromStudent || ''
      );
      const row = (r as { data?: Record<string, unknown> | null })?.data;
      return (row ?? null) as Record<string, unknown> | null;
    },
    enabled: useSupabaseClass,
  });

  const classTeacherIdFromSupabase =
    supabaseClassRow?.class_teacher_id != null ? String(supabaseClassRow.class_teacher_id) : '';

  const { data: supabaseStaffRow, isLoading: loadingSupabaseStaff } = useQuery({
    queryKey: ['supabase', 'staff', schoolCode, classTeacherIdFromSupabase],
    queryFn: async () => {
      const r = await getStaffById(schoolCode, classTeacherIdFromSupabase);
      const row = (r as { data?: Record<string, unknown> | null })?.data;
      return (row ?? null) as Record<string, unknown> | null;
    },
    enabled: useSupabaseClass && !!classTeacherIdFromSupabase,
  });

  const { data: classTeacherRes, isLoading: loadingCT } = useQuery({
    queryKey: ['student', 'class-teacher', schoolCode, clsFromStudent, sectionFromStudent, academicYearFromStudent],
    queryFn: async () => {
      const r = await studentService.getClassTeacher({
        school_code: schoolCode,
        class: clsFromStudent,
        section: sectionFromStudent,
        academic_year: academicYearFromStudent,
      });
      return (r.data ?? r) as Record<string, unknown>;
    },
    enabled: !env.USE_SUPABASE_DASHBOARD && Boolean(schoolCode && clsFromStudent && sectionFromStudent),
  });

  return useMemo((): ClassTeacherCardData => {
    const body = classTeacherRes as Record<string, unknown> | undefined;
    const data = body?.data as Record<string, unknown> | undefined;
    const apiClass = useSupabaseClass
      ? supabaseClassRow ?? undefined
      : (data?.class as Record<string, unknown> | undefined);
    const cls = toStr(apiClass?.class) || clsFromStudent;
    const section = toStr(apiClass?.section) || sectionFromStudent;

    const rawTeacherFromApi = data?.class_teacher ?? body?.class_teacher;
    const classTeacherFromApi =
      rawTeacherFromApi && typeof rawTeacherFromApi === 'object'
        ? (rawTeacherFromApi as Record<string, unknown>)
        : null;
    const classTeacher = useSupabaseClass ? supabaseStaffRow ?? null : classTeacherFromApi;
    const teacherName = toStr(classTeacher?.full_name) || toStr(classTeacher?.name) || '';
    const teacherDesignation = toStr(classTeacher?.designation) || '';

    const isLoading =
      (needStudentFetch && loadingProfile) ||
      (useSupabaseClass &&
        (loadingSupabaseClass || (!!classTeacherIdFromSupabase && loadingSupabaseStaff))) ||
      (!useSupabaseClass && loadingCT && Boolean(schoolCode && clsFromStudent && sectionFromStudent));

    return {
      classLabel: cls || '—',
      sectionLabel: section || '—',
      teacherName: teacherName || '—',
      teacherDesignation: teacherDesignation || 'Teacher',
      isLoading,
    };
  }, [
    classTeacherRes,
    supabaseClassRow,
    supabaseStaffRow,
    clsFromStudent,
    sectionFromStudent,
    useSupabaseClass,
    classTeacherIdFromSupabase,
    needStudentFetch,
    loadingProfile,
    loadingSupabaseClass,
    loadingSupabaseStaff,
    loadingCT,
    schoolCode,
  ]);
}
