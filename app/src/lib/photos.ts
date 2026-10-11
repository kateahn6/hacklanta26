import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const MAX_WIDTH = 1024;

/**
 * Photo storage for the demo is deliberately dumb: resize to ~1024px, JPEG,
 * and keep the result as a base64 data URL. No blob store, no signed uploads,
 * one less thing to configure. Swap for Vercel Blob if payload size bites.
 */
export async function toDataUrl(uri: string): Promise<string> {
  const rendered = await ImageManipulator.manipulate(uri)
    .resize({ width: MAX_WIDTH, height: null })
    .renderAsync();
  const saved = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.5,
    base64: true,
  });
  if (!saved.base64) throw new Error('Could not read the resized photo');
  return `data:image/jpeg;base64,${saved.base64}`;
}

export async function toDataUrls(uris: string[]): Promise<string[]> {
  const out: string[] = [];
  for (const uri of uris) {
    out.push(await toDataUrl(uri));
  }
  return out;
}
