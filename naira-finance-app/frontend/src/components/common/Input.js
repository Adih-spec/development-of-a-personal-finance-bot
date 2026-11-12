import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../styles/theme';

const Input = ({
  label, value, onChangeText, placeholder, secureTextEntry = false,
  keyboardType = 'default', error, multiline = false, editable = true,
  style, inputStyle, prefix, suffix, onPress,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = secureTextEntry;

  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        activeOpacity={onPress ? 0.7 : 1}
        onPress={onPress}
        style={[styles.inputRow, error && styles.inputError, !editable && styles.disabled]}
      >
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          style={[styles.input, multiline && styles.multiline, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={isPassword && !showPassword}
          keyboardType={keyboardType}
          multiline={multiline}
          editable={editable && !onPress}
          pointerEvents={onPress ? 'none' : 'auto'}
          autoCapitalize="none"
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
        {isPassword ? (
          <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={styles.eye}>
            <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: SPACING.md },
  label: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    minHeight: 48,
  },
  inputError: { borderColor: COLORS.danger },
  disabled:   { backgroundColor: COLORS.background, opacity: 0.7 },
  input: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.sm,
  },
  multiline: { height: 90, textAlignVertical: 'top', paddingTop: SPACING.sm },
  prefix: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary, marginRight: 4 },
  suffix: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginLeft: 4 },
  eye:    { paddingLeft: SPACING.sm },
  eyeText:{ fontSize: 18 },
  error: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.danger,
    marginTop: 4,
  },
});

export default Input;
