import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Clock, TrendingUp, X } from 'lucide-react';
import { usePlayer } from '@/hooks/usePlayer';
import { GlassCard } from '@/components/ui-custom';
import type { Track } from '@/types';

const HISTORY_KEY = 'kiwi_search_history';
const TRENDING = ['Lofi hip hop','Rock classics','Electronic','Jazz relax','Chill beats','Study music'];

export function SearchPage() {
  const { playTrack } = usePlayer();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [history, setHistory] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]'); } catch { return []; }
  });
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout>|null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      setResults(tracks);
      // Save to history
      setHistory(prev => {
        const next = [q, ...prev.filter(h => h !== q)].slice(0, 8);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
        return next;
      });
    } catch(e) { console.error(e); }
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

  return (
    <div className="min-h-screen bg-black text-white px-4 pt-12 pb-6">
      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40"/>
        <input
          type="text" value={query} onChange={e=>setQuery(e.target.value)}
          placeholder="Треки, артисты, альбомы..."
          className="w-full bg-white/8 border border-white/10 rounded-2xl py-3.5 pl-12 pr-12 text-white placeholder:text-white/30 outline-none focus:border-emerald-500/50 focus:bg-white/12 transition-all"
          autoFocus
        />
        {query && (
          <button onClick={()=>setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5"/>
          </button>
        )}
      </div>

      {loading && (
        <div className="space-y-2">
          {[...Array(5)].map((_,i) => (
            <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
              <div className="w-14 h-14 rounded-xl bg-white/5 flex-shrink-0"/>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-white/5 rounded w-2/3"/>
                <div className="h-2 bg-white/5 rounded w-1/2"/>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-2">
          <p className="text-white/40 text-sm mb-3">Найдено {results.length} треков</p>
          {results.map(track => (
            <GlassCard key={track.id} variant="dark" intensity="low"
              className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/8 transition-colors"
              onClick={()=>playTrack(track, results)}>
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                <img src={track.image_url||'/placeholder.png'} alt={track.name} className="w-full h-full object-cover"/>
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

      {!loading && !query && (
        <>
          {/* Recent searches */}
          {history.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-white/40"/>
                  <h2 className="font-semibold text-white/80">Недавние</h2>
                </div>
                <button onClick={clearHistory} className="text-white/40 text-sm hover:text-white transition-colors">Очистить</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {history.map(h => (
                  <button key={h} onClick={()=>setQuery(h)}
                    className="px-3 py-1.5 bg-white/8 border border-white/10 rounded-full text-sm text-white/70 hover:bg-white/15 hover:text-white transition-all">
                    {h}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trending */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-white/40"/>
              <h2 className="font-semibold text-white/80">Часто ищут</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {TRENDING.map(t => (
                <button key={t} onClick={()=>setQuery(t)}
                  className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-sm text-emerald-400 hover:bg-emerald-500/20 transition-all">
                  {t}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {!loading && query && results.length === 0 && (
        <div className="flex flex-col items-center py-20 text-white/30">
          <Search className="w-12 h-12 mb-3 opacity-30"/>
          <p className="text-lg">Ничего не найдено</p>
          <p className="text-sm mt-1">Попробуй другой запрос</p>
        </div>
      )}
    </div>
  );
}

const fmt = (s:number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
