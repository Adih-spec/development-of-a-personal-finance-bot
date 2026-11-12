import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { formatNaira, formatDate } from '../../utils/formatters';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../styles/theme';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState     from '../../components/common/EmptyState';

const STATUS_COLORS = { active: COLORS.primary, completed: COLORS.safe, paused: COLORS.caution, cancelled: COLORS.danger };

const SavingsListScreen = ({ navigation }) => {
  const [goals,      setGoals]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGoals = async () => {
    try {
      const { data } = await api.get('/savings');
      setGoals(data.data.goals);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchGoals(); }, []));

  const handleDelete = (id) => {
    Alert.alert('Delete Goal', 'This will also delete all contributions. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await api.delete(`/savings/${id}`);
        fetchGoals();
      }},
    ]);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.flex}>
      <FlatList
        data={goals}
        keyExtractor={g => String(g.id)}
        contentContainerStyle={goals.length === 0 ? styles.flex : styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchGoals(); }} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          <EmptyState icon="🐷" title="No savings goals yet"
            subtitle="Create a goal and start saving towards it"
            actionLabel="Create Goal" onAction={() => navigation.navigate('AddSavings')} />
        }
        renderItem={({ item: g }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('SavingsDetail', { goalId: g.id })}>
            <View style={styles.cardTop}>
              <View style={[styles.iconCircle, { backgroundColor: g.color || COLORS.savings }]}>
                <Text style={{ fontSize: 22 }}>{g.icon || '🎯'}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.title}>{g.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[g.status] + '20' }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[g.status] }]}>
                    {g.status.charAt(0).toUpperCase() + g.status.slice(1)}
                  </Text>
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => navigation.navigate('AddSavings', { item: g })}>
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(g.id)} style={{ marginLeft: 8 }}>
                  <Text style={styles.delText}>Del</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${g.percentage}%`, backgroundColor: g.color || COLORS.savings }]} />
            </View>
            <View style={styles.amtRow}>
              <Text style={styles.current}>{formatNaira(g.current_amount)}</Text>
              <Text style={styles.pct}>{g.percentage}%</Text>
              <Text style={styles.target}>{formatNaira(g.target_amount)}</Text>
            </View>
            {g.target_date ? <Text style={styles.deadline}>Target: {formatDate(g.target_date)}</Text> : null}
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddSavings')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.md, paddingBottom: 80 },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOW.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  iconCircle: { width: 48, height: 48, borderRadius: RADIUS.full, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  info:    { flex: 1 },
  title:   { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textPrimary },
  statusBadge: { alignSelf: 'flex-start', borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 2, marginTop: 4 },
  statusText:  { fontSize: 10, fontWeight: FONTS.weights.semibold },
  actions:   { alignItems: 'flex-end' },
  editText:  { fontSize: FONTS.sizes.xs, color: COLORS.primary },
  delText:   { fontSize: FONTS.sizes.xs, color: COLORS.danger, marginTop: 4 },
  barBg:     { height: 8, backgroundColor: COLORS.divider, borderRadius: RADIUS.full, overflow: 'hidden', marginVertical: SPACING.xs },
  barFill:   { height: '100%', borderRadius: RADIUS.full },
  amtRow:    { flexDirection: 'row', alignItems: 'center' },
  current:   { flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  pct:       { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.textPrimary },
  target:    { flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, textAlign: 'right' },
  deadline:  { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 4 },
  fab: { position: 'absolute', right: SPACING.lg, bottom: SPACING.lg, backgroundColor: COLORS.savings, width: 56, height: 56, borderRadius: RADIUS.full, justifyContent: 'center', alignItems: 'center', ...SHADOW.lg },
  fabText: { color: COLORS.white, fontSize: 30, lineHeight: 34 },
});

export default SavingsListScreen;
