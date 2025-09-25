package com.example.backend.recommend.port;

import java.math.BigDecimal;
import java.util.List;
public interface BuildingPort {
    BuildingPoint findByAdr(String adrMngNo);
    int insert(String adrMngNo, BigDecimal lat, BigDecimal lng);

    List<BuildingPoint> findByIdsList(List<Integer> ids);
    record BuildingPoint(int id, BigDecimal lat, BigDecimal lng) {}

}
