const PHOTO_IDS = [
  'photo-1519494026892-80bbd2d6fd0d',
  'photo-1612349317150-e413f6a5b16d',
  'photo-1559839734-2b71ea197ec2',
  'photo-1622253692010-333f2da6031d',
  'photo-1594824476967-48c8b964273f',
  'photo-1582750433449-648ed127bb54',
  'photo-1551601651-2a8555f1a136',
  'photo-1576091160399-112ba8d25d1d',
  'photo-1538108149393-fbbd81895907',
  'photo-1579684385127-1ef15d508118',
];

export const FALLBACK_IMG =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 3"><rect width="4" height="3" fill="#cfe0ff"/><path d="M1.75 1h.5v.5h.5v.5h-.5v.5h-.5V2h-.5v-.5h.5z" fill="#fff"/></svg>'
  );

export function getPhotoUrl(index) {
  const id = PHOTO_IDS[Math.abs(Number(index) || 0) % PHOTO_IDS.length];
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=70`;
}

export function handleImgError(event) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = FALLBACK_IMG;
}
