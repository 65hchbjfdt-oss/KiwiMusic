import { Home, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  activeTab: 'home' | 'search' | 'profile';
  onTabChange: (tab: 'home' | 'search' | 'profile') => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'home' as const, icon: Home, label: 'Главная' },
    { id: 'search' as const, icon: Search, label: 'Поиск' },
    { id: 'profile' as const, icon: User, label: 'Профиль' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="mx-4 mb-4">
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-3">
          <div className="flex items-center justify-around">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex flex-col items-center gap-1 transition-all duration-200',
                  activeTab === tab.id 
                    ? 'text-emerald-400 scale-110' 
                    : 'text-white/50 hover:text-white/70'
                )}
              >
                <tab.icon className="w-6 h-6" />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
