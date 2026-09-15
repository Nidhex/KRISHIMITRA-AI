/* ==========================================================================
   KrishiMitra AI — Mobile Farm Diary & Memory Screen
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { AppHeader } from '../../../components/AppHeader';
import { Colors, Typography, Spacing, BorderRadius, Elevation } from '../../../constants/theme';
import { diaryService, FarmDiaryEvent, DecisionRecommendation } from '../../../services/diaryService';

export default function DiaryScreen() {
  const [events, setEvents] = useState<FarmDiaryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [decision, setDecision] = useState<DecisionRecommendation | null>(null);

  // Manual Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [eventType, setEventType] = useState('fertilizer');
  const [crop, setCrop] = useState('Wheat');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [quantity, setQuantity] = useState('');

  const FARMER_ID = 'farmer_default';

  useEffect(() => {
    loadData();
  }, [activeFilter]);

  const loadData = async () => {
    setLoading(true);
    const res = await diaryService.getDiaryData(FARMER_ID, activeFilter);
    if (res.success) {
      setEvents(res.events);
    }
    const dec = await diaryService.getNextBestAction(FARMER_ID);
    setDecision(dec);
    setLoading(false);
  };

  const handleSaveManual = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter an activity title.');
      return;
    }

    await diaryService.saveEvent({
      farmerId: FARMER_ID,
      eventType,
      crop,
      title: title.trim(),
      description: desc.trim(),
      quantity: quantity ? parseFloat(quantity) : null,
      unit: 'kg',
      date: new Date().toISOString().split('T')[0],
      source: 'manual',
    });

    setModalVisible(false);
    setTitle('');
    setDesc('');
    setQuantity('');
    loadData();
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this diary record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await diaryService.deleteEvent(id, FARMER_ID);
          loadData();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <AppHeader title="🌾 Farm Diary & Memory" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Next Best Action Decision Card */}
        {decision && (
          <View style={styles.decisionCard}>
            <View style={styles.decisionHeader}>
              <Text style={styles.decisionBadge}>⚡ NEXT BEST ACTION</Text>
              <Text style={styles.decisionCrop}>{decision.crop}</Text>
            </View>
            <Text style={styles.decisionAction}>🌾 {decision.action}</Text>

            <View style={styles.whyBox}>
              <Text style={styles.whyTitle}>Why?</Text>
              <Text style={styles.whyText}>{decision.reason}</Text>
              {decision.basedOn && decision.basedOn.map((b, idx) => (
                <Text key={idx} style={styles.basedText}>✓ {b.summary}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Toolbar */}
        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.btnPrimary} onPress={() => setModalVisible(true)}>
            <Text style={styles.btnPrimaryText}>➕ Add Activity</Text>
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {['all', 'fertilizer', 'irrigation', 'disease', 'harvest', 'expense'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterPillText, activeFilter === f && styles.filterPillTextActive]}>
                {f.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Timeline List */}
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
        ) : events.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 32 }}>📖</Text>
            <Text style={styles.emptyTitle}>No Activities Recorded</Text>
            <Text style={styles.emptySub}>Tap 'Add Activity' to record your farm activities.</Text>
          </View>
        ) : (
          events.map((e) => (
            <View key={e.id} style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeText}>{e.eventType.toUpperCase()}</Text>
                  {e.crop && <Text style={styles.cropBadge}>{e.crop}</Text>}
                </View>
                <TouchableOpacity onPress={() => handleDelete(e.id)}>
                  <Text style={styles.deleteText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.eventTitle}>{e.title}</Text>
              {e.description ? <Text style={styles.eventDesc}>{e.description}</Text> : null}

              <View style={styles.eventFooter}>
                <Text style={styles.dateText}>{e.date}</Text>
                {e.quantity ? <Text style={styles.qtyTag}>{e.quantity} {e.unit || ''}</Text> : null}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Manual Entry Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>➕ Add Farm Activity</Text>

            <TextInput
              style={styles.input}
              placeholder="Crop (e.g. Wheat, Paddy)"
              value={crop}
              onChangeText={setCrop}
            />

            <TextInput
              style={styles.input}
              placeholder="Title (e.g. Applied 40kg urea)"
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={[styles.input, { height: 70 }]}
              placeholder="Description"
              multiline
              value={desc}
              onChangeText={setDesc}
            />

            <TextInput
              style={styles.input}
              placeholder="Quantity (e.g. 40)"
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.btnSecondary} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={handleSaveManual}>
                <Text style={styles.btnPrimaryText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    padding: Spacing.md,
  },
  decisionCard: {
    backgroundColor: '#1E293B',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  decisionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  decisionBadge: {
    color: '#60A5FA',
    fontWeight: '700',
    fontSize: Typography.fontSize.xs,
  },
  decisionCrop: {
    color: '#93C5FD',
    fontSize: Typography.fontSize.xs,
  },
  decisionAction: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    marginBottom: 8,
  },
  whyBox: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
  },
  whyTitle: {
    color: '#93C5FD',
    fontWeight: '600',
    fontSize: Typography.fontSize.xs,
  },
  whyText: {
    color: '#E2E8F0',
    fontSize: Typography.fontSize.sm,
    marginBottom: 4,
  },
  basedText: {
    color: '#CBD5E1',
    fontSize: Typography.fontSize.xs,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: Spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterPillText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    ...Elevation.low,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeText: {
    fontWeight: '700',
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
  },
  cropBadge: {
    backgroundColor: '#E8F5E9',
    color: '#2E7D32',
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    fontWeight: '600',
  },
  deleteText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
  },
  eventTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  eventDesc: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  dateText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  qtyTag: {
    backgroundColor: '#E0F2FE',
    color: '#0369A1',
    fontWeight: '700',
    fontSize: Typography.fontSize.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  emptySub: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  btnPrimary: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  btnSecondary: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  btnSecondaryText: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    fontSize: Typography.fontSize.sm,
  },
  modalBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: Spacing.md,
  },
});
