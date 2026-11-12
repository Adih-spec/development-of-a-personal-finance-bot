/**
 * SyncBanner – shows when there are pending offline records
 */
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { COLORS, FONTS, SPACING } from '../../styles/theme';
import { getPendingCount, syncPendingRecords } from '../../services/syncService';

const SyncBanner = ({ onSynced }) => {
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing,      setSyncing]      = useState(false);
  const [isOnline,     setIsOnline]     = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(!!state.isConnected);
    });
    refresh();
    return () => unsubscribe();
  }, []);

  const refresh = async () => {
    const c = await getPendingCount();
    setPendingCount(c);
  };

  const handleSync = async () => {
    setSyncing(true);
    await syncPendingRecords();
    await refresh();
    setSyncing(false);
    onSynced && onSynced();
  };

  if (!pendingCount && isOnline) return null;

  return (
    <View style={[styles.banner, !isOnline && styles.offline]}>
      <Text style={styles.text}>
        {!isOnline
          ? '📵 Offline – transactions will sync when connected'
          : `☁️ ${pendingCount} unsync'd transaction${pendingCount !== 1 ? 's' : ''}`}
      </Text>
      {isOnline && pendingCount > 0 && (
        <TouchableOpacity onPress={handleSync} disabled={syncing} style={styles.btn}>
          {syncing
            ? <ActivityIndicator size="small" color={COLORS.white} />
            : <Text style={styles.btnText}>Sync Now</Text>}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    justifyContent: 'space-between',
  },
  offline: { backgroundColor: COLORS.textSecondary },
  text: { color: COLORS.white, fontSize: FONTS.sizes.sm, flex: 1 },
  btn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: SPACING.sm,
  },
  btnText: { color: COLORS.textPrimary, fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold },
});

export default SyncBanner;
