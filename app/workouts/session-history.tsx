import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, intervalToDuration } from 'date-fns';
import { Colors } from '../../src/constants/colors';
import { getSessionHistory, deleteSession, type SessionHistoryItem } from '../../src/db/workouts';
import { styles } from '../../src/styles/SessionHistory.styles';
import { sheetStyles } from '../../src/styles/Sheet.styles';

export default function SessionHistoryScreen() {
  const router = useRouter();
  const { templateId, templateName } = useLocalSearchParams<{
    templateId: string;
    templateName?: string;
  }>();

  const [sessions, setSessions] = useState<SessionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => { loadSessions(); }, []);

  async function loadSessions() {
    setLoading(true);
    try {
      const data = await getSessionHistory(templateId);
      setSessions(data);
    } finally {
      setLoading(false);
    }
  }

  function getDuration(startedAt: number, finishedAt?: number): string {
    if (!finishedAt) return '—';
    const duration = intervalToDuration({ start: startedAt, end: finishedAt });
    if ((duration.hours ?? 0) > 0) return `${duration.hours}h ${duration.minutes}m`;
    return `${duration.minutes ?? 0}m ${duration.seconds ?? 0}s`;
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await deleteSession(deleteTarget);
    setSessions((prev) => prev.filter((s) => s.id !== deleteTarget));
    setDeleteTarget(null);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {templateName ?? 'History'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.empty}><ActivityIndicator color={Colors.primary} /></View>
      ) : sessions.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="time-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No Sessions Yet</Text>
          <Text style={styles.emptyDesc}>
            Complete a workout using this template to see your history here.
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {sessions.map((session) => (
            <View key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionTop}>
                <View>
                  <Text style={styles.sessionDate}>
                    {format(new Date(session.startedAt), 'EEEE, MMM d, yyyy')}
                  </Text>
                  <Text style={styles.sessionTime}>
                    {format(new Date(session.startedAt), 'h:mm a')}
                  </Text>
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => setDeleteTarget(session.id)}>
                  <Ionicons name="trash-outline" size={17} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.durationRow}>
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>
                    {getDuration(session.startedAt, session.finishedAt)}
                  </Text>
                </View>
                <Text style={styles.setCountText}>
                  {session.exerciseCount} exercise{session.exerciseCount !== 1 ? 's' : ''} · {session.totalSets} set{session.totalSets !== 1 ? 's' : ''}
                </Text>
              </View>

              {session.exerciseNames.length > 0 && (
                <>
                  <View style={styles.separator} />
                  <View style={styles.exerciseList}>
                    {session.exerciseNames.map((name) => (
                      <View key={name} style={styles.exerciseRow}>
                        <View style={styles.exerciseDot} />
                        <Text style={styles.exerciseRowText}>{name}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {session.notes ? (
                <>
                  <View style={styles.separator} />
                  <Text style={{ fontSize: 13, color: Colors.textSecondary, fontStyle: 'italic' }}>
                    "{session.notes}"
                  </Text>
                </>
              ) : null}
            </View>
          ))}
        </ScrollView>
      )}

      <Modal visible={!!deleteTarget} transparent animationType="slide" onRequestClose={() => setDeleteTarget(null)}>
        <TouchableOpacity style={sheetStyles.overlay} activeOpacity={1} onPress={() => setDeleteTarget(null)}>
          <TouchableOpacity style={sheetStyles.sheet} activeOpacity={1}>
            <View style={sheetStyles.handle} />
            <Text style={sheetStyles.title}>Delete Session?</Text>
            <Text style={sheetStyles.subtitle}>This session and all its logged sets will be permanently deleted.</Text>
            <TouchableOpacity style={sheetStyles.dangerBtn} onPress={confirmDelete}>
              <Ionicons name="trash-outline" size={18} color={Colors.textInverse} />
              <Text style={sheetStyles.dangerBtnText}>Delete Session</Text>
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
