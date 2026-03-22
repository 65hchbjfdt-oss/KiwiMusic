// Jamendo API — бесплатная музыка с реальными превью
const CLIENT_ID = 'c01865fc';
const BASE = 'https://api.jamendo.com/v3.0';

async function jFetch(path: string, params: Record<string, string> = {}) {
  const p = new URLSearchParams({ client_id: CLIENT_ID, format: 'json', ...params });
  const res = await fetch(`${BASE}${path}?${p}`);
  if (!res.ok) throw new Error(`Jamendo error: ${res.status}`);
  return res.json();
}

import type { Track } from '@/types';

function toTrack(r: any): Track {
  return {
    id: r.id,
    name: r.name,
    artist_name: r.artist_name,
    artist_id: r.artist_id,
    album_name: r.album_name,
    album_id: r.album_id,
    duration: r.duration,
    audio_url: r.audio,          // прямая ссылка на mp3
    image_url: r.image,
    genre: r.musicinfo?.tags?.genres?.[0] || '',
    tags: r.musicinfo?.tags?.genres || [],
    has_lyrics: false,
    lyrics: '',
    play_count: r.listens || 0,
  };
}

// Популярные треки
export async function getPopularTracks(limit = 20): Promise<Track[]> {
  const data = await jFetch('/tracks', {
    limit: String(limit),
    order: 'popularity_week',
    include: 'musicinfo',
    audioformat: 'mp32',
  });
  return (data.results || []).map(toTrack);
}

// Треки по жанру
export async function getTracksByGenre(genre: string, limit = 20): Promise<Track[]> {
  const data = await jFetch('/tracks', {
    limit: String(limit),
    tags: genre,
    order: 'popularity_week',
    include: 'musicinfo',
    audioformat: 'mp32',
  });
  return (data.results || []).map(toTrack);
}

// Поиск
export async function searchJamendo(query: string, limit = 20): Promise<Track[]> {
  const data = await jFetch('/tracks', {
    limit: String(limit),
    search: query,
    include: 'musicinfo',
    audioformat: 'mp32',
    order: 'relevance',
  });
  return (data.results || []).map(toTrack);
}

// Треки для KiwiFlow — случайная подборка по жанрам
export async function getKiwiFlow(genres: string[], limit = 20): Promise<Track[]> {
  const genre = genres[Math.floor(Math.random() * genres.length)] || 'pop';
  const data = await jFetch('/tracks', {
    limit: String(limit),
    tags: genre,
    order: 'popularity_total',
    include: 'musicinfo',
    audioformat: 'mp32',
    boost: 'popularity_week',
  });
  // Перемешиваем
  const tracks = (data.results || []).map(toTrack);
  return tracks.sort(() => Math.random() - 0.5);
}

// Новинки
export async function getNewReleases(limit = 10): Promise<Track[]> {
  const data = await jFetch('/tracks', {
    limit: String(limit),
    order: 'releasedate_desc',
    include: 'musicinfo',
    audioformat: 'mp32',
    datebetween: getLastMonthRange(),
  });
  return (data.results || []).map(toTrack);
}

// Треки артиста
export async function getArtistTracks(artistId: string, limit = 10): Promise<Track[]> {
  const data = await jFetch('/tracks', {
    limit: String(limit),
    artist_id: artistId,
    order: 'popularity_total',
    include: 'musicinfo',
    audioformat: 'mp32',
  });
  return (data.results || []).map(toTrack);
}

// Топ по стране (Jamendo поддерживает country_code)
export async function getTopByCountry(countryCode: string, limit = 15): Promise<Track[]> {
  const data = await jFetch('/tracks', {
    limit: String(limit),
    order: 'popularity_week',
    include: 'musicinfo',
    audioformat: 'mp32',
    // Jamendo не фильтрует напрямую по стране слушателей,
    // используем язык как прокси
    lang: countryCode.toLowerCase(),
  });
  // fallback если мало результатов
  if (!data.results?.length) return getPopularTracks(limit);
  return (data.results || []).map(toTrack);
}

// Рекомендации на основе прослушанных жанров
export async function getRecommendations(listenedGenres: string[], limit = 20): Promise<Track[]> {
  if (!listenedGenres.length) return getPopularTracks(limit);
  // Берём самый слушаемый жанр
  const topGenre = listenedGenres[0];
  return getTracksByGenre(topGenre, limit);
}

function getLastMonthRange() {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 1);
  return `${from.toISOString().split('T')[0]}_${to.toISOString().split('T')[0]}`;
}

// Определение страны по IP
export async function getCountryByIp(): Promise<string> {
  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    return data.country_code || 'US';
  } catch {
    return 'US';
  }
}
