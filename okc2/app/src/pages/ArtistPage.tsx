import { useState, useEffect } from 'react';
import { ChevronLeft, Play, Music, Shuffle } from 'lucide-react';
import { usePlayer } from '@/hooks/usePlayer';
import { GlassCard } from '@/components/ui-custom';
import { cn } from '@/lib/utils';
import type { Track, Artist } from '@/types';
import { getArtistInfo, getArtistTopTracks, getArtistAlbums } from '@/lib/spotify';

interface ArtistPageProps {
  artistId: string;
  onBack: () => void;
}

export function ArtistPage({ artistId, onBack }: ArtistPageProps) {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getArtistInfo(artistId),
      getArtistTopTracks(artistId),
    ]).then(([info, topTracks]) => {
      setArtist(info);
      setTracks(topTracks);
    }).catch(console.error).finally(() => setLoading(false));
  }, [artistId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <button onClick={onBack} className="fixed top-4 left-4 z-50 p-2 bg-black/60 backdrop-blur rounded-full">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="h-64 bg-white/5 animate-pulse" />
        <div className="px-4 pt-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-14 h-14 bg-white/5 rounded-xl" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 bg-white/5 rounded w-3/4" />
                <div className="h-2 bg-white/5 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!artist) return null;

  return (
    <div className="min-h-screen bg-black text-white pb-32 animate-slide-up">
      {/* Back button */}
      <button
        onClick={onBack}
        className="fixed top-4 left-4 z-50 p-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-white/80 hover:text-white transition-colors"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* Hero */}
      <div className="relative h-72">
        {artist.image_url ? (
          <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-900 to-black flex items-center justify-center">
            <Music className="w-20 h-20 text-white/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <p className="text-white/60 text-sm mb-1">Артист</p>
          <h1 className="text-3xl font-bold mb-2">{artist.name}</h1>
          {artist.genres.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {artist.genres.slice(0, 3).map(g => (
                <span key={g} className="px-2 py-0.5 bg-white/10 rounded-full text-xs text-white/70">{g}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Play controls */}
      <div className="px-5 py-4 flex gap-3">
        <button
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 transition-colors px-6 py-3 rounded-full font-medium active:scale-95"
          onClick={() => tracks[0] && playTrack(tracks[0], tracks)}
        >
          <Play className="w-5 h-5" /> Слушать
        </button>
        <button
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors px-6 py-3 rounded-full font-medium active:scale-95"
          onClick={() => {
            if (!tracks.length) return;
            const shuffled = [...tracks].sort(() => Math.random() - 0.5);
            playTrack(shuffled[0], shuffled);
          }}
        >
          <Shuffle className="w-5 h-5" /> Перемешать
        </button>
      </div>

      {/* Popular tracks */}
      {tracks.length > 0 && (
        <div className="px-4 mb-6">
          <h2 className="text-lg font-bold mb-3">Популярные треки</h2>
          <div className="space-y-2">
            {tracks.map((track, i) => {
              const active = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  className={cn('flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-all',
                    active ? 'bg-emerald-500/10 border border-emerald-500/20' : 'hover:bg-white/5'
                  )}
                  onClick={() => playTrack(track, tracks)}
                >
                  <span className={cn('w-5 text-sm text-center flex-shrink-0', active ? 'text-emerald-400' : 'text-white/30')}>
                    {active && isPlaying ? (
                      <span className="flex justify-center gap-px items-end h-4">
                        <span className="w-0.5 bg-emerald-400 rounded animate-bar1 inline-block" />
                        <span className="w-0.5 bg-emerald-400 rounded animate-bar2 inline-block" />
                        <span className="w-0.5 bg-emerald-400 rounded animate-bar3 inline-block" />
                      </span>
                    ) : i + 1}
                  </span>
                  <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-white/5">
                    {track.image_url
                      ? <img src={track.image_url} alt={track.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Music className="w-4 h-4 text-white/20" /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('font-medium text-sm truncate', active && 'text-emerald-400')}>{track.name}</p>
                    <p className="text-white/40 text-xs truncate">{track.album_name}</p>
                  </div>
                  <span className="text-white/25 text-xs">{fmt(track.duration)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tracks.length === 0 && !loading && (
        <div className="flex flex-col items-center py-12 text-white/30 px-4">
          <Music className="w-12 h-12 mb-3 opacity-30" />
          <p>Треки не найдены</p>
          <p className="text-sm mt-1 text-center">Spotify не предоставляет превью для этого артиста</p>
        </div>
      )}
    </div>
  );
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
