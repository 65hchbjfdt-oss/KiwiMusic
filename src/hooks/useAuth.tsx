import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { redirectToSpotify, handleCallback, getAccessToken, getMe, clearTokens } from '@/lib/spotify';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types';

interface AuthCtx {
  user: User | null;
  spotifyToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async (token: string, spotifyUser: any) => {
    // Upsert profile в Supabase (используем Spotify ID как user_id)
    const { data } = await supabase
      .from('profiles')
      .upsert({
        id: spotifyUser.id,
        email: spotifyUser.email || '',
        username: spotifyUser.display_name || spotifyUser.id,
        avatar_url: spotifyUser.images?.[0]?.url || null,
        last_login_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select()
      .single();
    setUser(data as User);
    setSpotifyToken(token);
  }, []);

  useEffect(() => {
    const init = async () => {
      // Handle OAuth callback
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (code) {
        window.history.replaceState({}, '', '/');
        try {
          const tokens = await handleCallback(code);
          const me = await getMe(tokens.access_token);
          await loadProfile(tokens.access_token, me);
        } catch (e) { console.error('Callback error:', e); }
        setIsLoading(false);
        return;
      }

      // Restore session
      const token = await getAccessToken();
      if (token) {
        try {
          const me = await getMe(token);
          await loadProfile(token, me);
        } catch { clearTokens(); }
      }
      setIsLoading(false);
    };
    init();
  }, [loadProfile]);

  const login = () => redirectToSpotify();
  const logout = () => { clearTokens(); setUser(null); setSpotifyToken(null); };

  return (
    <AuthContext.Provider value={{ user, spotifyToken, isLoading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
