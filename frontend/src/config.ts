// Venue map data shared by the admin, volunteer and attendee maps.
// TODO: replace with the real venue's center, exit and assembly point coordinates.
export const VENUE_CENTER: [number, number] = [17.385, 78.4867];

export const EXITS = [
  { id: 1, name: 'North Exit', lat: 17.387, lng: 78.4867, capacity: 'High' },
  { id: 2, name: 'South Exit', lat: 17.383, lng: 78.4867, capacity: 'Medium' },
  { id: 3, name: 'East Exit', lat: 17.385, lng: 78.4887, capacity: 'High' },
  { id: 4, name: 'West Exit', lat: 17.385, lng: 78.4847, capacity: 'Low' },
];

export const ASSEMBLY_POINTS = [
  { id: 1, name: 'Assembly Point A', lat: 17.388, lng: 78.4867, description: 'Main parking lot' },
  { id: 2, name: 'Assembly Point B', lat: 17.382, lng: 78.4867, description: 'South field' },
];

export const formatDistance = (meters: number) =>
  meters < 1000 ? `${Math.round(meters)}m` : `${(meters / 1000).toFixed(1)} km`;
