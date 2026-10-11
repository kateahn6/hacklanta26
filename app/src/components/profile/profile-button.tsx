import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { PressableScale } from '@/components/ui/pressable-scale';
import { DEMO_USER_ID } from '@/data/content-source';
import { useContent } from '@/store/content';
import { Colors, HitTarget } from '@/theme/tokens';

/** Your avatar in the top-right corner. Opens your profile. */
export function ProfileButton() {
  const content = useContent();
  const me = content.userById.get(DEMO_USER_ID);

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel="Your profile"
      hitSlop={4}
      onPress={() => router.push('/profile')}
      style={styles.button}>
      {me ? <Avatar user={me} size={HitTarget - 8} /> : <View style={styles.placeholder} />}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    width: HitTarget,
    height: HitTarget,
    borderRadius: HitTarget / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    shadowColor: Colors.navy,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  placeholder: { width: HitTarget - 8, height: HitTarget - 8, borderRadius: (HitTarget - 8) / 2, backgroundColor: Colors.navySoft },
});
