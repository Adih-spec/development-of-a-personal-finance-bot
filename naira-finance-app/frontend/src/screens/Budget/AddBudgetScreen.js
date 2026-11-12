import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import api from '../../services/api';
import { monthName } from '../../utils/formatters';
import { COLORS, FONTS, SPACING, RADIUS } from '../../styles/theme';
import Button from '../../components/common/Button';
import Input  from '../../components/common/Input';

const AddBudgetScreen = ({ route, navigation }) => {
  const { item, month: initMonth, year: initYear } = route.params || {};
  const isEdit = !!item;

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    category_id:  item?.category_id  || '',
    amount_limit: item?.amount_limit ? String(item.amount_limit) : '',
    month:        initMonth || new Date().getMonth() + 1,
    year:         initYear  || new Date().getFullYear(),
    alert_75:     item?.alert_75  !== undefined ? !!item.alert_75  : true,
    alert_90:     item?.alert_90  !== undefined ? !!item.alert_90  : true,
    alert_100:    item?.alert_100 !== undefined ? !!item.alert_100 : true,
  });
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  useEffect(() => {
    api.get('/categories/expense').then(({ data }) => {
      setCategories(data.data.categories);
      if (!isEdit && data.data.categories.length > 0) {
        setForm(p => ({ ...p, category_id: data.data.categories[0].id }));
      }
    });
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.category_id)  e.category_id  = 'Select a category';
    if (!form.amount_limit || parseFloat(form.amount_limit) <= 0) e.amount_limit = 'Enter a valid limit';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        category_id:  parseInt(form.category_id),
        amount_limit: parseFloat(form.amount_limit),
        month:        form.month,
        year:         form.year,
        alert_75:     form.alert_75  ? 1 : 0,
        alert_90:     form.alert_90  ? 1 : 0,
        alert_100:    form.alert_100 ? 1 : 0,
      };
      if (isEdit) {
        await api.put(`/budgets/${item.id}`, payload);
      } else {
        await api.post('/budgets', payload);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to save budget.');
    } finally {
      setLoading(false);
    }
  };

  const Toggle = ({ label, value, onToggle }) => (
    <TouchableOpacity style={styles.toggleRow} onPress={onToggle}>
      <View style={[styles.toggle, value && styles.toggleOn]}>
        <View style={[styles.thumb, value && styles.thumbOn]} />
      </View>
      <Text style={styles.toggleLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.periodBadge}>
          <Text style={styles.periodText}>{monthName(form.month)} {form.year}</Text>
        </View>

        <Text style={styles.label}>Category *</Text>
        <View style={styles.chips}>
          {categories.map(cat => (
            <TouchableOpacity key={cat.id}
              style={[styles.chip, form.category_id === cat.id && styles.chipActive]}
              onPress={() => set('category_id', cat.id)}
            >
              <Text style={[styles.chipText, form.category_id === cat.id && styles.chipTextActive]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.category_id ? <Text style={styles.errText}>{errors.category_id}</Text> : null}

        <Input
          label="Spending Limit (₦) *"
          value={form.amount_limit}
          onChangeText={v => set('amount_limit', v)}
          placeholder="0.00"
          keyboardType="decimal-pad"
          prefix="₦"
          error={errors.amount_limit}
        />

        <Text style={styles.sectionTitle}>Budget Alerts</Text>
        <Toggle label="Alert at 75% spent"  value={form.alert_75}  onToggle={() => set('alert_75',  !form.alert_75)} />
        <Toggle label="Alert at 90% spent"  value={form.alert_90}  onToggle={() => set('alert_90',  !form.alert_90)} />
        <Toggle label="Alert when exceeded" value={form.alert_100} onToggle={() => set('alert_100', !form.alert_100)} />

        <Button title={isEdit ? 'Update Budget' : 'Set Budget'} onPress={handleSave} loading={loading} size="lg" style={styles.saveBtn} />
        <Button title="Cancel" onPress={() => navigation.goBack()} variant="secondary" size="lg" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex:   { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  periodBadge: { backgroundColor: COLORS.primary + '15', borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center', marginBottom: SPACING.lg },
  periodText:  { color: COLORS.primary, fontWeight: FONTS.weights.bold, fontSize: FONTS.sizes.md },
  label:       { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.medium, color: COLORS.textPrimary, marginBottom: SPACING.xs },
  chips:       { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.sm },
  chip:        { paddingHorizontal: SPACING.sm, paddingVertical: 6, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white },
  chipActive:  { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '15' },
  chipText:    { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.primary, fontWeight: FONTS.weights.semibold },
  errText:     { fontSize: FONTS.sizes.xs, color: COLORS.danger, marginBottom: SPACING.sm },
  sectionTitle:{ fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textPrimary, marginBottom: SPACING.sm, marginTop: SPACING.sm },
  toggleRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  toggle:      { width: 44, height: 24, borderRadius: 12, backgroundColor: COLORS.border, justifyContent: 'center', paddingHorizontal: 2 },
  toggleOn:    { backgroundColor: COLORS.primary },
  thumb:       { width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.white },
  thumbOn:     { marginLeft: 20 },
  toggleLabel: { marginLeft: SPACING.sm, fontSize: FONTS.sizes.md, color: COLORS.textPrimary },
  saveBtn:     { marginTop: SPACING.md, marginBottom: SPACING.sm },
});

export default AddBudgetScreen;
