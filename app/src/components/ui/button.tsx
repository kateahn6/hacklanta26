import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { Colors, Fonts, HitTarget, Radius, Spacing } from '@/theme/tokens';

import { AppText } from './app-text';
import type { IconName } from './icon-button';
import { PressableScale } from './pressable-scale';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  flex?: boolean;
}

export function Button({ label, onPress, variant = 'primary', icon, disabled, loading, flex }: ButtonProps) {
  const primary = variant === 'primary';
  const color = primary ? Colors.white : Colors.navy;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.button,
        primary && styles.primary,
        variant === 'secondary' && styles.secondary,
        flex && styles.flex,
        (disabled || loading) && styles.disabled,
      ]}>
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={color} /> : null}
          <AppText style={[styles.label, { color }]}>{label}</AppText>
        </>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: HitTarget + 4,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  primary: { backgroundColor: Colors.navy },
  secondary: { borderWidth: 1.5, borderColor: Colors.navy },
  flex: { flex: 1 },
  disabled: { opacity: 0.45 },
  label: { fontFamily: Fonts.sansSemiBold, fontSize: 15 },
});
