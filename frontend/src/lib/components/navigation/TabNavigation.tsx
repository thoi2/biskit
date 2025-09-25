import { Button } from '@/lib/components/ui/button';
import { Search, BarChart3, FileText } from 'lucide-react';
import { useMapStore } from '@/features/map/store/mapStore';

export function TabNavigation() {
    const { activeTab, setActiveTab } = useMapStore();

    return (
        <div className="flex gap-2 mb-8 p-1 bg-orange-100 rounded-xl">
            <Button
                variant={activeTab === 'search' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('search')}
                className={`flex-1 transition-all duration-300 ${
                    activeTab === 'search'
                        ? 'bg-amber-600 hover:bg-orange-700 text-white shadow-sm'
                        : 'hover:bg-orange-200 text-orange-700'
                }`}
            >
                <Search className="w-4 h-4 mr-2" />
                검색
            </Button>

            <Button
                variant={activeTab === 'recommend' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('recommend')}
                className={`flex-1 transition-all duration-300 ${
                    activeTab === 'recommend'
                        ? 'bg-amber-600 hover:bg-orange-700 text-white shadow-sm'
                        : 'hover:bg-orange-200 text-orange-700'
                }`}
            >
                <BarChart3 className="w-4 h-4 mr-2" />
                추천
            </Button>

            <Button
                variant={activeTab === 'result' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('result')}
                className={`flex-1 transition-all duration-300 ${
                    activeTab === 'result'
                        ? 'bg-amber-600 hover:bg-orange-700 text-white shadow-sm'
                        : 'hover:bg-orange-200 text-orange-700'
                }`}
            >
                <FileText className="w-4 h-4 mr-2" />
                결과
            </Button>
        </div>
    );
}
