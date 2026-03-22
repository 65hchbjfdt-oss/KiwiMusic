import { useState, useEffect } from 'react';
import { ChevronLeft, Music, Heart, Users, UserCheck, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard } from '@/components/ui-custom';
import type { User } from '@/types';
import { getUserById, isFollowing, followUser, unfollowUser, getFollowStats } from '@/lib/supabase';

interface UserProfilePageProps {
  userId: string;
  onBack: () => void;
}

export function UserProfilePage({ userId, onBack }: UserProfilePageProps) {
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [following, setFollowing] = useState(false);
  const [stats, setStats] = useState({ followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  const isSelf = currentUser?.id === userId;

  useEffect(() => {
    Promise.all([
      getUserById(userId),
      currentUser ? isFollowing(currentUser.id, userId) : Promise.resolve(false),
      getFollowStats(userId),
    ]).then(([profileData, isFollowingResult, followStats]) => {
      setProfile(profileData.data);
      setFollowing(isFollowingResult);
      setStats(followStats);
    }).catch(console.error).finally(() => setLoading(false));
  }, [userId, currentUser]);

  const handleFollow = async () => {
    if (!currentUser || !profile) return;
    setFollowLoading(true);
    try {
      if (following) {
        await unfollowUser(currentUser.id, userId);
        setFollowing(false);
        setStats(s => ({ ...s, followers: s.followers - 1 }));
      } else {
        await followUser(currentUser.id, userId);
        setFollowing(true);
        setStats(s => ({ ...s, followers: s.followers + 1 }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <button onClick={onBack} className="fixed top-4 left-4 z-50 p-2 bg-black/60 backdrop-blur rounded-full">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="pt-20 px-4 flex flex-col items-center space-y-4">
          <div className="w-24 h-24 rounded-2xl bg-white/5 animate-pulse" />
          <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
          <div className="h-3 w-20 bg-white/5 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <button onClick={onBack} className="fixed top-4 left-4 z-50 p-2 bg-black/60 backdrop-blur rounded-full">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <p className="text-white/40">Пользователь не найден</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-32 animate-slide-up">
      {/* Back */}
      <button
        onClick={onBack}
        className="fixed top-4 left-4 z-50 p-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* Header gradient */}
      <div className="h-40 bg-gradient-to-b from-emerald-900/40 to-black" />

      <div className="px-4 -mt-16">
        {/* Avatar */}
        <div className="flex items-end gap-4 mb-4">
          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center border-4 border-black flex-shrink-0">
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
              : <span className="text-3xl font-bold text-white">{profile.username?.[0]?.toUpperCase()}</span>
            }
          </div>
          <div className="pb-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold truncate">{profile.username}</h1>
              {profile.role === 'premium' && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full flex-shrink-0">PREMIUM</span>
              )}
            </div>
            <p className="text-white/50 text-sm">@{profile.username}</p>
          </div>
        </div>

        {/* Follow button */}
        {!isSelf && (
          <button
            onClick={handleFollow}
            disabled={followLoading}
            className={`w-full py-3 rounded-2xl font-medium transition-all mb-5 flex items-center justify-center gap-2 active:scale-95 ${
              following
                ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                : 'bg-emerald-500 hover:bg-emerald-400 text-white'
            }`}
          >
            {following ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            {following ? 'Вы подписаны' : 'Подписаться'}
          </button>
        )}

        {/* Stats */}
        <GlassCard className="p-4 mb-5" intensity="medium">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xl font-bold">{stats.followers}</p>
              <p className="text-white/50 text-xs">Подписчики</p>
            </div>
            <div>
              <p className="text-xl font-bold">{stats.following}</p>
              <p className="text-white/50 text-xs">Подписки</p>
            </div>
            <div>
              <p className="text-xl font-bold">—</p>
              <p className="text-white/50 text-xs">Треков</p>
            </div>
          </div>
        </GlassCard>

        {/* Role badge */}
        {profile.role !== 'user' && (
          <div className="flex items-center gap-2 mb-4 px-1">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              profile.role === 'admin' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              {profile.role === 'admin' ? '🛡 Администратор' : '⭐ Premium участник'}
            </span>
          </div>
        )}

        <div className="text-center py-12 text-white/30">
          <Music className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Публичная активность не отображается</p>
        </div>
      </div>
    </div>
  );
}
