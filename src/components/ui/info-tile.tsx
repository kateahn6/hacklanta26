import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/theme/tokens';

import { AppText } from './app-text';
import type { IconName } from './icon-button';

export function InfoTile({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={styles.tile}>
      <Ionicons name={icon} size={16} color={Colors.olive} />
      <AppText variant="caption">{label}</AppText>
      <AppText variant="label">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, minWidth: 96, gap: 2, padding: Spacing.md, borderRadius: Radius.md, backgroundColor: Colors.sageSoft },
});
