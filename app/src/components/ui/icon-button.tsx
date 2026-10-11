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
  variant?: 'paper' | 'clear' | 'cherry';
  size?: number;
  iconColor?: string;
}

export function IconButton({ icon, label, onPress, variant = 'paper', size = HitTarget, iconColor }: IconButtonProps) {
  const background = variant === 'paper' ? Colors.paper : variant === 'cherry' ? Colors.cherry : 'transparent';
  const color = iconColor ?? (variant === 'cherry' ? Colors.cream : Colors.softBlack);

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      onPress={onPress}
      style={[
        styles.button,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: background },
        variant === 'paper' && styles.raised,
      ]}>
      <Ionicons name={icon} size={Math.round(size * 0.45)} color={color} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', justifyContent: 'center' },
  raised: { boxShadow: '0 2px 10px rgba(33, 31, 28, 0.14)' },
});
