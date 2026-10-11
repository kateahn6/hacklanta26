import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet } from 'react-native';

import { Colors, HitTarget } from '@/theme/tokens';

import { PressableScale } from './pressable-scale';

export type IconName = ComponentProps<typeof Ionicons>['name'];

interface IconButtonProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  variant?: 'surface' | 'clear' | 'primary';
  size?: number;
  iconColor?: string;
}

export function IconButton({ icon, label, onPress, variant = 'surface', size = HitTarget, iconColor }: IconButtonProps) {
  const background = variant === 'surface' ? Colors.surface : variant === 'primary' ? Colors.navy : 'transparent';
  const color = iconColor ?? (variant === 'primary' ? Colors.white : Colors.text);

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      onPress={onPress}
      style={[
        styles.button,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: background },
        variant === 'surface' && styles.raised,
      ]}>
      <Ionicons name={icon} size={Math.round(size * 0.45)} color={color} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', justifyContent: 'center' },
  raised: { boxShadow: '0 2px 10px rgba(22, 44, 94, 0.14)' },
});
