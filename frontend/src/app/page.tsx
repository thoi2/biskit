'use client';

import { useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Sidebar } from '@/lib/components/layout/Sidebar';
import { MapArea } from '@/lib/components/layout/MapArea';
import { LoadingScreen } from '@/lib/components/ui/LoadingScreen';
import { useBiskitData } from '@/lib/useBiskitData';

export default function HomePage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('search');
  const [activeProfileTab, setActiveProfileTab] = useState('favorites');
  const [searchActive, setSearchActive] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const {
    selectedCategories,
    setSelectedCategories,
    filteredBusinesses,
    recommendationResults,
    handlers,
  } = useBiskitData(user, setActiveTab);

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="h-full bg-gradient-warm flex overflow-hidden">
      <Sidebar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeProfileTab={activeProfileTab}
        setActiveProfileTab={setActiveProfileTab}
        selectedCategories={selectedCategories}
        filteredBusinesses={filteredBusinesses}
        recommendationResults={recommendationResults}
        handlers={handlers}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* 🔥 중복 래핑 제거 - MapArea가 직접 flex-1 처리 */}
      <MapArea
        businesses={filteredBusinesses}
        searchActive={searchActive}
        setSearchActive={setSearchActive}
        onBusinessClick={handlers.handleBusinessClick}
        onMapClick={handlers.handleMapClick}
      />
    </div>
  );
}
