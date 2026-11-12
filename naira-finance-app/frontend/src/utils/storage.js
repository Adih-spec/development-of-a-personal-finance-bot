/**
 * src/utils/storage.js
 * AsyncStorage helpers
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  AUTH_TOKEN:    '@naira_auth_token',
  USER_DATA:     '@naira_user_data',
  OFFLINE_QUEUE: '@naira_offline_queue',
  CACHED_DATA:   '@naira_cached_',
};

export const storeToken = async (token) => {
  await AsyncStorage.setItem(KEYS.AUTH_TOKEN, token);
};

export const getToken = async () => {
  return await AsyncStorage.getItem(KEYS.AUTH_TOKEN);
};

export const removeToken = async () => {
  await AsyncStorage.removeItem(KEYS.AUTH_TOKEN);
};

export const storeUser = async (user) => {
  await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(user));
};

export const getUser = async () => {
  const raw = await AsyncStorage.getItem(KEYS.USER_DATA);
  return raw ? JSON.parse(raw) : null;
};

export const removeUser = async () => {
  await AsyncStorage.removeItem(KEYS.USER_DATA);
};

// ── Offline queue ────────────────────────────────────────────
export const getOfflineQueue = async () => {
  const raw = await AsyncStorage.getItem(KEYS.OFFLINE_QUEUE);
  return raw ? JSON.parse(raw) : [];
};

export const addToOfflineQueue = async (item) => {
  const queue = await getOfflineQueue();
  queue.push(item);
  await AsyncStorage.setItem(KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
};

export const removeFromOfflineQueue = async (localIds) => {
  const queue = await getOfflineQueue();
  const remaining = queue.filter(item => !localIds.includes(item.local_id));
  await AsyncStorage.setItem(KEYS.OFFLINE_QUEUE, JSON.stringify(remaining));
};

export const clearOfflineQueue = async () => {
  await AsyncStorage.removeItem(KEYS.OFFLINE_QUEUE);
};

// ── Data cache ───────────────────────────────────────────────
export const cacheData = async (key, data, ttlSeconds = 300) => {
  const payload = { data, expires: Date.now() + ttlSeconds * 1000 };
  await AsyncStorage.setItem(KEYS.CACHED_DATA + key, JSON.stringify(payload));
};

export const getCachedData = async (key) => {
  const raw = await AsyncStorage.getItem(KEYS.CACHED_DATA + key);
  if (!raw) return null;
  const { data, expires } = JSON.parse(raw);
  if (Date.now() > expires) return null;
  return data;
};

export const clearAllCache = async () => {
  const keys = await AsyncStorage.getAllKeys();
  const cacheKeys = keys.filter(k => k.startsWith(KEYS.CACHED_DATA));
  if (cacheKeys.length > 0) await AsyncStorage.multiRemove(cacheKeys);
};
