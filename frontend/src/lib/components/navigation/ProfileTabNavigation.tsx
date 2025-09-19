import Button from '@/lib/components/ui/Button/Button';
import { Heart, Search, Brain } from 'lucide-react';

interface ProfileTabNavigationProps {
  activeProfileTab: string;
  onProfileTabChange: (tab: string) => void;
}

export function ProfileTabNavigation({
  activeProfileTab,
  onProfileTabChange,
}: ProfileTabNavigationProps) {
  return (
    <div className="flex gap-1 mb-6 p-1 bg-orange-100 rounded-lg">
      <Button
        variant={activeProfileTab === 'favorites' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onProfileTabChange('favorites')}
        className={`flex-1 transition-all duration-300 ${
          activeProfileTab === 'favorites'
            ? 'bg-amber-600 hover:bg-orange-700 text-white shadow-sm'
            : 'hover:bg-orange-200 text-orange-700'
        }`}
      >
        <Heart className="w-4 h-4 mr-1" />찜
      </Button>
      <Button
        variant={activeProfileTab === 'history' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onProfileTabChange('history')}
        className={`flex-1 transition-all duration-300 ${
          activeProfileTab === 'history'
            ? 'bg-amber-600 hover:bg-orange-700 text-white shadow-sm'
            : 'hover:bg-orange-200 text-orange-700'
        }`}
      >
        <Search className="w-4 h-4 mr-1" />
        기록
      </Button>
      <Button
        variant={activeProfileTab === 'survey' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onProfileTabChange('survey')}
        className={`flex-1 transition-all duration-300 ${
          activeProfileTab === 'survey'
            ? 'bg-amber-600 hover:bg-orange-700 text-white shadow-sm'
            : 'hover:bg-orange-200 text-orange-700'
        }`}
      >
        <Brain className="w-4 h-4 mr-1" />
        AI
      </Button>
    </div>
  );
}
