import { ActivityIndicator, Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { s } from '@/constants/styles';
import { C } from '@/constants/theme';

/** The prototype's ActionButton, plus a busy state for the API calls. */
export function ActionButton({
  label,
  onPress,
  secondary = false,
  busy = false,
  disabled = false,
  style,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  busy?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      style={[
        s.actionButton,
        secondary && s.secondaryButton,
        (disabled || busy) && { opacity: 0.55 },
        style,
      ]}>
      {busy ? (
        <ActivityIndicator color={secondary ? C.cherry : C.paper} />
      ) : (
        <Text style={[s.actionText, secondary && s.secondaryText]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[s.chip, active && s.chipActive]}>
      <Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function Banner({ text, tone = 'error' }: { text: string; tone?: 'error' | 'info' }) {
  return (
    <View style={[s.banner, tone === 'info' && s.bannerInfo]}>
      <Text style={s.bannerText}>{text}</Text>
    </View>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <Text style={s.eyebrow}>{children}</Text>;
}
