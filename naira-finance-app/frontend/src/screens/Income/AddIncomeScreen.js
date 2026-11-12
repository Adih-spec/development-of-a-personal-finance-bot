import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import NetInfo from '@react-native-community/netinfo';
import api from '../../services/api';
import { createOfflineRecord } from '../../services/syncService';
import { todayString, formatDate } from '../../utils/formatters';
import { COLORS, FONTS, SPACING, RADIUS } from '../../styles/theme';
import Button from '../../components/common/Button';
import Input  from '../../components/common/Input';

const AddIncomeScreen = ({ route, navigation }) => {
  const editItem = route.params?.item;
  const isEdit   = !!editItem;

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    category_id:      editItem?.category_id  || '',
    amount:           editItem?.amount       ? String(editItem.amount) : '',
    description:      editItem?.description  || '',
    transaction_date: editItem?.transaction_date || todayString(),
    source:           editItem?.source       || '',
    is_recurring:     editItem?.is_recurring  ? true : false,
  });
  const [loading,       setLoading]       = useState(false);
  const [showDatePicker,setShowDatePicker] = useState(false);
  const [errors,        setErrors]        = useState({});

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data } = await api.get('/categories/income');
        setCategories(data.data.categories);
        if (!editItem && data.data.categories.length > 0) {
          setForm(p => ({ ...p, category_id: data.data.categories[0].id }));
        }
      } catch (e) { console.error(e); }
    };
    loadCategories();
  }, []);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.category_id)          e.category_id = 'Select a category';
    if (!form.amount || isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0)
      e.amount = 'Enter a valid amount';
    if (!form.transaction_date)     e.transaction_date = 'Select a date';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);

    const payload = {
      category_id:      parseInt(form.category_id),
      amount:           parseFloat(form.amount),
      description:      form.description || null,
      transaction_date: form.transaction_date,
      source:           form.source || null,
      is_recurring:     form.is_recurring,
    };

    try {
      const net = await NetInfo.fetch();
      if (!net.isConnected) {
        // Save offline
        await createOfflineRecord('income', payload);
        Alert.alert('Saved Offline', 'Income saved locally. It will sync when you are online.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        if (isEdit) {
          await api.put(`/income/${editItem.id}`, payload);
          Alert.alert('Updated', 'Income updated successfully.');
        } else {
          await api.post('/income', payload);
          Alert.alert('Added', 'Income added successfully.');
        }
        navigation.goBack();
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to save income.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Category selector */}
        <Text style={styles.label}>Category *</Text>
        <View style={styles.chips}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.chip, form.category_id === cat.id && styles.chipActive]}
              onPress={() => set('category_id', cat.id)}
            >
              <Text style={[styles.chipText, form.category_id === cat.id && styles.chipTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.category_id ? <Text style={styles.errText}>{errors.category_id}</Text> : null}

        {/* Amount */}
        <Input
          label="Amount (₦) *"
          value={form.amount}
          onChangeText={v => set('amount', v)}
          placeholder="0.00"
          keyboardType="decimal-pad"
          prefix="₦"
          error={errors.amount}
        />

        {/* Date */}
        <Input
          label="Date *"
          value={formatDate(form.transaction_date)}
          placeholder="Select date"
          editable={false}
          onPress={() => setShowDatePicker(true)}
          suffix="📅"
          error={errors.transaction_date}
        />
        <DateTimePickerModal
          isVisible={showDatePicker}
          mode="date"
          maximumDate={new Date()}
          onConfirm={d => { set('transaction_date', d.toISOString().split('T')[0]); setShowDatePicker(false); }}
          onCancel={() => setShowDatePicker(false)}
        />

        {/* Source */}
        <Input
          label="Source (optional)"
          value={form.source}
          onChangeText={v => set('source', v)}
          placeholder="e.g. Employer, Client name"
        />

        {/* Description */}
        <Input
          label="Description (optional)"
          value={form.description}
          onChangeText={v => set('description', v)}
          placeholder="Add a note..."
          multiline
        />

        {/* Recurring toggle */}
        <TouchableOpacity style={styles.toggleRow} onPress={() => set('is_recurring', !form.is_recurring)}>
          <View style={[styles.toggle, form.is_recurring && styles.toggleOn]}>
            <View style={[styles.thumb, form.is_recurring && styles.thumbOn]} />
          </View>
          <Text style={styles.toggleLabel}>Recurring income</Text>
        </TouchableOpacity>

        <Button
          title={isEdit ? 'Update Income' : 'Save Income'}
          onPress={handleSave}
          loading={loading}
          size="lg"
          style={styles.saveBtn}
        />
        <Button title="Cancel" onPress={() => navigation.goBack()} variant="secondary" size="lg" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex:   { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  label:  { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.medium, color: COLORS.textPrimary, marginBottom: SPACING.xs },
  chips:  { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.sm },
  chip: {
    paddingHorizontal: SPACING.sm, paddingVertical: 6,
    borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  chipActive:     { borderColor: COLORS.income, backgroundColor: COLORS.income + '15' },
  chipText:       { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.income, fontWeight: FONTS.weights.semibold },
  errText:   { fontSize: FONTS.sizes.xs, color: COLORS.danger, marginBottom: SPACING.sm },
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
  toggle: {
    width: 44, height: 24, borderRadius: 12, backgroundColor: COLORS.border,
    justifyContent: 'center', paddingHorizontal: 2,
  },
  toggleOn: { backgroundColor: COLORS.income },
  thumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.white },
  thumbOn: { marginLeft: 20 },
  toggleLabel: { marginLeft: SPACING.sm, fontSize: FONTS.sizes.md, color: COLORS.textPrimary },
  saveBtn: { marginBottom: SPACING.sm },
});

export default AddIncomeScreen;
