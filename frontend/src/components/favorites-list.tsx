'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MapPin, Trash2, ExternalLink } from 'lucide-react';
// import { createClient } from "@/lib/supabase/client" // Removed supabase dependency
import { useAuth } from '@/features/auth/hooks/useAuth';

interface Favorite {
  id: string;
  business_id: string;
  business_name: string;
  business_type: string;
  latitude: number;
  longitude: number;
  closure_probability: number;
  created_at: string;
}

export function FavoritesList() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  // const supabase = createClient() // Removed supabase dependency

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      // const { data, error } = await supabase.from("favorites").select("*").order("created_at", { ascending: false })
      const data: Favorite[] = [];
      const error = null; // Mock data for now

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favoriteId: string) => {
    try {
      // const { error } = await supabase.from("favorites").delete().eq("id", favoriteId)
      const error = null; // Mock delete for now

      if (error) throw error;
      setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const getRiskLevel = (probability: number) => {
    if (probability >= 80) return { level: 'high', color: 'bg-red-500' };
    if (probability >= 60) return { level: 'medium', color: 'bg-yellow-500' };
    return { level: 'low', color: 'bg-green-500' };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />찜 목록
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">로딩 중...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" />찜 목록 ({favorites.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {favorites.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">아직 찜한 상가가 없습니다</p>
            <p className="text-sm text-muted-foreground mt-2">
              관심있는 상가에 하트를 눌러 저장해보세요
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.map(favorite => {
              const risk = getRiskLevel(favorite.closure_probability);
              return (
                <div
                  key={favorite.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">
                          {favorite.business_name}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {favorite.business_type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>위도: {favorite.latitude?.toFixed(4)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>경도: {favorite.longitude?.toFixed(4)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">폐업 확률:</span>
                        <Badge className={`${risk.color} text-white`}>
                          {favorite.closure_probability}%
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(favorite.created_at).toLocaleDateString(
                            'ko-KR',
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // TODO: Center map on this location
                          console.log(
                            'Navigate to:',
                            favorite.latitude,
                            favorite.longitude,
                          );
                        }}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFavorite(favorite.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
