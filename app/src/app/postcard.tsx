import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/ui';
import { s } from '@/constants/styles';
import { C } from '@/constants/theme';
import { useData } from '@/lib/data';

export default function PostcardScreen() {
  const { entry_id } = useLocalSearchParams<{ entry_id?: string }>();
  const { findEntry } = useData();
  const found = entry_id ? findEntry(entry_id) : null;

  if (!found) {
    return (
      <SafeAreaView style={[s.modalSafe, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={s.cardMeta}>That entry is no longer on the map.</Text>
      </SafeAreaView>
    );
  }

  const { entry, place } = found;
  const photo = entry.photo_urls[0];
  const message = entry.postcard_text ?? entry.caption ?? `Thinking of you from ${place.name}.`;

  return (
    <SafeAreaView style={s.modalSafe}>
      <View style={s.detailTop}>
        <Pressable onPress={() => router.back()} style={s.backButton}>
          <Text style={s.backText}>{'←'}</Text>
        </Pressable>
        <Text style={s.eyebrow}>A POSTCARD FROM HERE</Text>
        <View style={{ width: 34 }} />
      </View>

      <View style={{ flex: 1, paddingHorizontal: 18, paddingBottom: 18, gap: 14 }}>
        <View
          style={{
            flex: 1,
            borderRadius: 12,
            overflow: 'hidden',
            backgroundColor: C.ink,
            borderWidth: 1,
            borderColor: C.line,
          }}>
          {photo ? (
            <Image
              source={{ uri: photo }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              contentFit="cover"
            />
          ) : null}

          <View
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              borderWidth: 2,
              borderColor: C.paper,
              paddingHorizontal: 9,
              paddingVertical: 4,
            }}>
            <Text style={{ color: C.paper, fontSize: 10, fontWeight: '900', letterSpacing: 3 }}>
              UNFOLD
            </Text>
          </View>

          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              padding: 22,
              gap: 8,
              backgroundColor: 'rgba(33,31,28,0.58)',
            }}>
            <Text
              style={{
                color: C.paper,
                fontSize: 22,
                lineHeight: 30,
                fontWeight: '700',
                fontStyle: 'italic',
              }}>
              {'“'}
              {message}
              {'”'}
            </Text>
            <Text style={{ color: C.rose, fontSize: 12, letterSpacing: 0.4 }}>
              {'—'} {entry.user_name ?? 'a friend'}, {place.name}
            </Text>
          </View>
        </View>

        <ActionButton
          label="Send this postcard"
          onPress={() =>
            Share.share({ message: `${message}\n\n— from ${place.name}, via Unfold` })
          }
        />
      </View>
    </SafeAreaView>
  );
}
