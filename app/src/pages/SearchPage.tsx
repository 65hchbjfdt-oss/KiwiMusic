import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Clock, TrendingUp, X, Music, User as UserIcon } from 'lucide-react';
import { usePlayer } from '@/hooks/usePlayer';
import { GlassCard } from '@/components/ui-custom';
import { cn } from '@/lib/utils';
import type { Track, Artist, User } from '@/types';
import { searchSpotify, searchArtists } from '@/lib/spotify';
import { searchUsers } from '@/lib/supabase';

const HISTORY_KEY = 'kiwi_search_history';
const TRENDING = ['Lofi hip hop', 'Rock classics', 'Electronic', 'Jazz relax', 'Chill beats', 'Study music'];

type TabType = 'tracks' | 'artists' | 'users';

interface SearchPageProps {
  onArtistClick?: (artistId: string) => void;
  onUserClick?: (userId: string) => void;
}

export function SearchPage({ onArtistClick, onUserClick }: SearchPageProps) {
  const { playTrack } = usePlayer();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('tracks');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [history, setHistory] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
  });
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setTracks([]); setArtists([]); setUsers([]); return; }
    setLoading(true);
    try {
      const [t, a, u] = await Promise.all([
        searchSpotify(q, 20),
        searchArtists(q, 10),
        searchUsers(q).then(r => r.data || []),
      ]);
      setTracks(t);
      setArtists(a);
      setUsers(u);
      setHistory(prev => {
        const next = [q, ...prev.filter(h => h !== q)].slice(0, 8);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
        return next;
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => doSearch(query), 450);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [query, doSearch]);

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  const totalResults = tracks.length + artists.length + users.length;
  const hasResults = totalResults > 0 && !loading;

  const tabs = [
    { id: 'tracks' as TabType, label: 'Треки', count: tracks.length },
    { id: 'artists' as TabType, label: 'Артисты', count: artists.length },
    { id: 'users' as TabType, label: 'Пользователи', count: users.length },
  ];

  return (
    <div className="min-h-screen bg-black text-white px-4 pt-12 pb-6 animate-fade-in">
      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Треки, артисты, пользователи..."
          className="w-full bg-white/8 border border-white/10 rounded-2xl py-3.5 pl-12 pr-12 text-white placeholder:text-white/30 outline-none focus:border-emerald-500/50 focus:bg-white/12 transition-all"
          autoFocus
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tabs — shown when there are results */}
      {hasResults && (
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                activeTab === tab.id ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
              )}
            >
              {tab.label} {tab.count > 0 && <span className="ml-1 opacity-70">{tab.count}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
              <div className="w-14 h-14 rounded-xl bg-white/5 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-white/5 rounded w-2/3" />
                <div className="h-2 bg-white/5 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {hasResults && activeTab === 'tracks' && (
        <div className="space-y-2">
          <p className="text-white/40 text-sm mb-3">Найдено {tracks.length} треков</p>
          {tracks.map(track => (
            <GlassCard
              key={track.id}
              variant="dark"
              intensity="low"
              className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/8 transition-colors"
              onClick={() => playTrack(track, tracks)}
            >
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-white/5">
                {track.image_url
                  ? <img src={track.image_url} alt={track.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><Music className="w-6 h-6 text-white/20" /></div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{track.name}</p>
                <p className="text-white/50 text-sm truncate">{track.artist_name}</p>
                {track.genre && <span className="text-emerald-500/70 text-xs">{track.genre}</span>}
              </div>
              <span className="text-white/25 text-xs flex-shrink-0">{fmt(track.duration)}</span>
            </GlassCard>
          ))}
        </div>
      )}

      {hasResults && activeTab === 'artists' && (
        <div className="space-y-2">
          <p className="text-white/40 text-sm mb-3">Найдено {artists.length} артистов</p>
          {artists.map(artist => (
            <GlassCard
              key={artist.id}
              variant="dark"
              intensity="low"
              className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/8 transition-colors"
              onClick={() => onArtistClick?.(artist.id)}
            >
              <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-white/5">
                {artist.image_url
                  ? <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><UserIcon className="w-6 h-6 text-white/20" /></div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{artist.name}</p>
                {artist.genres.length > 0 && (
                  <p className="text-white/40 text-sm truncate">{artist.genres.slice(0, 2).join(' · ')}</p>
                )}
              </div>
              <span className="text-white/40 text-xs">Артист →</span>
            </GlassCard>
          ))}
        </div>
      )}

      {hasResults && activeTab === 'users' && (
        <div className="space-y-2">
          <p className="text-white/40 text-sm mb-3">Найдено {users.length} пользователей</p>
          {users.length === 0
            ? <p className="text-white/30 text-sm text-center py-8">Пользователей не найдено</p>
            : users.map(u => (
              <GlassCard
                key={u.id}
                variant="dark"
                intensity="low"
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/8 transition-colors"
                onClick={() => onUserClick?.(u.id)}
              >
                <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                  {u.avatar_url
                    ? <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover" />
                    : <span className="text-white font-bold text-lg">{u.username?.[0]?.toUpperCase()}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{u.username}</p>
                  <p className="text-white/40 text-sm">
                    {u.role === 'premium' ? '⭐ Premium' : u.role === 'admin' ? '🛡 Admin' : 'Пользователь'}
                  </p>
                </div>
                <span className="text-white/40 text-xs">Профиль →</span>
              </GlassCard>
            ))
          }
        </div>
      )}

      {/* Empty state */}
      {!loading && query && !hasResults && (
        <div className="flex flex-col items-center py-20 text-white/30">
          <Search className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-lg">Ничего не найдено</p>
          <p className="text-sm mt-1">Попробуй другой запрос</p>
        </div>
      )}

      {/* No query — history + trending */}
      {!loading && !query && (
        <>
          {history.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-white/40" />
                  <h2 className="font-semibold text-white/80">Недавние</h2>
                </div>
                <button onClick={clearHistory} className="text-white/40 text-sm hover:text-white transition-colors">Очистить</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {history.map(h => (
                  <button
                    key={h}
                    onClick={() => setQuery(h)}
                    className="px-3 py-1.5 bg-white/8 border border-white/10 rounded-full text-sm text-white/70 hover:bg-white/15 hover:text-white transition-all"
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-white/40" />
              <h2 className="font-semibold text-white/80">Часто ищут</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {TRENDING.map(t => (
                <button
                  key={t}
                  onClick={() => setQuery(t)}
                  className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-sm text-emerald-400 hover:bg-emerald-500/20 transition-all"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
