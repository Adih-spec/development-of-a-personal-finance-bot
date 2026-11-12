import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';
import { COLORS, SPACING } from '../../styles/theme';
import Button from '../../components/common/Button';
import Input  from '../../components/common/Input';

const AddSavingsScreen = ({ route, navigation }) => {
  const editItem = route.params?.item;
  const isEdit   = !!editItem;

  const [form, setForm] = useState({
    title:        editItem?.title        || '',
    target_amount:editItem?.target_amount? String(editItem.target_amount) : '',
    target_date:  editItem?.target_date  || '',
    description:  editItem?.description  || '',
  });
  const [loading,        setLoading]       = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors,         setErrors]        = useState({});

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.title.trim())   e.title = 'Goal title is required';
    if (!form.target_amount || parseFloat(form.target_amount) <= 0) e.target_amount = 'Enter a valid target amount';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        title:         form.title.trim(),
        target_amount: parseFloat(form.target_amount),
        target_date:   form.target_date || null,
        description:   form.description || null,
      };
      if (isEdit) {
        await api.put(`/savings/${editItem.id}`, { ...payload, status: editItem.status });
      } else {
        await api.post('/savings', payload);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to save.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Input label="Goal Title *" value={form.title} onChangeText={v => set('title', v)} placeholder="e.g. Emergency Fund" error={errors.title} />
        <Input label="Target Amount (₦) *" value={form.target_amount} onChangeText={v => set('target_amount', v)} placeholder="0.00" keyboardType="decimal-pad" prefix="₦" error={errors.target_amount} />
        <Input
          label="Target Date (optional)"
          value={form.target_date ? formatDate(form.target_date) : ''}
          placeholder="Select date"
          editable={false}
          onPress={() => setShowDatePicker(true)}
          suffix="📅"
        />
        <DateTimePickerModal
          isVisible={showDatePicker}
          mode="date"
          minimumDate={new Date()}
          onConfirm={d => { set('target_date', d.toISOString().split('T')[0]); setShowDatePicker(false); }}
          onCancel={() => setShowDatePicker(false)}
        />
        <Input label="Description (optional)" value={form.description} onChangeText={v => set('description', v)} placeholder="What is this goal for?" multiline />
        <Button title={isEdit ? 'Update Goal' : 'Create Goal'} onPress={handleSave} loading={loading} size="lg" style={styles.saveBtn} />
        <Button title="Cancel" onPress={() => navigation.goBack()} variant="secondary" size="lg" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  saveBtn: { marginBottom: SPACING.sm },
});

export default AddSavingsScreen;
