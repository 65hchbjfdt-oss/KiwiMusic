import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { PlayerProvider } from '@/hooks/useSpotifyPlayer';
import { AuthPage } from '@/pages/AuthPage';
import { HomePage } from '@/pages/HomePage';
import { SearchPage } from '@/pages/SearchPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { BottomNav } from '@/components/BottomNav';
import { MiniPlayer } from '@/components/player/MiniPlayer';
import { FullPlayer } from '@/components/player/FullPlayer';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState<'home'|'search'|'profile'>('home');
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-emerald-400 animate-spin"/>
    </div>
  );

  if (!isAuthenticated) return (
    <Routes>
      <Route path="/auth" element={<AuthPage/>}/>
      <Route path="*" element={<Navigate to="/auth" replace/>}/>
    </Routes>
  );

  return (
    <PlayerProvider userId={user?.id}>
      <div className="min-h-screen bg-black">
        <main className="pb-32">
          {activeTab==='home' && <HomePage/>}
          {activeTab==='search' && <SearchPage/>}
          {activeTab==='profile' && <ProfilePage/>}
        </main>
        <MiniPlayer/>
        <FullPlayer/>
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab}/>
      </div>
    </PlayerProvider>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent/>
      </AuthProvider>
    </Router>
  );
}
