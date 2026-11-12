import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { formatNaira, monthName } from '../../utils/formatters';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../styles/theme';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState     from '../../components/common/EmptyState';

const BudgetListScreen = ({ navigation }) => {
  const now   = new Date();
  const [month,      setMonth]      = useState(now.getMonth() + 1);
  const [year,       setYear]       = useState(now.getFullYear());
  const [budgets,    setBudgets]    = useState([]);
  const [alerts,     setAlerts]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBudgets = async () => {
    try {
      const [bRes, aRes] = await Promise.all([
        api.get(`/budgets?month=${month}&year=${year}`),
        api.get('/budgets/alerts'),
      ]);
      setBudgets(bRes.data.data.budgets);
      setAlerts(aRes.data.data.alerts);
    } catch (e) { console.error(e.message); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchBudgets(); }, [month, year]));

  const handleDelete = (id) => {
    Alert.alert('Delete Budget', 'Remove this budget?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await api.delete(`/budgets/${id}`);
        fetchBudgets();
      }},
    ]);
  };

  const alertColor = (b) => {
    const pct = b.percentage_used;
    if (pct >= 100) return COLORS.danger;
    if (pct >= 90)  return COLORS.warning;
    if (pct >= 75)  return COLORS.caution;
    return COLORS.safe;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.flex}>
      {/* Month selector */}
      <View style={styles.monthRow}>
        <TouchableOpacity onPress={() => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); }}>
          <Text style={styles.arrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthName(month)} {year}</Text>
        <TouchableOpacity onPress={() => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); }}>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Alerts */}
      {alerts.length > 0 && (
        <View style={styles.alertsBanner}>
          <Text style={styles.alertsTitle}>⚠️ Budget Alerts</Text>
          {alerts.map(a => (
            <Text key={a.id} style={styles.alertItem}>
              {a.category_name}: {a.percentage_used}% used
              {a.alert_level === 'exceeded' ? ' — EXCEEDED!' : a.alert_level === 'warning' ? ' — Warning' : ' — Caution'}
            </Text>
          ))}
        </View>
      )}

      <FlatList
        data={budgets}
        keyExtractor={b => String(b.id)}
        contentContainerStyle={budgets.length === 0 ? styles.flex : styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBudgets(); }} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          <EmptyState
            icon="📊" title="No budgets for this month"
            subtitle="Set spending limits for each category"
            actionLabel="Set Budget"
            onAction={() => navigation.navigate('AddBudget', { month, year })}
          />
        }
        renderItem={({ item: b }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.catDot, { backgroundColor: b.color }]} />
              <Text style={styles.catName}>{b.category_name}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AddBudget', { item: b, month, year })}>
                <Text style={styles.editBtn}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(b.id)}>
                <Text style={styles.delBtn}>Del</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${b.percentage_used}%`, backgroundColor: alertColor(b) }]} />
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.spent}>{formatNaira(b.amount_spent)} spent</Text>
              <Text style={[styles.pct, { color: alertColor(b) }]}>{b.percentage_used}%</Text>
              <Text style={styles.limit}>of {formatNaira(b.amount_limit)}</Text>
            </View>
            <Text style={styles.remaining}>
              {b.remaining >= 0 ? `${formatNaira(b.remaining)} remaining` : `${formatNaira(Math.abs(b.remaining))} over budget`}
            </Text>
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddBudget', { month, year })}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white, padding: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  arrow:       { fontSize: 28, color: COLORS.primary, paddingHorizontal: SPACING.md },
  monthLabel:  { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.textPrimary },
  alertsBanner:{ backgroundColor: '#FFF9C4', padding: SPACING.sm, borderLeftWidth: 4, borderLeftColor: COLORS.warning, margin: SPACING.sm, borderRadius: RADIUS.sm },
  alertsTitle: { fontWeight: FONTS.weights.bold, color: COLORS.textPrimary, marginBottom: 4 },
  alertItem:   { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  list: { padding: SPACING.md, paddingBottom: 80 },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOW.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  catDot:  { width: 12, height: 12, borderRadius: 6, marginRight: SPACING.xs },
  catName: { flex: 1, fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.semibold, color: COLORS.textPrimary },
  editBtn: { fontSize: FONTS.sizes.xs, color: COLORS.primary, marginRight: SPACING.sm },
  delBtn:  { fontSize: FONTS.sizes.xs, color: COLORS.danger },
  barBg:   { height: 10, backgroundColor: COLORS.divider, borderRadius: RADIUS.full, overflow: 'hidden', marginBottom: 6 },
  barFill: { height: '100%', borderRadius: RADIUS.full },
  cardFooter: { flexDirection: 'row', alignItems: 'center' },
  spent:     { flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  pct:       { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, marginHorizontal: SPACING.xs },
  limit:     { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  remaining: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 4 },
  fab: { position: 'absolute', right: SPACING.lg, bottom: SPACING.lg, backgroundColor: COLORS.primary, width: 56, height: 56, borderRadius: RADIUS.full, justifyContent: 'center', alignItems: 'center', ...SHADOW.lg },
  fabText: { color: COLORS.white, fontSize: 30, lineHeight: 34 },
});

export default BudgetListScreen;
