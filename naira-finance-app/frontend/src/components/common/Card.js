import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../styles/theme';

const Card = ({ children, style, elevation = 'md' }) => (
  <View style={[styles.card, SHADOW[elevation], style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
});

export default Card;
