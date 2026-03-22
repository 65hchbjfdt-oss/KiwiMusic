// Spotify API via RapidAPI
import type { Track, Artist, Album } from '@/types';

const API_KEY = 'e358b3ef7a6c40acb94405c7b45f0c42';
const BASE = 'https://spotify23.p.rapidapi.com';

const headers = {
  'x-rapidapi-key': API_KEY,
  'x-rapidapi-host': 'spotify23.p.rapidapi.com',
};

async function spFetch(path: string, params: Record<string, string> = {}) {
  const p = new URLSearchParams(params);
  const url = `${BASE}${path}?${p}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);
  return res.json();
}

function toTrack(r: any): Track {
  const preview = r.preview_url || r.hub?.actions?.[1]?.uri || '';
  return {
    id: r.id || r.uri?.split(':').pop() || String(Math.random()),
    name: r.name || r.title || 'Unknown',
    artist_name: r.artists?.[0]?.name || r.subtitle || 'Unknown Artist',
    artist_id: r.artists?.[0]?.id || r.artists?.[0]?.uri?.split(':').pop() || '',
    album_name: r.album?.name || '',
    album_id: r.album?.id || '',
    duration: Math.floor((r.duration_ms || 0) / 1000),
    audio_url: preview,
    image_url:
      r.album?.images?.[0]?.url ||
      r.images?.[0]?.url ||
      r.image ||
      '',
    genre: r.genre || '',
    tags: r.genres || [],
    has_lyrics: false,
    lyrics: '',
    play_count: r.popularity || 0,
  };
}

function toArtist(r: any): Artist {
  return {
    id: r.id || r.uri?.split(':').pop() || '',
    name: r.name || '',
    image_url: r.images?.[0]?.url || '',
    genres: r.genres || [],
    albums: [],
    popular_tracks: [],
  };
}

// Popular / Featured tracks via search
export async function getPopularTracks(limit = 20): Promise<Track[]> {
  try {
    const data = await spFetch('/search/', {
      q: 'top hits 2024',
      type: 'tracks',
      offset: '0',
      limit: String(limit),
      numberOfTopResults: '5',
    });
    const items = data.tracks?.items || [];
    return items.map((i: any) => toTrack(i.data || i)).filter((t: Track) => t.audio_url);
  } catch (e) {
    console.error('getPopularTracks', e);
    return [];
  }
}

// New releases
export async function getNewReleases(limit = 10): Promise<Track[]> {
  try {
    const data = await spFetch('/search/', {
      q: 'new releases 2025',
      type: 'tracks',
      offset: '0',
      limit: String(limit),
    });
    const items = data.tracks?.items || [];
    return items.map((i: any) => toTrack(i.data || i)).filter((t: Track) => t.audio_url);
  } catch (e) {
    console.error('getNewReleases', e);
    return [];
  }
}

// Tracks by genre
export async function getTracksByGenre(genre: string, limit = 20): Promise<Track[]> {
  try {
    const data = await spFetch('/search/', {
      q: `genre:${genre}`,
      type: 'tracks',
      offset: '0',
      limit: String(limit),
    });
    const items = data.tracks?.items || [];
    return items.map((i: any) => toTrack(i.data || i)).filter((t: Track) => t.audio_url);
  } catch (e) {
    console.error('getTracksByGenre', e);
    return [];
  }
}

// KiwiFlow — mix of genres
export async function getKiwiFlow(genres: string[], limit = 20): Promise<Track[]> {
  const genre = genres[Math.floor(Math.random() * genres.length)] || 'pop';
  const tracks = await getTracksByGenre(genre, limit);
  return tracks.sort(() => Math.random() - 0.5);
}

// Search tracks
export async function searchSpotify(query: string, limit = 20): Promise<Track[]> {
  try {
    const data = await spFetch('/search/', {
      q: query,
      type: 'tracks',
      offset: '0',
      limit: String(limit),
    });
    const items = data.tracks?.items || [];
    return items.map((i: any) => toTrack(i.data || i));
  } catch (e) {
    console.error('searchSpotify', e);
    return [];
  }
}

// Search artists
export async function searchArtists(query: string, limit = 10): Promise<Artist[]> {
  try {
    const data = await spFetch('/search/', {
      q: query,
      type: 'artists',
      offset: '0',
      limit: String(limit),
    });
    const items = data.artists?.items || [];
    return items.map((i: any) => toArtist(i.data || i));
  } catch (e) {
    console.error('searchArtists', e);
    return [];
  }
}

// Artist top tracks
export async function getArtistTopTracks(artistId: string): Promise<Track[]> {
  try {
    const data = await spFetch('/artist_overview/', { id: artistId });
    const items =
      data.discography?.topTracks?.items ||
      data.topTracks?.items ||
      [];
    return items
      .map((i: any) => toTrack(i.track?.data || i.data || i))
      .filter((t: Track) => t.audio_url);
  } catch (e) {
    console.error('getArtistTopTracks', e);
    return [];
  }
}

// Artist albums
export async function getArtistAlbums(artistId: string): Promise<Album[]> {
  try {
    const data = await spFetch('/artist_albums/', {
      id: artistId,
      offset: '0',
      limit: '10',
    });
    const items = data.data?.artist?.discography?.albums?.items || data.items || [];
    return items.map((i: any) => {
      const a = i.releases?.items?.[0] || i;
      return {
        id: a.id || '',
        name: a.name || '',
        artist_name: a.artists?.[0]?.name || '',
        artist_id: a.artists?.[0]?.id || artistId,
        image_url: a.coverArt?.sources?.[0]?.url || a.images?.[0]?.url || '',
        tracks: [],
      };
    });
  } catch (e) {
    console.error('getArtistAlbums', e);
    return [];
  }
}

// Artist info (for artist page)
export async function getArtistInfo(artistId: string): Promise<Artist | null> {
  try {
    const data = await spFetch('/artist_overview/', { id: artistId });
    const a = data.data?.artist || data;
    const profile = a.profile || {};
    const visuals = a.visuals?.avatarImage?.sources || [];
    const topTracks = (a.discography?.topTracks?.items || [])
      .map((i: any) => toTrack(i.track?.data || i.data || i))
      .filter((t: Track) => t.audio_url);
    return {
      id: artistId,
      name: profile.name || a.name || '',
      image_url: visuals[0]?.url || '',
      genres: (a.profile?.genres?.items || []).map((g: any) => g.name),
      albums: [],
      popular_tracks: topTracks,
    };
  } catch (e) {
    console.error('getArtistInfo', e);
    return null;
  }
}

// Top by country (search with country tag)
export async function getTopByCountry(countryCode: string, limit = 15): Promise<Track[]> {
  try {
    const countryNames: Record<string, string> = {
      RU: 'russian', UA: 'ukraine', KZ: 'kazakhstan', BY: 'belarus',
      DE: 'german', US: 'american', GB: 'british', FR: 'french',
      PL: 'polish', TR: 'turkish',
    };
    const tag = countryNames[countryCode] || 'top';
    const data = await spFetch('/search/', {
      q: `${tag} hits`,
      type: 'tracks',
      limit: String(limit),
    });
    const items = data.tracks?.items || [];
    return items.map((i: any) => toTrack(i.data || i)).filter((t: Track) => t.audio_url);
  } catch (e) {
    return getPopularTracks(limit);
  }
}

export async function getCountryByIp(): Promise<string> {
  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    return data.country_code || 'US';
  } catch {
    return 'US';
  }
}

export async function getRecommendations(listenedGenres: string[], limit = 20): Promise<Track[]> {
  if (!listenedGenres.length) return getPopularTracks(limit);
  return getTracksByGenre(listenedGenres[0], limit);
}
