package com.example.backend.store.repository;

import com.example.backend.store.entity.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface StoreRepository extends JpaRepository<Store, Long> {

    @Query("SELECT s FROM Store s WHERE " +
           "s.lat >= :swLat AND s.lat <= :neLat AND " +
           "s.lng >= :swLng AND s.lng <= :neLng")
    List<Store> findStoresWithinBounds(
        @Param("swLat") BigDecimal swLat,
        @Param("swLng") BigDecimal swLng,
        @Param("neLat") BigDecimal neLat,
        @Param("neLng") BigDecimal neLng
    );
}
