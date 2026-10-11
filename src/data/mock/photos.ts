import type { Photo } from '@/types';

// Bundled sample photography (Unsplash License). Aspect = width / height.
const photo = (source: number, width: number, height: number): Photo => ({ source, aspect: width / height });

export const Photos = {
  bigTree: photo(require('@/assets/images/places/big-tree.jpg'), 900, 600),
  boutique: photo(require('@/assets/images/places/boutique.jpg'), 900, 601),
  cafeCounter: photo(require('@/assets/images/places/cafe-counter.jpg'), 900, 506),
  cherryBlossom: photo(require('@/assets/images/places/cherry-blossom.jpg'), 900, 596),
  espressoFlatlay: photo(require('@/assets/images/places/espresso-flatlay.jpg'), 600, 900),
  eventHall: photo(require('@/assets/images/places/event-hall.jpg'), 900, 600),
  forestPath: photo(require('@/assets/images/places/forest-path.jpg'), 900, 599),
  friendsTable: photo(require('@/assets/images/places/friends-table.jpg'), 900, 600),
  greenValley: photo(require('@/assets/images/places/green-valley.jpg'), 900, 600),
  latteCheers: photo(require('@/assets/images/places/latte-cheers.jpg'), 900, 600),
  lattePlants: photo(require('@/assets/images/places/latte-plants.jpg'), 600, 900),
  marketHall: photo(require('@/assets/images/places/market-hall.jpg'), 900, 617),
  openSign: photo(require('@/assets/images/places/open-sign.jpg'), 900, 600),
  paintBrushes: photo(require('@/assets/images/places/paint-brushes.jpg'), 900, 900),
  pizza: photo(require('@/assets/images/places/pizza.jpg'), 745, 900),
  sculptureHall: photo(require('@/assets/images/places/sculpture-hall.jpg'), 900, 600),
  sharedPlates: photo(require('@/assets/images/places/shared-plates.jpg'), 900, 675),
  skyline: photo(require('@/assets/images/places/skyline.jpg'), 900, 554),
  smallPlates: photo(require('@/assets/images/places/small-plates.jpg'), 900, 600),
  stageGlow: photo(require('@/assets/images/places/stage-glow.jpg'), 900, 600),
  streetMural: photo(require('@/assets/images/places/street-mural.jpg'), 900, 600),
  whiteGallery: photo(require('@/assets/images/places/white-gallery.jpg'), 900, 675),
  wineToast: photo(require('@/assets/images/places/wine-toast.jpg'), 900, 600),
  bookshelves: photo(require('@/assets/images/places/bookshelves.jpg'), 900, 832),
};
