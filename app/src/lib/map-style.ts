import type { MapStyleElement } from 'react-native-maps';

// Calm, warm Google Maps style (Android). iOS uses Apple's muted map type instead.
export const notedMapStyle: MapStyleElement[] = [
  { elementType: 'geometry', stylers: [{ color: '#efe6d6' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6e665c' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f6f0e4' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', stylers: [{ visibility: 'on' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#d6dbc3' }] },
  { featureType: 'poi.park', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#fbf7ef' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#e8d9bf' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9d3cf' }] },
];
