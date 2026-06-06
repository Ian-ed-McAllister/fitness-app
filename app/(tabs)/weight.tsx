import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { Colors } from '../../src/constants/colors';
import { WeightChart } from '../../src/components/charts/WeightChart';
import { useWeightStore } from '../../src/store/weightStore';
import { useProfileStore } from '../../src/store/profileStore';
import { styles } from '../../src/styles/WeightTab.styles';
import { sheetStyles } from '../../src/styles/Sheet.styles';

type Range = 30 | 60 | 90;

export default function WeightTab() {
  const { entries, unit, isLoading, loadEntries, loadUnit, logWeight, removeEntry, setUnit } =
    useWeightStore();
  const { goalDirection } = useProfileStore();

  const [range, setRange] = useState<Range>(30);
  const [showAvg, setShowAvg] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [weightError, setWeightError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; date: string } | null>(null);

  const { width } = useWindowDimensions();
  const chartWidth = width - 32; // 16px margin each side

  useEffect(() => {
    loadUnit();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [])
  );

  function openModal() {
    setWeightInput('');
    setNotesInput('');
    setWeightError('');
    setModalVisible(true);
  }

  async function handleSave() {
    const val = parseFloat(weightInput);
    if (isNaN(val) || val <= 0) {
      setWeightError('Please enter a valid weight');
      return;
    }
    setWeightError('');
    setSaving(true);
    try {
      await logWeight(val, format(new Date(), 'yyyy-MM-dd'), notesInput.trim() || undefined);
      setModalVisible(false);
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(id: string, date: string) {
    setDeleteTarget({ id, date });
  }

  // Stats
  const weights = entries.map((e) => e.weight);
  const latest = entries[0];
  const highest = weights.length ? Math.max(...weights) : null;
  const lowest = weights.length ? Math.min(...weights) : null;
  const change =
    entries.length >= 2 ? entries[0].weight - entries[entries.length - 1].weight : null;

  // Goal-aware colour for change stat
  function changeColour(delta: number | null): string {
    if (delta === null) return Colors.text;
    if (goalDirection === 'gain') return delta >= 0 ? Colors.primary : Colors.danger;
    if (goalDirection === 'lose') return delta <= 0 ? Colors.primary : Colors.danger;
    // maintain — neutral either way
    return Colors.text;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Weight</Text>
        <TouchableOpacity style={styles.logBtn} onPress={openModal}>
          <Ionicons name="add" size={16} color={Colors.textInverse} />
          <Text style={styles.logBtnText}>Log</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.empty}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No entries yet</Text>
          <Text style={styles.emptyDesc}>Tap Log to record your first weight entry.</Text>
          <TouchableOpacity style={[styles.logBtn, { marginTop: 8 }]} onPress={openModal}>
            <Ionicons name="add" size={16} color={Colors.textInverse} />
            <Text style={styles.logBtnText}>Log Weight</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Stats */}
          <View style={styles.statsCard}>
            <StatItem label="Current" value={latest ? `${latest.weight}` : '—'} unit={unit} />
            <View style={styles.statDivider} />
            <StatItem label="Lowest" value={lowest != null ? `${lowest}` : '—'} unit={unit} />
            <View style={styles.statDivider} />
            <StatItem label="Highest" value={highest != null ? `${highest}` : '—'} unit={unit} />
            <View style={styles.statDivider} />
            <StatItem
              label="Change"
              value={change != null ? `${change > 0 ? '+' : ''}${change.toFixed(1)}` : '—'}
              unit={change != null ? unit : ''}
              valueColor={changeColour(change)}
            />
          </View>

          {/* Chart */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Progress</Text>
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                <TouchableOpacity
                  style={[styles.rangeBtn, showAvg && styles.rangeBtnActive]}
                  onPress={() => setShowAvg((v) => !v)}
                >
                  <Text style={[styles.rangeBtnText, showAvg && styles.rangeBtnTextActive]}>
                    Avg
                  </Text>
                </TouchableOpacity>
                <View style={styles.rangeToggle}>
                  {([30, 60, 90] as Range[]).map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.rangeBtn, range === r && styles.rangeBtnActive]}
                      onPress={() => setRange(r)}
                    >
                      <Text style={[styles.rangeBtnText, range === r && styles.rangeBtnTextActive]}>
                        {r}d
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            <WeightChart entries={entries} unit={unit} days={range} width={chartWidth} showAverage={showAvg} />
          </View>

          {/* Entry list */}
          <Text style={styles.sectionTitle}>History</Text>
          {entries.map((entry) => (
            <View key={entry.id} style={styles.entryCard}>
              <View style={styles.entryLeft}>
                <Text style={styles.entryDate}>{format(parseISO(entry.date), 'EEEE, MMM d')}</Text>
                {entry.notes ? <Text style={styles.entryNotes}>{entry.notes}</Text> : null}
              </View>
              <Text style={styles.entryWeight}>
                {entry.weight}
                <Text style={styles.entryUnit}> {entry.unit}</Text>
              </Text>
              <TouchableOpacity
                style={styles.entryDelete}
                onPress={() => confirmDelete(entry.id, entry.date)}
                hitSlop={8}
              >
                <Ionicons name="trash-outline" size={17} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Log weight modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <TouchableOpacity style={styles.modalSheet} activeOpacity={1}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Log Weight</Text>

              <View style={styles.weightRow}>
                <TextInput
                  style={styles.weightInput}
                  placeholder="0.0"
                  placeholderTextColor={Colors.textMuted}
                  value={weightInput}
                  onChangeText={setWeightInput}
                  keyboardType="decimal-pad"
                  autoFocus
                  selectTextOnFocus
                />
                {weightError ? <Text style={{ color: '#FF453A', fontSize: 12, position: 'absolute', bottom: -18, left: 0 }}>{weightError}</Text> : null}
                <View style={styles.unitToggle}>
                  {(['kg', 'lb'] as const).map((u) => (
                    <TouchableOpacity
                      key={u}
                      style={[styles.unitBtn, unit === u && styles.unitBtnActive]}
                      onPress={() => setUnit(u)}
                    >
                      <Text style={[styles.unitBtnText, unit === u && styles.unitBtnTextActive]}>
                        {u}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TextInput
                style={styles.notesInput}
                placeholder="Notes (optional)"
                placeholderTextColor={Colors.textMuted}
                value={notesInput}
                onChangeText={setNotesInput}
                multiline
              />

              <TouchableOpacity
                style={[styles.saveBtn, (saving || !weightInput) && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving || !weightInput}
              >
                {saving ? (
                  <ActivityIndicator color={Colors.textInverse} />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete entry sheet */}
      <Modal visible={!!deleteTarget} transparent animationType="slide" onRequestClose={() => setDeleteTarget(null)}>
        <TouchableOpacity style={sheetStyles.overlay} activeOpacity={1} onPress={() => setDeleteTarget(null)}>
          <TouchableOpacity style={sheetStyles.sheet} activeOpacity={1}>
            <View style={sheetStyles.handle} />
            <Text style={sheetStyles.title}>Delete Entry?</Text>
            <Text style={sheetStyles.subtitle}>
              {deleteTarget ? `Entry for ${format(parseISO(deleteTarget.date), 'MMM d, yyyy')} will be permanently deleted.` : ''}
            </Text>
            <TouchableOpacity style={sheetStyles.dangerBtn} onPress={() => { if (deleteTarget) { removeEntry(deleteTarget.id); setDeleteTarget(null); } }}>
              <Ionicons name="trash-outline" size={18} color="#000" />
              <Text style={sheetStyles.dangerBtnText}>Delete Entry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={sheetStyles.cancel} onPress={() => setDeleteTarget(null)}>
              <Text style={sheetStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function StatItem({
  label,
  value,
  unit,
  valueColor,
}: {
  label: string;
  value: string;
  unit: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statVal, valueColor ? { color: valueColor } : undefined]}>
        {value}
        {unit ? <Text style={styles.statLabel}> {unit}</Text> : null}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}
