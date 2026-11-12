import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import api from '../../services/api';
import { formatNaira, monthName, abbreviateNaira } from '../../utils/formatters';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../styles/theme';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Card from '../../components/common/Card';

const { width } = Dimensions.get('window');
const chartWidth = width - SPACING.lg * 4;

const TABS = ['Monthly', 'Weekly', 'Category', 'Savings'];

const chartConfig = {
  backgroundGradientFrom: COLORS.white,
  backgroundGradientTo:   COLORS.white,
  color: (opacity = 1) => `rgba(27, 94, 32, ${opacity})`,
  labelColor: () => COLORS.textSecondary,
  barPercentage: 0.6,
  propsForLabels: { fontSize: 10 },
};

const ReportsScreen = () => {
  const [tab,       setTab]       = useState('Monthly');
  const [monthly,   setMonthly]   = useState(null);
  const [weekly,    setWeekly]    = useState(null);
  const [catData,   setCatData]   = useState(null);
  const [savings,   setSavings]   = useState(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [m, w, c, s] = await Promise.all([
        api.get('/reports/monthly?months=6'),
        api.get('/reports/weekly?weeks=6'),
        api.get('/reports/category/expense'),
        api.get('/reports/savings'),
      ]);
      setMonthly(m.data.data);
      setWeekly(w.data.data);
      setCatData(c.data.data);
      setSavings(s.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return <LoadingSpinner message="Loading reports..." />;

  // ── Monthly chart data ──────────────────────────────────────
  const monthlyIncomeMap  = {};
  const monthlyExpenseMap = {};
  (monthly?.income_by_month  || []).forEach(r => { monthlyIncomeMap[`${r.yr}-${r.mo}`]  = parseFloat(r.total); });
  (monthly?.expense_by_month || []).forEach(r => { monthlyExpenseMap[`${r.yr}-${r.mo}`] = parseFloat(r.total); });

  const now   = new Date();
  const labels = [];
  const incomeVals   = [];
  const expenseVals  = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    labels.push(monthName(d.getMonth() + 1).slice(0, 3));
    incomeVals.push(monthlyIncomeMap[key]  || 0);
    expenseVals.push(monthlyExpenseMap[key] || 0);
  }

  const lineData = {
    labels,
    datasets: [
      { data: incomeVals,  color: () => COLORS.income,  strokeWidth: 2 },
      { data: expenseVals, color: () => COLORS.expense,  strokeWidth: 2 },
    ],
    legend: ['Income', 'Expenses'],
  };

  // ── Category pie data ──────────────────────────────────────
  const pieData = (catData?.categories || []).slice(0, 6).map((c, i) => ({
    name:         c.name.length > 10 ? c.name.slice(0, 9) + '…' : c.name,
    population:   c.total,
    color:        c.color || `hsl(${i * 60}, 65%, 55%)`,
    legendFontColor: COLORS.textSecondary,
    legendFontSize: 10,
  }));

  return (
    <View style={styles.flex}>
      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* ── Monthly tab ─────────────────────────────────────── */}
        {tab === 'Monthly' && (
          <>
            <Card>
              <Text style={styles.chartTitle}>Income vs Expenses (6 months)</Text>
              <LineChart
                data={lineData}
                width={chartWidth}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                formatYLabel={v => abbreviateNaira(v).replace('₦', '')}
              />
            </Card>
            <Card>
              <Text style={styles.chartTitle}>Monthly Breakdown</Text>
              {labels.map((l, i) => (
                <View key={l} style={styles.summaryRow}>
                  <Text style={styles.summaryMonth}>{l}</Text>
                  <Text style={[styles.summaryVal, { color: COLORS.income }]}>{abbreviateNaira(incomeVals[i])}</Text>
                  <Text style={[styles.summaryVal, { color: COLORS.expense }]}>{abbreviateNaira(expenseVals[i])}</Text>
                  <Text style={[styles.summaryVal, {
                    color: incomeVals[i] - expenseVals[i] >= 0 ? COLORS.income : COLORS.expense,
                  }]}>{abbreviateNaira(incomeVals[i] - expenseVals[i])}</Text>
                </View>
              ))}
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryMonth, { fontWeight: FONTS.weights.bold }]}>Labels</Text>
                <Text style={[styles.summaryHdr, { color: COLORS.income }]}>Income</Text>
                <Text style={[styles.summaryHdr, { color: COLORS.expense }]}>Expenses</Text>
                <Text style={styles.summaryHdr}>Net</Text>
              </View>
            </Card>
          </>
        )}

        {/* ── Weekly tab ──────────────────────────────────────── */}
        {tab === 'Weekly' && (
          <Card>
            <Text style={styles.chartTitle}>Weekly Expenses (last 6 weeks)</Text>
            {(weekly?.expense_by_week || []).length > 0 ? (
              <BarChart
                data={{
                  labels:   (weekly.expense_by_week || []).slice(0, 6).reverse().map((_, i) => `W${i + 1}`),
                  datasets: [{ data: (weekly.expense_by_week || []).slice(0, 6).reverse().map(w => w.expenses) }],
                }}
                width={chartWidth}
                height={200}
                chartConfig={{ ...chartConfig, color: (opacity) => `rgba(198, 40, 40, ${opacity})` }}
                style={styles.chart}
                formatYLabel={v => abbreviateNaira(v).replace('₦', '')}
              />
            ) : <Text style={styles.noData}>No weekly data available</Text>}
          </Card>
        )}

        {/* ── Category tab ────────────────────────────────────── */}
        {tab === 'Category' && (
          <>
            {pieData.length > 0 && (
              <Card>
                <Text style={styles.chartTitle}>Spending by Category</Text>
                <PieChart
                  data={pieData}
                  width={chartWidth}
                  height={180}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="10"
                />
              </Card>
            )}
            <Card>
              <Text style={styles.chartTitle}>Category Details</Text>
              {(catData?.categories || []).map(c => (
                <View key={c.id} style={styles.catRow}>
                  <View style={[styles.catDot, { backgroundColor: c.color }]} />
                  <Text style={styles.catName}>{c.name}</Text>
                  <Text style={styles.catPct}>{c.percentage}%</Text>
                  <Text style={styles.catTotal}>{formatNaira(c.total)}</Text>
                </View>
              ))}
              {(catData?.categories || []).length === 0 && <Text style={styles.noData}>No expense data</Text>}
            </Card>
          </>
        )}

        {/* ── Savings tab ─────────────────────────────────────── */}
        {tab === 'Savings' && (
          <Card>
            <Text style={styles.chartTitle}>Savings Goals Progress</Text>
            {(savings?.goals || []).map(g => (
              <View key={g.id} style={styles.goalRow}>
                <Text style={styles.goalTitle}>{g.title}</Text>
                <View style={styles.goalBarBg}>
                  <View style={[styles.goalBarFill, { width: `${g.percentage}%` }]} />
                </View>
                <View style={styles.goalAmts}>
                  <Text style={styles.goalSaved}>Saved: {formatNaira(g.current_amount)}</Text>
                  <Text style={styles.goalTarget}>Goal: {formatNaira(g.target_amount)}</Text>
                  <Text style={styles.goalPct}>{g.percentage}%</Text>
                </View>
                <Text style={styles.goalDeposits}>
                  Total deposited: {formatNaira(g.total_deposited)} | Withdrawn: {formatNaira(g.total_withdrawn)}
                </Text>
              </View>
            ))}
            {(savings?.goals || []).length === 0 && <Text style={styles.noData}>No savings goals</Text>}
          </Card>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex:    { flex: 1, backgroundColor: COLORS.background },
  tabBar:  { flexDirection: 'row', backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  tab:     { flex: 1, paddingVertical: SPACING.sm + 2, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2.5, borderBottomColor: COLORS.primary },
  tabText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.primary, fontWeight: FONTS.weights.bold },
  content:    { padding: SPACING.md, paddingBottom: SPACING.xxl },
  chartTitle: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textPrimary, marginBottom: SPACING.sm },
  chart:      { marginLeft: -SPACING.sm, borderRadius: RADIUS.md },
  noData:     { textAlign: 'center', color: COLORS.textMuted, padding: SPACING.lg },
  summaryRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  summaryMonth: { flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  summaryVal:   { flex: 1, fontSize: FONTS.sizes.sm, textAlign: 'right' },
  summaryHdr:   { flex: 1, fontSize: FONTS.sizes.xs, color: COLORS.textMuted, textAlign: 'right' },
  catRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  catDot:  { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  catName: { flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.textPrimary },
  catPct:  { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginHorizontal: 8 },
  catTotal:{ fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold, color: COLORS.textPrimary },
  goalRow:    { marginBottom: SPACING.md },
  goalTitle:  { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold, color: COLORS.textPrimary, marginBottom: 6 },
  goalBarBg:  { height: 8, backgroundColor: COLORS.divider, borderRadius: RADIUS.full, overflow: 'hidden', marginBottom: 6 },
  goalBarFill:{ height: '100%', backgroundColor: COLORS.savings, borderRadius: RADIUS.full },
  goalAmts:   { flexDirection: 'row', justifyContent: 'space-between' },
  goalSaved:  { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  goalTarget: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  goalPct:    { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold, color: COLORS.savings },
  goalDeposits:{ fontSize: 10, color: COLORS.textMuted, marginTop: 4 },
});

export default ReportsScreen;
