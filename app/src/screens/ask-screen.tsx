import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RecommendationPanel } from '@/components/recommend/recommendation-panel';
import { AppText } from '@/components/ui/app-text';
import { TopBar } from '@/components/ui/top-bar';
import { Colors, Gutter, Spacing } from '@/theme/tokens';

export function AskScreen() {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TopBar title="Ask Noted!" backIcon="close" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}
        keyboardShouldPersistTaps="handled">
        <AppText variant="display">What are you in the mood for?</AppText>
        <AppText variant="body" color={Colors.muted}>
          Describe your plans and get places the community recommends.
        </AppText>
        <RecommendationPanel />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.cream },
  content: { paddingHorizontal: Gutter, gap: Spacing.md },
});
