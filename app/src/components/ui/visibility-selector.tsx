import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/theme/tokens';
import type { Visibility } from '@/types';

import { AppText } from './app-text';
import { PressableScale } from './pressable-scale';

const OPTIONS: { value: Visibility; title: string; detail: string; icon: 'earth-outline' | 'lock-closed-outline' }[] = [
  { value: 'public', title: 'Public', detail: 'Shows in Explore and Discover', icon: 'earth-outline' },
  { value: 'private', title: 'Private', detail: 'Only you can see it', icon: 'lock-closed-outline' },
];

export function VisibilitySelector({ value, onChange }: { value: Visibility; onChange: (v: Visibility) => void }) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <PressableScale
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            accessibilityLabel={`${option.title}. ${option.detail}`}
            onPress={() => onChange(option.value)}
            style={[styles.option, active && styles.active]}>
            <Ionicons name={option.icon} size={18} color={active ? Colors.cherry : Colors.muted} />
            <AppText variant="label" color={active ? Colors.cherry : Colors.softBlack}>
              {option.title}
            </AppText>
            <AppText variant="caption">{option.detail}</AppText>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.sm },
  option: {
    flex: 1,
    gap: 4,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.paper,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  active: { borderColor: Colors.cherry, backgroundColor: Colors.cherrySoft },
});
