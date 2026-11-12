import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../styles/theme';

const Button = ({
  title, onPress, loading = false, disabled = false,
  variant = 'primary', style, textStyle, size = 'md',
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? COLORS.white : COLORS.primary} size="small" />
      ) : (
        <Text style={[styles.text, styles[`text_${variant}`], textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: { backgroundColor: COLORS.primary },
  secondary: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: COLORS.primary },
  danger:  { backgroundColor: COLORS.danger },
  ghost:   { backgroundColor: 'transparent' },

  size_sm: { paddingVertical: SPACING.xs,  paddingHorizontal: SPACING.md, height: 36 },
  size_md: { paddingVertical: SPACING.sm + 2, paddingHorizontal: SPACING.lg, height: 48 },
  size_lg: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl, height: 56 },

  disabled: { opacity: 0.5 },

  text: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.semibold },
  text_primary:   { color: COLORS.white },
  text_secondary: { color: COLORS.primary },
  text_danger:    { color: COLORS.white },
  text_ghost:     { color: COLORS.primary },
});

export default Button;
