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
  display: { fontFamily: Fonts.serif, fontSize: 36, lineHeight: 40, color: Colors.softBlack, letterSpacing: -0.5 },
  title: { fontFamily: Fonts.serif, fontSize: 28, lineHeight: 33, color: Colors.softBlack },
  heading: { fontFamily: Fonts.serif, fontSize: 22, lineHeight: 27, color: Colors.softBlack },
  subheading: { fontFamily: Fonts.serif, fontSize: 17, lineHeight: 21, color: Colors.softBlack },
  body: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 22, color: Colors.softBlack },
  label: { fontFamily: Fonts.sansSemiBold, fontSize: 14, lineHeight: 18, color: Colors.softBlack },
  caption: { fontFamily: Fonts.sans, fontSize: 12.5, lineHeight: 17, color: Colors.muted },
  note: { fontFamily: Fonts.serifItalic, fontSize: 20, lineHeight: 28, color: Colors.chocolate },
  overline: {
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.olive,
  },
});
