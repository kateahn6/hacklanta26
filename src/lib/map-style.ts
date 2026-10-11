import type { MapStyleElement } from 'react-native-maps';

// Calm, cool Google Maps style (Android) in the brand blues. iOS uses Apple's muted map type instead.
export const notedMapStyle: MapStyleElement[] = [
  { elementType: 'geometry', stylers: [{ color: '#eef2f8' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5d6574' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f7f9fc' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', stylers: [{ visibility: 'on' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#dde7f1' }] },
  { featureType: 'poi.park', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#d6dfeb' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#bcd6f0' }] },
];
