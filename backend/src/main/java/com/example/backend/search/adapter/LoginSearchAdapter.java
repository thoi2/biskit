package com.example.backend.search.adapter;

import com.example.backend.search.entity.LoginSearchEntity;
import com.example.backend.search.port.LoginSearchPort;
import com.example.backend.search.repository.LoginSearchRepository;
import com.example.backend.search.repository.projection.LoginSearchProjection;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class LoginSearchAdapter implements LoginSearchPort {

    private final LoginSearchRepository repo;

    @Override
    @Transactional(readOnly = true)
    public List<LoginSearchProjection> find(long userId) {
        return repo.findByUserId(userId);
    }

    @Override
    @Transactional
    public int delete(long userId, int buildingId) {
        return repo.deleteByUserIdAndBuildingId(userId, buildingId);
    }

    @Override
    @Transactional
    public int set(long userId, int buildingId, boolean favorite) {
        return repo.setFavorite(userId, buildingId, favorite);
    }

    @Override @Transactional(readOnly = true)
    public boolean isFavorite(long userId, int buildingId) {
        Boolean v = repo.existsByUserIdAndBuildingIdAndFavoriteTrue(userId, buildingId);
        return Boolean.TRUE.equals(v);  // null 또는 false ⇒ false
    }

    @Override @Transactional
    public void upsertubid(long userId, int buildingId) {
        if (repo.existsByUserIdAndBuildingId(userId, buildingId)) return;
        LoginSearchEntity e = new LoginSearchEntity();
        e.setUserId(userId);
        e.setBuildingId(buildingId);
        repo.save(e);
    }
}