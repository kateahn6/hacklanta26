import { StyleSheet, Text, View } from 'react-native';

import { PhotoView } from '@/components/ui/photo-view';
import { Colors, Fonts, Radius, Spacing } from '@/theme/tokens';
import type { Photo, Place } from '@/types';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function postmarkDate(iso: string) {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  return { line1: `${MONTHS[month - 1]} ${day}`, line2: String(year) };
}

interface PostcardBackProps {
  note: string;
  signedBy: string;
  place: Place;
  photo: Photo | null;
  date: string;
}

/** Classic postcard back: message on the left, stamp, postmark, and address lines on the right. */
export function PostcardBack({ note, signedBy, place, photo, date }: PostcardBackProps) {
  const stamp = postmarkDate(date);
  const addressLines = [place.name, place.neighborhood, place.city].filter((line) => line.length > 0);

  return (
    <View style={styles.back}>
      <Text style={styles.header}>POST CARD</Text>
      <View style={styles.body}>
        <View style={styles.message}>
          <Text style={styles.note} numberOfLines={7} adjustsFontSizeToFit minimumFontScale={0.6}>
            {note || 'No note yet.'}
          </Text>
          <Text style={styles.signature} numberOfLines={1}>
            — {signedBy}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.addressSide}>
          <View style={styles.stampRow}>
            <View style={styles.postmark} accessibilityLabel={`Postmarked ${stamp.line1}, ${stamp.line2}`}>
              <Text style={styles.postmarkCity} numberOfLines={1}>
                {place.city.toUpperCase()}
              </Text>
              <Text style={styles.postmarkDate}>{stamp.line1}</Text>
              <Text style={styles.postmarkCity}>{stamp.line2}</Text>
            </View>
            <View style={styles.stamp}>
              <PhotoView photo={photo} aspect={0.82} style={styles.stampPhoto} />
            </View>
          </View>
          <View style={styles.address}>
            {addressLines.map((line, i) => (
              <View key={i} style={styles.addressLine}>
                <Text style={styles.addressText} numberOfLines={1}>
                  {line}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { flex: 1, padding: Spacing.md, borderRadius: Radius.sm, backgroundColor: Colors.surface },
  header: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 4,
    color: Colors.slate,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  body: { flex: 1, flexDirection: 'row' },
  message: { flex: 1.15, justifyContent: 'space-between', paddingRight: Spacing.md },
  note: { fontFamily: Fonts.script, fontSize: 21, lineHeight: 25, color: Colors.navy },
  signature: { fontFamily: Fonts.script, fontSize: 19, color: Colors.navy, textAlign: 'right' },
  divider: { width: 1, backgroundColor: Colors.hairline, marginVertical: 2 },
  addressSide: { flex: 1, paddingLeft: Spacing.md, justifyContent: 'space-between' },
  stampRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-start' },
  postmark: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: 'rgba(75, 95, 140, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -12,
    marginTop: 14,
    zIndex: 1,
    transform: [{ rotate: '-12deg' }],
  },
  postmarkCity: { fontFamily: Fonts.sansSemiBold, fontSize: 6.5, letterSpacing: 0.5, color: Colors.slate, maxWidth: 40 },
  postmarkDate: { fontFamily: Fonts.sansBold, fontSize: 9, color: Colors.slate },
  stamp: {
    width: 44,
    padding: 3,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.sky,
  },
  stampPhoto: { width: '100%' },
  address: { gap: Spacing.sm },
  addressLine: { borderBottomWidth: 1, borderBottomColor: Colors.hairline, paddingBottom: 2 },
  addressText: { fontFamily: Fonts.sansMedium, fontSize: 11.5, color: Colors.navy },
});
