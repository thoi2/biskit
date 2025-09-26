package com.example.backend.search.repository;

import com.example.backend.search.entity.LoginSearchEntity;
import com.example.backend.search.repository.projection.LoginSearchProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LoginSearchRepository
        extends JpaRepository<LoginSearchEntity, LoginSearchEntity.Key> {

    List<LoginSearchProjection> findByUserId(long userId);
    int deleteByUserIdAndBuildingId(long userId, int buildingId);
    boolean existsByUserIdAndBuildingId(long userId, int buildingId);
    boolean existsByUserIdAndBuildingIdAndFavoriteTrue(long userId, int buildingId);
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        update LoginSearchEntity ls
           set ls.favorite = :favorite
         where ls.userId = :userId
           and ls.buildingId = :buildingId
    """)
    int setFavorite(@Param("userId") long userId,
                    @Param("buildingId") int buildingId,
                    @Param("favorite") boolean favorite);
}
