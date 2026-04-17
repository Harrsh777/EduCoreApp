/**
 * Student apply leave — matches student dashboard tokens (warm base, navy, teal hints).
 * Custom calendar date picker.
 */

import { useStudent } from '@/lib/student-context';
import { useToastStore } from '@/lib/toast';
import { leaveService } from '@/services/leave.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  const y = parseInt(p[0]), m = parseInt(p[1])-1, d = parseInt(p[2]);
  return isNaN(y)||isNaN(m)||isNaN(d) ? null : { y, m, d };
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
  return (
    <View style={df.wrap}>
      <Text style={df.label}>{label}</Text>
      <Pressable onPress={() => setOpen(true)}
        style={({ pressed }) => [df.btn, pressed && { borderColor: P.blue }]}>
        <Text style={[df.value, !value && df.placeholder]}>{value || 'Select date'}</Text>
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
  const handleSubmit = () => {
    if (!leaveTypeId || !startDate || !endDate || !reason) {
      Alert.alert("Incomplete Form", "Please fill all fields before submitting.");
      return;
    }
  
    if (new Date(endDate) < new Date(startDate)) {
      Alert.alert("Invalid Dates", "End date cannot be before start date.");
      return;
    }
  
    if (selectedType?.max_days && totalDays > selectedType.max_days) {
      Alert.alert(
        "Limit Exceeded",
        `Maximum ${selectedType.max_days} days allowed for this leave type.`
      );
      return;
    }
  
    mutation.mutate();
  };
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate,   setStartDate]   = useState('');
  const [endDate,     setEndDate]     = useState('');
  const [reason,      setReason]      = useState('');

  const { data: typesData, isLoading } = useQuery({
    queryKey: ['leave', 'types', schoolCode],
    queryFn:  () => leaveService.getLeaveTypes(schoolCode).then(r => r.data),
    enabled:  Boolean(schoolCode),
  });
  const leaveTypes = (typesData ?? []).filter((t: any) => t.is_active);

  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return Math.ceil(Math.abs(new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000) + 1;
  }, [startDate, endDate]);

  const selectedType = leaveTypes.find((t: any) => t.id === leaveTypeId);

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await leaveService.postStudentLeaveRequest(
        schoolCode,
        {
          school_code: schoolCode,
          student_id: studentId,
          leave_type_id: leaveTypeId,
          leave_title: selectedType?.name,
          leave_start_date: startDate,
          leave_end_date: endDate,
          reason,
        }
      );

      const status = response?.status ?? 0;
      if (!response || status < 200 || status >= 300) {
        throw new Error(response?.data?.message ?? response?.data?.error ?? 'Request failed');
      }

      return response;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['leave', 'student-requests', schoolCode, studentId],
      });
      showToast('Leave request sent successfully.', 'success');
      Alert.alert(
        'Request Sent ✅',
        'Your leave request has been successfully sent.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    },

    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string; error?: string } }; message?: string };
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Something went wrong. Please try again.';
      showToast(message, 'error');
      Alert.alert('Request Failed ❌', message);
    },
  });


  const canSubmit = !!(leaveTypeId && startDate && endDate && reason) && !mutation.isPending;

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS==='ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Header */}
        <View style={s.pageHeader}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backIcon}>‹</Text>
          </Pressable>
          <View>
            <Text style={s.pageTitle}>Apply for Leave</Text>
            <Text style={s.pageSubtitle}>Fill in all details below</Text>
          </View>
        </View>

        {/* Leave type */}
        <Text style={s.sectionLabel}>Leave Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.typeScroll}>
          {isLoading ? (
            <ActivityIndicator color={P.blue} style={{ marginLeft:8 }} />
          ) : leaveTypes.map((type: any) => {
            const active = leaveTypeId === type.id;
            return (
              <Pressable key={type.id} onPress={() => setLeaveTypeId(type.id)}
                style={[s.typeCard, active && s.typeCardActive]}>
                <View style={[s.typeDot, active && s.typeDotActive]} />
                <Text style={[s.typeName, active && s.typeNameActive]}>{type.name}</Text>
                {type.max_days ? <Text style={s.typeMax}>Max {type.max_days}d</Text> : null}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Date pickers */}
        <Text style={s.sectionLabel}>Date Range</Text>
        <View style={s.dateRow}>
          <DateField label="Start Date" value={startDate} onChange={setStartDate} />
          <Text style={s.dateSep}>→</Text>
          <DateField label="End Date" value={endDate} onChange={setEndDate} />
        </View>

        {/* Duration badge */}
        {totalDays > 0 && (
          <View style={s.durationBadge}>
            <View style={s.durationDot} />
            <Text style={s.durationText}>
              {totalDays} {totalDays===1?'day':'days'} selected
              {selectedType?.max_days ? `  ·  Max ${selectedType.max_days} days` : ''}
            </Text>
          </View>
        )}

        {/* Reason */}
        <Text style={s.sectionLabel}>Reason</Text>
        <TextInput
          placeholder="Briefly explain your reason…"
          placeholderTextColor={P.textDim}
          multiline
          value={reason}
          onChangeText={setReason}
          style={s.reasonInput}
        />

        {/* Submit — always pressable so validation/success/error feedback always runs */}
        <Pressable onPress={handleSubmit}
          style={({ pressed }) => [s.submitBtn, !canSubmit && s.submitBtnDisabled, pressed && canSubmit && { opacity: 0.85 }]}>
          {mutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={s.submitText}>Submit Request</Text>
              <Text style={s.submitArrow}>→</Text>
            </>
          )}
        </Pressable>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex:1, backgroundColor:P.pageBg },
  scroll: { padding:20, paddingTop:60, paddingBottom:60 },

  // Header
  pageHeader:  { flexDirection:'row', alignItems:'center', gap:14, marginBottom:32 },
  backBtn: {
    width:42, height:42, borderRadius:13,
    backgroundColor:P.cardBg, borderWidth:1.5, borderColor:P.cardBorder,
    alignItems:'center', justifyContent:'center',
    ...Platform.select({
      ios: { shadowColor:P.shadow, shadowOffset:{width:0,height:4}, shadowOpacity:1, shadowRadius:10 },
      android: { elevation:4 },
    }),
  },
  backIcon:    { color:P.blue, fontSize:24, fontWeight:'400', lineHeight:28 },
  pageTitle:   { fontSize:22, fontWeight:'800', color:P.textPrimary, letterSpacing:-0.3 },
  pageSubtitle:{ fontSize:13, color:P.textMid, marginTop:2 },

  // Section label
  sectionLabel: {
    fontSize:11, fontWeight:'700', color:P.textMid,
    textTransform:'uppercase', letterSpacing:1, marginBottom:10, marginTop:24,
  },

  // Leave type cards
  typeScroll: { marginBottom:4 },
  typeCard: {
    backgroundColor:P.cardBg, borderRadius:14, borderWidth:1.5,
    borderColor:P.cardBorder, paddingVertical:14, paddingHorizontal:16,
    marginRight:10, minWidth:110, gap:6,
    ...Platform.select({
      ios: { shadowColor:P.shadow, shadowOffset:{width:0,height:3}, shadowOpacity:1, shadowRadius:8 },
      android: { elevation:2 },
    }),
  },
  typeCardActive: { borderColor:P.blue, backgroundColor:P.blueSubtle },
  typeDot:        { width:8, height:8, borderRadius:4, backgroundColor:P.blueMid },
  typeDotActive:  { backgroundColor:P.blue },
  typeName:       { fontSize:14, fontWeight:'700', color:P.textMid },
  typeNameActive: { color:P.textPrimary },
  typeMax:        { fontSize:11, color:P.textDim, fontWeight:'500' },

  // Date row
  dateRow:  { flexDirection:'row', alignItems:'flex-end', gap:8 },
  dateSep:  { color:P.textDim, fontSize:18, fontWeight:'300', paddingBottom:13 },

  // Duration badge
  durationBadge: {
    flexDirection:'row', alignItems:'center', gap:8, marginTop:10,
    backgroundColor:P.blueSubtle, borderRadius:10, borderWidth:1,
    borderColor:P.cardBorder, paddingVertical:9, paddingHorizontal:14, alignSelf:'flex-start',
  },
  durationDot:  { width:6, height:6, borderRadius:3, backgroundColor:P.blue },
  durationText: { fontSize:13, color:P.blue, fontWeight:'600' },

  // Reason
  reasonInput: {
    backgroundColor:P.cardBg, borderRadius:16, borderWidth:1.5,
    borderColor:P.cardBorder, padding:16, minHeight:110,
    textAlignVertical:'top', color:P.textPrimary, fontSize:14, lineHeight:22,
    ...Platform.select({
      ios: { shadowColor:P.shadow, shadowOffset:{width:0,height:3}, shadowOpacity:1, shadowRadius:8 },
      android: { elevation:2 },
    }),
  },

  // Submit
  submitBtn: {
    flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8,
    backgroundColor:P.blue, borderRadius:18, paddingVertical:18, marginTop:32,
    ...Platform.select({
      ios: { shadowColor:P.blue, shadowOffset:{width:0,height:6}, shadowOpacity:0.35, shadowRadius:14 },
      android: { elevation:8 },
    }),
  },
  submitBtnDisabled: { backgroundColor:P.blueMid },
  submitText:  { color:'#fff', fontWeight:'800', fontSize:16, letterSpacing:0.2 },
  submitArrow: { color:'#fff', fontSize:18, fontWeight:'300' },
});