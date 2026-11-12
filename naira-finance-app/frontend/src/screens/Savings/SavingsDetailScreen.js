import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import api from '../../services/api';
import { formatNaira, formatDate, todayString } from '../../utils/formatters';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../styles/theme';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button  from '../../components/common/Button';
import Input   from '../../components/common/Input';
import Card    from '../../components/common/Card';

const SavingsDetailScreen = ({ route }) => {
  const { goalId } = route.params;

  const [goal,           setGoal]           = useState(null);
  const [contributions,  setContributions]  = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [showForm,       setShowForm]       = useState(false);
  const [form,           setForm]           = useState({ amount: '', type: 'deposit', note: '', contribution_date: todayString() });
  const [submitting,     setSubmitting]     = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fetch = async () => {
    try {
      const [gRes, cRes] = await Promise.all([
        api.get(`/savings/${goalId}`),
        api.get(`/savings/${goalId}/contributions`),
      ]);
      setGoal(gRes.data.data.goal);
      setContributions(cRes.data.data.contributions);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetch(); }, [goalId]));

  const handleContribute = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) {
      Alert.alert('Error', 'Enter a valid amount.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/savings/${goalId}/contributions`, {
        amount:            parseFloat(form.amount),
        type:              form.type,
        note:              form.note || null,
        contribution_date: form.contribution_date,
      });
      setForm({ amount: '', type: 'deposit', note: '', contribution_date: todayString() });
      setShowForm(false);
      fetch();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!goal)   return null;

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} colors={[COLORS.primary]} />}
    >
      {/* Goal summary */}
      <View style={[styles.hero, { backgroundColor: goal.color || COLORS.savings }]}>
        <Text style={styles.heroIcon}>{goal.icon || '🎯'}</Text>
        <Text style={styles.heroTitle}>{goal.title}</Text>
        <Text style={styles.heroAmount}>{formatNaira(goal.current_amount)}</Text>
        <Text style={styles.heroTarget}>of {formatNaira(goal.target_amount)}</Text>
        <View style={styles.heroBg}>
          <View style={[styles.heroFill, { width: `${goal.percentage}%` }]} />
        </View>
        <Text style={styles.heroPct}>{goal.percentage}% achieved</Text>
      </View>

      {/* Stats */}
      <Card>
        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{formatNaira(goal.remaining)}</Text>
            <Text style={styles.statLbl}>Remaining</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statVal}>{goal.target_date ? formatDate(goal.target_date) : '–'}</Text>
            <Text style={styles.statLbl}>Target Date</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={[styles.statVal, { textTransform: 'capitalize' }]}>{goal.status}</Text>
            <Text style={styles.statLbl}>Status</Text>
          </View>
        </View>
      </Card>

      {/* Contribution form */}
      <Button
        title={showForm ? 'Cancel' : '+ Add Contribution'}
        variant={showForm ? 'secondary' : 'primary'}
        onPress={() => setShowForm(f => !f)}
        style={styles.addBtn}
      />

      {showForm && (
        <Card>
          <View style={styles.typeRow}>
            {['deposit', 'withdrawal'].map(t => (
              <TouchableOpacity key={t} style={[styles.typeBtn, form.type === t && styles.typeBtnActive]}
                onPress={() => setForm(p => ({ ...p, type: t }))}>
                <Text style={[styles.typeTxt, form.type === t && styles.typeTxtActive]}>
                  {t === 'deposit' ? '+ Deposit' : '- Withdraw'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Input label="Amount (₦)" value={form.amount} onChangeText={v => setForm(p => ({ ...p, amount: v }))}
            placeholder="0.00" keyboardType="decimal-pad" prefix="₦" />
          <Input
            label="Date"
            value={formatDate(form.contribution_date)}
            editable={false}
            onPress={() => setShowDatePicker(true)}
            suffix="📅"
          />
          <DateTimePickerModal
            isVisible={showDatePicker}
            mode="date"
            maximumDate={new Date()}
            onConfirm={d => { setForm(p => ({ ...p, contribution_date: d.toISOString().split('T')[0] })); setShowDatePicker(false); }}
            onCancel={() => setShowDatePicker(false)}
          />
          <Input label="Note (optional)" value={form.note} onChangeText={v => setForm(p => ({ ...p, note: v }))} placeholder="Add a note..." />
          <Button title="Save Contribution" onPress={handleContribute} loading={submitting} />
        </Card>
      )}

      {/* Contribution history */}
      <Text style={styles.histTitle}>Contribution History</Text>
      {contributions.length === 0 ? (
        <Text style={styles.emptyText}>No contributions yet</Text>
      ) : (
        contributions.map(c => (
          <View key={c.id} style={styles.contRow}>
            <Text style={[styles.contType, { color: c.type === 'deposit' ? COLORS.income : COLORS.expense }]}>
              {c.type === 'deposit' ? '↑' : '↓'}
            </Text>
            <View style={styles.contInfo}>
              <Text style={styles.contDate}>{formatDate(c.contribution_date)}</Text>
              {c.note ? <Text style={styles.contNote}>{c.note}</Text> : null}
            </View>
            <Text style={[styles.contAmt, { color: c.type === 'deposit' ? COLORS.income : COLORS.expense }]}>
              {c.type === 'deposit' ? '+' : '-'}{formatNaira(c.amount)}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  flex:    { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: SPACING.xxl },
  hero: { alignItems: 'center', padding: SPACING.lg },
  heroIcon:   { fontSize: 48, marginBottom: 8 },
  heroTitle:  { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold, color: COLORS.white },
  heroAmount: { fontSize: FONTS.sizes.hero, fontWeight: FONTS.weights.extrabold, color: COLORS.white, marginTop: 8 },
  heroTarget: { fontSize: FONTS.sizes.md, color: COLORS.white, opacity: 0.8 },
  heroBg:     { width: '80%', height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: RADIUS.full, marginTop: SPACING.sm, overflow: 'hidden' },
  heroFill:   { height: '100%', backgroundColor: COLORS.white, borderRadius: RADIUS.full },
  heroPct:    { color: COLORS.white, opacity: 0.9, fontSize: FONTS.sizes.sm, marginTop: 4 },
  statRow:    { flexDirection: 'row' },
  stat:       { flex: 1, alignItems: 'center' },
  statVal:    { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textPrimary },
  statLbl:    { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  statDivider:{ width: 1, backgroundColor: COLORS.divider },
  addBtn:     { margin: SPACING.md },
  typeRow:    { flexDirection: 'row', marginBottom: SPACING.md, gap: SPACING.sm },
  typeBtn:    { flex: 1, padding: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center' },
  typeBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '15' },
  typeTxt:    { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  typeTxtActive: { color: COLORS.primary, fontWeight: FONTS.weights.semibold },
  histTitle:  { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textPrimary, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  emptyText:  { textAlign: 'center', color: COLORS.textMuted, padding: SPACING.lg },
  contRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  contType:   { fontSize: 22, marginRight: SPACING.sm },
  contInfo:   { flex: 1 },
  contDate:   { fontSize: FONTS.sizes.sm, color: COLORS.textPrimary },
  contNote:   { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  contAmt:    { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold },
});

export default SavingsDetailScreen;
