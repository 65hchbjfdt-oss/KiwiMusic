import { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Heart, ChevronDown,
  Shuffle, Repeat, Volume2, VolumeX, Mic2, ListMusic, MessageCircle
} from 'lucide-react';
import { usePlayer } from '@/hooks/usePlayer';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/ui-custom';
import { CommentsSheet } from '@/components/CommentsSheet';

export function FullPlayer() {
  const {
    currentTrack, isPlaying, currentTime, duration, volume, isMuted,
    isShuffle, repeatMode, togglePlay, nextTrack, previousTrack,
    seekTo, toggleMute, toggleShuffle, toggleRepeat,
    isLiked, toggleLike, showPlayer, setShowPlayer, showLyrics, setShowLyrics,
  } = usePlayer();

  const [showComments, setShowComments] = useState(false);
  const [visible, setVisible] = useState(false);

  // FIXED: slide-up animation on mount
  useEffect(() => {
    if (showPlayer) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [showPlayer]);

  if (!currentTrack || !showPlayer) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  const albumColor = currentTrack.image_url ? 'from-zinc-900' : 'from-emerald-950';

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-50 bg-gradient-to-b to-black transition-all duration-400',
          albumColor,
          visible ? 'animate-player-in' : 'opacity-0 pointer-events-none'
        )}
      >
        {/* Ambient background */}
        <div className="absolute inset-0 overflow-hidden">
          {currentTrack.image_url && (
            <img
              src={currentTrack.image_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-20 scale-110 blur-3xl"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80" />
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-4 pt-12">
          <button
            onClick={() => setShowPlayer(false)}
            className="p-2 text-white/70 hover:text-white transition-colors"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
          <div className="text-center">
            <p className="text-white/60 text-sm">Сейчас играет</p>
          </div>
          <button
            onClick={() => setShowComments(true)}
            className="p-2 text-white/70 hover:text-white transition-colors relative"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Album art */}
        <div className="relative z-10 flex flex-col h-[calc(100%-80px)]">
          <div className="flex-1 flex items-center justify-center px-8">
            {showLyrics ? (
              <GlassCard className="w-full max-w-md h-[280px] overflow-hidden" variant="dark" intensity="high">
                <div className="h-full flex items-center justify-center p-6">
                  <p className="text-white/50 text-center text-sm">
                    Тексты песен не поддерживаются для этого источника
                  </p>
                </div>
              </GlassCard>
            ) : (
              <div className="relative w-64 h-64 md:w-72 md:h-72">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-rose-500/20 rounded-3xl blur-2xl" />
                <img
                  src={currentTrack.image_url || '/placeholder-track.png'}
                  alt={currentTrack.name}
                  className={cn(
                    'relative w-full h-full object-cover rounded-3xl shadow-2xl transition-all duration-300',
                    isPlaying ? 'scale-100' : 'scale-95 opacity-80'
                  )}
                />
              </div>
            )}
          </div>

          {/* Track info */}
          <div className="px-8 mt-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-3">
                <h2 className="text-2xl font-bold text-white truncate">{currentTrack.name}</h2>
                <p className="text-white/60 text-lg truncate">{currentTrack.artist_name}</p>
              </div>
              <button
                onClick={() => toggleLike()}
                className={cn('p-3 rounded-full transition-all active:scale-90', isLiked ? 'text-rose-500' : 'text-white/40 hover:text-white')}
              >
                <Heart className={cn('w-7 h-7', isLiked && 'fill-current')} />
              </button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-6 pb-28">
          {/* Progress */}
          <div className="mb-5">
            <div
              className="h-1.5 bg-white/10 rounded-full cursor-pointer group"
              onClick={e => {
                const rect = e.currentTarget.getBoundingClientRect();
                seekTo(((e.clientX - rect.left) / rect.width) * duration);
              }}
            >
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="flex justify-between mt-2 text-sm text-white/50">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main controls */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={toggleShuffle}
              className={cn('p-2 transition-colors', isShuffle ? 'text-emerald-400' : 'text-white/40 hover:text-white')}
            >
              <Shuffle className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4">
              <button onClick={previousTrack} className="p-3 text-white hover:text-emerald-400 transition-colors active:scale-90">
                <SkipBack className="w-8 h-8" />
              </button>
              <button
                onClick={togglePlay}
                className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white hover:bg-emerald-400 transition-all active:scale-90 shadow-lg shadow-emerald-500/30"
              >
                {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
              </button>
              <button onClick={nextTrack} className="p-3 text-white hover:text-emerald-400 transition-colors active:scale-90">
                <SkipForward className="w-8 h-8" />
              </button>
            </div>
            <button
              onClick={toggleRepeat}
              className={cn('p-2 transition-colors relative', repeatMode !== 'none' ? 'text-emerald-400' : 'text-white/40 hover:text-white')}
            >
              <Repeat className="w-5 h-5" />
              {repeatMode === 'one' && (
                <span className="absolute -top-1 -right-1 text-[8px] font-bold bg-emerald-500 text-white rounded-full w-4 h-4 flex items-center justify-center">1</span>
              )}
            </button>
          </div>

          {/* Secondary controls */}
          <div className="flex items-center justify-between">
            <button onClick={toggleMute} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              <div className="w-20 h-1 bg-white/20 rounded-full">
                <div className="h-full bg-white/60 rounded-full" style={{ width: `${isMuted ? 0 : volume * 100}%` }} />
              </div>
            </button>
            <button
              onClick={() => setShowLyrics(!showLyrics)}
              className={cn('p-2 rounded-lg transition-colors', showLyrics ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/60 hover:text-white')}
            >
              <Mic2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Comments Sheet */}
      <CommentsSheet
        trackId={currentTrack.id}
        trackName={currentTrack.name}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />
    </>
  );
}
