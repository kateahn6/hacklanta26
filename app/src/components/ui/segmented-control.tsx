import { StyleSheet, View } from 'react-native';

import { Colors, Fonts, Radius } from '@/theme/tokens';

import { AppText } from './app-text';
import { PressableScale } from './pressable-scale';

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  floating?: boolean;
}

export function SegmentedControl<T extends string>({ options, value, onChange, floating }: SegmentedControlProps<T>) {
  return (
    <View style={[styles.track, floating && styles.floating]} accessibilityRole="tablist">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <PressableScale
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.value)}
            style={[styles.segment, active && styles.active]}>
            <AppText style={[styles.label, { color: active ? Colors.white : Colors.text }]}>{option.label}</AppText>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', padding: 3, borderRadius: Radius.pill, backgroundColor: Colors.backgroundDeep },
  floating: { backgroundColor: Colors.surface, boxShadow: '0 2px 10px rgba(22, 44, 94, 0.14)' },
  segment: { flex: 1, minHeight: 36, paddingHorizontal: 14, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  active: { backgroundColor: Colors.navy },
  label: { fontFamily: Fonts.sansSemiBold, fontSize: 13.5 },
});
