import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../styles/theme';

const MenuItem = ({ icon, label, onPress, danger }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <Text style={styles.menuIcon}>{icon}</Text>
    <Text style={[styles.menuLabel, danger && { color: COLORS.danger }]}>{label}</Text>
    <Text style={styles.menuArrow}>›</Text>
  </TouchableOpacity>
);

const MoreMenuScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      {/* Profile card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.full_name?.charAt(0)?.toUpperCase() || 'U'}</Text>
        </View>
        <View>
          <Text style={styles.userName}>{user?.full_name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.sectionCard}>
          <MenuItem icon="👤" label="My Profile"      onPress={() => navigation.navigate('Profile')} />
          <View style={styles.divider} />
          <MenuItem icon="📊" label="Financial Reports" onPress={() => navigation.navigate('Reports')} />
          <View style={styles.divider} />
          <MenuItem icon="🤝" label="Ajo & Esusu"    onPress={() => navigation.navigate('AjoList')} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>APP</Text>
        <View style={styles.sectionCard}>
          <MenuItem icon="🔒" label="Sign Out" onPress={handleLogout} danger />
        </View>
      </View>

      <Text style={styles.version}>Naira Finance v1.0.0</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  flex:        { flex: 1, backgroundColor: COLORS.background },
  content:     { padding: SPACING.md, paddingBottom: SPACING.xxl },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.lg, ...SHADOW.md },
  avatar:      { width: 52, height: 52, borderRadius: RADIUS.full, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  avatarText:  { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold, color: COLORS.textPrimary },
  userName:    { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.white },
  userEmail:   { fontSize: FONTS.sizes.sm, color: COLORS.white, opacity: 0.8 },
  section:     { marginBottom: SPACING.md },
  sectionLabel:{ fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold, color: COLORS.textMuted, marginBottom: SPACING.xs, marginLeft: SPACING.sm },
  sectionCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, ...SHADOW.sm },
  menuItem:    { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
  menuIcon:    { fontSize: 20, marginRight: SPACING.md, width: 28 },
  menuLabel:   { flex: 1, fontSize: FONTS.sizes.md, color: COLORS.textPrimary },
  menuArrow:   { fontSize: 20, color: COLORS.textMuted },
  divider:     { height: 1, backgroundColor: COLORS.divider, marginLeft: SPACING.lg + 28 },
  version:     { textAlign: 'center', fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: SPACING.xl },
});

export default MoreMenuScreen;
