import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { PlayerProvider } from '@/hooks/usePlayer';
import { AuthPage } from '@/pages/AuthPage';
import { HomePage } from '@/pages/HomePage';
import { SearchPage } from '@/pages/SearchPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ArtistPage } from '@/pages/ArtistPage';
import { UserProfilePage } from '@/pages/UserProfilePage';
import { BottomNav } from '@/components/BottomNav';
import { MiniPlayer } from '@/components/player/MiniPlayer';
import { FullPlayer } from '@/components/player/FullPlayer';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'home' | 'search' | 'profile';
type Modal = { type: 'artist'; id: string } | { type: 'user'; id: string } | null;

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [modal, setModal] = useState<Modal>(null);
  const [prevTab, setPrevTab] = useState<Tab>('home');
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-3xl animate-spin-slow">🥝</span>
          <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  const handleTabChange = (tab: Tab) => {
    setPrevTab(activeTab);
    setActiveTab(tab);
    setModal(null);
  };

  const handleArtistClick = (id: string) => setModal({ type: 'artist', id });
  const handleUserClick = (id: string) => setModal({ type: 'user', id });
  const handleBack = () => setModal(null);

  return (
    <div className="min-h-screen bg-black">
      {/* Main pages */}
      <main className="pb-32">
        <div className={cn(activeTab === 'home' ? 'block' : 'hidden')}>
          <HomePage />
        </div>
        <div className={cn(activeTab === 'search' ? 'block' : 'hidden')}>
          <SearchPage
            onArtistClick={handleArtistClick}
            onUserClick={handleUserClick}
          />
        </div>
        <div className={cn(activeTab === 'profile' ? 'block' : 'hidden')}>
          <ProfilePage />
        </div>
      </main>

      {/* Modal overlays for Artist / User pages */}
      {modal?.type === 'artist' && (
        <div className="fixed inset-0 z-40 bg-black">
          <ArtistPage artistId={modal.id} onBack={handleBack} />
        </div>
      )}
      {modal?.type === 'user' && (
        <div className="fixed inset-0 z-40 bg-black">
          <UserProfilePage userId={modal.id} onBack={handleBack} />
        </div>
      )}

      <MiniPlayer />
      <FullPlayer />
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <PlayerProvider>
          <AppContent />
        </PlayerProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
