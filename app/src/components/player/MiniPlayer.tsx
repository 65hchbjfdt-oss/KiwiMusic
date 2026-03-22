import { Play, Pause, Heart, SkipForward, ChevronUp } from 'lucide-react';
import { usePlayer } from '@/hooks/usePlayer';
import { cn } from '@/lib/utils';

export function MiniPlayer() {
  const {
    currentTrack, isPlaying, currentTime, duration,
    togglePlay, nextTrack, isLiked, toggleLike, setShowPlayer,
  } = usePlayer();

  if (!currentTrack) return null;

  // FIXED: progress now uses real currentTime/duration
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 animate-mini-player-in">
      <div
        className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-3 cursor-pointer shadow-2xl"
        onClick={() => setShowPlayer(true)}
      >
        <div className="flex items-center gap-3">
          {/* Album art */}
          <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
            <img
              src={currentTrack.image_url || '/placeholder-track.png'}
              alt={currentTrack.name}
              className="w-full h-full object-cover"
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                {/* FIXED: using proper audio-bar animation classes */}
                <div className="flex gap-0.5 items-end h-5">
                  <div className="w-1 bg-emerald-400 rounded audio-bar" />
                  <div className="w-1 bg-emerald-400 rounded audio-bar" />
                  <div className="w-1 bg-emerald-400 rounded audio-bar" />
                </div>
              </div>
            )}
          </div>

          {/* Track info */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate text-sm">{currentTrack.name}</p>
            <p className="text-white/60 text-xs truncate">{currentTrack.artist_name}</p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={e => { e.stopPropagation(); toggleLike(); }}
              className={cn('p-2 rounded-full transition-colors', isLiked ? 'text-rose-500' : 'text-white/60 hover:text-white')}
            >
              <Heart className={cn('w-5 h-5', isLiked && 'fill-current')} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); togglePlay(); }}
              className="p-2 bg-emerald-500 rounded-full text-white hover:bg-emerald-400 transition-colors active:scale-90"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <button
              onClick={e => { e.stopPropagation(); nextTrack(); }}
              className="p-2 text-white/60 hover:text-white transition-colors"
            >
              <SkipForward className="w-4 h-4" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); setShowPlayer(true); }}
              className="p-2 text-white/60 hover:text-white transition-colors"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* FIXED: real progress bar */}
        <div className="mt-2 h-0.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
