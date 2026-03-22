import { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Heart, 
  ChevronDown, 
  Shuffle, 
  Repeat, 
  Volume2, 
  VolumeX,
  Mic2,
  ListMusic
} from 'lucide-react';
import { usePlayer } from '@/hooks/useSpotifyPlayer';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/ui-custom';

// Mock lyrics data
const mockLyrics = [
  { time: 0, text: "♪ Музыка играет ♪" },
  { time: 5, text: "♪ Наслаждайтесь звуком ♪" },
  { time: 10, text: "♪ Пусть мелодия несётся ♪" },
  { time: 15, text: "♪ В сердце и в душу ♪" },
  { time: 20, text: "♪ Каждая нота ♪" },
  { time: 25, text: "♪ Рассказывает историю ♪" },
  { time: 30, text: "♪ Погрузитесь в музыку ♪" },
];

export function FullPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    togglePlay,
    nextTrack,
    previousTrack,
    seekTo,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    isLiked,
    toggleLike,
    showPlayer,
    setShowPlayer,
    showLyrics,
    setShowLyrics
  } = usePlayer();

  const [showQueue, setShowQueue] = useState(false);
  const lyricsRef = useRef<HTMLDivElement>(null);
  const [activeLyricIndex, setActiveLyricIndex] = useState(0);

  useEffect(() => {
    // Find active lyric based on current time
    const index = mockLyrics.findIndex((lyric, i) => {
      const nextLyric = mockLyrics[i + 1];
      return currentTime >= lyric.time && (!nextLyric || currentTime < nextLyric.time);
    });
    if (index !== -1) {
      setActiveLyricIndex(index);
    }
  }, [currentTime]);

  useEffect(() => {
    // Scroll to active lyric
    if (lyricsRef.current && showLyrics) {
      const activeElement = lyricsRef.current.children[activeLyricIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeLyricIndex, showLyrics]);

  if (!currentTrack || !showPlayer) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-rose-950 via-black to-black">
      {/* Background Effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-[60%] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.3) 0%, transparent 70%)',
            filter: 'blur(80px)'
          }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4">
        <button
          onClick={() => setShowPlayer(false)}
          className="p-2 text-white/70 hover:text-white transition-colors"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
        <span className="text-white/60 text-sm">Сейчас играет</span>
        <button
          onClick={() => setShowQueue(!showQueue)}
          className={cn(
            'p-2 transition-colors',
            showQueue ? 'text-emerald-400' : 'text-white/70 hover:text-white'
          )}
        >
          <ListMusic className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col h-[calc(100%-180px)]">
        {/* Track Image or Lyrics */}
        <div className="flex-1 flex items-center justify-center px-8">
          {showLyrics ? (
            <GlassCard 
              className="w-full max-w-md h-[300px] overflow-hidden"
              variant="dark"
              intensity="high"
            >
              <div 
                ref={lyricsRef}
                className="h-full overflow-y-auto p-6 space-y-6 scrollbar-hide"
              >
                {mockLyrics.map((lyric, index) => (
                  <p
                    key={index}
                    className={cn(
                      'text-center text-lg font-medium transition-all duration-300',
                      index === activeLyricIndex 
                        ? 'text-white scale-110' 
                        : index < activeLyricIndex 
                          ? 'text-white/40' 
                          : 'text-white/60'
                    )}
                  >
                    {lyric.text}
                  </p>
                ))}
              </div>
            </GlassCard>
          ) : (
            <div className="relative w-64 h-64 md:w-80 md:h-80">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-rose-500/20 rounded-3xl blur-2xl" />
              <img
                src={currentTrack.image_url || '/placeholder-track.png'}
                alt={currentTrack.name}
                className="relative w-full h-full object-cover rounded-3xl shadow-2xl"
              />
            </div>
          )}
        </div>

        {/* Track Info */}
        <div className="px-8 mt-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white truncate">
                {currentTrack.name}
              </h2>
              <p className="text-white/60 text-lg">
                {currentTrack.artist_name}
              </p>
            </div>
            <button
              onClick={toggleLike}
              className={cn(
                'p-3 rounded-full transition-colors',
                isLiked ? 'text-rose-500' : 'text-white/40 hover:text-white'
              )}
            >
              <Heart className={cn('w-7 h-7', isLiked && 'fill-current')} />
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-6 pb-28">
        {/* Progress Bar */}
        <div className="mb-6">
          <div 
            className="h-1.5 bg-white/10 rounded-full cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const percent = (e.clientX - rect.left) / rect.width;
              seekTo(percent * duration);
            }}
          >
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
            </div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-white/50">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={toggleShuffle}
            className={cn(
              'p-2 transition-colors',
              isShuffle ? 'text-emerald-400' : 'text-white/40 hover:text-white'
            )}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={previousTrack}
              className="p-3 text-white hover:text-emerald-400 transition-colors"
            >
              <SkipBack className="w-8 h-8" />
            </button>

            <button
              onClick={togglePlay}
              className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/30"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8" />
              ) : (
                <Play className="w-8 h-8 ml-1" />
              )}
            </button>

            <button
              onClick={nextTrack}
              className="p-3 text-white hover:text-emerald-400 transition-colors"
            >
              <SkipForward className="w-8 h-8" />
            </button>
          </div>

          <button
            onClick={toggleRepeat}
            className={cn(
              'p-2 transition-colors relative',
              repeatMode !== 'none' ? 'text-emerald-400' : 'text-white/40 hover:text-white'
            )}
          >
            <Repeat className="w-5 h-5" />
            {repeatMode === 'one' && (
              <span className="absolute -top-1 -right-1 text-[8px] font-bold bg-emerald-500 text-white rounded-full w-4 h-4 flex items-center justify-center">1</span>
            )}
          </button>
        </div>

        {/* Secondary Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 text-white/60 hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <div className="w-20 h-1 bg-white/20 rounded-full">
              <div 
                className="h-full bg-white/60 rounded-full"
                style={{ width: `${isMuted ? 0 : volume * 100}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => setShowLyrics(!showLyrics)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              showLyrics ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/60 hover:text-white'
            )}
          >
            <Mic2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Not What I Wanted Button - Small, off-center */}
      <button
        className="absolute bottom-36 right-4 px-3 py-1.5 bg-white/5 hover:bg-white/10 
                   border border-white/10 rounded-lg text-white/40 hover:text-white/60 
                   text-xs transition-colors"
        onClick={nextTrack}
      >
        Не то, что я хотел
      </button>
    </div>
  );
}
