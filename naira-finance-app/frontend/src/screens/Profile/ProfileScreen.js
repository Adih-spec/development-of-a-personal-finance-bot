import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS } from '../../styles/theme';
import Button from '../../components/common/Button';
import Input  from '../../components/common/Input';
import Card   from '../../components/common/Card';

const ProfileScreen = () => {
  const { user, updateUserLocal } = useAuth();

  const [profileForm, setProfileForm] = useState({ full_name: user?.full_name || '', phone: user?.phone || '' });
  const [pwdForm,     setPwdForm]     = useState({ current_password: '', new_password: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPwd,     setSavingPwd]     = useState(false);
  const [profileErr,    setProfileErr]    = useState({});
  const [pwdErr,        setPwdErr]        = useState({});

  const handleSaveProfile = async () => {
    if (!profileForm.full_name.trim()) { setProfileErr({ full_name: 'Name is required' }); return; }
    setSavingProfile(true);
    try {
      await api.put('/auth/profile', profileForm);
      updateUserLocal(profileForm);
      Alert.alert('Success', 'Profile updated.');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    const e = {};
    if (!pwdForm.current_password) e.current_password = 'Required';
    if (pwdForm.new_password.length < 8) e.new_password = 'Min 8 characters';
    if (pwdForm.confirm !== pwdForm.new_password) e.confirm = 'Passwords do not match';
    setPwdErr(e);
    if (Object.keys(e).length > 0) return;

    setSavingPwd(true);
    try {
      await api.put('/auth/change-password', { current_password: pwdForm.current_password, new_password: pwdForm.new_password });
      Alert.alert('Success', 'Password changed.');
      setPwdForm({ current_password: '', new_password: '', confirm: '' });
    } catch (ex) {
      Alert.alert('Error', ex.response?.data?.message || 'Failed.');
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.full_name?.charAt(0)?.toUpperCase()}</Text>
          </View>
          <Text style={styles.memberSince}>Member since {user?.created_at ? new Date(user.created_at).getFullYear() : ''}</Text>
        </View>

        {/* Profile */}
        <Card>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <Input label="Full Name" value={profileForm.full_name}
            onChangeText={v => setProfileForm(p => ({ ...p, full_name: v }))}
            error={profileErr.full_name} />
          <Input label="Phone Number" value={profileForm.phone}
            onChangeText={v => setProfileForm(p => ({ ...p, phone: v }))}
            keyboardType="phone-pad" />
          <Input label="Email" value={user?.email || ''} editable={false} />
          <Button title="Save Changes" onPress={handleSaveProfile} loading={savingProfile} />
        </Card>

        {/* Password */}
        <Card>
          <Text style={styles.sectionTitle}>Change Password</Text>
          <Input label="Current Password" value={pwdForm.current_password}
            onChangeText={v => setPwdForm(p => ({ ...p, current_password: v }))}
            secureTextEntry error={pwdErr.current_password} />
          <Input label="New Password" value={pwdForm.new_password}
            onChangeText={v => setPwdForm(p => ({ ...p, new_password: v }))}
            secureTextEntry error={pwdErr.new_password} />
          <Input label="Confirm New Password" value={pwdForm.confirm}
            onChangeText={v => setPwdForm(p => ({ ...p, confirm: v }))}
            secureTextEntry error={pwdErr.confirm} />
          <Button title="Change Password" onPress={handleChangePassword} loading={savingPwd} variant="secondary" />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex:          { flex: 1, backgroundColor: COLORS.background },
  content:       { padding: SPACING.md, paddingBottom: SPACING.xxl },
  avatarSection: { alignItems: 'center', marginBottom: SPACING.md },
  avatar:        { width: 80, height: 80, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText:    { fontSize: FONTS.sizes.hero, fontWeight: FONTS.weights.bold, color: COLORS.white },
  memberSince:   { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginTop: SPACING.xs },
  sectionTitle:  { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textPrimary, marginBottom: SPACING.md },
});

export default ProfileScreen;
