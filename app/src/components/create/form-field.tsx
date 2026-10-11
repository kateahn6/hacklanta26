import type { ReactNode } from 'react';
import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors, Fonts, Radius, Spacing } from '@/theme/tokens';

interface FormFieldProps {
  label: string;
  optional?: boolean;
  hint?: string;
  error?: string | null;
  children: ReactNode;
}

export function FormField({ label, optional, hint, error, children }: FormFieldProps) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <AppText variant="label">{label}</AppText>
        {optional ? <AppText variant="caption">Optional</AppText> : null}
      </View>
      {children}
      {error ? (
        <AppText variant="caption" color={Colors.danger} accessibilityRole="alert">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption">{hint}</AppText>
      ) : null}
    </View>
  );
}

interface TextBoxProps extends Omit<TextInputProps, 'style'> {
  invalid?: boolean;
}

export function TextBox({ invalid, multiline, ...props }: TextBoxProps) {
  return (
    <TextInput
      placeholderTextColor={Colors.muted}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
      {...props}
      style={[styles.input, multiline && styles.multiline, invalid && styles.invalid]}
    />
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.sm },
  labelRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  input: {
    minHeight: 48,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.hairline,
    fontFamily: Fonts.sans,
    fontSize: 15.5,
    color: Colors.softBlack,
  },
  multiline: { minHeight: 110, fontFamily: Fonts.serifItalic, fontSize: 18, lineHeight: 25 },
  invalid: { borderColor: Colors.danger },
});
