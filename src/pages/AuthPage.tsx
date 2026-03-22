import { useAuth } from '@/hooks/useAuth';

export function AuthPage() {
  const { login } = useAuth();
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden px-6">
      {/* BG */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20"
          style={{background:'radial-gradient(circle,rgba(16,185,129,0.5) 0%,transparent 70%)',filter:'blur(80px)'}}/>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-20"
          style={{background:'radial-gradient(circle,rgba(139,0,0,0.6) 0%,transparent 70%)',filter:'blur(80px)'}}/>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 max-w-sm w-full text-white">
        {/* Logo */}
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-700 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-emerald-500/30">
            <span className="text-4xl">🥝</span>
          </div>
          <h1 className="text-4xl font-bold mb-1">Kiwi Music</h1>
          <p className="text-white/50">Твоя музыка, твой ритм</p>
        </div>

        {/* Spotify Login */}
        <button onClick={login}
          className="w-full flex items-center justify-center gap-3 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-4 px-8 rounded-2xl transition-all shadow-lg shadow-[#1DB954]/30 hover:scale-[1.02]">
          <SpotifyIcon />
          Войти через Spotify
        </button>

        <p className="text-white/25 text-xs text-center leading-relaxed">
          Полное воспроизведение требует Spotify Premium.<br/>
          Поиск и 30-сек превью — бесплатно.
        </p>
      </div>
    </div>
  );
}

function SpotifyIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  );
}
