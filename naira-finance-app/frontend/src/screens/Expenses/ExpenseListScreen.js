import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { formatNaira, formatDate } from '../../utils/formatters';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../styles/theme';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState     from '../../components/common/EmptyState';

const ExpenseListScreen = ({ navigation }) => {
  const [expenses,   setExpenses]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState('');
  const [total,      setTotal]      = useState(0);

  const fetchExpenses = async (q = '') => {
    try {
      const params = q ? `?search=${encodeURIComponent(q)}&limit=50` : '?limit=50';
      const { data } = await api.get('/expenses' + params);
      setExpenses(data.data.expenses);
      const sum = data.data.expenses.reduce((acc, e) => acc + parseFloat(e.amount), 0);
      setTotal(sum);
    } catch (e) {
      console.error(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchExpenses(); }, []));

  const handleDelete = (id) => {
    Alert.alert('Delete Expense', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/expenses/${id}`);
            fetchExpenses(search);
          } catch { Alert.alert('Error', 'Failed to delete.'); }
        },
      },
    ]);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.flex}>
      <View style={styles.totalBanner}>
        <Text style={styles.totalLabel}>Total Expenses</Text>
        <Text style={styles.totalAmount}>{formatNaira(total)}</Text>
      </View>

      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search expenses..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={v => { setSearch(v); fetchExpenses(v); }}
        />
      </View>

      <FlatList
        data={expenses}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={expenses.length === 0 ? styles.flex : styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchExpenses(search); }} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          <EmptyState
            icon="💳" title="No expenses recorded"
            subtitle="Tap + to record your first expense"
            actionLabel="Add Expense"
            onAction={() => navigation.navigate('AddExpense')}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
              <Text style={{ fontSize: 18 }}>💸</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.category}>{item.category_name}</Text>
              {item.description ? <Text style={styles.desc} numberOfLines={1}>{item.description}</Text> : null}
              <Text style={styles.date}>{formatDate(item.transaction_date)}</Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.amount}>-{formatNaira(item.amount)}</Text>
              <View style={styles.payBadge}>
                <Text style={styles.payText}>{item.payment_method}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => navigation.navigate('AddExpense', { item })} style={styles.actionBtn}>
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionBtn}>
                  <Text style={styles.deleteText}>Del</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddExpense')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  flex:        { flex: 1, backgroundColor: COLORS.background },
  totalBanner: { backgroundColor: COLORS.expense, padding: SPACING.md },
  totalLabel:  { color: COLORS.white, opacity: 0.8, fontSize: FONTS.sizes.sm },
  totalAmount: { color: COLORS.white, fontSize: FONTS.sizes.xxl, fontWeight: FONTS.weights.extrabold },
  searchBox:   { backgroundColor: COLORS.white, padding: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  searchInput: { backgroundColor: COLORS.background, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2, fontSize: FONTS.sizes.md, color: COLORS.textPrimary },
  list:  { padding: SPACING.md, paddingBottom: 80 },
  card:  { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOW.sm },
  iconBox: { width: 44, height: 44, borderRadius: RADIUS.full, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  info:    { flex: 1 },
  category:{ fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.semibold, color: COLORS.textPrimary },
  desc:    { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  date:    { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  right:   { alignItems: 'flex-end' },
  amount:  { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.expense },
  payBadge: { backgroundColor: COLORS.divider, borderRadius: RADIUS.sm, paddingHorizontal: 5, paddingVertical: 2, marginTop: 2 },
  payText:  { fontSize: 9, color: COLORS.textSecondary, textTransform: 'capitalize' },
  actions:  { flexDirection: 'row', marginTop: 4 },
  actionBtn:{ paddingHorizontal: 6, paddingVertical: 2 },
  editText: { fontSize: FONTS.sizes.xs, color: COLORS.primary },
  deleteText:{ fontSize: FONTS.sizes.xs, color: COLORS.danger },
  fab: {
    position: 'absolute', right: SPACING.lg, bottom: SPACING.lg,
    backgroundColor: COLORS.expense, width: 56, height: 56,
    borderRadius: RADIUS.full, justifyContent: 'center', alignItems: 'center', ...SHADOW.lg,
  },
  fabText: { color: COLORS.white, fontSize: 30, lineHeight: 34 },
});

export default ExpenseListScreen;
