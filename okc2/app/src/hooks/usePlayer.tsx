import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { Track, PlayerState } from '@/types';
import { likeTrack, unlikeTrack, isTrackLiked, addListeningHistory } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface PlayerContextType extends PlayerState {
  playTrack: (track: Track, queue?: Track[]) => void;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  isLiked: boolean;
  toggleLike: () => void;
  showPlayer: boolean;
  setShowPlayer: (show: boolean) => void;
  showLyrics: boolean;
  setShowLyrics: (show: boolean) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);
const STORAGE_KEY = 'kiwi_player_state';

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement>(null);

  const loadSavedState = (): Partial<PlayerState> => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) { /* ignore */ }
    return {};
  };

  const savedState = loadSavedState();

  const [state, setState] = useState<PlayerState>({
    currentTrack: savedState.currentTrack || null,
    isPlaying: false,
    currentTime: savedState.currentTime || 0,
    duration: 0,
    volume: savedState.volume ?? 0.7,
    isMuted: false,
    isShuffle: false,
    repeatMode: 'none',
    queue: [],
    currentIndex: 0,
  });

  const [isLiked, setIsLiked] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const listenStartRef = useRef<number>(0);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      currentTrack: state.currentTrack,
      currentTime: state.currentTime,
      volume: state.volume,
    }));
  }, [state.currentTrack, state.currentTime, state.volume]);

  useEffect(() => {
    if (!user || !state.currentTrack) { setIsLiked(false); return; }
    isTrackLiked(user.id, state.currentTrack.id).then(setIsLiked).catch(() => setIsLiked(false));
  }, [user, state.currentTrack?.id]);

  // FIXED: use ref so handlers always read current state
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setState(prev => ({ ...prev, currentTime: audio.currentTime }));
    };
    const handleLoadedMetadata = () => {
      setState(prev => ({ ...prev, duration: audio.duration }));
    };
    // FIXED: read from ref, not stale closure
    const handleEnded = () => {
      const s = stateRef.current;
      if (s.repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(console.error);
        return;
      }
      if (s.queue.length === 0) return;
      let nextIndex: number;
      if (s.isShuffle) {
        nextIndex = Math.floor(Math.random() * s.queue.length);
      } else if (s.repeatMode === 'all') {
        nextIndex = (s.currentIndex + 1) % s.queue.length;
      } else {
        nextIndex = s.currentIndex + 1;
        if (nextIndex >= s.queue.length) return;
      }
      setState(prev => ({
        ...prev,
        currentTrack: s.queue[nextIndex],
        currentIndex: nextIndex,
        isPlaying: true,
      }));
    };
    const handlePlay = () => { listenStartRef.current = Date.now(); };
    const handlePause = () => {
      if (!user || !stateRef.current.currentTrack) return;
      const elapsed = Math.floor((Date.now() - listenStartRef.current) / 1000);
      if (elapsed > 5) {
        const dur = stateRef.current.currentTrack.duration;
        addListeningHistory(user.id, stateRef.current.currentTrack.id, elapsed, elapsed >= dur * 0.8).catch(() => {});
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !state.currentTrack) return;
    audio.src = state.currentTrack.audio_url || '';
    audio.volume = state.volume;
    if (state.isPlaying) audio.play().catch(console.error);
  }, [state.currentTrack?.id]);

  const playTrack = useCallback((track: Track, queue?: Track[]) => {
    setState(prev => ({
      ...prev,
      currentTrack: track,
      isPlaying: true,
      queue: queue || [track],
      currentIndex: queue ? queue.findIndex(t => t.id === track.id) : 0,
    }));
    setShowPlayer(true);
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !stateRef.current.currentTrack) return;
    if (stateRef.current.isPlaying) {
      audio.pause();
      setState(prev => ({ ...prev, isPlaying: false }));
    } else {
      audio.play().catch(console.error);
      setState(prev => ({ ...prev, isPlaying: true }));
    }
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const resume = useCallback(() => {
    if (!stateRef.current.currentTrack) return;
    audioRef.current?.play().catch(console.error);
    setState(prev => ({ ...prev, isPlaying: true }));
  }, []);

  const nextTrack = useCallback(() => {
    const s = stateRef.current;
    if (s.queue.length === 0) return;
    const nextIndex = s.isShuffle
      ? Math.floor(Math.random() * s.queue.length)
      : (s.currentIndex + 1) % s.queue.length;
    setState(prev => ({ ...prev, currentTrack: s.queue[nextIndex], currentIndex: nextIndex, isPlaying: true }));
  }, []);

  const previousTrack = useCallback(() => {
    const s = stateRef.current;
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) { audio.currentTime = 0; return; }
    if (s.queue.length === 0) return;
    const prevIndex = s.currentIndex === 0 ? s.queue.length - 1 : s.currentIndex - 1;
    setState(prev => ({ ...prev, currentTrack: s.queue[prevIndex], currentIndex: prevIndex, isPlaying: true }));
  }, []);

  const seekTo = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio) { audio.currentTime = time; setState(prev => ({ ...prev, currentTime: time })); }
  }, []);

  const setVolume = useCallback((volume: number) => {
    const audio = audioRef.current;
    if (audio) { audio.volume = volume; setState(prev => ({ ...prev, volume, isMuted: volume === 0 })); }
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const newMuted = !stateRef.current.isMuted;
    audio.muted = newMuted;
    setState(prev => ({ ...prev, isMuted: newMuted }));
  }, []);

  const toggleShuffle = useCallback(() => setState(prev => ({ ...prev, isShuffle: !prev.isShuffle })), []);

  const toggleRepeat = useCallback(() => {
    setState(prev => ({
      ...prev,
      repeatMode: prev.repeatMode === 'none' ? 'all' : prev.repeatMode === 'all' ? 'one' : 'none',
    }));
  }, []);

  const addToQueue = useCallback((track: Track) => {
    setState(prev => ({ ...prev, queue: [...prev.queue, track] }));
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setState(prev => ({ ...prev, queue: prev.queue.filter((_, i) => i !== index) }));
  }, []);

  const clearQueue = useCallback(() => setState(prev => ({ ...prev, queue: [], currentIndex: 0 })), []);

  // FIXED: likes saved to Supabase
  const toggleLike = useCallback(async () => {
    if (!user || !stateRef.current.currentTrack) return;
    const trackId = stateRef.current.currentTrack.id;
    if (isLiked) {
      setIsLiked(false);
      await unlikeTrack(user.id, trackId).catch(() => setIsLiked(true));
    } else {
      setIsLiked(true);
      await likeTrack(user.id, trackId).catch(() => setIsLiked(false));
    }
  }, [user, isLiked]);

  return (
    <PlayerContext.Provider value={{
      ...state, playTrack, togglePlay, pause, resume, nextTrack, previousTrack,
      seekTo, setVolume, toggleMute, toggleShuffle, toggleRepeat,
      addToQueue, removeFromQueue, clearQueue,
      isLiked, toggleLike, showPlayer, setShowPlayer, showLyrics, setShowLyrics, audioRef,
    }}>
      {children}
      <audio ref={audioRef} />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within a PlayerProvider');
  return context;
}
