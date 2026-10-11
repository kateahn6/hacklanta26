import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { Colors, Spacing } from '@/theme/tokens';

import { AppText } from './app-text';
import { Button } from './button';
import type { IconName } from './icon-button';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={26} color={Colors.slate} />
      </View>
      <AppText variant="heading" style={styles.center}>
        {title}
      </AppText>
      <AppText variant="body" color={Colors.textMuted} style={styles.center}>
        {message}
      </AppText>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} variant="secondary" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xxxl, paddingHorizontal: Spacing.xxl },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.skySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { textAlign: 'center' },
});
