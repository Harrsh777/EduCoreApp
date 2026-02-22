/**
 * Request a Demo – 3-step flow: date → time → details.
 * Same functionality as the website; data stored in Supabase demo_requests table.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { demoService } from '@/services/demo.service';
import { FloatingLabelInput } from '@/components/ui/FloatingLabelInput';
import { areaPalettes } from '@/theme/areaPalettes';
import { spacing, radii } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const palette = areaPalettes.landing;

const TIME_SLOTS = Array.from({ length: 18 }, (_, i) => {
  const totalMinutes = 9 * 60 + i * 30;
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${hour.toString().padStart(2, '0')}:${minute === 0 ? '00' : minute}`;
});

function getNextDays(): Date[] {
  return Array.from({ length: 9 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
}

function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
}

function formatPhone(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  submit?: string;
}

const inputTheme = {
  labelColor: palette.textSecondary,
  inputColor: palette.textPrimary,
  placeholderColor: palette.textSecondary,
  borderColor: palette.border ?? '#E5E7EB',
  focusColor: palette.primary,
  backgroundColor: palette.cardBg ?? palette.background,
};

export default function RequestDemoScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [touched, setTouched] = useState({ name: false, phone: false, email: false });
  const [bookedSlots, setBookedSlots] = useState<Array<{ demo_date: string; demo_time: string }>>([]);

  useEffect(() => {
    demoService
      .getBookedSlots()
      .then(setBookedSlots)
      .catch(() => setBookedSlots([]));
  }, []);

  const bookedSetForDate = useMemo(() => {
    if (!date) return new Set<string>();
    const dateStr = date.toISOString().split('T')[0];
    return new Set(
      bookedSlots
        .filter((s) => String(s.demo_date).split('T')[0] === dateStr)
        .map((s) => s.demo_time.trim())
    );
  }, [date, bookedSlots]);

  const validateStep3 = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    else if (form.name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!validateEmail(form.email)) newErrors.email = 'Please enter a valid email address';
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!validatePhone(form.phone)) newErrors.phone = 'Please enter a valid phone number (10-15 digits)';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form.name, form.email, form.phone]);

  const handleInputChange = useCallback(
    (field: 'name' | 'phone' | 'email', value: string) => {
      if (field === 'phone') setForm((f) => ({ ...f, [field]: formatPhone(value) }));
      else setForm((f) => ({ ...f, [field]: value }));
      if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
    },
    [errors]
  );

  const handleBlur = useCallback((field: 'name' | 'phone' | 'email') => {
    setTouched((t) => ({ ...t, [field]: true }));
  }, []);

  const submitDemo = useCallback(async () => {
    if (!date || !validateStep3()) return;
    setLoading(true);
    setErrors((e) => ({ ...e, submit: undefined }));
    const demoDate = date.toISOString().split('T')[0];
    const result = await demoService.submitDemoRequest({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      demo_date: demoDate,
      demo_time: time,
    });
    setLoading(false);
    if (result.ok) setSuccess(true);
    else setErrors((e) => ({ ...e, submit: result.error }));
  }, [date, time, form, validateStep3]);

  const goToStep = useCallback(
    (newStep: number) => {
      if (newStep === 2 && !date) return;
      if (newStep === 3 && !time) return;
      setStep(newStep);
    },
    [date, time]
  );

  // ——— Success screen ———
  if (success) {
    return (
      <LinearGradient
        colors={['#F5F3FF', '#FAF5FF', '#FDF4FF']}
        style={styles.successRoot}
      >
        <ScrollView contentContainerStyle={styles.successScroll} keyboardShouldPersistTaps="handled">
          <View style={styles.successCard}>
            <View style={styles.successIconWrap}>
              <Ionicons name="checkmark-circle" size={48} color="#fff" />
            </View>
            <Text style={styles.successTitle}>Demo Scheduled!</Text>
            <Text style={styles.successSubtitle}>
              An <Text style={styles.successBold}>EduCore Executive</Text> will contact you shortly to confirm your demo.
            </Text>
            <View style={styles.successSummary}>
              <View style={styles.successRow}>
                <Ionicons name="calendar-outline" size={20} color={palette.primary} />
                <Text style={styles.successSummaryText}>
                  {date?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
              <View style={styles.successRow}>
                <Ionicons name="time-outline" size={20} color={palette.primary} />
                <Text style={styles.successSummaryText}>{time}</Text>
              </View>
            </View>
            <Text style={styles.successNote}>✓ Confirmation email sent to {form.email}</Text>
            <Text style={styles.successNote}>✓ Calendar invite will be sent shortly</Text>
            <Pressable style={styles.successBackBtn} onPress={() => router.back()}>
              <Text style={styles.successBackText}>Back to Home</Text>
            </Pressable>
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  // ——— Main 3-step flow ———
  return (
    <LinearGradient colors={['#F5F3FF', '#FAF5FF', '#FDF4FF']} style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <View style={styles.card}>
          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Request a Demo</Text>
              <Text style={styles.subtitle}>Schedule a personalized walkthrough with our experts</Text>
              <View style={styles.stepIndicator}>
                {[1, 2, 3].map((s) => (
                  <View key={s} style={styles.stepRow}>
                    <View
                      style={[
                        styles.stepDot,
                        s === step && styles.stepDotActive,
                        s < step && styles.stepDotDone,
                      ]}
                    >
                      <Text style={[styles.stepDotText, s === step && styles.stepDotTextActive, s < step && styles.stepDotTextDone]}>
                        {s < step ? '✓' : s}
                      </Text>
                    </View>
                    {s < 3 && <View style={[styles.stepLine, s < step && styles.stepLineDone]} />}
                  </View>
                ))}
              </View>
            </View>

            {/* Step 1 – Date */}
            {step === 1 && (
              <View style={styles.stepContent}>
                <View style={styles.stepLabelRow}>
                  <Ionicons name="calendar-outline" size={20} color={palette.primary} />
                  <Text style={styles.stepLabel}>Select a date</Text>
                </View>
                <View style={styles.dateGrid}>
                  {getNextDays().map((d) => {
                    const isSelected = date?.toDateString() === d.toDateString();
                    const isToday = d.toDateString() === new Date().toDateString();
                    return (
                      <Pressable
                        key={d.toDateString()}
                        onPress={() => setDate(new Date(d))}
                        style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                      >
                        <Text style={[styles.dateWeekday, isSelected && styles.dateCardTextLight]}>
                          {d.toLocaleDateString('en-US', { weekday: 'short' })}
                        </Text>
                        <Text style={[styles.dateDay, isSelected && styles.dateCardTextLight]}>{d.getDate()}</Text>
                        <Text style={[styles.dateMonth, isSelected && styles.dateCardTextLight]}>
                          {d.toLocaleDateString('en-US', { month: 'short' })}
                        </Text>
                        {isToday && !isSelected && <Text style={styles.dateToday}>Today</Text>}
                      </Pressable>
                    );
                  })}
                </View>
                <Pressable
                  style={[styles.primaryBtn, !date && styles.primaryBtnDisabled]}
                  onPress={() => goToStep(2)}
                  disabled={!date}
                >
                  <Text style={styles.primaryBtnText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </Pressable>
              </View>
            )}

            {/* Step 2 – Time */}
            {step === 2 && (
              <View style={styles.stepContent}>
                <View style={styles.stepHeaderRow}>
                  <View style={styles.stepLabelRow}>
                    <Ionicons name="time-outline" size={20} color={palette.primary} />
                    <Text style={styles.stepLabel}>Select a time slot</Text>
                  </View>
                  <Pressable onPress={() => goToStep(1)} style={styles.backLink}>
                    <Ionicons name="arrow-back" size={16} color={palette.primary} />
                    <Text style={styles.backLinkText}>Back</Text>
                  </Pressable>
                </View>
                <View style={styles.dateSummary}>
                  <Text style={styles.dateSummaryText}>
                    📅 {date?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>
                <View style={styles.timeGrid}>
                  {TIME_SLOTS.map((slot) => {
                    const isBooked = bookedSetForDate.has(slot);
                    return (
                      <Pressable
                        key={slot}
                        onPress={() => !isBooked && setTime(slot)}
                        disabled={isBooked}
                        style={[
                          styles.timeSlot,
                          isBooked && styles.timeSlotBooked,
                          time === slot && !isBooked && styles.timeSlotSelected,
                        ]}
                      >
                        <Text style={[styles.timeSlotText, isBooked && styles.timeSlotTextBooked, time === slot && !isBooked && styles.timeSlotTextSelected]}>
                          {slot}
                        </Text>
                        {isBooked && <Text style={styles.timeSlotBookedLabel}>Booked</Text>}
                      </Pressable>
                    );
                  })}
                </View>
                <View style={styles.btnRow}>
                  <Pressable style={styles.outlineBtn} onPress={() => goToStep(1)}>
                    <Text style={styles.outlineBtnText}>Back</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.primaryBtn, styles.primaryBtnFlex, !time && styles.primaryBtnDisabled]}
                    onPress={() => goToStep(3)}
                    disabled={!time}
                  >
                    <Text style={styles.primaryBtnText}>Continue</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </Pressable>
                </View>
              </View>
            )}

            {/* Step 3 – Details */}
            {step === 3 && (
              <View style={styles.stepContent}>
                <View style={styles.stepHeaderRow}>
                  <View style={styles.stepLabelRow}>
                    <Ionicons name="person-outline" size={20} color={palette.primary} />
                    <Text style={styles.stepLabel}>Your details</Text>
                  </View>
                  <Pressable onPress={() => goToStep(2)} style={styles.backLink}>
                    <Ionicons name="arrow-back" size={16} color={palette.primary} />
                    <Text style={styles.backLinkText}>Back</Text>
                  </Pressable>
                </View>
                <View style={styles.dateSummary}>
                  <Text style={styles.dateSummaryText}>
                    <Ionicons name="calendar-outline" size={14} color={palette.textSecondary} />{' '}
                    {date?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </Text>
                  <Text style={styles.dateSummaryText}>
                    <Ionicons name="time-outline" size={14} color={palette.textSecondary} /> {time}
                  </Text>
                </View>
                <View style={styles.form}>
                  <FloatingLabelInput
                    label="Full Name *"
                    value={form.name}
                    onChangeText={(v) => handleInputChange('name', v)}
                    onBlur={() => handleBlur('name')}
                    error={touched.name ? errors.name : undefined}
                    themeOverrides={inputTheme}
                    placeholder="John Doe"
                  />
                  <FloatingLabelInput
                    label="Email Address *"
                    value={form.email}
                    onChangeText={(v) => handleInputChange('email', v)}
                    onBlur={() => handleBlur('email')}
                    error={touched.email ? errors.email : undefined}
                    themeOverrides={inputTheme}
                    placeholder="john@company.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <FloatingLabelInput
                    label="Phone Number *"
                    value={form.phone}
                    onChangeText={(v) => handleInputChange('phone', v)}
                    onBlur={() => handleBlur('phone')}
                    error={touched.phone ? errors.phone : undefined}
                    themeOverrides={inputTheme}
                    placeholder="123-456-7890"
                    keyboardType="phone-pad"
                  />
                </View>
                {errors.submit ? (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>{errors.submit}</Text>
                  </View>
                ) : null}
                <View style={styles.btnRow}>
                  <Pressable style={styles.outlineBtn} onPress={() => goToStep(2)}>
                    <Text style={styles.outlineBtnText}>Back</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.primaryBtn, styles.primaryBtnFlex, loading && styles.primaryBtnDisabled]}
                    onPress={submitDemo}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <ActivityIndicator color="#fff" size="small" />
                        <Text style={styles.primaryBtnText}>Scheduling...</Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.primaryBtnText}>Schedule Demo</Text>
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  keyboard: { flex: 1 },
  card: {
    flex: 1,
    marginHorizontal: spacing[4],
    marginVertical: spacing[6],
    backgroundColor: '#fff',
    borderRadius: radii['2xl'],
    overflow: 'hidden',
    ...Platform.select({
      web: { maxWidth: 672, alignSelf: 'center' as const, width: '100%' },
      default: {},
    }),
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(124,58,237,0.2)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 4,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing[6], paddingBottom: spacing[12] },

  header: { alignItems: 'center', marginBottom: spacing[8] },
  title: {
    ...textStyles.h1,
    fontSize: 28,
    color: palette.primary,
    marginBottom: spacing[1],
    textAlign: 'center',
  },
  subtitle: { ...textStyles.body, color: palette.textSecondary, textAlign: 'center', marginBottom: spacing[6] },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: spacing[4] },
  stepRow: { flexDirection: 'row', alignItems: 'center' },
  stepDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: palette.primary },
  stepDotDone: { backgroundColor: '#EDE9FE' },
  stepDotText: { ...textStyles.h4, color: '#9CA3AF' },
  stepDotTextActive: { color: '#fff' },
  stepDotTextDone: { color: palette.primary },
  stepLine: { width: 32, height: 2, backgroundColor: '#E5E7EB', marginHorizontal: 2 },
  stepLineDone: { backgroundColor: '#C4B5FD' },

  stepContent: {},
  stepLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[4] },
  stepLabel: { ...textStyles.h4, color: palette.textPrimary },
  stepHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[4] },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backLinkText: { fontSize: 14, color: palette.primary, fontWeight: '600' },
  dateSummary: {
    backgroundColor: '#F5F3FF',
    borderRadius: radii.lg,
    padding: spacing[4],
    marginBottom: spacing[6],
  },
  dateSummaryText: { ...textStyles.bodySm, color: palette.textSecondary, textAlign: 'center', marginVertical: 2 },

  dateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3], marginBottom: spacing[8] },
  dateCard: {
    width: '31%',
    minWidth: 90,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[3],
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  dateCardSelected: {
    backgroundColor: palette.primary,
    borderColor: 'transparent',
  },
  dateWeekday: { fontSize: 12, color: palette.textSecondary, marginBottom: 4 },
  dateDay: { fontSize: 24, fontWeight: '700', color: palette.textPrimary },
  dateMonth: { fontSize: 12, color: palette.textSecondary },
  dateCardTextLight: { color: 'rgba(255,255,255,0.9)' },
  dateToday: { fontSize: 12, color: palette.primary, fontWeight: '600', marginTop: 4 },

  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[6], maxHeight: 320 },
  timeSlot: {
    width: '23%',
    minWidth: 72,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[2],
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  timeSlotBooked: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  timeSlotSelected: { backgroundColor: palette.primary, borderColor: 'transparent' },
  timeSlotText: { ...textStyles.bodySm, fontWeight: '600', color: palette.textPrimary },
  timeSlotTextBooked: { color: '#9CA3AF', textDecorationLine: 'line-through' },
  timeSlotTextSelected: { color: '#fff' },
  timeSlotBookedLabel: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },

  form: { marginBottom: spacing[4] },
  errorBanner: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA', borderRadius: radii.lg, padding: spacing[4], marginBottom: spacing[4] },
  errorBannerText: { fontSize: 14, color: '#B91C1C' },

  btnRow: { flexDirection: 'row', gap: spacing[3], marginTop: spacing[4] },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    borderRadius: radii.full,
    backgroundColor: palette.primary,
  },
  primaryBtnFlex: { flex: 1 },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  outlineBtn: {
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  outlineBtnText: { ...textStyles.button, color: palette.textPrimary },

  // Success
  successRoot: { flex: 1 },
  successScroll: { flexGrow: 1, justifyContent: 'center', padding: spacing[6], paddingBottom: spacing[12] },
  successCard: {
    backgroundColor: '#fff',
    borderRadius: radii['2xl'],
    padding: spacing[8],
    alignItems: 'center',
    ...Platform.select({ web: { maxWidth: 400, alignSelf: 'center' as const }, default: {} }),
  },
  successIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[6],
  },
  successTitle: { ...textStyles.h1, fontSize: 28, color: palette.primary, marginBottom: spacing[4], textAlign: 'center' },
  successSubtitle: { ...textStyles.body, color: palette.textSecondary, textAlign: 'center', marginBottom: spacing[6] },
  successBold: { fontWeight: '600', color: palette.primary },
  successSummary: {
    backgroundColor: '#F5F3FF',
    borderRadius: radii.lg,
    padding: spacing[6],
    marginBottom: spacing[6],
    alignSelf: 'stretch',
  },
  successRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], marginVertical: 4 },
  successSummaryText: { ...textStyles.bodySm, fontWeight: '600', color: palette.textPrimary },
  successNote: { ...textStyles.bodySm, color: palette.textSecondary, marginBottom: 4 },
  successBackBtn: { marginTop: spacing[8], paddingVertical: spacing[3], paddingHorizontal: spacing[6] },
  successBackText: { fontSize: 16, color: palette.primary, fontWeight: '600' },
});
