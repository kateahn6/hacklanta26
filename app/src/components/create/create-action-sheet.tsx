import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import type { IconName } from '@/components/ui/icon-button';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Colors, Gutter, Radius, Spacing } from '@/theme/tokens';

interface CreateActionSheetProps {
  visible: boolean;
  onClose: () => void;
}

interface Option {
  icon: IconName;
  title: string;
  detail: string;
  href: '/create/postcard' | '/create/scrapbook';
  tone: string;
}

const OPTIONS: Option[] = [
  {
    icon: 'mail-open-outline',
    title: 'Create a postcard',
    detail: 'One place, one photo, and a short note about why you loved it.',
    href: '/create/postcard',
    tone: Colors.navySoft,
  },
  {
    icon: 'albums-outline',
    title: 'Create a scrapbook',
    detail: 'Your photos around a theme, laid out like a mood board.',
    href: '/create/scrapbook',
    tone: Colors.skySoft,
  },
];

export function CreateActionSheet({ visible, onClose }: CreateActionSheetProps) {
  const insets = useSafeAreaInsets();

  const choose = (href: Option['href']) => {
    onClose();
    router.push(href);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable accessibilityRole="button" accessibilityLabel="Close" style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <View style={styles.handle} />
        <AppText variant="heading">What are you sharing?</AppText>
        {OPTIONS.map((option) => (
          <PressableScale
            key={option.href}
            accessibilityRole="button"
            accessibilityLabel={option.title}
            onPress={() => choose(option.href)}
            style={styles.option}>
            <View style={[styles.icon, { backgroundColor: option.tone }]}>
              <Ionicons name={option.icon} size={22} color={Colors.navy} />
            </View>
            <View style={styles.optionText}>
              <AppText variant="label">{option.title}</AppText>
              <AppText variant="caption">{option.detail}</AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </PressableScale>
        ))}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: Colors.overlay },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Gutter,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.hairline, marginBottom: Spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
  },
  icon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  optionText: { flex: 1, gap: 2 },
});
