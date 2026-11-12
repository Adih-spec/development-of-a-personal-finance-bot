import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PieChart } from 'react-native-chart-kit';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatNaira, abbreviateNaira, formatDate } from '../../utils/formatters';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../styles/theme';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SyncBanner     from '../../components/common/SyncBanner';
import Card           from '../../components/common/Card';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const { data: res } = await api.get('/dashboard/summary');
      setData(res.data);
    } catch (e) {
      console.error('Dashboard fetch:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchDashboard(); }, []));

  const onRefresh = () => { setRefreshing(true); fetchDashboard(); };

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  const ov = data?.overview   || {};
  const mo = data?.monthly    || {};
  const bg = data?.budget     || {};
  const recent     = data?.recent_transactions  || [];
  const goals      = data?.savings_goals        || [];
  const categories = data?.expense_by_category  || [];

  // Pie chart data
  const pieData = categories.slice(0, 5).map((c, i) => ({
    name: c.name,
    population: c.total,
    color: c.color || `hsl(${i * 72}, 65%, 50%)`,
    legendFontColor: COLORS.textSecondary,
    legendFontSize: 11,
  }));

  return (
    <View style={styles.flex}>
      <SyncBanner onSynced={fetchDashboard} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {/* Greeting */}
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greeting}>Good day, {user?.full_name?.split(' ')[0]} 👋</Text>
            <Text style={styles.greetingDate}>{new Date().toLocaleDateString('en-NG', { weekday:'long', day:'numeric', month:'long' })}</Text>
          </View>
        </View>

        {/* Balance card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>{formatNaira(ov.balance || 0)}</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>↑ Income</Text>
              <Text style={[styles.balanceItemValue, { color: COLORS.safe }]}>{abbreviateNaira(ov.total_income || 0)}</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>↓ Expenses</Text>
              <Text style={[styles.balanceItemValue, { color: COLORS.danger }]}>{abbreviateNaira(ov.total_expenses || 0)}</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>🐷 Savings</Text>
              <Text style={[styles.balanceItemValue, { color: COLORS.accent }]}>{abbreviateNaira(ov.total_savings || 0)}</Text>
            </View>
          </View>
        </View>

        {/* Monthly summary */}
        <Card>
          <Text style={styles.sectionTitle}>This Month</Text>
          <View style={styles.monthRow}>
            <View style={[styles.monthBox, { backgroundColor: '#E8F5E9' }]}>
              <Text style={styles.monthLabel}>Income</Text>
              <Text style={[styles.monthValue, { color: COLORS.income }]}>{formatNaira(mo.income || 0)}</Text>
            </View>
            <View style={[styles.monthBox, { backgroundColor: '#FFEBEE' }]}>
              <Text style={styles.monthLabel}>Expenses</Text>
              <Text style={[styles.monthValue, { color: COLORS.expense }]}>{formatNaira(mo.expenses || 0)}</Text>
            </View>
          </View>
          <View style={[styles.monthBox, { backgroundColor: (mo.net || 0) >= 0 ? '#E8F5E9' : '#FFEBEE', marginTop: 8 }]}>
            <Text style={styles.monthLabel}>Net</Text>
            <Text style={[styles.monthValue, { color: (mo.net || 0) >= 0 ? COLORS.income : COLORS.expense }]}>
              {formatNaira(mo.net || 0)}
            </Text>
          </View>
        </Card>

        {/* Budget overview */}
        {bg.total_limit > 0 && (
          <Card>
            <Text style={styles.sectionTitle}>Budget Utilisation</Text>
            <View style={styles.budgetBar}>
              <View style={[styles.budgetFill, {
                width: `${Math.min(100, bg.percentage_used || 0)}%`,
                backgroundColor: (bg.percentage_used || 0) >= 90 ? COLORS.danger :
                                 (bg.percentage_used || 0) >= 75 ? COLORS.warning : COLORS.safe,
              }]} />
            </View>
            <View style={styles.budgetLabels}>
              <Text style={styles.budgetText}>
                {formatNaira(bg.total_spent || 0)} of {formatNaira(bg.total_limit || 0)}
              </Text>
              <Text style={[styles.budgetPct, {
                color: (bg.percentage_used || 0) >= 90 ? COLORS.danger :
                       (bg.percentage_used || 0) >= 75 ? COLORS.warning : COLORS.income,
              }]}>{bg.percentage_used || 0}%</Text>
            </View>
          </Card>
        )}

        {/* Expense breakdown chart */}
        {pieData.length > 0 && (
          <Card>
            <Text style={styles.sectionTitle}>Spending Breakdown</Text>
            <PieChart
              data={pieData}
              width={width - SPACING.lg * 4}
              height={160}
              chartConfig={{ color: () => COLORS.primary }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="10"
              hasLegend={true}
              absolute={false}
            />
          </Card>
        )}

        {/* Savings goals */}
        {goals.length > 0 && (
          <Card>
            <Text style={styles.sectionTitle}>Savings Goals</Text>
            {goals.map(g => (
              <View key={g.id} style={styles.goalRow}>
                <Text style={styles.goalIcon}>{g.icon || '🎯'}</Text>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalTitle}>{g.title}</Text>
                  <View style={styles.goalBarBg}>
                    <View style={[styles.goalBarFill, { width: `${g.percentage}%`, backgroundColor: g.color || COLORS.savings }]} />
                  </View>
                  <Text style={styles.goalAmts}>
                    {formatNaira(g.current_amount)} / {formatNaira(g.target_amount)} — {g.percentage}%
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Recent transactions */}
        <Card>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
          </View>
          {recent.length === 0 ? (
            <Text style={styles.emptyText}>No transactions yet</Text>
          ) : (
            recent.map((tx, i) => (
              <View key={`${tx.tx_type}-${tx.id}`} style={[styles.txRow, i < recent.length - 1 && styles.txBorder]}>
                <View style={[styles.txIcon, { backgroundColor: tx.color + '20' }]}>
                  <Text style={{ fontSize: 18 }}>{tx.tx_type === 'income' ? '↑' : '↓'}</Text>
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txCategory}>{tx.category_name}</Text>
                  <Text style={styles.txDate}>{formatDate(tx.transaction_date)}</Text>
                </View>
                <Text style={[styles.txAmount, { color: tx.tx_type === 'income' ? COLORS.income : COLORS.expense }]}>
                  {tx.tx_type === 'income' ? '+' : '-'}{formatNaira(tx.amount)}
                </Text>
              </View>
            ))
          )}
        </Card>

        {/* Quick actions */}
        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('Transactions', { screen: 'AddIncome' })}>
            <Text style={styles.quickIcon}>+₦</Text>
            <Text style={styles.quickLabel}>Add Income</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickBtn, { backgroundColor: '#FFEBEE' }]} onPress={() => navigation.navigate('Transactions', { screen: 'AddExpense' })}>
            <Text style={[styles.quickIcon, { color: COLORS.expense }]}>-₦</Text>
            <Text style={styles.quickLabel}>Add Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickBtn, { backgroundColor: '#EDE7F6' }]} onPress={() => navigation.navigate('More', { screen: 'Reports' })}>
            <Text style={styles.quickIcon}>📊</Text>
            <Text style={styles.quickLabel}>Reports</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex:     { flex: 1, backgroundColor: COLORS.background },
  scroll:   { flex: 1 },
  content:  { padding: SPACING.md, paddingBottom: SPACING.xxl },

  greetingRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  greeting:      { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.textPrimary },
  greetingDate:  { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 2 },

  balanceCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOW.md,
  },
  balanceLabel:      { color: COLORS.white, opacity: 0.8, fontSize: FONTS.sizes.sm },
  balanceAmount:     { color: COLORS.accent, fontSize: FONTS.sizes.hero, fontWeight: FONTS.weights.extrabold, marginVertical: 4 },
  balanceRow:        { flexDirection: 'row', marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  balanceItem:       { flex: 1, alignItems: 'center' },
  balanceDivider:    { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  balanceItemLabel:  { color: COLORS.white, opacity: 0.7, fontSize: FONTS.sizes.xs },
  balanceItemValue:  { fontWeight: FONTS.weights.bold, fontSize: FONTS.sizes.sm, marginTop: 2 },

  sectionTitle: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textPrimary, marginBottom: SPACING.sm },

  monthRow:   { flexDirection: 'row', gap: SPACING.sm },
  monthBox:   { flex: 1, borderRadius: RADIUS.md, padding: SPACING.sm + 2, alignItems: 'center' },
  monthLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  monthValue: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, marginTop: 2 },

  budgetBar:    { height: 10, backgroundColor: COLORS.divider, borderRadius: RADIUS.full, overflow: 'hidden', marginBottom: 6 },
  budgetFill:   { height: '100%', borderRadius: RADIUS.full },
  budgetLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  budgetText:   { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  budgetPct:    { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold },

  goalRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  goalIcon:   { fontSize: 24, marginRight: SPACING.sm },
  goalInfo:   { flex: 1 },
  goalTitle:  { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.medium, color: COLORS.textPrimary },
  goalBarBg:  { height: 6, backgroundColor: COLORS.divider, borderRadius: RADIUS.full, marginVertical: 4, overflow: 'hidden' },
  goalBarFill:{ height: '100%', borderRadius: RADIUS.full },
  goalAmts:   { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },

  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emptyText:    { color: COLORS.textMuted, textAlign: 'center', fontSize: FONTS.sizes.sm, paddingVertical: SPACING.sm },
  txRow:        { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm },
  txBorder:     { borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  txIcon:       { width: 40, height: 40, borderRadius: RADIUS.full, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  txInfo:       { flex: 1 },
  txCategory:   { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.medium, color: COLORS.textPrimary },
  txDate:       { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  txAmount:     { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold },

  quickRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs, marginBottom: SPACING.xl },
  quickBtn: {
    flex: 1, backgroundColor: '#E8F5E9', borderRadius: RADIUS.md,
    alignItems: 'center', padding: SPACING.sm, ...SHADOW.sm,
  },
  quickIcon:  { fontSize: 22 },
  quickLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textPrimary, fontWeight: FONTS.weights.medium, marginTop: 4 },
});

export default DashboardScreen;
