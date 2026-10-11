import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Colors, Fonts, HitTarget, Radius, Spacing } from '@/theme/tokens';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  compact?: boolean;
}

export function SearchBar({ value, onChangeText, placeholder = 'Search places, neighborhoods, activities', compact }: SearchBarProps) {
  return (
    <View style={[styles.bar, compact && styles.compact]}>
      <Ionicons name="search" size={18} color={Colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        accessibilityLabel="Search"
        returnKeyType="search"
        autoCorrect={false}
        style={styles.input}
      />
      {value.length > 0 ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={10} onPress={() => onChangeText('')}>
          <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    height: HitTarget + 4,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
  },
  compact: { height: HitTarget, borderWidth: 0, boxShadow: '0 2px 10px rgba(22, 44, 94, 0.14)' },
  input: { flex: 1, fontFamily: Fonts.sans, fontSize: 15, color: Colors.text, paddingVertical: 0 },
});
