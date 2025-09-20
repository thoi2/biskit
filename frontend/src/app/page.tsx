'use client';

import { useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Sidebar } from '@/lib/components/layout/Sidebar';
import { MapArea } from '@/features/map/components/MapArea';
import { LoadingScreen } from '@/lib/components/ui/LoadingScreen';
import { useBiskitData } from '@/features/map/hooks/useBiskitData';

export default function HomePage() {
  const { user, loading } = useAuth();

  const {
    selectedCategories,
    stores,
    recommendationResults,
    searchError,
    handlers,
  } = useBiskitData(user);

  if (loading) return <LoadingScreen />;

  return (
    <div className="h-full bg-gradient-warm flex overflow-hidden">
      <Sidebar
        user={user}
        selectedCategories={selectedCategories}
        stores={stores}
        recommendationResults={recommendationResults}
        handlers={handlers}
      />

      <MapArea />

      {/* 검색 오류 표시 */}
      {searchError && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-between">
            <span>{searchError}</span>
            <button
              onClick={() =>
                handlers.handleClearResults && handlers.handleClearResults()
              }
              className="ml-2 text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
