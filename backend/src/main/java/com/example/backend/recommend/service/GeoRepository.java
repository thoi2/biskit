package com.example.backend.recommend.service;

import java.math.BigDecimal;

public interface GeoRepository {
    int upsertAndGetIdByAdr(String adrMngNo, BigDecimal lat, BigDecimal lng);
}
