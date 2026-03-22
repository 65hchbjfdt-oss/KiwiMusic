import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import type { Track } from '@/types';
import { getAccessToken, playSdk, transferPlayback, saveTrack, unsaveTrack } from '@/lib/spotify';
import { supabase } from '@/lib/supabase';

declare global {
  interface Window { onSpotifyWebPlaybackSDKReady: () => void; Spotify: any; }
}

const STORAGE_KEY = 'kiwi_player_state';

interface PlayerContextType {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: 'none' | 'all' | 'one';
  isLiked: boolean;
  showPlayer: boolean;
  showLyrics: boolean;
  isSDKReady: boolean;
  likedIds: Set<string>;
  playTrack: (track: Track, queue?: Track[]) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  seekTo: (t: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleLike: () => void;
  setShowPlayer: (v: boolean) => void;
  setShowLyrics: (v: boolean) => void;
}

const Ctx = createContext<PlayerContextType>({} as PlayerContextType);

export function PlayerProvider({ children, userId }: { children: ReactNode; userId?: string }) {
  const saved = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; } })();

  const [currentTrack, setCurrentTrack] = useState<Track | null>(saved.currentTrack || null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIdx, setQueueIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(saved.currentTime || 0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(saved.volume ?? 0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none'|'all'|'one'>('none');
  const [showPlayer, setShowPlayer] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [isSDKReady, setIsSDKReady] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const playerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persist state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentTrack, currentTime, volume }));
  }, [currentTrack, currentTime, volume]);

  // Load liked tracks from Supabase
  useEffect(() => {
    if (!userId) return;
    supabase.from('liked_tracks').select('track_id').eq('user_id', userId)
      .then(({ data }) => { if (data) setLikedIds(new Set(data.map(r => r.track_id))); });
  }, [userId]);

  // Load Spotify SDK
  useEffect(() => {
    const loadSdk = async () => {
      const token = await getAccessToken();
      if (!token) return;
      if (document.getElementById('spotify-sdk')) return;
      const s = document.createElement('script');
      s.id = 'spotify-sdk';
      s.src = 'https://sdk.scdn.co/spotify-player.js';
      document.body.appendChild(s);

      window.onSpotifyWebPlaybackSDKReady = () => {
        const player = new window.Spotify.Player({
          name: 'Kiwi Music',
          getOAuthToken: async (cb: (t: string) => void) => { const t = await getAccessToken(); if (t) cb(t); },
          volume,
        });
        player.addListener('ready', async ({ device_id }: { device_id: string }) => {
          setDeviceId(device_id);
          setIsSDKReady(true);
          const token = await getAccessToken();
          if (token) await transferPlayback(token, device_id);
        });
        player.addListener('not_ready', () => setIsSDKReady(false));
        player.addListener('player_state_changed', (state: any) => {
          if (!state) return;
          setIsPlaying(!state.paused);
          setCurrentTime(state.position / 1000);
          setDuration(state.duration / 1000);
        });
        player.connect();
        playerRef.current = player;
      };
    };
    loadSdk();
    return () => playerRef.current?.disconnect();
  }, []);

  // Progress timer fallback (for preview audio)
  useEffect(() => {
    if (progressRef.current) clearInterval(progressRef.current);
    if (isPlaying && audioRef.current) {
      progressRef.current = setInterval(() => {
        if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
      }, 500);
    }
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, [isPlaying]);

  const playTrack = useCallback(async (track: Track, newQueue?: Track[]) => {
    setCurrentTrack(track);
    setCurrentTime(0);
    setShowPlayer(true);
    if (newQueue) { setQueue(newQueue); setQueueIdx(newQueue.findIndex(t => t.id === track.id)); }

    const token = await getAccessToken();

    // Try Spotify SDK (Premium) first
    if (isSDKReady && deviceId && token && track.uri) {
      try {
        await playSdk(token, deviceId, track.uri);
        setIsPlaying(true);
        return;
      } catch (e) { console.warn('SDK play failed, fallback to preview', e); }
    }

    // Fallback: 30-sec preview
    if (track.audio_url) {
      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.addEventListener('ended', () => nextTrackInternal());
        audioRef.current.addEventListener('loadedmetadata', () => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        });
      }
      audioRef.current.src = track.audio_url;
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.play();
      setIsPlaying(true);
      setDuration(30);
    }
  }, [isSDKReady, deviceId, volume, isMuted]);

  const nextTrackInternal = useCallback(() => {
    setQueue(q => {
      setQueueIdx(idx => {
        let next = isShuffle ? Math.floor(Math.random() * q.length) : idx + 1;
        if (next >= q.length) { if (repeatMode === 'all') next = 0; else return idx; }
        if (q[next]) playTrack(q[next], q);
        return next;
      });
      return q;
    });
  }, [isShuffle, repeatMode, playTrack]);

  const togglePlay = useCallback(async () => {
    if (audioRef.current?.src) {
      isPlaying ? audioRef.current.pause() : audioRef.current.play();
      setIsPlaying(!isPlaying);
      return;
    }
    if (playerRef.current) await playerRef.current.togglePlay();
  }, [isPlaying]);

  const nextTrack = nextTrackInternal;

  const previousTrack = useCallback(() => {
    if (currentTime > 3) { seekTo(0); return; }
    setQueueIdx(idx => {
      const prev = Math.max(0, idx - 1);
      if (queue[prev]) playTrack(queue[prev], queue);
      return prev;
    });
  }, [currentTime, queue, playTrack]);

  const seekTo = useCallback((t: number) => {
    setCurrentTime(t);
    if (audioRef.current) audioRef.current.currentTime = t;
    else playerRef.current?.seek(t * 1000);
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
    playerRef.current?.setVolume(v);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(m => {
      const next = !m;
      if (audioRef.current) audioRef.current.volume = next ? 0 : volume;
      playerRef.current?.setVolume(next ? 0 : volume);
      return next;
    });
  }, [volume]);

  const isLiked = currentTrack ? likedIds.has(currentTrack.id) : false;

  const toggleLike = useCallback(async () => {
    if (!currentTrack || !userId) return;
    const token = await getAccessToken();
    const newLiked = new Set(likedIds);
    if (isLiked) {
      newLiked.delete(currentTrack.id);
      if (token) await unsaveTrack(token, currentTrack.id);
      await supabase.from('liked_tracks').delete().eq('user_id', userId).eq('track_id', currentTrack.id);
    } else {
      newLiked.add(currentTrack.id);
      if (token) await saveTrack(token, currentTrack.id);
      await supabase.from('liked_tracks').upsert({
        user_id: userId, track_id: currentTrack.id,
        track_name: currentTrack.name, artist_name: currentTrack.artist_name,
        album_name: currentTrack.album_name, image_url: currentTrack.image_url,
      });
    }
    setLikedIds(newLiked);
  }, [currentTrack, isLiked, likedIds, userId]);

  return (
    <Ctx.Provider value={{
      currentTrack, queue, isPlaying, currentTime, duration, volume, isMuted,
      isShuffle, repeatMode, isLiked, showPlayer, showLyrics, isSDKReady, likedIds,
      playTrack, togglePlay, nextTrack, previousTrack, seekTo, setVolume, toggleMute,
      toggleShuffle: () => setIsShuffle(s => !s),
      toggleRepeat: () => setRepeatMode(m => m==='none'?'all':m==='all'?'one':'none'),
      toggleLike, setShowPlayer, setShowLyrics,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePlayer() { return useContext(Ctx); }
