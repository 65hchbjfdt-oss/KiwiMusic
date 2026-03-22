import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { Track, PlayerState } from '@/types';

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
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Load saved state from localStorage
  const loadSavedState = (): Partial<PlayerState> => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load player state:', e);
    }
    return {};
  };
  
  const savedState = loadSavedState();
  
  const [state, setState] = useState<PlayerState>({
    currentTrack: savedState.currentTrack || null,
    isPlaying: false,
    currentTime: savedState.currentTime || 0,
    duration: 0,
    volume: savedState.volume || 0.7,
    isMuted: false,
    isShuffle: false,
    repeatMode: 'none',
    queue: [],
    currentIndex: 0
  });
  
  const [isLiked, setIsLiked] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);

  // Save state to localStorage
  useEffect(() => {
    const stateToSave = {
      currentTrack: state.currentTrack,
      currentTime: state.currentTime,
      volume: state.volume
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [state.currentTrack, state.currentTime, state.volume]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setState(prev => ({ ...prev, currentTime: audio.currentTime }));
    };

    const handleLoadedMetadata = () => {
      setState(prev => ({ ...prev, duration: audio.duration }));
    };

    const handleEnded = () => {
      if (state.repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else {
        nextTrack();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [state.repeatMode]);

  // Set audio source when track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && state.currentTrack) {
      audio.src = state.currentTrack.audio_url;
      audio.volume = state.volume;
      if (state.isPlaying) {
        audio.play().catch(console.error);
      }
    }
  }, [state.currentTrack?.id]);

  const playTrack = useCallback((track: Track, queue?: Track[]) => {
    setState(prev => ({
      ...prev,
      currentTrack: track,
      isPlaying: true,
      queue: queue || [track],
      currentIndex: queue ? queue.findIndex(t => t.id === track.id) : 0
    }));
    setShowPlayer(true);
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !state.currentTrack) return;

    if (state.isPlaying) {
      audio.pause();
      setState(prev => ({ ...prev, isPlaying: false }));
    } else {
      audio.play().catch(console.error);
      setState(prev => ({ ...prev, isPlaying: true }));
    }
  }, [state.isPlaying, state.currentTrack]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      setState(prev => ({ ...prev, isPlaying: false }));
    }
  }, []);

  const resume = useCallback(() => {
    const audio = audioRef.current;
    if (audio && state.currentTrack) {
      audio.play().catch(console.error);
      setState(prev => ({ ...prev, isPlaying: true }));
    }
  }, [state.currentTrack]);

  const nextTrack = useCallback(() => {
    if (state.queue.length === 0) return;
    
    let nextIndex: number;
    if (state.isShuffle) {
      nextIndex = Math.floor(Math.random() * state.queue.length);
    } else {
      nextIndex = (state.currentIndex + 1) % state.queue.length;
    }
    
    const nextTrack = state.queue[nextIndex];
    setState(prev => ({
      ...prev,
      currentTrack: nextTrack,
      currentIndex: nextIndex,
      isPlaying: true
    }));
  }, [state.queue, state.currentIndex, state.isShuffle]);

  const previousTrack = useCallback(() => {
    if (state.queue.length === 0) return;
    
    const prevIndex = state.currentIndex === 0 
      ? state.queue.length - 1 
      : state.currentIndex - 1;
    
    const prevTrack = state.queue[prevIndex];
    setState(prev => ({
      ...prev,
      currentTrack: prevTrack,
      currentIndex: prevIndex,
      isPlaying: true
    }));
  }, [state.queue, state.currentIndex]);

  const seekTo = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = time;
      setState(prev => ({ ...prev, currentTime: time }));
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
      setState(prev => ({ ...prev, volume }));
    }
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = !state.isMuted;
      setState(prev => ({ ...prev, isMuted: !prev.isMuted }));
    }
  }, [state.isMuted]);

  const toggleShuffle = useCallback(() => {
    setState(prev => ({ ...prev, isShuffle: !prev.isShuffle }));
  }, []);

  const toggleRepeat = useCallback(() => {
    setState(prev => ({
      ...prev,
      repeatMode: prev.repeatMode === 'none' ? 'all' : prev.repeatMode === 'all' ? 'one' : 'none'
    }));
  }, []);

  const addToQueue = useCallback((track: Track) => {
    setState(prev => ({
      ...prev,
      queue: [...prev.queue, track]
    }));
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      queue: prev.queue.filter((_, i) => i !== index)
    }));
  }, []);

  const clearQueue = useCallback(() => {
    setState(prev => ({
      ...prev,
      queue: [],
      currentIndex: 0
    }));
  }, []);

  const toggleLike = useCallback(() => {
    setIsLiked(prev => !prev);
  }, []);

  return (
    <PlayerContext.Provider value={{
      ...state,
      playTrack,
      togglePlay,
      pause,
      resume,
      nextTrack,
      previousTrack,
      seekTo,
      setVolume,
      toggleMute,
      toggleShuffle,
      toggleRepeat,
      addToQueue,
      removeFromQueue,
      clearQueue,
      isLiked,
      toggleLike,
      showPlayer,
      setShowPlayer,
      showLyrics,
      setShowLyrics,
      audioRef
    }}>
      {children}
      <audio ref={audioRef} />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
