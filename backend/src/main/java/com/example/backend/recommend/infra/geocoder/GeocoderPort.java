package com.example.backend.recommend.infra.geocoder;

import java.math.BigDecimal;

public interface GeocoderPort {
    ReverseResult reverseToAdr(BigDecimal lat, BigDecimal lng);

    GeoPoint getPointByAdr(String address);

    record ReverseResult(String adr, String address, boolean useAdr) {}
    record GeoPoint(BigDecimal lat, BigDecimal lng, String bldMgtNo) {}
}

