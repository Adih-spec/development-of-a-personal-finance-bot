import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../styles/theme';

const TransactionHomeScreen = ({ navigation }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Transactions</Text>
    <Text style={styles.sub}>Record and view your income and expenses</Text>

    <TouchableOpacity style={[styles.card, { borderLeftColor: COLORS.income }]}
      onPress={() => navigation.navigate('IncomeList')}>
      <Text style={styles.cardIcon}>💰</Text>
      <View>
        <Text style={styles.cardTitle}>Income</Text>
        <Text style={styles.cardSub}>View and add income records</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>

    <TouchableOpacity style={[styles.card, { borderLeftColor: COLORS.expense }]}
      onPress={() => navigation.navigate('ExpenseList')}>
      <Text style={styles.cardIcon}>💳</Text>
      <View>
        <Text style={styles.cardTitle}>Expenses</Text>
        <Text style={styles.cardSub}>Track your spending</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>

    <View style={styles.btnRow}>
      <TouchableOpacity style={[styles.addBtn, { backgroundColor: COLORS.income }]}
        onPress={() => navigation.navigate('AddIncome')}>
        <Text style={styles.addBtnText}>+ Add Income</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.addBtn, { backgroundColor: COLORS.expense }]}
        onPress={() => navigation.navigate('AddExpense')}>
        <Text style={styles.addBtnText}>+ Add Expense</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.lg },
  title:     { fontSize: FONTS.sizes.xxl, fontWeight: FONTS.weights.bold, color: COLORS.textPrimary },
  sub:       { fontSize: FONTS.sizes.md, color: COLORS.textSecondary, marginBottom: SPACING.xl },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md,
    borderLeftWidth: 5, ...SHADOW.sm,
  },
  cardIcon:  { fontSize: 32, marginRight: SPACING.md },
  cardTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.textPrimary },
  cardSub:   { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, flex: 1 },
  arrow:     { fontSize: 24, color: COLORS.textMuted, marginLeft: 'auto' },
  btnRow:    { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg },
  addBtn:    { flex: 1, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center' },
  addBtnText:{ color: COLORS.white, fontWeight: FONTS.weights.bold, fontSize: FONTS.sizes.md },
});

export default TransactionHomeScreen;
