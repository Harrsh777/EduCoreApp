/**
 * Teacher dashboard home: assigned class, daily agenda, attendance summary, exams, notices, notifications, My Tasks.
 * APIs: classes/teacher, grade-distribution, todos, daily-agenda, attendance/staff, examinations/v2/teacher,
 * communication/notices, calendar/notifications, staff-subjects, leave/student-requests (pending).
 */

import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeacher } from '@/lib/teacher-context';
import { teacherService } from '@/services/teacher.service';
import { communicationService } from '@/services/communication.service';
import { calendarService } from '@/services/calendar.service';
import { leaveService } from '@/services/leave.service';
import { SectionHeader, StatCard } from '@/components/ui';
import Ionicons from '@expo/vector-icons/Ionicons';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const TEACHER_GREEN = '#16A34A';

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return d;
  }
}

export default function TeacherDashboardHomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { teacher, schoolCode, path } = useTeacher();
  const [newTodoTitle, setNewTodoTitle] = useState('');

  const teacherId = teacher?.id ?? '';
  const staffId = teacher?.staff_id ?? teacherId;

  const { data: classesData, refetch: refetchClasses, isRefetching: refetchingClasses } = useQuery({
    queryKey: ['teacher', 'classes', schoolCode, teacherId],
    queryFn: () => teacherService.getClasses({ school_code: schoolCode, teacher_id: teacherId }).then((r) => r.data),
    enabled: Boolean(schoolCode && teacherId),
  });
  const { data: todosData, refetch: refetchTodos, isRefetching: refetchingTodos } = useQuery({
    queryKey: ['teacher', 'todos', schoolCode, teacherId],
    queryFn: () =>
      teacherService.getTodos({ school_code: schoolCode, teacher_id: teacherId, status: 'pending,in_progress' }).then((r) => r.data),
    enabled: Boolean(schoolCode && teacherId),
  });
  const { data: agendaData } = useQuery({
    queryKey: ['teacher', 'daily-agenda', schoolCode, teacherId],
    queryFn: () => teacherService.getDailyAgenda({ school_code: schoolCode, teacher_id: teacherId }).then((r) => r.data),
    enabled: Boolean(schoolCode && teacherId),
  });
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);
  const { data: staffAttData } = useQuery({
    queryKey: ['teacher', 'attendance', schoolCode, staffId, startOfMonth.toISOString().slice(0, 10), endOfMonth.toISOString().slice(0, 10)],
    queryFn: () =>
      teacherService
        .getAttendance({
          school_code: schoolCode,
          teacher_id: teacherId,
          staff_id: staffId,
          start_date: startOfMonth.toISOString().slice(0, 10),
          end_date: endOfMonth.toISOString().slice(0, 10),
        })
        .then((r) => r.data),
    enabled: Boolean(schoolCode && teacherId),
  });
  const { data: examsData } = useQuery({
    queryKey: ['teacher', 'exams', schoolCode, teacherId],
    queryFn: () => teacherService.getExams({ school_code: schoolCode, teacher_id: teacherId }).then((r) => r.data),
    enabled: Boolean(schoolCode && teacherId),
  });
  const { data: noticesData } = useQuery({
    queryKey: ['communication', 'notices', schoolCode, 5],
    queryFn: () =>
      communicationService
        .getNotices(schoolCode, { status: 'Active', category: 'all', priority: 'all', limit: 5 })
        .then((r) => r.data),
    enabled: Boolean(schoolCode),
  });
  const { data: notifData } = useQuery({
    queryKey: ['calendar', 'notifications', schoolCode, teacherId],
    queryFn: () =>
      calendarService
        .getCalendarNotifications(schoolCode, { user_type: 'teacher', user_id: teacherId, unread_only: true })
        .then((r) => r.data),
    enabled: Boolean(schoolCode && teacherId),
  });
  const { data: studentLeaveData } = useQuery({
    queryKey: ['leave', 'student-requests', schoolCode, staffId],
    queryFn: () => leaveService.getStudentLeaveRequestsClassTeacher(schoolCode, staffId).then((r) => r.data),
    enabled: Boolean(schoolCode && staffId),
  });

  const createTodoMutation = useMutation({
    mutationFn: (title: string) =>
      teacherService.createTodo({ school_code: schoolCode, teacher_id: teacherId, title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'todos', schoolCode, teacherId] });
      setNewTodoTitle('');
    },
  });
  const updateTodoMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      teacherService.updateTodo(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'todos', schoolCode, teacherId] });
    },
  });
  const deleteTodoMutation = useMutation({
    mutationFn: (id: string) => teacherService.deleteTodo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'todos', schoolCode, teacherId] });
    },
  });

  const refetch = useCallback(() => {
    refetchClasses();
    refetchTodos();
  }, [refetchClasses, refetchTodos]);

  const classes = Array.isArray(classesData) ? classesData : (classesData as { data?: unknown[] })?.data ?? [];
  const todos = Array.isArray(todosData) ? todosData : (todosData as { data?: unknown[] })?.data ?? [];
  const agenda = (agendaData ?? []) as Array<{ date?: string; slots?: Array<{ subject?: string; class_name?: string; start_time?: string; end_time?: string }> }>;
  const staffAttList = Array.isArray(staffAttData) ? staffAttData : (staffAttData as { data?: unknown[] })?.data ?? [];
  const exams = Array.isArray(examsData) ? examsData : (examsData as { data?: unknown[] })?.data ?? [];
  const notices = Array.isArray(noticesData) ? noticesData : (noticesData as { data?: unknown[] })?.data ?? [];
  const notifs = Array.isArray(notifData) ? notifData : (notifData as { data?: unknown[] })?.data ?? [];
  const studentLeaves = Array.isArray(studentLeaveData) ? studentLeaveData : (studentLeaveData as { data?: unknown[] })?.data ?? [];
  const pendingLeaves = studentLeaves.filter((r: { status?: string }) => r.status === 'pending');

  const handleAddTodo = () => {
    const title = newTodoTitle.trim();
    if (!title) return;
    createTodoMutation.mutate(title);
  };

  const handleCompleteTodo = (id: string) => {
    updateTodoMutation.mutate({ id, status: 'completed' });
  };

  const handleDeleteTodo = (id: string) => {
    Alert.alert('Delete task', 'Remove this task?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTodoMutation.mutate(id) },
    ]);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refetchingClasses || refetchingTodos}
          onRefresh={refetch}
          tintColor={TEACHER_GREEN}
        />
      }
    >
      <SectionHeader title={`Welcome, ${teacher?.full_name ?? 'Teacher'}`} />

      <View style={styles.grid}>
        <Pressable style={styles.cardWrap} onPress={() => router.push(path('my-class') as never)}>
          <StatCard label="My classes" value={classes.length} variant="primary" />
        </Pressable>
        <View style={styles.cardWrap}>
          <StatCard label="Pending todos" value={todos.length} variant="warning" />
        </View>
      </View>

      {staffAttList.length > 0 && (
        <>
          <SectionHeader title="Attendance (this month)" />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>
              Marked days: {staffAttList.filter((a: { status?: string }) => a.status === 'present').length} / {staffAttList.length}
            </Text>
          </View>
        </>
      )}

      {agenda.length > 0 && (
        <>
          <SectionHeader title="Daily agenda" />
          <View style={styles.agendaList}>
            {agenda.slice(0, 5).map((day: { date?: string; slots?: Array<{ subject?: string; class_name?: string; start_time?: string }> }, i: number) => (
              <View key={i} style={styles.agendaCard}>
                <Text style={styles.agendaDate}>{day.date ? formatDate(day.date) : 'Today'}</Text>
                {(day.slots ?? []).slice(0, 3).map((slot: { subject?: string; class_name?: string; start_time?: string }, j: number) => (
                  <Text key={j} style={styles.agendaSlot}>
                    {slot.start_time ?? ''} {slot.subject ?? ''} ({slot.class_name ?? ''})
                  </Text>
                ))}
              </View>
            ))}
          </View>
        </>
      )}

      {exams.length > 0 && (
        <>
          <SectionHeader title="Upcoming exams" />
          <View style={styles.linkList}>
            {exams.slice(0, 3).map((exam: { id?: string; name?: string; exam_date?: string }, i: number) => (
              <Pressable
                key={exam.id ?? i}
                style={styles.linkCard}
                onPress={() => router.push(path('examinations') as never)}
              >
                <Text style={styles.linkText} numberOfLines={1}>{exam.name ?? 'Exam'}</Text>
                <Text style={styles.linkMeta}>{exam.exam_date ? formatDate(exam.exam_date) : ''}</Text>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {notices.length > 0 && (
        <>
          <SectionHeader title="Notices" />
          <View style={styles.linkList}>
            {notices.slice(0, 3).map((n: { id?: string; title?: string }, i: number) => (
              <Pressable
                key={n.id ?? i}
                style={styles.linkCard}
                onPress={() => router.push(path('communication') as never)}
              >
                <Text style={styles.linkText} numberOfLines={1}>{n.title ?? 'Notice'}</Text>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {notifs.length > 0 && (
        <>
          <SectionHeader title="Notifications" />
          <View style={styles.linkList}>
            {notifs.slice(0, 3).map((n: { id?: string; title?: string }, i: number) => (
              <Pressable
                key={n.id ?? i}
                style={styles.linkCard}
                onPress={() => router.push(path('calendar') as never)}
              >
                <Text style={styles.linkText} numberOfLines={1}>{n.title ?? 'Event'}</Text>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {pendingLeaves.length > 0 && (
        <>
          <SectionHeader title="Student leave requests" />
          <Pressable style={styles.linkCard} onPress={() => router.push(path('student-leave-approvals') as never)}>
            <Text style={styles.linkText}>{pendingLeaves.length} pending approval</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </>
      )}

      <SectionHeader title="My Tasks" />
      <View style={styles.addTodoRow}>
        <TextInput
          style={styles.todoInput}
          placeholder="New task..."
          value={newTodoTitle}
          onChangeText={setNewTodoTitle}
          onSubmitEditing={handleAddTodo}
          returnKeyType="done"
        />
        <Pressable
          style={[styles.addTodoBtn, { backgroundColor: TEACHER_GREEN }]}
          onPress={handleAddTodo}
          disabled={!newTodoTitle.trim() || createTodoMutation.isPending}
        >
          {createTodoMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="add" size={24} color="#fff" />
          )}
        </Pressable>
      </View>
      <View style={styles.todoList}>
        {todos.map((t: { id?: string; title?: string; status?: string }) => (
          <View key={t.id} style={styles.todoRow}>
            <Pressable
              style={styles.todoCheck}
              onPress={() => t.id && handleCompleteTodo(t.id)}
            >
              <Ionicons
                name={t.status === 'completed' ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={t.status === 'completed' ? TEACHER_GREEN : '#9CA3AF'}
              />
            </Pressable>
            <Text style={[styles.todoTitle, t.status === 'completed' && styles.todoTitleDone]} numberOfLines={1}>
              {t.title ?? ''}
            </Text>
            <Pressable style={styles.todoDelete} onPress={() => t.id && handleDeleteTodo(t.id)}>
              <Ionicons name="trash-outline" size={20} color="#B91C1C" />
            </Pressable>
          </View>
        ))}
      </View>

      <SectionHeader title="Quick actions" />
      <Pressable style={styles.linkCard} onPress={() => router.push(path('attendance') as never)}>
        <Text style={styles.linkText}>Mark Attendance</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
      <Pressable style={styles.linkCard} onPress={() => router.push(path('marks') as never)}>
        <Text style={styles.linkText}>Marks Entry</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
      <Pressable style={styles.linkCard} onPress={() => router.push(path('homework') as never)}>
        <Text style={styles.linkText}>Digital Diary</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0FDF4' },
  content: { padding: spacing[4], paddingBottom: spacing[12] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[4], marginBottom: spacing[4] },
  cardWrap: { width: '47%', minWidth: 120 },
  summaryRow: { marginBottom: spacing[4] },
  summaryText: { ...textStyles.bodySm, color: '#6B7280' },
  agendaList: { marginBottom: spacing[4] },
  agendaCard: {
    backgroundColor: '#fff',
    padding: spacing[3],
    borderRadius: 12,
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  agendaDate: { ...textStyles.body, fontWeight: '600', color: '#111827', marginBottom: spacing[1] },
  agendaSlot: { ...textStyles.bodySm, color: '#6B7280', marginLeft: spacing[2] },
  linkList: { marginBottom: spacing[4] },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: spacing[4],
    borderRadius: 12,
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  linkText: { ...textStyles.body, color: '#111827', fontWeight: '500', flex: 1 },
  linkMeta: { ...textStyles.caption, color: '#6B7280', marginRight: spacing[2] },
  chevron: { fontSize: 20, color: '#9CA3AF' },
  addTodoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[4] },
  todoInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    ...textStyles.body,
  },
  addTodoBtn: { padding: spacing[2], borderRadius: 8, minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  todoList: { marginBottom: spacing[4] },
  todoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing[2], paddingHorizontal: spacing[2], gap: spacing[2] },
  todoCheck: { padding: spacing[1] },
  todoTitle: { ...textStyles.body, color: '#111827', flex: 1 },
  todoTitleDone: { textDecorationLine: 'line-through', color: '#9CA3AF' },
  todoDelete: { padding: spacing[1] },
});
