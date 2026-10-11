import { useRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors, Fonts, Radius, Spacing } from '@/theme/tokens';

export const CODE_LENGTH = 6;

interface CodeInputProps {
  value: string;
  onChange: (code: string) => void;
  onSubmit: () => void;
  invalid?: boolean;
}

/** Six letter boxes over one hidden text field, so typing, pasting, and deleting all just work. */
export function CodeInput({ value, onChange, onSubmit, invalid }: CodeInputProps) {
  const input = useRef<TextInput>(null);
  const chars = value.padEnd(CODE_LENGTH, ' ').split('').slice(0, CODE_LENGTH);

  return (
    <Pressable accessible={false} onPress={() => input.current?.focus()} style={styles.wrap}>
      <View style={styles.boxes} pointerEvents="none">
        {chars.map((char, i) => {
          const active = i === Math.min(value.length, CODE_LENGTH - 1);
          return (
            <View key={i} style={[styles.box, active && styles.active, invalid && styles.invalid]}>
              <AppText style={styles.char}>{char.trim()}</AppText>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={input}
        value={value}
        onChangeText={(text) => onChange(text.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, CODE_LENGTH))}
        autoFocus
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        maxLength={CODE_LENGTH}
        returnKeyType="go"
        onSubmitEditing={onSubmit}
        accessibilityLabel="Scrapbook access code"
        accessibilityHint="Six letters and numbers"
        caretHidden
        style={styles.hidden}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch' },
  boxes: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm },
  box: {
    flex: 1,
    aspectRatio: 0.82,
    maxWidth: 56,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.hairline,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: { borderColor: Colors.navy },
  invalid: { borderColor: Colors.danger },
  char: { fontFamily: Fonts.sansBold, fontSize: 26, color: Colors.navy },
  hidden: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.02, color: 'transparent' },
});
