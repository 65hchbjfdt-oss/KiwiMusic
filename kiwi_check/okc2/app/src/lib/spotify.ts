// ─── Spotify API + PKCE OAuth ──────────────────────────────────────────────
const CLIENT_ID = 'e358b3ef7a6c40acb94405c7b45f0c42';
const REDIRECT_URI = `${window.location.origin}/callback`;
const SCOPES = [
  'streaming','user-read-email','user-read-private',
  'user-library-read','user-library-modify',
  'user-read-playback-state','user-modify-playback-state',
  'user-top-read','user-read-recently-played',
].join(' ');

// ── PKCE ──
function generateVerifier(len = 128) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  return Array.from(crypto.getRandomValues(new Uint8Array(len))).map(b => chars[b % chars.length]).join('');
}
async function generateChallenge(verifier: string) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

// ── Auth ──
export async function redirectToSpotify() {
  const verifier = generateVerifier();
  const challenge = await generateChallenge(verifier);
  localStorage.setItem('spotify_verifier', verifier);
  const params = new URLSearchParams({
    client_id: CLIENT_ID, response_type: 'code',
    redirect_uri: REDIRECT_URI, scope: SCOPES,
    code_challenge_method: 'S256', code_challenge: challenge,
  });
  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

export async function handleCallback(code: string) {
  const verifier = localStorage.getItem('spotify_verifier');
  if (!verifier) throw new Error('No verifier');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID, grant_type: 'authorization_code',
      code, redirect_uri: REDIRECT_URI, code_verifier: verifier,
    }),
  });
  if (!res.ok) throw new Error('Token exchange failed');
  const tokens = await res.json();
  saveTokens(tokens);
  localStorage.removeItem('spotify_verifier');
  return tokens;
}

export async function refreshToken() {
  const rt = localStorage.getItem('spotify_refresh_token');
  if (!rt) return null;
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, grant_type: 'refresh_token', refresh_token: rt }),
  });
  if (!res.ok) { clearTokens(); return null; }
  const tokens = await res.json();
  saveTokens(tokens);
  return tokens.access_token as string;
}

function saveTokens(t: any) {
  localStorage.setItem('spotify_access_token', t.access_token);
  if (t.refresh_token) localStorage.setItem('spotify_refresh_token', t.refresh_token);
  localStorage.setItem('spotify_expires_at', String(Date.now() + t.expires_in * 1000));
}
export function clearTokens() {
  ['spotify_access_token','spotify_refresh_token','spotify_expires_at'].forEach(k => localStorage.removeItem(k));
}
export async function getAccessToken(): Promise<string | null> {
  const exp = Number(localStorage.getItem('spotify_expires_at'));
  if (Date.now() < exp - 60000) return localStorage.getItem('spotify_access_token');
  return refreshToken();
}

// ── API ──
async function spFetch(path: string, token: string) {
  const res = await fetch(`https://api.spotify.com/v1${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 204) return null;
  if (!res.ok) throw new Error(`Spotify ${res.status}: ${path}`);
  return res.json();
}

export async function getMe(token: string) { return spFetch('/me', token); }
export async function search(q: string, token: string, limit = 20) {
  return spFetch(`/search?q=${encodeURIComponent(q)}&type=track&limit=${limit}`, token);
}
export async function getFeatured(token: string) { return spFetch('/browse/featured-playlists?limit=6', token); }
export async function getNewReleases(token: string, limit = 10) { return spFetch(`/browse/new-releases?limit=${limit}`, token); }
export async function getRecommendations(token: string, seedGenres = 'pop,rock,electronic') {
  return spFetch(`/recommendations?seed_genres=${seedGenres}&limit=20`, token);
}
export async function getTopTracks(token: string) { return spFetch('/me/top/tracks?limit=20&time_range=short_term', token); }
export async function getRecentlyPlayed(token: string) { return spFetch('/me/player/recently-played?limit=20', token); }

// Playback
export async function playSdk(token: string, deviceId: string, uri: string) {
  await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ uris: [uri] }),
  });
}
export async function transferPlayback(token: string, deviceId: string) {
  await fetch('https://api.spotify.com/v1/me/player', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_ids: [deviceId], play: false }),
  });
}

// Save/unsave track
export async function saveTrack(token: string, id: string) {
  await fetch(`https://api.spotify.com/v1/me/tracks?ids=${id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
}
export async function unsaveTrack(token: string, id: string) {
  await fetch(`https://api.spotify.com/v1/me/tracks?ids=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
}

// Normalize Spotify track → our Track type
import type { Track } from '@/types';
export function normalizeTrack(r: any): Track {
  return {
    id: r.id,
    name: r.name,
    artist_name: r.artists?.map((a: any) => a.name).join(', ') || '',
    artist_id: r.artists?.[0]?.id || '',
    album_name: r.album?.name || '',
    album_id: r.album?.id || '',
    duration: Math.round((r.duration_ms || 0) / 1000),
    audio_url: r.preview_url || '',   // 30-сек превью для не-Premium
    image_url: r.album?.images?.[0]?.url || '',
    genre: '',
    tags: [],
    has_lyrics: false,
    lyrics: '',
    play_count: r.popularity || 0,
    uri: r.uri,
  };
}
