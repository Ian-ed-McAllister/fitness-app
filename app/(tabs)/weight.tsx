import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
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
import { styles } from '../../src/styles/WeightTab.styles';

type Range = 30 | 60 | 90;

export default function WeightTab() {
  const { entries, unit, isLoading, loadEntries, loadUnit, logWeight, removeEntry, setUnit } =
    useWeightStore();

  const [range, setRange] = useState<Range>(30);
  const [modalVisible, setModalVisible] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [saving, setSaving] = useState(false);

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
    setModalVisible(true);
  }

  async function handleSave() {
    const val = parseFloat(weightInput);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Invalid', 'Please enter a valid weight.');
      return;
    }
    setSaving(true);
    try {
      await logWeight(val, format(new Date(), 'yyyy-MM-dd'), notesInput.trim() || undefined);
      setModalVisible(false);
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(id: string, date: string) {
    Alert.alert('Delete Entry', `Delete entry for ${format(parseISO(date), 'MMM d, yyyy')}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeEntry(id) },
    ]);
  }

  // Stats
  const weights = entries.map((e) => e.weight);
  const latest = entries[0];
  const highest = weights.length ? Math.max(...weights) : null;
  const lowest = weights.length ? Math.min(...weights) : null;
  const change =
    entries.length >= 2 ? entries[0].weight - entries[entries.length - 1].weight : null;

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
              valueColor={change != null ? (change <= 0 ? Colors.primary : Colors.danger) : Colors.text}
            />
          </View>

          {/* Chart */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Progress</Text>
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
            <WeightChart entries={entries} unit={unit} days={range} width={chartWidth} />
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
