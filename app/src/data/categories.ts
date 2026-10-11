import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

import type { CategoryId } from '@/types';

export interface Category {
  id: CategoryId;
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
}

export const CATEGORIES: Category[] = [
  { id: 'food', label: 'Food & cafés', icon: 'cafe-outline' },
  { id: 'art', label: 'Art', icon: 'color-palette-outline' },
  { id: 'music', label: 'Music', icon: 'musical-notes-outline' },
  { id: 'nature', label: 'Nature', icon: 'leaf-outline' },
  { id: 'culture', label: 'Culture', icon: 'library-outline' },
  { id: 'hidden', label: 'Hidden gems', icon: 'sparkles-outline' },
];

export const categoryById = (id: CategoryId): Category => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
