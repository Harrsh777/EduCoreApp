import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useStudent } from '@/lib/student-context';
import { useAuthStore } from '@/lib/auth-store';
import { supabase } from '@/lib/supabase';
import { spacing } from '@/theme/spacing';

const ACCENT = '#2563EB';
const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const STUDENT_PHOTOS_BUCKET = 'student-photos';

type InfoRowProps = {
  label: string;
  value: string;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, styles.flatText]}>{label}</Text>
      <Text style={[styles.infoValue, styles.flatText]}>{value}</Text>
    </View>
  );
}

export default function StudentSettingsScreen() {
  const router = useRouter();
  const { student } = useStudent();
  const logout = useAuthStore((s) => s.logout);
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const [profileUri, setProfileUri] = useState<string | null>(
    (student?.photo_url as string) ||
      (student?.avatar_url as string) ||
      (profile?.photo_url as string) ||
      (profile?.avatar_url as string) ||
      null
  );
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const profileData = useMemo(() => {
    const displayName = (student?.full_name as string) || 'AISHA BANO';
    const admissionNo = (student?.admission_no as string) || 'JPPS56';
    const classSection =
      student?.class || student?.section ? `${student?.class ?? '1'} - ${student?.section ?? 'A'}` : '1 - A';
    const academicYear = (student?.academic_year as string) || '2026-2027';
    const gender = (student?.gender as string) || 'Female';
    const dob = (student?.dob as string) || (student?.date_of_birth as string) || 'January 1, 2015';
    const address = (student?.address as string) || 'GOHARI PHAPHAMAU';
    return { displayName, admissionNo, classSection, academicYear, gender, dob, address };
  }, [student]);

  const initials = useMemo(() => {
    return profileData.displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }, [profileData.displayName]);

  const handlePickPhoto = async () => {
    if (isUploading) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow gallery access to upload your photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > MAX_IMAGE_SIZE) {
      Alert.alert('Image too large', 'Please choose an image up to 5MB.');
      return;
    }
    if (asset.mimeType && !SUPPORTED_MIME_TYPES.includes(asset.mimeType)) {
      Alert.alert('Unsupported format', 'Please upload JPG, PNG or GIF.');
      return;
    }

    try {
      setIsUploading(true);
      const extension = (asset.fileName?.split('.').pop() || asset.mimeType?.split('/')[1] || 'jpg')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      const schoolCode = String(student?.school_code || profile?.school_code || 'school').toLowerCase();
      const studentId = String(student?.id || 'student');
      const filePath = `${schoolCode}/${studentId}/${Date.now()}.${extension}`;
      const uploadBlob = await (await fetch(asset.uri)).blob();

      const { error: uploadError } = await supabase.storage
        .from(STUDENT_PHOTOS_BUCKET)
        .upload(filePath, uploadBlob, {
          contentType: asset.mimeType || `image/${extension}`,
          upsert: true,
        });

      if (uploadError) {
        Alert.alert('Upload failed', uploadError.message || 'Could not upload image to Supabase.');
        return;
      }

      const { data } = supabase.storage.from(STUDENT_PHOTOS_BUCKET).getPublicUrl(filePath);
      const publicUrl = data.publicUrl;
      if (!publicUrl) {
        Alert.alert('Upload failed', 'Image uploaded but URL was not generated.');
        return;
      }

      setProfileUri(publicUrl);
      setProfile({
        ...(profile ?? {}),
        photo_url: publicUrl,
        avatar_url: publicUrl,
        profile_photo_url: publicUrl,
      });
      Alert.alert('Uploaded', 'Profile photo saved successfully.');
    } catch {
      Alert.alert('Upload failed', 'Could not upload image right now. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    try {
      setIsLoggingOut(true);
      await logout();
      router.replace('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerWrap}>
          <Text style={[styles.title, styles.flatText]}>Settings</Text>
          <Text style={[styles.subtitle, styles.flatText]}>Manage your profile and preferences</Text>
        </View>

        <View style={styles.card}>
          <Text style={[styles.sectionTitle, styles.flatText]}>Profile Photo</Text>
          <View style={styles.profileRow}>
            {profileUri ? (
              <Image source={{ uri: profileUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={[styles.avatarText, styles.flatText]}>{initials || 'AB'}</Text>
              </View>
            )}
            <View style={styles.photoMeta}>
              <Pressable style={styles.uploadButton} onPress={handlePickPhoto} disabled={isUploading}>
                <Text style={[styles.uploadButtonText, styles.flatText]}>
                  {isUploading ? 'Uploading...' : 'Upload Photo'}
                </Text>
              </Pressable>
              <Text style={[styles.helperText, styles.flatText]}>Max 5MB. Supported: JPG, PNG, GIF</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={[styles.sectionTitle, styles.flatText]}>Personal Information</Text>
          <InfoRow label="Student Name" value={profileData.displayName} />
          <InfoRow label="Admission Number" value={profileData.admissionNo} />
          <InfoRow label="Class & Section" value={profileData.classSection} />
          <InfoRow label="Academic Year" value={profileData.academicYear} />
          <InfoRow label="Gender" value={profileData.gender} />
          <InfoRow label="Date of Birth" value={profileData.dob} />

          <View style={styles.fieldWrap}>
            <Text style={[styles.inputLabel, styles.flatText]}>Phone</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter phone number"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              style={[styles.input, styles.flatText]}
            />
          </View>

          <View style={styles.fieldWrap}>
            <Text style={[styles.inputLabel, styles.flatText]}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email address"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.input, styles.flatText]}
            />
          </View>

          <InfoRow label="Address" value={profileData.address} />
        </View>

        <Pressable
          style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          <Text style={[styles.logoutButtonText, styles.flatText]}>
            {isLoggingOut ? 'Logging out...' : 'Log out'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flatText: {
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
    includeFontPadding: false,
  },
  root: {
    flex: 1,
    backgroundColor: '#EFF6FF',
  },
  content: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
    marginTop: 15,
    gap: spacing[4],
  },
  headerWrap: {
    paddingTop: spacing[2],
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: spacing[1],
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#475569',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    padding: spacing[4],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: spacing[3],
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: '#BFDBFE',
  },
  avatarFallback: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DBEAFE',
    borderWidth: 2,
    borderColor: '#BFDBFE',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  photoMeta: {
    flex: 1,
  },
  uploadButton: {
    alignSelf: 'flex-start',
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    minHeight: 44,
    justifyContent: 'center',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  helperText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#64748B',
    marginTop: spacing[2],
  },
  infoRow: {
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: spacing[1],
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  fieldWrap: {
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: spacing[2],
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: spacing[3],
    minHeight: 44,
    fontSize: 16,
    fontWeight: '500',
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  logoutButton: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[1],
  },
  logoutButtonDisabled: {
    opacity: 0.7,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
