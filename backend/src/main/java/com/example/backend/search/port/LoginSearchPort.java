package com.example.backend.search.port;

import com.example.backend.search.repository.projection.LoginSearchProjection;
import java.util.List;

public interface LoginSearchPort {
    List<LoginSearchProjection> find(long userId);
    int delete(long userId, int buildingId);
    int set(long userId, int buildingId, boolean favorite);
    boolean isFavorite(long userId, int buildingId);
    void upsertubid(long userId, int buildingId);
}
