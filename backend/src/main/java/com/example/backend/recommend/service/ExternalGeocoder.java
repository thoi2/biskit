package com.example.backend.recommend.service;

import java.math.BigDecimal;
import java.util.Optional;

public interface ExternalGeocoder {

    /** 역지오코딩: (lat,lng) → 도로명주소관리번호(ADR, 26자리) */
    Optional<String> reverseToAdr(BigDecimal lat, BigDecimal lng);

    /** 정방향 지오코딩(선택): 도로명주소 문자열 → ADR(26자리) */
//    Optional<String> geocodeToAdr(String roadAddress);

    class CommunicationException extends RuntimeException {
        public CommunicationException(String msg, Throwable cause) { super(msg, cause); }
    }
}
