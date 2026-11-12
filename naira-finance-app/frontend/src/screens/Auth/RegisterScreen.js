import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useAuth }  from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input  from '../../components/common/Input';
import { COLORS, FONTS, SPACING, RADIUS } from '../../styles/theme';

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const [form,    setForm]    = useState({ full_name: '', email: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.full_name.trim())       e.full_name = 'Full name is required';
    if (!form.email.trim())           e.email     = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password)               e.password  = 'Password is required';
    else if (form.password.length < 8) e.password = 'Minimum 8 characters';
    else if (!/[A-Z]/.test(form.password)) e.password = 'Must contain uppercase letter';
    else if (!/[0-9]/.test(form.password)) e.password = 'Must contain a number';
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    const result = await register(form.full_name.trim(), form.email.trim(), form.phone.trim() || null, form.password);
    setLoading(false);
    if (!result.success) {
      Alert.alert('Registration Failed', result.message);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>₦</Text>
          <Text style={styles.appName}>Naira Finance</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start managing your finances today</Text>

          <Input label="Full Name" value={form.full_name} onChangeText={v => set('full_name', v)}
            placeholder="e.g. Chidi Okafor" error={errors.full_name} />

          <Input label="Email Address" value={form.email} onChangeText={v => set('email', v)}
            placeholder="you@example.com" keyboardType="email-address" error={errors.email} />

          <Input label="Phone Number (optional)" value={form.phone} onChangeText={v => set('phone', v)}
            placeholder="0801 234 5678" keyboardType="phone-pad" />

          <Input label="Password" value={form.password} onChangeText={v => set('password', v)}
            placeholder="Min 8 chars, 1 uppercase, 1 number" secureTextEntry error={errors.password} />

          <Input label="Confirm Password" value={form.confirm} onChangeText={v => set('confirm', v)}
            placeholder="Re-enter password" secureTextEntry error={errors.confirm} />

          <Button title="Create Account" onPress={handleRegister} loading={loading} size="lg" style={styles.btn} />

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex:     { flex: 1, backgroundColor: COLORS.background },
  scroll:   { flexGrow: 1 },
  header:   { backgroundColor: COLORS.primary, alignItems: 'center', paddingTop: SPACING.xl + 16, paddingBottom: SPACING.xl },
  logo:     { fontSize: 48, color: COLORS.accent },
  appName:  { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.extrabold, color: COLORS.white },
  form: {
    flex: 1, backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    marginTop: -RADIUS.xl, padding: SPACING.lg, paddingTop: SPACING.xl,
  },
  title:     { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold, color: COLORS.textPrimary },
  subtitle:  { fontSize: FONTS.sizes.md, color: COLORS.textSecondary, marginBottom: SPACING.lg, marginTop: 4 },
  btn:       { marginTop: SPACING.sm },
  loginRow:  { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.lg },
  loginText: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary },
  loginLink: { fontSize: FONTS.sizes.md, color: COLORS.primary, fontWeight: FONTS.weights.semibold },
});

export default RegisterScreen;
