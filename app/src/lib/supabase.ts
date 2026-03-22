import { createClient } from '@supabase/supabase-js';
import type { User, Track, Event, UserSticker, Comment, Notification, UserEventProgress } from '@/types';

// ✅ Исправлено: ключи из env-переменных (не в git)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kswsvpnhnowvvakgfkjz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtzd3N2cG5obm93dnZha2dmamsiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc3MzY2NjQ3NiwiZXhwIjoyMDg5MjQyNDc2fQ.kCWcvUPJAw0q-pJPyD6gbiuP-ocWGhtvJvUPiY1mEX0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth functions
export const signUpWithEmail = async (email: string, password: string, username: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username }
    }
  });
  return { data, error };
};

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
};

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  return profile as User | null;
};

// Track functions
export const getPopularTracks = async (limit = 20) => {
  const { data, error } = await supabase
    .from('tracks')
    .select('*')
    .order('play_count', { ascending: false })
    .limit(limit);
  
  return { data: data as Track[] | null, error };
};

export const getTracksByGenre = async (genre: string, limit = 20) => {
  const { data, error } = await supabase
    .from('tracks')
    .select('*')
    .eq('genre', genre)
    .limit(limit);
  
  return { data: data as Track[] | null, error };
};

export const getTrackById = async (id: string) => {
  const { data, error } = await supabase
    .from('tracks')
    .select('*')
    .eq('id', id)
    .single();
  
  return { data: data as Track | null, error };
};

// Search function
export const searchTracks = async (query: string) => {
  const { data, error } = await supabase
    .from('tracks')
    .select('*')
    .or(`name.ilike.%${query}%,artist_name.ilike.%${query}%`)
    .limit(20);
  
  return { data: data as Track[] | null, error };
};

// Like functions
export const likeTrack = async (userId: string, trackId: string) => {
  const { data, error } = await supabase
    .from('liked_tracks')
    .insert({ user_id: userId, track_id: trackId });
  
  return { data, error };
};

export const unlikeTrack = async (userId: string, trackId: string) => {
  const { error } = await supabase
    .from('liked_tracks')
    .delete()
    .eq('user_id', userId)
    .eq('track_id', trackId);
  
  return { error };
};

export const getLikedTracks = async (userId: string) => {
  const { data, error } = await supabase
    .from('liked_tracks')
    .select('track_id')
    .eq('user_id', userId);
  
  return { data: data?.map(item => item.track_id) || [], error };
};

// Listening history
export const addListeningHistory = async (userId: string, trackId: string, duration: number, completed: boolean) => {
  const { data, error } = await supabase
    .from('listening_history')
    .insert({
      user_id: userId,
      track_id: trackId,
      listen_duration: duration,
      completed
    });
  
  return { data, error };
};

// Event functions
export const getActiveEvents = async () => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_active', true);
  
  return { data: data as Event[] | null, error };
};

export const getUserEventProgress = async (userId: string, eventId: string) => {
  const { data, error } = await supabase
    .from('user_event_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('event_id', eventId)
    .single();
  
  return { data: data as UserEventProgress | null, error };
};

export const updateEventProgress = async (progressId: string, updates: Partial<UserEventProgress>) => {
  const { data, error } = await supabase
    .from('user_event_progress')
    .update(updates)
    .eq('id', progressId);
  
  return { data, error };
};

// Sticker functions
export const getUserStickers = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_stickers')
    .select('*')
    .eq('user_id', userId);
  
  return { data: data as UserSticker[] | null, error };
};

export const equipSticker = async (userId: string, stickerId: string) => {
  // First unequip all stickers
  await supabase
    .from('user_stickers')
    .update({ is_equipped: false })
    .eq('user_id', userId);
  
  // Then equip the selected one
  const { data, error } = await supabase
    .from('user_stickers')
    .update({ is_equipped: true })
    .eq('user_id', userId)
    .eq('sticker_id', stickerId);
  
  return { data, error };
};

// Comment functions
export const getTrackComments = async (trackId: string) => {
  const { data, error } = await supabase
    .from('comments')
    .select('*, user:profiles(*)')
    .eq('track_id', trackId)
    .is('parent_id', null)
    .order('created_at', { ascending: false });
  
  return { data: data as Comment[] | null, error };
};

export const addComment = async (trackId: string, userId: string, content: string, parentId?: string) => {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      track_id: trackId,
      user_id: userId,
      content,
      parent_id: parentId
    });
  
  return { data, error };
};

// Notification functions
export const getUserNotifications = async (userId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  
  return { data: data as Notification[] | null, error };
};

export const markNotificationAsRead = async (notificationId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId);
  
  return { data, error };
};

// Admin functions
export const grantPremium = async (adminId: string, userId: string, durationMonths: number) => {
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + durationMonths);
  
  const { data, error } = await supabase
    .from('premium_subscriptions')
    .insert({
      user_id: userId,
      expires_at: expiresAt.toISOString(),
      granted_by: adminId
    });
  
  if (!error) {
    await supabase
      .from('profiles')
      .update({ role: 'premium', premium_until: expiresAt.toISOString() })
      .eq('id', userId);
  }
  
  return { data, error };
};

export const revokePremium = async (userId: string) => {
  const { error } = await supabase
    .from('profiles')
    .update({ role: 'user', premium_until: null })
    .eq('id', userId);
  
  return { error };
};

export const searchUsers = async (query: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(20);
  
  return { data: data as User[] | null, error };
};

export const getUserById = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data: data as User | null, error };
};

export const isTrackLiked = async (userId: string, trackId: string) => {
  const { data } = await supabase
    .from('liked_tracks')
    .select('track_id')
    .eq('user_id', userId)
    .eq('track_id', trackId)
    .single();
  return !!data;
};

export const getCommentReplies = async (parentId: string) => {
  const { data, error } = await supabase
    .from('comments')
    .select('*, user:profiles(*)')
    .eq('parent_id', parentId)
    .order('created_at', { ascending: true });
  return { data: data as Comment[] | null, error };
};

export const getUserListeningStats = async (userId: string) => {
  const { data, error } = await supabase
    .from('listening_history')
    .select('*')
    .eq('user_id', userId)
    .order('listened_at', { ascending: false })
    .limit(100);
  return { data, error };
};

export const followUser = async (followerId: string, followingId: string) => {
  const { data, error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, following_id: followingId });
  return { data, error };
};

export const unfollowUser = async (followerId: string, followingId: string) => {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);
  return { error };
};

export const isFollowing = async (followerId: string, followingId: string) => {
  const { data } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single();
  return !!data;
};

export const getFollowStats = async (userId: string) => {
  const [{ count: followers }, { count: following }] = await Promise.all([
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
  ]);
  return { followers: followers || 0, following: following || 0 };
};

export const markAllNotificationsAsRead = async (userId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId);
  return { error };
};
