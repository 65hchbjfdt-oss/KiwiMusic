import { useState, useEffect } from 'react';
import { TrendingUp, Zap, Play, Trophy, Star, Globe } from 'lucide-react';
import { usePlayer } from '@/hooks/usePlayer';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard } from '@/components/ui-custom';
import type { Track } from '@/types';
import { cn } from '@/lib/utils';
import { getPopularTracks, getKiwiFlow, getNewReleases, getTopByCountry, getCountryByIp } from '@/lib/spotify';
import { getActiveEvents } from '@/lib/supabase';

export function HomePage() {
  const { user } = useAuth();
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const [popular, setPopular] = useState<Track[]>([]);
  const [kiwiFlow, setKiwiFlow] = useState<Track[]>([]);
  const [regional, setRegional] = useState<Track[]>([]);
  const [countryCode, setCountryCode] = useState('RU');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsTab, setEventsTab] = useState<'tasks' | 'collection'>('tasks');

  useEffect(() => {
    Promise.all([
      getPopularTracks(10),
      getKiwiFlow(['electronic', 'pop', 'rock', 'chill', 'jazz'], 20),
      getCountryByIp(),
      getActiveEvents(),
    ]).then(async ([pop, kiwi, country, eventsData]) => {
      setPopular(pop);
      setKiwiFlow(kiwi);
      setCountryCode(country);
      setEvents(eventsData.data || []);
      const reg = await getTopByCountry(country, 10);
      setRegional(reg);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const countryNames: Record<string, string> = {
    RU: 'России', UA: 'Украины', KZ: 'Казахстана', BY: 'Беларуси',
    DE: 'Германии', US: 'США', GB: 'Великобритании', FR: 'Франции',
    PL: 'Польши', TR: 'Турции',
  };

  return (
    <div className="min-h-screen bg-black text-white pb-4 animate-fade-in">
      <div className="px-4 pt-12 pb-4">
        <p className="text-white/40 text-sm">Добро пожаловать</p>
        <h1 className="text-2xl font-bold">
          {user?.username ? `Привет, ${user.username} 👋` : 'Kiwi Music 🥝'}
        </h1>
      </div>

      {/* KiwiFlow — FIXED: animate-gradient-x now has keyframes */}
      <div className="px-4 mb-6">
        <div
          className="relative rounded-3xl overflow-hidden cursor-pointer"
          style={{ minHeight: 160 }}
          onClick={() => kiwiFlow[0] && playTrack(kiwiFlow[0], kiwiFlow)}
        >
          <div
            className="absolute inset-0 animate-gradient-x"
            style={{
              background: 'linear-gradient(270deg,#8B0000,#0D3B1E,#1a1a2e,#A52A2A,#0D3B1E)',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at 30% 60%,rgba(34,197,94,0.25) 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,rgba(139,0,0,0.4) 0%,transparent 60%)',
            }}
          />
          {/* FIXED: animate-float and animate-pulse-slow now have keyframes */}
          <div
            className="absolute top-2 right-8 w-24 h-24 rounded-full opacity-30 animate-float"
            style={{ background: 'radial-gradient(circle,#22C55E,transparent)', filter: 'blur(20px)' }}
          />
          <div
            className="absolute bottom-2 left-12 w-20 h-20 rounded-full opacity-20 animate-pulse-slow"
            style={{ background: 'radial-gradient(circle,#8B0000,transparent)', filter: 'blur(15px)' }}
          />
          <div className="relative z-10 p-5">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 text-xs font-semibold tracking-widest uppercase">KiwiFlow</span>
            </div>
            <h2 className="text-2xl font-bold mb-1">Моя волна</h2>
            <p className="text-white/60 text-sm mb-4">{kiwiFlow.length} треков · специально для тебя</p>
            <button
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full transition-all text-sm font-medium active:scale-95"
              onClick={e => { e.stopPropagation(); kiwiFlow[0] && playTrack(kiwiFlow[0], kiwiFlow); }}
            >
              <Play className="w-4 h-4" /> Слушать
            </button>
          </div>
        </div>
      </div>

      <Section title="Популярное" icon={<TrendingUp className="w-4 h-4" />} loading={loading}>
        {popular.map((t, i) => (
          <TrackRow key={t.id} track={t} index={i + 1} onPlay={() => playTrack(t, popular)} />
        ))}
      </Section>

      <Section title={`Топ ${countryNames[countryCode] || countryCode}`} icon={<Globe className="w-4 h-4" />} loading={loading}>
        {regional.slice(0, 6).map((t, i) => (
          <TrackRow key={t.id} track={t} index={i + 1} onPlay={() => playTrack(t, regional)} />
        ))}
      </Section>

      {events.length > 0 && (
        <div className="px-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <h2 className="text-lg font-bold">Ивенты</h2>
          </div>
          <div className="flex gap-2 mb-3">
            {(['tasks', 'collection'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setEventsTab(tab)}
                className={cn('px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                  eventsTab === tab ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
                )}
              >
                {tab === 'tasks' ? 'Задания' : 'Коллекция'}
              </button>
            ))}
          </div>
          {eventsTab === 'tasks' ? (
            <div className="space-y-3">
              {events.map(ev => (
                <GlassCard key={ev.id} variant="dark" intensity="medium" className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{ev.title}</h3>
                      <p className="text-white/50 text-sm">{ev.description}</p>
                    </div>
                    <span className="text-2xl">🏆</span>
                  </div>
                  <div className="flex gap-1 mt-3">
                    {[1, 2, 3].map(n => (
                      <div key={n} className={cn('h-1 flex-1 rounded-full', n <= 1 ? 'bg-emerald-500' : 'bg-white/10')} />
                    ))}
                  </div>
                  <button
                    className="mt-3 w-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-xl py-2 text-emerald-400 text-sm font-medium transition-all flex items-center justify-center gap-2"
                    onClick={() => {
                      const gt = kiwiFlow.filter(t => t.genre === ev.genre).slice(0, 3);
                      if (gt.length) playTrack(gt[0], gt);
                    }}
                  >
                    <Play className="w-4 h-4" /> Начать задание
                  </button>
                </GlassCard>
              ))}
            </div>
          ) : (
            <GlassCard variant="dark" intensity="medium" className="p-6 text-center">
              <Star className="w-10 h-10 text-white/20 mx-auto mb-2" />
              <p className="text-white/40 text-sm">Выполняй задания, чтобы получить стикеры</p>
            </GlassCard>
          )}
        </div>
      )}

      <NewReleasesSection />
    </div>
  );
}

function NewReleasesSection() {
  const { playTrack } = usePlayer();
  const [tracks, setTracks] = useState<Track[]>([]);
  useEffect(() => { getNewReleases(8).then(setTracks).catch(console.error); }, []);
  return (
    <div className="mb-6 px-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-emerald-400" />
        <h2 className="text-lg font-bold">Новинки</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {tracks.map(t => (
          <div key={t.id} className="flex-shrink-0 w-32 cursor-pointer group" onClick={() => playTrack(t, tracks)}>
            <div className="relative w-32 h-32 rounded-2xl overflow-hidden mb-2">
              <img src={t.image_url || '/placeholder.png'} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <p className="text-xs font-medium truncate">{t.name}</p>
            <p className="text-white/40 text-xs truncate">{t.artist_name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Section({ title, icon, loading, children }: { title: string; icon?: React.ReactNode; loading: boolean; children: React.ReactNode }) {
  return (
    <div className="mb-6 px-4">
      <div className="flex items-center gap-2 mb-3">
        {icon && <span className="text-emerald-400">{icon}</span>}
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      {loading ? <SkeletonList /> : <div className="space-y-2">{children}</div>}
    </div>
  );
}

function TrackRow({ track, index, onPlay }: { track: Track; index: number; onPlay: () => void }) {
  const { currentTrack, isPlaying } = usePlayer();
  const active = currentTrack?.id === track.id;
  return (
    <div
      className={cn('flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-all',
        active ? 'bg-emerald-500/10 border border-emerald-500/20' : 'hover:bg-white/5'
      )}
      onClick={onPlay}
    >
      <span className={cn('w-5 text-sm text-center flex-shrink-0', active ? 'text-emerald-400' : 'text-white/30')}>
        {/* FIXED: animate-bar1/bar2/bar3 now have keyframes */}
        {active && isPlaying ? (
          <span className="flex justify-center gap-px items-end h-4">
            <span className="w-0.5 bg-emerald-400 rounded animate-bar1 inline-block" />
            <span className="w-0.5 bg-emerald-400 rounded animate-bar2 inline-block" />
            <span className="w-0.5 bg-emerald-400 rounded animate-bar3 inline-block" />
          </span>
        ) : index}
      </span>
      <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0">
        <img src={track.image_url || '/placeholder.png'} alt={track.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('font-medium text-sm truncate', active && 'text-emerald-400')}>{track.name}</p>
        <p className="text-white/40 text-xs truncate">{track.artist_name}</p>
      </div>
      <span className="text-white/25 text-xs">{fmt(track.duration)}</span>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2.5 animate-pulse">
          <div className="w-5 h-3 bg-white/5 rounded" />
          <div className="w-11 h-11 rounded-xl bg-white/5" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-white/5 rounded w-3/4" />
            <div className="h-2 bg-white/5 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
