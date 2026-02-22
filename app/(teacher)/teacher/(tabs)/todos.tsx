import { AppCard, Button, DataList, SectionHeader } from '@/components/ui';
import { useSession } from '@/hooks/useSession';
import { useTheme } from '@/hooks/useTheme';
import { useToastStore } from '@/lib/toast';
import { teacherService } from '@/services/teacher.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type Todo = { id: string; title?: string; status?: string; due_date?: string };

export default function TeacherTodosScreen() {
  const { spacing, colors: c } = useTheme();
  const { school_code, user_id } = useSession();
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.show);
  const [newTitle, setNewTitle] = useState('');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['teacher', 'todos', school_code, user_id],
    queryFn: async () => {
      const res = await teacherService.getTodos({ school_code: school_code!, teacher_id: user_id!, status: 'pending,in_progress' });
      return res.data;
    },
    enabled: Boolean(school_code && user_id),
  });

  const createMutation = useMutation({
    mutationFn: (title: string) =>
      teacherService.createTodo({ school_code: school_code!, teacher_id: user_id!, title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'todos'] });
      setNewTitle('');
      showToast('Todo added', 'success');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      teacherService.updateTodo(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teacher', 'todos'] }),
  });

  const list = Array.isArray(data) ? data : [];

  return (
    <View style={styles.container}>
      <SectionHeader title="My todos" />
      <View style={[styles.addRow, { marginBottom: spacing[4] }]}>
        <TextInput
          style={[styles.input, { borderColor: c.border.default, color: c.text.primary }]}
          value={newTitle}
          onChangeText={setNewTitle}
          placeholder="New task..."
          placeholderTextColor={c.text.tertiary}
        />
        <Button
          title="Add"
          onPress={() => {
            if (newTitle.trim()) createMutation.mutate(newTitle.trim());
          }}
          loading={createMutation.isPending}
        />
      </View>
      <DataList<Todo>
        data={list}
        loading={isLoading}
        emptyTitle="No todos"
        onRefresh={() => refetch()}
        refreshing={isRefetching}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing[4] }}
        renderItem={({ item }) => (
          <AppCard style={{ marginBottom: spacing[3] }}>
            <View style={styles.todoRow}>
              <Text style={[styles.todoTitle, { color: c.text.primary }]} numberOfLines={1}>{item.title ?? ''}</Text>
              <Pressable
                onPress={() => updateMutation.mutate({ id: item.id, status: 'completed' })}
                style={[styles.doneBtn, { backgroundColor: c.success.main }]}
              >
                <Text style={[styles.doneBtnText, { color: c.text.inverse }]}>Done</Text>
              </Pressable>
            </View>
          </AppCard>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  addRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  input: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16 },
  todoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  todoTitle: { fontSize: 18, flex: 1 },
  doneBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  doneBtnText: { fontWeight: '600' },
});
