import { useState, useEffect } from 'react';
import {
  Settings, LogOut, Music, Heart, Users, Disc, Clock,
  Crown, ChevronRight, Shield, Bell, BellOff
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard, GlassButton } from '@/components/ui-custom';
import { getUserListeningStats, getLikedTracks, getFollowStats } from '@/lib/supabase';

interface Stats {
  totalListens: number;
  totalLikes: number;
  following: number;
  followers: number;
}

export function ProfilePage() {
  const { user, signOut } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [stats, setStats] = useState<Stats>({ totalListens: 0, totalLikes: 0, following: 0, followers: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getUserListeningStats(user.id),
      getLikedTracks(user.id),
      getFollowStats(user.id),
    ]).then(([history, liked, follow]) => {
      setStats({
        totalListens: history.data?.length || 0,
        totalLikes: liked.data?.length || 0,
        following: follow.following,
        followers: follow.followers,
      });
    }).catch(console.error).finally(() => setLoadingStats(false));
  }, [user]);

  if (!user) return null;

  const isPremium = user.role === 'premium';
  const isAdmin = user.role === 'admin';

  const diffDays = Math.ceil(
    Math.abs(Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-black pb-32 animate-fade-in">
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

      <div className="p-4 space-y-5">
        {/* Profile card */}
        <GlassCard className="p-5" intensity="high">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center overflow-hidden">
                {user.avatar_url
                  ? <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                  : <span className="text-3xl font-bold text-white">{user.username?.charAt(0).toUpperCase()}</span>
                }
              </div>
              {isPremium && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center">
                  <Crown className="w-3 h-3 text-black" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-white">{user.username}</h2>
                {isPremium && (
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">PREMIUM</span>
                )}
                {isAdmin && (
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">ADMIN</span>
                )}
              </div>
              <p className="text-white/50 text-sm">@{user.username}</p>
              <div className="flex items-center gap-1 mt-1.5 text-white/40 text-sm">
                <Clock className="w-3.5 h-3.5" />
                <span>{diffDays} {dayWord(diffDays)} с нами</span>
              </div>
            </div>
          </div>

          {/* Stats — now real data */}
          <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/10">
            {loadingStats
              ? [...Array(4)].map((_, i) => (
                <div key={i} className="text-center animate-pulse">
                  <div className="h-6 bg-white/5 rounded mx-auto w-10 mb-1" />
                  <div className="h-2 bg-white/5 rounded mx-auto w-14" />
                </div>
              ))
              : [
                { val: stats.totalListens, label: 'Прослушано' },
                { val: stats.totalLikes, label: 'Лайков' },
                { val: stats.following, label: 'Подписок' },
                { val: stats.followers, label: 'Подписчиков' },
              ].map(({ val, label }) => (
                <div key={label} className="text-center">
                  <p className="text-xl font-bold text-white">{val}</p>
                  <p className="text-white/50 text-xs">{label}</p>
                </div>
              ))
            }
          </div>
        </GlassCard>

        {/* Quick actions */}
        <section>
          <h3 className="text-base font-semibold text-white mb-3">Библиотека</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Music, label: 'История', color: 'bg-emerald-500/20 text-emerald-400' },
              { icon: Heart, label: 'Лайки', color: 'bg-rose-500/20 text-rose-400' },
              { icon: Users, label: 'Подписки', color: 'bg-blue-500/20 text-blue-400' },
            ].map(({ icon: Icon, label, color }) => (
              <button
                key={label}
                className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors active:scale-95"
              >
                <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-white/70 text-sm">{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Playlists */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Disc className="w-4 h-4 text-emerald-400" /> Плейлисты
            </h3>
            <button className="text-emerald-400 text-sm flex items-center gap-1">
              Все <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            <button className="flex-shrink-0 w-28">
              <div className="aspect-square rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center mb-2 hover:border-emerald-500/50 transition-colors">
                <span className="text-3xl text-white/40">+</span>
              </div>
              <p className="text-white/60 text-sm">Создать</p>
            </button>
          </div>
        </section>

        {/* Premium banner */}
        {!isPremium && (
          <GlassCard className="p-5 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/20" intensity="medium">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Crown className="w-6 h-6 text-black" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold">Kiwi Premium</h3>
                <p className="text-white/50 text-sm">Без рекламы и HQ звук</p>
              </div>
            </div>
            <GlassButton variant="primary" fullWidth className="mt-4">
              Попробовать Premium
            </GlassButton>
          </GlassCard>
        )}

        {/* Settings panel */}
        {showSettings && (
          <section className="animate-slide-up">
            <h3 className="text-base font-semibold text-white mb-3">Настройки</h3>
            <div className="space-y-2">
              {[
                { label: 'Аккаунт', icon: Users },
                { label: 'Уведомления', icon: Bell },
                { label: 'Качество звука', icon: Music },
                ...(isAdmin ? [{ label: 'Админ панель', icon: Shield }] : []),
              ].map(item => (
                <button
                  key={item.label}
                  className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors active:scale-[0.99]"
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
          className="w-full flex items-center justify-center gap-2 p-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-rose-400 transition-colors active:scale-[0.99]"
        >
          <LogOut className="w-5 h-5" />
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}

function dayWord(n: number) {
  const abs = Math.abs(n) % 100;
  const mod = abs % 10;
  if (abs > 10 && abs < 20) return 'дней';
  if (mod === 1) return 'день';
  if (mod >= 2 && mod <= 4) return 'дня';
  return 'дней';
}
