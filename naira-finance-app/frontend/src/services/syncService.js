/**
 * src/services/syncService.js
 * Offline → Cloud synchronisation service
 */
import NetInfo from '@react-native-community/netinfo';
import { v4 as uuidv4 } from 'uuid';
import api from './api';
import {
  getOfflineQueue,
  addToOfflineQueue,
  removeFromOfflineQueue,
} from '../utils/storage';

/**
 * Create a local (offline) transaction record
 */
export const createOfflineRecord = async (entityType, data) => {
  const item = {
    local_id:    uuidv4(),
    entity_type: entityType,
    data,
    created_at:  new Date().toISOString(),
  };
  await addToOfflineQueue(item);
  return item.local_id;
};

/**
 * Attempt to synchronise all pending offline records
 * Returns { synced, failed, skipped }
 */
export const syncPendingRecords = async () => {
  const net = await NetInfo.fetch();
  if (!net.isConnected) {
    return { synced: 0, failed: 0, skipped: 'offline' };
  }

  const queue = await getOfflineQueue();
  if (queue.length === 0) return { synced: 0, failed: 0, skipped: 'empty' };

  try {
    const { data: result } = await api.post('/sync', { transactions: queue });
    const syncedIds = result.data.synced.map(s => s.local_id);

    if (syncedIds.length > 0) {
      await removeFromOfflineQueue(syncedIds);
    }

    return {
      synced:  result.data.synced.length,
      failed:  result.data.failed.length,
      skipped: 0,
    };
  } catch (err) {
    console.error('syncPendingRecords error:', err.message);
    return { synced: 0, failed: queue.length, skipped: 0 };
  }
};

/**
 * Returns true if there are unsynced records
 */
export const hasPendingSync = async () => {
  const queue = await getOfflineQueue();
  return queue.length > 0;
};

/**
 * Returns count of pending items
 */
export const getPendingCount = async () => {
  const queue = await getOfflineQueue();
  return queue.length;
};
