import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useSchool } from '@/hooks/useSchool';
import { AppCard, SectionHeader, Button, Input } from '@/components/ui';
import { schoolService } from '@/services/school.service';
import { useToastStore } from '@/lib/toast';

export default function StudentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { spacing, colors: c } = useTheme();
  const { school_code } = useSchool();
  const showToast = useToastStore((s) => s.show);

  const { data: student, isLoading, isError, error } = useQuery({
    queryKey: ['school', 'student', school_code, id],
    queryFn: async () => {
      if (!school_code || !id || id === 'new') throw new Error('Missing params');
      const res = await schoolService.getStudent(id, school_code);
      return res.data;
    },
    enabled: Boolean(school_code && id && id !== 'new'),
  });

  const [name, setName] = useState('');
  useEffect(() => {
    if (student) {
      const s = student as Record<string, unknown>;
      setName(String(s.name ?? ''));
      setAdmissionNo(String(s.admission_no ?? ''));
      setClassVal(String(s.class ?? ''));
      setSection(String(s.section ?? ''));
    }
  }, [student]);
  const [admissionNo, setAdmissionNo] = useState('');
  const [classVal, setClassVal] = useState('');
  const [section, setSection] = useState('');

  const updateMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      if (!school_code || !id) throw new Error('Missing params');
      return schoolService.updateStudent(id, school_code, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school', 'student', school_code, id] });
      queryClient.invalidateQueries({ queryKey: ['school', 'students'] });
      showToast('Saved', 'success');
    },
    onError: (err: Error) => showToast(err?.message ?? 'Failed to save', 'error'),
  });

  if (id === 'new' || !id) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing[4] }}>
        <SectionHeader title="New Student" />
        <Text style={[styles.placeholder, { color: c.text.secondary }]}>Add student form (POST /api/students)</Text>
      </ScrollView>
    );
  }

  if (isLoading && !student) return null;
  if (isError) {
    return (
      <View style={[styles.centered, { padding: spacing[6] }]}>
        <Text style={{ color: c.error.main }}>{error?.message ?? 'Failed to load'}</Text>
      </View>
    );
  }

  const s = (student ?? {}) as Record<string, unknown>;
  const currentName = name !== '' ? name : (s.name as string) ?? '';
  const currentAdmissionNo = admissionNo !== '' ? admissionNo : (s.admission_no as string) ?? '';
  const currentClass = classVal !== '' ? classVal : (s.class as string) ?? '';
  const currentSection = section !== '' ? section : (s.section as string) ?? '';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[8] }}>
      <SectionHeader title="Student" />
      <AppCard style={{ marginBottom: spacing[4] }}>
        <Input label="Name" value={currentName} onChangeText={setName} />
        <Input label="Admission No" value={currentAdmissionNo} onChangeText={setAdmissionNo} />
        <Input label="Class" value={currentClass} onChangeText={setClassVal} />
        <Input label="Section" value={currentSection} onChangeText={setSection} />
        <Button
          title="Save"
          onPress={() =>
            updateMutation.mutate({
              name: currentName,
              admission_no: currentAdmissionNo,
              class: currentClass,
              section: currentSection,
            })
          }
          loading={updateMutation.isPending}
        />
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center' },
  placeholder: { fontSize: 14 },
});
