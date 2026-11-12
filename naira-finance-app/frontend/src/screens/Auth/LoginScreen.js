import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Button  from '../../components/common/Button';
import Input   from '../../components/common/Input';
import { COLORS, FONTS, SPACING, RADIUS } from '../../styles/theme';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});

  const validate = () => {
    const e = {};
    if (!email.trim())    e.email    = 'Email is required';
    if (!password.trim()) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (!result.success) {
      Alert.alert('Login Failed', result.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>₦</Text>
          <Text style={styles.appName}>Naira Finance</Text>
          <Text style={styles.tagline}>Track your money, grow your wealth</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          <Input
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            error={errors.email}
          />

          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            error={errors.password}
          />

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginBtn}
            size="lg"
          />

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Create one</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1 },
  header: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    paddingTop: SPACING.xxl + 16,
    paddingBottom: SPACING.xxl,
  },
  logo:     { fontSize: 64, color: COLORS.accent },
  appName:  { fontSize: FONTS.sizes.xxl, fontWeight: FONTS.weights.extrabold, color: COLORS.white, marginTop: 4 },
  tagline:  { fontSize: FONTS.sizes.sm, color: COLORS.white, opacity: 0.8, marginTop: 6 },
  form: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    marginTop: -RADIUS.xl,
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  title:    { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold, color: COLORS.textPrimary },
  subtitle: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary, marginBottom: SPACING.lg, marginTop: 4 },
  loginBtn: { marginTop: SPACING.sm },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.lg },
  registerText:{ fontSize: FONTS.sizes.md, color: COLORS.textSecondary },
  registerLink:{ fontSize: FONTS.sizes.md, color: COLORS.primary, fontWeight: FONTS.weights.semibold },
});

export default LoginScreen;
