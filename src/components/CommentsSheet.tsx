import { useState, useEffect, useRef } from 'react';
import { X, Send, MessageCircle, Heart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getTrackComments, addComment } from '@/lib/supabase';
import type { Comment } from '@/types';
import { cn } from '@/lib/utils';

interface CommentsSheetProps {
  trackId: string;
  trackName: string;
  isOpen: boolean;
  onClose: () => void;
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'только что';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч`;
  return `${Math.floor(diff / 86400)} д`;
}

export function CommentsSheet({ trackId, trackName, isOpen, onClose }: CommentsSheetProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen || !trackId) return;
    setLoading(true);
    getTrackComments(trackId)
      .then(({ data }) => setComments(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen, trackId]);

  const handleSend = async () => {
    if (!user || !text.trim() || sending) return;
    setSending(true);
    const optimistic: Comment = {
      id: `temp-${Date.now()}`,
      track_id: trackId,
      user_id: user.id,
      content: text.trim(),
      is_censored: false,
      likes_count: 0,
      replies_count: 0,
      created_at: new Date().toISOString(),
      user,
      parent_id: undefined,
    };
    setComments(prev => [optimistic, ...prev]);
    setText('');
    try {
      await addComment(trackId, user.id, optimistic.content);
    } catch (e) {
      setComments(prev => prev.filter(c => c.id !== optimistic.id));
      setText(optimistic.content);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[61] bg-zinc-900 rounded-t-3xl border-t border-white/10 animate-player-in"
        style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 flex-shrink-0">
          <div>
            <h3 className="font-semibold">Комментарии</h3>
            <p className="text-white/40 text-xs truncate">{trackName}</p>
          </div>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4" style={{ minHeight: 0 }}>
          {loading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-white/5 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-2.5 bg-white/5 rounded w-24" />
                    <div className="h-3 bg-white/5 rounded w-full" />
                    <div className="h-3 bg-white/5 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && comments.length === 0 && (
            <div className="flex flex-col items-center py-10 text-white/30">
              <MessageCircle className="w-10 h-10 mb-2 opacity-30" />
              <p>Комментариев пока нет</p>
              <p className="text-sm mt-1">Будь первым!</p>
            </div>
          )}
          {!loading && comments.map(comment => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {comment.user?.avatar_url
                  ? <img src={comment.user.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <span className="text-white text-sm font-bold">{comment.user?.username?.[0]?.toUpperCase() || '?'}</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-medium">{comment.user?.username || 'Аноним'}</span>
                  <span className="text-white/30 text-xs">{timeAgo(comment.created_at)}</span>
                </div>
                <p className="text-white/80 text-sm leading-relaxed">{comment.content}</p>
                <div className="flex items-center gap-3 mt-2">
                  <button className="flex items-center gap-1 text-white/30 hover:text-white/60 transition-colors text-xs">
                    <Heart className="w-3.5 h-3.5" />
                    {comment.likes_count > 0 && comment.likes_count}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        {user ? (
          <div className="px-4 py-3 border-t border-white/5 flex items-center gap-3 flex-shrink-0 pb-safe">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">{user.username?.[0]?.toUpperCase()}</span>
            </div>
            <input
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Написать комментарий..."
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-emerald-500/50 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className={cn(
                'p-2.5 rounded-full transition-all active:scale-95',
                text.trim() ? 'bg-emerald-500 text-white hover:bg-emerald-400' : 'bg-white/5 text-white/30'
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="px-4 py-3 border-t border-white/5 text-center text-white/40 text-sm flex-shrink-0">
            Войдите, чтобы оставить комментарий
          </div>
        )}
      </div>
    </>
  );
}
