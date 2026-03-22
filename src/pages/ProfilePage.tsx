import { useState } from 'react';
import { 
  Settings, 
  LogOut, 
  Music, 
  Heart, 
  Users, 
  Disc, 
  Clock,
  Crown,
  ChevronRight,
  Shield
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard, GlassButton } from '@/components/ui-custom';

// Mock stats
const mockStats = {
  totalListens: 1234,
  totalLikes: 56,
  totalPlaylists: 3,
  followingArtists: 12,
  followers: 8
};

// Mock albums
const mockAlbums = [
  { id: '1', name: 'Мои фавориты', trackCount: 15 },
  { id: '2', name: 'Вечерний плейлист', trackCount: 8 }
];

export function ProfilePage() {
  const { user, signOut } = useAuth();
  const [showSettings, setShowSettings] = useState(false);

  if (!user) return null;

  const isPremium = user.role === 'premium';
  const isAdmin = user.role === 'admin';

  const registrationDate = new Date(user.created_at);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - registrationDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-black pb-32">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Профиль</h1>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
                <Shield className="w-5 h-5" />
              </button>
            )}
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-white/60 hover:text-white transition-colors"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Profile Card */}
        <GlassCard className="p-6" intensity="high">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center overflow-hidden">
                {user.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-white">
                    {user.username?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {isPremium && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center">
                  <Crown className="w-3 h-3 text-black" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{user.username}</h2>
                {isPremium && (
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                    PREMIUM
                  </span>
                )}
              </div>
              <p className="text-white/50 text-sm">@{user.username}</p>
              <div className="flex items-center gap-1 mt-2 text-white/40 text-sm">
                <Clock className="w-4 h-4" />
                <span>{diffDays} дней с нами</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
            <div className="text-center">
              <p className="text-xl font-bold text-white">{mockStats.totalListens}</p>
              <p className="text-white/50 text-xs">Прослушиваний</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-white">{mockStats.totalLikes}</p>
              <p className="text-white/50 text-xs">Лайков</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-white">{mockStats.followingArtists}</p>
              <p className="text-white/50 text-xs">Подписок</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-white">{mockStats.followers}</p>
              <p className="text-white/50 text-xs">Подписчиков</p>
            </div>
          </div>
        </GlassCard>

        {/* Albums */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Disc className="w-5 h-5 text-emerald-400" />
              Альбомы
            </h3>
            <button className="text-emerald-400 text-sm flex items-center gap-1">
              Все <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {mockAlbums.map((album) => (
              <div
                key={album.id}
                className="flex-shrink-0 w-32 cursor-pointer group"
              >
                <div className="aspect-square rounded-2xl bg-white/5 flex items-center justify-center mb-2 group-hover:bg-white/10 transition-colors">
                  <Disc className="w-12 h-12 text-white/30" />
                </div>
                <p className="text-white font-medium text-sm truncate">{album.name}</p>
                <p className="text-white/50 text-xs">{album.trackCount} треков</p>
              </div>
            ))}
            <button className="flex-shrink-0 w-32">
              <div className="aspect-square rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center mb-2 hover:border-emerald-500/50 transition-colors">
                <span className="text-3xl text-white/40">+</span>
              </div>
              <p className="text-white/60 text-sm">Создать</p>
            </button>
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h3 className="text-lg font-semibold text-white mb-4">Быстрый доступ</h3>
          <div className="grid grid-cols-3 gap-3">
            <button className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Music className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-white/70 text-sm">История</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors">
              <div className="w-12 h-12 bg-rose-500/20 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-rose-400" />
              </div>
              <span className="text-white/70 text-sm">Лайки</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-white/70 text-sm">Подписки</span>
            </button>
          </div>
        </section>

        {/* Premium Banner */}
        {!isPremium && (
          <GlassCard 
            className="p-6 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/30"
            intensity="medium"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center">
                <Crown className="w-7 h-7 text-black" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg">Kiwi Premium</h3>
                <p className="text-white/60 text-sm">
                  Безлимитные скачивания, HQ звук и многое другое
                </p>
              </div>
            </div>
            <GlassButton variant="primary" fullWidth className="mt-4">
              Попробовать Premium
            </GlassButton>
          </GlassCard>
        )}

        {/* Settings */}
        {showSettings && (
          <section>
            <h3 className="text-lg font-semibold text-white mb-4">Настройки</h3>
            <div className="space-y-2">
              {[
                { label: 'Аккаунт', icon: Users },
                { label: 'Уведомления', icon: Settings },
                { label: 'Качество звука', icon: Music },
                ...(isAdmin ? [{ label: 'Админ панель', icon: Shield }] : [])
              ].map((item) => (
                <button
                  key={item.label}
                  className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <item.icon className="w-5 h-5 text-white/60" />
                  <span className="text-white flex-1 text-left">{item.label}</span>
                  <ChevronRight className="w-5 h-5 text-white/40" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Logout */}
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 p-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}
