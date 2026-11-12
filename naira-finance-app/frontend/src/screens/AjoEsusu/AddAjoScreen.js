import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import NetInfo from '@react-native-community/netinfo';
import api from '../../services/api';
import { createOfflineRecord } from '../../services/syncService';
import { todayString, formatDate } from '../../utils/formatters';
import { COLORS, FONTS, SPACING, RADIUS } from '../../styles/theme';
import Button from '../../components/common/Button';
import Input  from '../../components/common/Input';

const CYCLES   = ['daily', 'weekly', 'monthly'];
const STATUSES = ['paid', 'pending', 'received'];

const AddAjoScreen = ({ route, navigation }) => {
  const editItem = route.params?.item;
  const isEdit   = !!editItem;

  const [form, setForm] = useState({
    type:              editItem?.type              || 'ajo',
    group_name:        editItem?.group_name        || '',
    amount:            editItem?.amount            ? String(editItem.amount) : '',
    contribution_date: editItem?.contribution_date || todayString(),
    description:       editItem?.description       || '',
    cycle:             editItem?.cycle             || 'monthly',
    status:            editItem?.status            || 'paid',
  });
  const [loading,        setLoading]       = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors,         setErrors]        = useState({});

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.amount || parseFloat(form.amount) <= 0) e.amount = 'Enter a valid amount';
    if (!form.contribution_date)                       e.contribution_date = 'Select a date';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    const payload = {
      type:              form.type,
      group_name:        form.group_name || null,
      amount:            parseFloat(form.amount),
      contribution_date: form.contribution_date,
      description:       form.description || null,
      cycle:             form.cycle,
      status:            form.status,
    };
    try {
      const net = await NetInfo.fetch();
      if (!net.isConnected) {
        await createOfflineRecord('ajo_esusu', payload);
        Alert.alert('Saved Offline', 'Will sync when you are online.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        if (isEdit) {
          await api.put(`/ajo/${editItem.id}`, payload);
        } else {
          await api.post('/ajo', payload);
        }
        navigation.goBack();
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to save.');
    } finally {
      setLoading(false);
    }
  };

  const ChipGroup = ({ label, options, value, onChange }) => (
    <View style={{ marginBottom: SPACING.md }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chips}>
        {options.map(o => (
          <TouchableOpacity key={o} style={[styles.chip, value === o && styles.chipActive]} onPress={() => onChange(o)}>
            <Text style={[styles.chipText, value === o && styles.chipTextActive]}>
              {o.charAt(0).toUpperCase() + o.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <ChipGroup label="Type *" options={['ajo', 'esusu']} value={form.type} onChange={v => set('type', v)} />
        <Input label="Group Name (optional)" value={form.group_name} onChangeText={v => set('group_name', v)} placeholder="e.g. Street Ajo Group" />
        <Input label="Amount (₦) *" value={form.amount} onChangeText={v => set('amount', v)} placeholder="0.00" keyboardType="decimal-pad" prefix="₦" error={errors.amount} />
        <Input
          label="Date *"
          value={formatDate(form.contribution_date)}
          editable={false}
          onPress={() => setShowDatePicker(true)}
          suffix="📅"
          error={errors.contribution_date}
        />
        <DateTimePickerModal
          isVisible={showDatePicker}
          mode="date"
          onConfirm={d => { set('contribution_date', d.toISOString().split('T')[0]); setShowDatePicker(false); }}
          onCancel={() => setShowDatePicker(false)}
        />
        <ChipGroup label="Cycle" options={CYCLES}   value={form.cycle}  onChange={v => set('cycle', v)} />
        <ChipGroup label="Status" options={STATUSES} value={form.status} onChange={v => set('status', v)} />
        <Input label="Description (optional)" value={form.description} onChangeText={v => set('description', v)} placeholder="Add notes..." multiline />
        <Button title={isEdit ? 'Update' : 'Save Contribution'} onPress={handleSave} loading={loading} size="lg" style={styles.saveBtn} />
        <Button title="Cancel" onPress={() => navigation.goBack()} variant="secondary" size="lg" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex:   { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  label:  { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.medium, color: COLORS.textPrimary, marginBottom: SPACING.xs },
  chips:  { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  chip:        { paddingHorizontal: SPACING.sm, paddingVertical: 6, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white },
  chipActive:  { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '15' },
  chipText:    { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.primary, fontWeight: FONTS.weights.semibold },
  saveBtn: { marginBottom: SPACING.sm },
});

export default AddAjoScreen;
