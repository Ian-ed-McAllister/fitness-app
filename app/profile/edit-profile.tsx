import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { useProfileStore } from '../../src/store/profileStore';
import { DateWheelPicker } from '../../src/components/ui/DateWheelPicker';

function dobToState(dob: string | null): { day: number; month: number; year: number } {
  if (!dob) return { day: 1, month: 1, year: 1990 };
  const parts = dob.split('-');
  return { year: parseInt(parts[0], 10), month: parseInt(parts[1], 10), day: parseInt(parts[2], 10) };
}

function stateToIso(day: number, month: number, year: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDob(day: number, month: number, year: number): string {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

export default function EditProfileScreen() {
  const { displayName, dateOfBirth, biologicalSex, heightCm, updateProfile, loadProfile } =
    useProfileStore();

  const [name, setName] = useState('');
  const [hasDob, setHasDob] = useState(false);
  const [dobDay, setDobDay] = useState(1);
  const [dobMonth, setDobMonth] = useState(1);
  const [dobYear, setDobYear] = useState(1990);
  const [sex, setSex] = useState<'male' | 'female' | null>(null);
  const [heightStr, setHeightStr] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    setName(displayName ?? '');
    setSex(biologicalSex);
    setHeightStr(heightCm ? String(heightCm) : '');
    if (dateOfBirth) {
      const s = dobToState(dateOfBirth);
      setDobDay(s.day);
      setDobMonth(s.month);
      setDobYear(s.year);
      setHasDob(true);
    }
  }, [displayName, dateOfBirth, biologicalSex, heightCm]);

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({
        displayName: name.trim(),
        dateOfBirth: hasDob ? stateToIso(dobDay, dobMonth, dobYear) : null,
        biologicalSex: sex,
        heightCm: heightStr ? parseFloat(heightStr) : null,
      });
      setSaved(true);
      setTimeout(() => { setSaved(false); router.back(); }, 800);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          <Field label="Display Name" value={name} onChange={setName} placeholder="Your name" />

          {/* Date of birth */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Date of Birth</Text>
            <TouchableOpacity style={styles.fieldBtn} onPress={() => { setHasDob(true); setPickerVisible(true); }}>
              <Text style={hasDob ? styles.fieldBtnText : styles.fieldBtnPlaceholder}>
                {hasDob ? formatDob(dobDay, dobMonth, dobYear) : 'Select date'}
              </Text>
              <Ionicons name="calendar-outline" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
            {hasDob && (
              <TouchableOpacity onPress={() => setHasDob(false)}>
                <Text style={styles.clearText}>Clear date</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Biological sex */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>
              Biological Sex{' '}
              <Text style={styles.optional}>(used for calorie estimate)</Text>
            </Text>
            <View style={styles.chipRow}>
              {(['male', 'female'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, sex === s && styles.chipActive]}
                  onPress={() => setSex(sex === s ? null : s)}
                >
                  <Text style={[styles.chipText, sex === s && styles.chipTextActive]}>
                    {s === 'male' ? 'Male' : 'Female'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Height */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Height (cm)</Text>
            <TextInput
              style={styles.input}
              value={heightStr}
              onChangeText={setHeightStr}
              keyboardType="decimal-pad"
              placeholder="e.g. 178"
              placeholderTextColor={Colors.textMuted}
              selectTextOnFocus
            />
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={Colors.textInverse} />
          ) : saved ? (
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.textInverse} />
              <Text style={styles.saveBtnText}>Saved!</Text>
            </View>
          ) : (
            <Text style={styles.saveBtnText}>Save Profile</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Custom date wheel picker modal */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={styles.pickerOverlay}>
          {/* Tappable backdrop — separate from sheet so scroll isn't blocked */}
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setPickerVisible(false)}
          />
          {/* Sheet is a plain View so FlatList receives scroll gestures */}
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHandle} />
            <Text style={styles.pickerTitle}>Date of Birth</Text>

            <DateWheelPicker
              day={dobDay}
              month={dobMonth}
              year={dobYear}
              onChange={(d, m, y) => { setDobDay(d); setDobMonth(m); setDobYear(y); }}
            />

            <TouchableOpacity style={styles.pickerDone} onPress={() => setPickerVisible(false)}>
              <Text style={styles.pickerDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Field({
  label, value, onChange, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: 17, fontWeight: '600', color: Colors.text },
  content: { padding: 16, gap: 16 },
  fieldWrap: { gap: 6 },
  fieldLabel: { fontSize: 12, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  optional: { textTransform: 'none', fontWeight: '400', fontSize: 11 },
  input: {
    backgroundColor: Colors.surface, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: Colors.text,
  },
  fieldBtn: {
    backgroundColor: Colors.surface, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  fieldBtnText: { fontSize: 15, color: Colors.text },
  fieldBtnPlaceholder: { fontSize: 15, color: Colors.textMuted },
  clearText: { fontSize: 12, color: Colors.danger, marginTop: 2 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  chipTextActive: { color: Colors.primary },
  footer: { padding: 16, paddingBottom: 24, borderTopWidth: 1, borderTopColor: Colors.border },
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    height: 52, alignItems: 'center', justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: Colors.textInverse, fontSize: 16, fontWeight: '700' },
  pickerOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 16, paddingBottom: 40, paddingTop: 12,
  },
  pickerHandle: {
    width: 36, height: 4, backgroundColor: Colors.border,
    borderRadius: 2, alignSelf: 'center', marginBottom: 16,
  },
  pickerTitle: {
    fontSize: 17, fontWeight: '600', color: Colors.text,
    textAlign: 'center', marginBottom: 8,
  },
  pickerDone: { alignItems: 'center', paddingVertical: 16, marginTop: 4 },
  pickerDoneText: { fontSize: 17, fontWeight: '600', color: Colors.primary },
});
