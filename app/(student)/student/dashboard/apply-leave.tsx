/**
 * Student apply leave — matches student dashboard tokens (warm base, navy, teal hints).
 * Custom calendar date picker. Leave type is resolved automatically (first active school type).
 */

import { useStudent } from '@/lib/student-context';
import { useToastStore } from '@/lib/toast';
import { leaveService } from '@/services/leave.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import type { AlertButton } from 'react-native';
import {
  ActivityIndicator,
  Alert,
  InteractionManager,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

function leaveSubmitErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const d = error.response?.data;
    if (typeof d === 'string') return d;
    if (d && typeof d === 'object') {
      const o = d as Record<string, unknown>;
      if (typeof o.message === 'string') return o.message;
      if (typeof o.error === 'string') return o.error;
    }
    return error.message || 'Something went wrong. Please try again.';
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

function showLeaveAlert(title: string, message?: string, buttons?: AlertButton[]) {
  InteractionManager.runAfterInteractions(() => {
    Alert.alert(title, message ?? '', buttons);
  });
}

// ─── Tokens — student dashboard (warm base, navy, teal accents) ─────────────
const P = {
  pageBg:      '#FAF5FF',
  cardBg:      'rgba(255,255,255,0.92)',
  cardBorder:  'rgba(109, 40, 217, 0.18)',
  blue:        '#6D28D9',
  blueDeep:    '#5B21B6',
  blueSubtle:  '#EDE9FE',
  blueMid:     'rgba(236, 72, 153, 0.35)',
  textPrimary: '#312E81',
  textMid:     '#64748B',
  textDim:     '#64748B',
  inputBg:     '#ECEDED',
  green:       '#22C55E',
  shadow:      'rgba(0,0,0,0.08)',
};

// ─── Calendar helpers ─────────────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function firstDayOfMonth(y: number, m: number) { return new Date(y, m, 1).getDay(); }
function toDateString(y: number, m: number, d: number) {
  return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}
function parseDate(s: string) {
  const p = s.split('-');
  if (p.length !== 3) return null;
  const y = parseInt(p[0], 10), m = parseInt(p[1], 10) - 1, d = parseInt(p[2], 10);
  return isNaN(y)||isNaN(m)||isNaN(d) ? null : { y, m, d };
}

/** ISO yyyy-mm-dd → display dd-mm-yyyy */
function formatDisplayDate(iso: string) {
  const parsed = parseDate(iso);
  if (!parsed) return '';
  const { y, m, d } = parsed;
  return `${String(d).padStart(2,'0')}-${String(m + 1).padStart(2,'0')}-${y}`;
}

// ─── Calendar picker ──────────────────────────────────────────────────────────
function CalendarPicker({ value, onChange, onClose }: {
  value: string;
  onChange: (d: string) => void;
  onClose: () => void;
}) {
  const today  = new Date();
  const parsed = parseDate(value);
  const [viewY, setViewY] = useState(parsed?.y ?? today.getFullYear());
  const [viewM, setViewM] = useState(parsed?.m ?? today.getMonth());
  const [pickingYear, setPickingYear] = useState(false);

  const totalDays = daysInMonth(viewY, viewM);
  const firstDay  = firstDayOfMonth(viewY, viewM);
  const selectedD = parsed?.y === viewY && parsed?.m === viewM ? parsed.d : null;
  const todayD    = today.getFullYear()===viewY && today.getMonth()===viewM ? today.getDate() : null;
  const yearRange = Array.from({ length: 11 }, (_, i) => today.getFullYear() - 5 + i);

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, (): null => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  const prevMonth = () => viewM===0 ? (setViewM(11), setViewY(y=>y-1)) : setViewM(m=>m-1);
  const nextMonth = () => viewM===11 ? (setViewM(0), setViewY(y=>y+1)) : setViewM(m=>m+1);

  return (
    <View style={cal.wrap}>
      {/* Header */}
      <View style={cal.header}>
        <Pressable onPress={prevMonth} style={cal.navBtn}>
          <Text style={cal.navText}>‹</Text>
        </Pressable>
        <Pressable onPress={() => setPickingYear(p => !p)} style={cal.monthBtn}>
          <Text style={cal.monthText}>{MONTHS[viewM]} {viewY}</Text>
          <Text style={cal.chevron}>{pickingYear ? '▲' : '▼'}</Text>
        </Pressable>
        <Pressable onPress={nextMonth} style={cal.navBtn}>
          <Text style={cal.navText}>›</Text>
        </Pressable>
      </View>

      {/* Year picker */}
      {pickingYear && (
        <View style={cal.yearGrid}>
          {yearRange.map(y => (
            <Pressable key={y} onPress={() => { setViewY(y); setPickingYear(false); }}
              style={[cal.yearCell, y===viewY && cal.yearCellActive]}>
              <Text style={[cal.yearText, y===viewY && cal.yearTextActive]}>{y}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Day headers + grid */}
      {!pickingYear && (
        <>
          <View style={cal.dayHeaders}>
            {DAYS.map(d => <Text key={d} style={cal.dayHeader}>{d}</Text>)}
          </View>
          <View style={cal.grid}>
            {cells.map((day, idx) => {
              if (!day) return <View key={`e-${idx}`} style={cal.cell} />;
              const isSel   = day === selectedD;
              const isToday = day === todayD;
              return (
                <Pressable key={day}
                  onPress={() => { onChange(toDateString(viewY, viewM, day)); onClose(); }}
                  style={[cal.cell, isToday && cal.cellToday, isSel && cal.cellSelected]}>
                  <Text style={[cal.cellText, isToday && cal.cellTextToday, isSel && cal.cellTextSel]}>
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      <Pressable onPress={onClose} style={cal.closeBtn}>
        <Text style={cal.closeText}>Cancel</Text>
      </Pressable>
    </View>
  );
}

const cal = StyleSheet.create({
  wrap: {
    backgroundColor: P.cardBg,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: P.cardBorder,
    width: 308,
    ...Platform.select({
      ios: { shadowColor: P.shadow, shadowOffset:{width:0,height:8}, shadowOpacity:1, shadowRadius:24 },
      android: { elevation: 12 },
    }),
  },
  header:    { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:14 },
  navBtn:    { width:34, height:34, borderRadius:10, backgroundColor:P.blueSubtle, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:P.cardBorder },
  navText:   { color:P.blue, fontSize:22, fontWeight:'400', lineHeight:26 },
  monthBtn:  { flexDirection:'row', alignItems:'center', gap:5 },
  monthText: { color:P.textPrimary, fontSize:15, fontWeight:'700' },
  chevron:   { color:P.textDim, fontSize:10 },
  // Year
  yearGrid:      { flexDirection:'row', flexWrap:'wrap', gap:6, marginBottom:12 },
  yearCell:      { paddingHorizontal:10, paddingVertical:6, borderRadius:8, backgroundColor:P.blueSubtle, minWidth:54, alignItems:'center' },
  yearCellActive:{ backgroundColor:P.blue },
  yearText:      { color:P.textMid, fontSize:13, fontWeight:'500' },
  yearTextActive:{ color:'#fff', fontWeight:'700' },
  // Day headers
  dayHeaders: { flexDirection:'row', marginBottom:6 },
  dayHeader:  { flex:1, textAlign:'center', fontSize:11, fontWeight:'600', color:P.textDim, letterSpacing:0.4 },
  // Grid
  grid:            { flexDirection:'row', flexWrap:'wrap' },
  cell:            { width:`${100/7}%` as any, aspectRatio:1, alignItems:'center', justifyContent:'center', borderRadius:8 },
  cellToday:       { borderWidth:1.5, borderColor:P.blue },
  cellSelected:    { backgroundColor:P.blue },
  cellText:        { color:P.textMid, fontSize:13, fontWeight:'500' },
  cellTextToday:   { color:P.blue, fontWeight:'700' },
  cellTextSel:     { color:'#fff', fontWeight:'700' },
  // Close
  closeBtn:  { marginTop:14, paddingVertical:9, alignItems:'center', borderRadius:10, backgroundColor:P.blueSubtle },
  closeText: { color:P.textMid, fontSize:13, fontWeight:'600' },
});

// ─── Date field ───────────────────────────────────────────────────────────────
function DateField({ label, value, onChange }: { label:string; value:string; onChange:(v:string)=>void }) {
  const [open, setOpen] = useState(false);
  const shown = formatDisplayDate(value);
  return (
    <View style={df.wrap}>
      <Text style={df.label}>{label}</Text>
      <Pressable onPress={() => setOpen(true)}
        style={({ pressed }) => [df.btn, pressed && { borderColor: P.blue }]}>
        <Text style={[df.value, !shown && df.placeholder]}>{shown || 'dd-mm-yyyy'}</Text>
        <Text style={df.icon}>📅</Text>
      </Pressable>
      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={df.overlay} onPress={() => setOpen(false)}>
          <Pressable onPress={e => e.stopPropagation()}>
            <CalendarPicker value={value} onChange={onChange} onClose={() => setOpen(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const df = StyleSheet.create({
  wrap:  { flex:1 },
  label: { fontSize:11, fontWeight:'700', color:P.textMid, marginBottom:6, textTransform:'uppercase', letterSpacing:0.7 },
  btn:   {
    flexDirection:'row', alignItems:'center', justifyContent:'space-between',
    backgroundColor:P.inputBg, borderRadius:12, borderWidth:1.5,
    borderColor:P.cardBorder, paddingVertical:13, paddingHorizontal:14,
  },
  value:       { fontSize:14, fontWeight:'600', color:P.textPrimary },
  placeholder: { color:P.textDim, fontWeight:'400' },
  icon:        { fontSize:16 },
  overlay:     { flex:1, backgroundColor:'rgba(15,23,42,0.45)', alignItems:'center', justifyContent:'center' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function StudentApplyLeaveScreen() {
  const router      = useRouter();
  const { student, schoolCode } = useStudent();
  const studentId   = student?.id ?? '';
  const showToast   = useToastStore((s) => s.show);
  const queryClient = useQueryClient();

  const [startDate,   setStartDate]   = useState('');
  const [endDate,     setEndDate]     = useState('');
  const [reason,      setReason]      = useState('');

  const { data: typesData, isLoading: typesLoading, isSuccess: typesReady } = useQuery({
    queryKey: ['leave', 'types', schoolCode],
    queryFn:  () => leaveService.getLeaveTypes(schoolCode).then(r => r.data),
    enabled:  Boolean(schoolCode),
  });
  const leaveTypes = (typesData ?? []).filter((t: { is_active?: boolean }) => t.is_active !== false);

  const defaultLeaveType = useMemo(
    () => (leaveTypes[0] as { id?: string; name?: string } | undefined) ?? null,
    [leaveTypes],
  );

  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return Math.ceil(Math.abs(new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000) + 1;
  }, [startDate, endDate]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!schoolCode || !studentId || !defaultLeaveType?.id) {
        throw new Error('Unable to submit. Check your connection or contact the school.');
      }
      const response = await leaveService.postStudentLeaveRequest(
        schoolCode,
        {
          school_code: schoolCode,
          student_id: studentId,
          leave_type_id: defaultLeaveType.id,
          leave_title: defaultLeaveType.name ?? 'Leave',
          leave_start_date: startDate,
          leave_end_date: endDate,
          reason: reason.trim(),
        }
      );

      const status = response?.status ?? 0;
      if (!response || status < 200 || status >= 300) {
        throw new Error(response?.data?.message ?? response?.data?.error ?? 'Request failed');
      }

      return response;
    },
  });

  const handleSubmit = () => {
    void (async () => {
      if (!studentId) {
        showLeaveAlert('Session', 'Student profile is not loaded. Please sign in again.');
        return;
      }
      if (typesReady && leaveTypes.length === 0) {
        showLeaveAlert(
          'Not Available',
          'Leave requests are not set up for your school yet. Please contact the office.',
        );
        return;
      }
      if (!startDate || !endDate || !reason.trim()) {
        showLeaveAlert('Incomplete Form', 'Please fill all required fields before submitting.');
        return;
      }

      if (new Date(endDate) < new Date(startDate)) {
        showLeaveAlert('Invalid Dates', 'End date cannot be before start date.');
        return;
      }

      try {
        await mutation.mutateAsync();
        queryClient.invalidateQueries({
          queryKey: ['leave', 'student-requests', schoolCode, studentId],
        });
        showToast('Leave request sent successfully.', 'success');
        showLeaveAlert(
          'Request Sent',
          'Your leave request has been successfully sent.',
          [{ text: 'OK', onPress: () => router.back() }],
        );
      } catch (error: unknown) {
        const message = leaveSubmitErrorMessage(error);
        showToast(message, 'error');
        showLeaveAlert('Request Failed', message);
      }
    })();
  };

  const canSend =
    !!studentId &&
    !!startDate &&
    !!endDate &&
    !!reason.trim() &&
    !!defaultLeaveType?.id &&
    !typesLoading &&
    !mutation.isPending;

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS==='ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Header */}
        <View style={s.pageHeader}>
          <View style={s.titleBlock}>
            <Text style={s.pageTitle}>Apply for Leave</Text>
            <Text style={s.pageSubtitle}>Submit your leave request to the office</Text>
          </View>
        </View>

        <Pressable onPress={() => router.back()} style={s.backRow}>
          <Text style={s.backChevron}>‹</Text>
          <Text style={s.backLabel}>Back</Text>
        </Pressable>

        {typesReady && leaveTypes.length === 0 ? (
          <Text style={s.configWarning}>
            Leave requests are not available for your school yet. Please contact the office.
          </Text>
        ) : null}

        {/* Date pickers */}
        <View style={s.dateRow}>
          <DateField label="Start Date *" value={startDate} onChange={setStartDate} />
          <Text style={s.dateSep}> </Text>
          <DateField label="End Date *" value={endDate} onChange={setEndDate} />
        </View>

        {totalDays > 0 ? (
          <View style={s.durationBadge}>
            <View style={s.durationDot} />
            <Text style={s.durationText}>
              {totalDays} {totalDays===1?'day':'days'} selected
            </Text>
          </View>
        ) : null}

        {/* Reason */}
        <Text style={[s.sectionLabel, { marginTop: totalDays > 0 ? 20 : 24 }]}>Reason *</Text>
        <TextInput
          placeholder="Please provide a reason for your leave request..."
          placeholderTextColor={P.textDim}
          multiline
          value={reason}
          onChangeText={setReason}
          style={s.reasonInput}
        />

        {/* Actions */}
        <View style={s.actionsRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [s.cancelBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={s.cancelBtnText}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={handleSubmit}
            style={({ pressed }) => [
              s.sendBtn,
              !canSend && s.sendBtnDisabled,
              pressed && canSend && { opacity: 0.85 },
            ]}
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.sendBtnText}>Send Request</Text>
            )}
          </Pressable>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex:1, backgroundColor:P.pageBg },
  scroll: { padding:20, paddingTop:60, paddingBottom:60 },

  pageHeader:  { marginBottom:8 },
  titleBlock:  {},
  pageTitle:   { fontSize:22, fontWeight:'800', color:P.textPrimary, letterSpacing:-0.3 },
  pageSubtitle:{ fontSize:13, color:P.textMid, marginTop:4 },

  backRow: {
    flexDirection:'row',
    alignItems:'center',
    gap:4,
    alignSelf:'flex-start',
    marginBottom:20,
    paddingVertical:8,
    paddingRight:12,
  },
  backChevron: { color:P.blue, fontSize:22, fontWeight:'600', marginTop:-2 },
  backLabel:   { color:P.blue, fontSize:15, fontWeight:'700' },

  configWarning: {
    fontSize:13,
    color:'#B45309',
    backgroundColor:'#FEF3C7',
    borderRadius:12,
    padding:12,
    marginBottom:16,
    overflow:'hidden',
  },

  sectionLabel: {
    fontSize:11,
    fontWeight:'700',
    color:P.textMid,
    textTransform:'uppercase',
    letterSpacing:1,
    marginBottom:10,
  },

  dateRow:  { flexDirection:'row', alignItems:'flex-end', gap:10 },
  dateSep:  { width:8 },

  durationBadge: {
    flexDirection:'row',
    alignItems:'center',
    gap:8,
    marginTop:10,
    backgroundColor:P.blueSubtle,
    borderRadius:10,
    borderWidth:1,
    borderColor:P.cardBorder,
    paddingVertical:9,
    paddingHorizontal:14,
    alignSelf:'flex-start',
  },
  durationDot:  { width:6, height:6, borderRadius:3, backgroundColor:P.blue },
  durationText: { fontSize:13, color:P.blue, fontWeight:'600' },

  reasonInput: {
    backgroundColor:P.cardBg,
    borderRadius:16,
    borderWidth:1.5,
    borderColor:P.cardBorder,
    padding:16,
    minHeight:110,
    textAlignVertical:'top',
    color:P.textPrimary,
    fontSize:14,
    lineHeight:22,
    ...Platform.select({
      ios: { shadowColor:P.shadow, shadowOffset:{width:0,height:3}, shadowOpacity:1, shadowRadius:8 },
      android: { elevation:2 },
    }),
  },

  actionsRow: {
    flexDirection:'row',
    alignItems:'center',
    gap:12,
    marginTop:28,
  },
  cancelBtn: {
    flex:1,
    alignItems:'center',
    justifyContent:'center',
    paddingVertical:16,
    borderRadius:16,
    borderWidth:1.5,
    borderColor:P.cardBorder,
    backgroundColor:P.cardBg,
  },
  cancelBtnText: { fontSize:15, fontWeight:'700', color:P.textPrimary },
  sendBtn: {
    flex:1,
    alignItems:'center',
    justifyContent:'center',
    paddingVertical:16,
    borderRadius:16,
    backgroundColor:P.blue,
    ...Platform.select({
      ios: { shadowColor:P.blue, shadowOffset:{width:0,height:6}, shadowOpacity:0.35, shadowRadius:14 },
      android: { elevation:8 },
    }),
  },
  sendBtnDisabled: { backgroundColor:P.blueMid },
  sendBtnText: { color:'#fff', fontWeight:'800', fontSize:15, letterSpacing:0.2 },
});
