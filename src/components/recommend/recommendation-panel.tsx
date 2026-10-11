import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { TextBox } from '@/components/create/form-field';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Notice } from '@/components/ui/notice';
import { getRecommendations } from '@/services/recommendation-service';
import { useContent } from '@/store/content';
import { Spacing } from '@/theme/tokens';
import type { RecommendationResult } from '@/types';

import { RecommendationCard } from './recommendation-card';

const EXAMPLES = [
  'Find me affordable art and coffee spots around Midtown.',
  'A quiet afternoon outside, nothing too busy.',
  'Live music and a great view for a date night.',
];

type Status = 'idle' | 'loading' | 'done' | 'error';

export function RecommendationPanel() {
  const content = useContent();
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

  const ask = async (text: string) => {
    const request = text.trim();
    if (!request) {
      setInputError('Tell us what you’re in the mood for.');
      return;
    }
    setInputError(null);
    setStatus('loading');
    try {
      setResult(await getRecommendations(request));
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  return (
    <View style={styles.panel}>
      <Notice
        icon="flask-outline"
        tone="caramel"
        message="Preview: these are sample picks from Noted! data, not live AI. Later, your request will go to a Noted! server that asks Gemini."
      />
      <TextBox
        value={prompt}
        onChangeText={setPrompt}
        placeholder="Find me affordable art and coffee spots around Midtown."
        accessibilityLabel="What are you looking for?"
        multiline
        invalid={Boolean(inputError)}
      />
      {inputError ? (
        <AppText variant="caption" accessibilityRole="alert">
          {inputError}
        </AppText>
      ) : null}
      <View style={styles.examples}>
        {EXAMPLES.map((example) => (
          <Chip
            key={example}
            label={example}
            selected={false}
            onPress={() => {
              setPrompt(example);
              ask(example);
            }}
          />
        ))}
      </View>
      <Button label="Get recommendations" icon="sparkles-outline" loading={status === 'loading'} onPress={() => ask(prompt)} />

      {status === 'error' ? (
        <Notice icon="alert-circle-outline" tone="cherry" message="Couldn’t load recommendations. Please try again." />
      ) : null}

      {status === 'done' && result ? (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.results}>
          <AppText variant="heading">{result.summary}</AppText>
          <AppText variant="caption">Sample response for “{result.prompt}”</AppText>
          {result.items.map((rec, index) => (
            <Animated.View key={rec.placeId} entering={FadeInDown.delay(80 * (index + 1)).duration(300)}>
              <RecommendationCard recommendation={rec} content={content} index={index} />
            </Animated.View>
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: Spacing.md },
  examples: { gap: Spacing.sm, alignItems: 'flex-start' },
  results: { gap: Spacing.md, marginTop: Spacing.lg },
});
