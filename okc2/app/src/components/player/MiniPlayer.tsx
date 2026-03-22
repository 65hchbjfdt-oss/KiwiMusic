import { Play, Pause, Heart, SkipForward, ChevronUp } from 'lucide-react';
import { usePlayer } from '@/hooks/usePlayer';
import { cn } from '@/lib/utils';

export function MiniPlayer() {
  const { 
    currentTrack, 
    isPlaying, 
    togglePlay, 
    nextTrack, 
    isLiked, 
    toggleLike,
    setShowPlayer 
  } = usePlayer();

  if (!currentTrack) return null;

  return (
    <div 
      className="fixed bottom-20 left-4 right-4 z-40"
      onClick={() => setShowPlayer(true)}
    >
      <div className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-2xl p-3">
        <div className="flex items-center gap-3">
          {/* Track Image */}
          <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
            <img 
              src={currentTrack.image_url || '/placeholder-track.png'} 
              alt={currentTrack.name}
              className="w-full h-full object-cover"
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="flex gap-0.5">
                  <div className="w-1 h-4 bg-emerald-400 animate-pulse" />
                  <div className="w-1 h-6 bg-emerald-400 animate-pulse delay-75" />
                  <div className="w-1 h-3 bg-emerald-400 animate-pulse delay-150" />
                </div>
              </div>
            )}
          </div>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate text-sm">
              {currentTrack.name}
            </p>
            <p className="text-white/60 text-xs truncate">
              {currentTrack.artist_name}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleLike();
              }}
              className={cn(
                'p-2 rounded-full transition-colors',
                isLiked ? 'text-rose-500' : 'text-white/60 hover:text-white'
              )}
            >
              <Heart className={cn('w-5 h-5', isLiked && 'fill-current')} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="p-2 bg-emerald-500 rounded-full text-white hover:bg-emerald-400 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                nextTrack();
              }}
              className="p-2 text-white/60 hover:text-white transition-colors"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPlayer(true);
              }}
              className="p-2 text-white/60 hover:text-white transition-colors"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
            style={{ 
              width: `${(currentTrack.duration ? 0 : 0)}%` 
            }}
          />
        </div>
      </div>
    </div>
  );
}
