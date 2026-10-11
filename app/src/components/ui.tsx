import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';

export function Button({
  label,
  onPress,
  variant = 'primary',
  busy,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  busy?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.buttonPrimary : styles.buttonSecondary,
        (disabled || busy) && styles.buttonDisabled,
        pressed && styles.buttonPressed,
        style,
      ]}>
      {busy ? (
        <ActivityIndicator color={isPrimary ? '#fff' : Colors.ink} />
      ) : (
        <Text style={[styles.buttonLabel, !isPrimary && styles.buttonLabelSecondary]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function Tag({ label }: { label: string }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

export function Banner({ text, tone = 'error' }: { text: string; tone?: 'error' | 'info' }) {
  return (
    <View style={[styles.banner, tone === 'info' && styles.bannerInfo]}>
      <Text style={styles.bannerText}>{text}</Text>
    </View>
  );
}

export function Label({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.label, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  buttonPrimary: { backgroundColor: Colors.accent },
  buttonSecondary: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.line },
  buttonDisabled: { opacity: 0.5 },
  buttonPressed: { opacity: 0.8 },
  buttonLabel: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonLabelSecondary: { color: Colors.ink },
  tag: {
    backgroundColor: Colors.accentSoft,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  tagText: { color: Colors.accent, fontSize: 12, fontWeight: '600' },
  banner: {
    backgroundColor: '#FBE4DD',
    borderRadius: Radius.sm,
    padding: Spacing.sm,
  },
  bannerInfo: { backgroundColor: Colors.accentSoft },
  bannerText: { color: Colors.ink, fontSize: 13 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: Colors.inkSoft,
  },
});
