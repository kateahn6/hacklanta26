import { StyleSheet, Text, type TextProps } from 'react-native';

import { Colors, Fonts } from '@/theme/tokens';

export type TextVariant = 'display' | 'title' | 'heading' | 'subheading' | 'body' | 'label' | 'caption' | 'note' | 'overline';

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
}

export function AppText({ variant = 'body', color, style, ...props }: AppTextProps) {
  return <Text {...props} style={[styles[variant], color ? { color } : null, style]} />;
}

const styles = StyleSheet.create({
  display: { fontFamily: Fonts.sansBold, fontSize: 32, lineHeight: 38, color: Colors.text, letterSpacing: -0.9 },
  title: { fontFamily: Fonts.sansBold, fontSize: 25, lineHeight: 31, color: Colors.text, letterSpacing: -0.6 },
  heading: { fontFamily: Fonts.sansSemiBold, fontSize: 19, lineHeight: 25, color: Colors.text, letterSpacing: -0.3 },
  subheading: { fontFamily: Fonts.sansSemiBold, fontSize: 15.5, lineHeight: 21, color: Colors.text, letterSpacing: -0.2 },
  body: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 22, color: Colors.text },
  label: { fontFamily: Fonts.sansSemiBold, fontSize: 14, lineHeight: 18, color: Colors.text },
  caption: { fontFamily: Fonts.sans, fontSize: 12.5, lineHeight: 17, color: Colors.textMuted },
  note: { fontFamily: Fonts.sansItalic, fontSize: 18, lineHeight: 27, color: Colors.slate },
  overline: {
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.slate,
  },
});
