import Button from '@/lib/components/ui/Button/Button';
import { Search } from 'lucide-react';

interface MapSearchToggleProps {
  searchActive: boolean;
  onToggle: () => void;
}

export function MapSearchToggle({
  searchActive,
  onToggle,
}: MapSearchToggleProps) {
  return (
    <div className="absolute top-6 left-6 z-10">
      <Button
        onClick={onToggle}
        className={`shadow-sm border-0 transition-all duration-300 ${
          searchActive
            ? 'bg-amber-600 hover:bg-orange-700 text-white shadow-sm'
            : 'bg-white/90 hover:bg-white text-orange-900 shadow-sm border border-orange-200'
        }`}
      >
        <Search className="w-4 h-4 mr-2" />
        {searchActive ? '검색 중지' : '지도에서 검색'}
      </Button>
    </div>
  );
}
