import { useState, useEffect } from 'react';
import { TrendingUp, Zap, Play, Trophy, Star, Globe } from 'lucide-react';
import { usePlayer } from '@/hooks/useSpotifyPlayer';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard } from '@/components/ui-custom';
import type { Track } from '@/types';
import { cn } from '@/lib/utils';
import { getRecommendations, getNewReleases, normalizeTrack, getTopTracks } from '@/lib/spotify';
import { getActiveEvents } from '@/lib/supabase';

export function HomePage() {
  const { user, spotifyToken } = useAuth();
  const { playTrack } = usePlayer();
  const [recommended, setRecommended] = useState<Track[]>([]);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [newReleases, setNewReleases] = useState<Track[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsTab, setEventsTab] = useState<'tasks'|'collection'>('tasks');

  useEffect(() => {
    if (!spotifyToken) return;
    Promise.all([
      getRecommendations(spotifyToken),
      getTopTracks(spotifyToken),
      getNewReleases(spotifyToken, 10),
      getActiveEvents(),
    ]).then(([recs, top, releases, eventsData]) => {
      setRecommended((recs?.tracks || []).map(normalizeTrack));
      setTopTracks((top?.items || []).map(normalizeTrack));
      const albums = (releases?.albums?.items || []).map((a: any) => ({
        id: a.id, name: a.name,
        artist_name: a.artists?.map((x:any) => x.name).join(', '),
        artist_id: a.artists?.[0]?.id || '',
        album_name: a.name, album_id: a.id,
        duration: 0, audio_url: '', image_url: a.images?.[0]?.url || '',
        genre: '', tags: [], has_lyrics: false, lyrics: '', play_count: 0,
        uri: a.uri,
      }));
      setNewReleases(albums);
      setEvents(eventsData.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [spotifyToken]);

  const kfTracks = recommended.length ? recommended : topTracks;

  return (
    <div className="min-h-screen bg-black text-white pb-4">
      <div className="px-4 pt-12 pb-4">
        <p className="text-white/40 text-sm">Добро пожаловать</p>
        <h1 className="text-2xl font-bold">{user?.username ? `Привет, ${user.username} 👋` : 'Kiwi Music 🥝'}</h1>
      </div>

      {/* KiwiFlow */}
      <div className="px-4 mb-6">
        <div className="relative rounded-3xl overflow-hidden cursor-pointer" style={{minHeight:160}}
          onClick={() => kfTracks[0] && playTrack(kfTracks[0], kfTracks)}>
          <div className="absolute inset-0 animate-gradient-x" style={{
            background:'linear-gradient(270deg,#8B0000,#0D3B1E,#1a1a2e,#A52A2A,#0D3B1E)',backgroundSize:'400% 400%'}}/>
          <div className="absolute inset-0" style={{
            background:'radial-gradient(ellipse at 30% 60%,rgba(34,197,94,0.25) 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,rgba(139,0,0,0.4) 0%,transparent 60%)'}}/>
          <div className="absolute top-2 right-8 w-24 h-24 rounded-full opacity-30 animate-float"
            style={{background:'radial-gradient(circle,#22C55E,transparent)',filter:'blur(20px)'}}/>
          <div className="relative z-10 p-5">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-emerald-400"/>
              <span className="text-emerald-400 text-xs font-semibold tracking-widest uppercase">KiwiFlow</span>
            </div>
            <h2 className="text-2xl font-bold mb-1">Моя волна</h2>
            <p className="text-white/60 text-sm mb-4">{kfTracks.length} треков · специально для тебя</p>
            <button className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full transition-all text-sm font-medium"
              onClick={e=>{e.stopPropagation();kfTracks[0]&&playTrack(kfTracks[0],kfTracks);}}>
              <Play className="w-4 h-4"/> Слушать
            </button>
          </div>
        </div>
      </div>

      <Section title="Твой топ" icon={<TrendingUp className="w-4 h-4"/>} loading={loading}>
        {topTracks.slice(0,8).map((t,i)=><TrackRow key={t.id} track={t} index={i+1} onPlay={()=>playTrack(t,topTracks)}/>)}
      </Section>

      <Section title="Рекомендации" icon={<Zap className="w-4 h-4"/>} loading={loading}>
        {recommended.slice(0,8).map((t,i)=><TrackRow key={t.id} track={t} index={i+1} onPlay={()=>playTrack(t,recommended)}/>)}
      </Section>

      {events.length > 0 && (
        <div className="px-4 mb-6">
          <div className="flex items-center gap-2 mb-3"><Trophy className="w-4 h-4 text-yellow-400"/><h2 className="text-lg font-bold">Ивенты</h2></div>
          <div className="flex gap-2 mb-3">
            {(['tasks','collection'] as const).map(tab=>(
              <button key={tab} onClick={()=>setEventsTab(tab)}
                className={cn('px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                  eventsTab===tab?'bg-emerald-500 text-white':'bg-white/10 text-white/60 hover:bg-white/20')}>
                {tab==='tasks'?'Задания':'Коллекция'}
              </button>
            ))}
          </div>
          {eventsTab==='tasks' ? (
            <div className="space-y-3">
              {events.map(ev=>(
                <GlassCard key={ev.id} variant="dark" intensity="medium" className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div><h3 className="font-semibold">{ev.title}</h3><p className="text-white/50 text-sm">{ev.description}</p></div>
                    <span className="text-2xl">🏆</span>
                  </div>
                  <div className="flex gap-1 mt-3">{[1,2,3].map(n=><div key={n} className={cn('h-1 flex-1 rounded-full',n<=1?'bg-emerald-500':'bg-white/10')}/>)}</div>
                </GlassCard>
              ))}
            </div>
          ) : (
            <GlassCard variant="dark" intensity="medium" className="p-6 text-center">
              <Star className="w-10 h-10 text-white/20 mx-auto mb-2"/>
              <p className="text-white/40 text-sm">Выполняй задания, чтобы получить стикеры</p>
            </GlassCard>
          )}
        </div>
      )}

      <div className="mb-6 px-4">
        <div className="flex items-center gap-2 mb-3"><Globe className="w-4 h-4 text-emerald-400"/><h2 className="text-lg font-bold">Новинки</h2></div>
        {loading ? <div className="flex gap-4 overflow-hidden">{[...Array(4)].map((_,i)=><div key={i} className="flex-shrink-0 w-32 animate-pulse"><div className="w-32 h-32 rounded-2xl bg-white/5 mb-2"/></div>)}</div>
          : <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
              {newReleases.map(t=>(
                <div key={t.id} className="flex-shrink-0 w-32 cursor-pointer group" onClick={()=>playTrack(t)}>
                  <div className="relative w-32 h-32 rounded-2xl overflow-hidden mb-2">
                    <img src={t.image_url||'/placeholder.png'} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform"/>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity"/>
                    </div>
                  </div>
                  <p className="text-xs font-medium truncate">{t.name}</p>
                  <p className="text-white/40 text-xs truncate">{t.artist_name}</p>
                </div>
              ))}
            </div>}
      </div>
    </div>
  );
}

function Section({title,icon,loading,children}:{title:string;icon?:React.ReactNode;loading:boolean;children:React.ReactNode}) {
  return (
    <div className="mb-6 px-4">
      <div className="flex items-center gap-2 mb-3">{icon&&<span className="text-emerald-400">{icon}</span>}<h2 className="text-lg font-bold">{title}</h2></div>
      {loading?<div className="space-y-2">{[...Array(5)].map((_,i)=><div key={i} className="flex items-center gap-3 p-2.5 animate-pulse"><div className="w-5 h-3 bg-white/5 rounded"/><div className="w-11 h-11 rounded-xl bg-white/5"/><div className="flex-1 space-y-1.5"><div className="h-3 bg-white/5 rounded w-3/4"/><div className="h-2 bg-white/5 rounded w-1/2"/></div></div>)}</div>
        :<div className="space-y-2">{children}</div>}
    </div>
  );
}

function TrackRow({track,index,onPlay}:{track:Track;index:number;onPlay:()=>void}) {
  const {currentTrack,isPlaying} = usePlayer();
  const active = currentTrack?.id===track.id;
  return (
    <div className={cn('flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-all',active?'bg-emerald-500/10 border border-emerald-500/20':'hover:bg-white/5')} onClick={onPlay}>
      <span className={cn('w-5 text-sm text-center flex-shrink-0',active?'text-emerald-400':'text-white/30')}>
        {active&&isPlaying?<span className="flex justify-center gap-px items-end h-4"><span className="w-0.5 bg-emerald-400 rounded animate-bar1 inline-block"/><span className="w-0.5 bg-emerald-400 rounded animate-bar2 inline-block"/><span className="w-0.5 bg-emerald-400 rounded animate-bar3 inline-block"/></span>:index}
      </span>
      <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0">
        <img src={track.image_url||'/placeholder.png'} alt={track.name} className="w-full h-full object-cover"/>
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('font-medium text-sm truncate',active&&'text-emerald-400')}>{track.name}</p>
        <p className="text-white/40 text-xs truncate">{track.artist_name}</p>
      </div>
      <span className="text-white/25 text-xs">{fmt(track.duration)}</span>
    </div>
  );
}
const fmt=(s:number)=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
