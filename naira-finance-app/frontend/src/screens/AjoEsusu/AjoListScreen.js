import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { formatNaira, formatDate } from '../../utils/formatters';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../styles/theme';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState     from '../../components/common/EmptyState';
import Card           from '../../components/common/Card';

const TYPE_COLORS = { ajo: COLORS.income, esusu: COLORS.savings };
const STATUS_COLORS = { paid: COLORS.safe, pending: COLORS.caution, received: COLORS.income };

const AjoListScreen = ({ navigation }) => {
  const [data,       setData]       = useState(null);
  const [filter,     setFilter]     = useState('all');
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const params = filter !== 'all' ? `?type=${filter}&limit=50` : '?limit=50';
      const { data: res } = await api.get('/ajo' + params);
      setData(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, [filter]));

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Delete this contribution record?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await api.delete(`/ajo/${id}`);
        fetchData();
      }},
    ]);
  };

  if (loading) return <LoadingSpinner />;

  const contributions = data?.contributions || [];
  const summary       = data?.summary || {};

  return (
    <View style={styles.flex}>
      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryBox, { backgroundColor: COLORS.income + '20' }]}>
          <Text style={styles.summaryLabel}>Total Ajo</Text>
          <Text style={[styles.summaryVal, { color: COLORS.income }]}>{formatNaira(summary.total_ajo || 0)}</Text>
        </View>
        <View style={[styles.summaryBox, { backgroundColor: COLORS.savings + '20' }]}>
          <Text style={styles.summaryLabel}>Total Esusu</Text>
          <Text style={[styles.summaryVal, { color: COLORS.savings }]}>{formatNaira(summary.total_esusu || 0)}</Text>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {['all', 'ajo', 'esusu'].map(f => (
          <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={contributions}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={contributions.length === 0 ? styles.flex : styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          <EmptyState icon="🤝" title="No contributions recorded"
            subtitle="Start tracking your Ajo and Esusu contributions"
            actionLabel="Record Contribution"
            onAction={() => navigation.navigate('AddAjo')} />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={[styles.typeBadge, { backgroundColor: TYPE_COLORS[item.type] + '20' }]}>
              <Text style={[styles.typeText, { color: TYPE_COLORS[item.type] }]}>
                {item.type.toUpperCase()}
              </Text>
            </View>
            <View style={styles.info}>
              {item.group_name ? <Text style={styles.groupName}>{item.group_name}</Text> : null}
              {item.description ? <Text style={styles.desc} numberOfLines={1}>{item.description}</Text> : null}
              <Text style={styles.date}>{formatDate(item.contribution_date)} · {item.cycle}</Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.amount}>{formatNaira(item.amount)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '20' }]}>
                <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
                  {item.status}
                </Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => navigation.navigate('AddAjo', { item })}>
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ marginLeft: 8 }}>
                  <Text style={styles.delText}>Del</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddAjo')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  flex:         { flex: 1, backgroundColor: COLORS.background },
  summaryRow:   { flexDirection: 'row', padding: SPACING.sm, gap: SPACING.sm, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  summaryBox:   { flex: 1, borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center' },
  summaryLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  summaryVal:   { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, marginTop: 2 },
  filterRow:    { flexDirection: 'row', backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  filterBtn:    { flex: 1, padding: SPACING.sm, alignItems: 'center' },
  filterActive: { borderBottomWidth: 2.5, borderBottomColor: COLORS.primary },
  filterText:   { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  filterTextActive: { color: COLORS.primary, fontWeight: FONTS.weights.bold },
  list:   { padding: SPACING.md, paddingBottom: 80 },
  card:   { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOW.sm },
  typeBadge: { borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 3, marginRight: SPACING.sm, marginTop: 2 },
  typeText:  { fontSize: 10, fontWeight: FONTS.weights.bold },
  info:      { flex: 1 },
  groupName: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.semibold, color: COLORS.textPrimary },
  desc:      { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  date:      { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  right:     { alignItems: 'flex-end' },
  amount:    { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textPrimary },
  statusBadge: { borderRadius: RADIUS.full, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 },
  statusText:  { fontSize: 9, fontWeight: FONTS.weights.semibold },
  actions:   { flexDirection: 'row', marginTop: 4 },
  editText:  { fontSize: FONTS.sizes.xs, color: COLORS.primary },
  delText:   { fontSize: FONTS.sizes.xs, color: COLORS.danger },
  fab: { position: 'absolute', right: SPACING.lg, bottom: SPACING.lg, backgroundColor: COLORS.primary, width: 56, height: 56, borderRadius: RADIUS.full, justifyContent: 'center', alignItems: 'center', ...SHADOW.lg },
  fabText: { color: COLORS.white, fontSize: 30, lineHeight: 34 },
});

export default AjoListScreen;
