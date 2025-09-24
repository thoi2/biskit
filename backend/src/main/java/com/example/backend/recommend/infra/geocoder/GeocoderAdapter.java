package com.example.backend.recommend.infra.geocoder;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;


@Component
@RequiredArgsConstructor
public class GeocoderAdapter implements GeocoderPort {

    private final GeocoderRequest client;
    private final GeocoderResponseParser parser;

    @Override
    public ReverseResult reverseToAdr(BigDecimal lat, BigDecimal lng) {
        String body = client.callReverse(lat, lng);
        ParsedRoadAddr parsed = parser.parseReverse(body);
        return new ReverseResult(parsed.getAdr(), parsed.getAddress(), parsed.isUseAdr());
    }

    @Override
    public GeoPoint getPointByAdr(String address) {
        String body = client.callGeocode(address);
        ParsedGeoPoint parsed = parser.parseGeocode(body);
        return new GeoPoint(parsed.getLat(), parsed.getLng(), parsed.getBldMgtNo());
    }
}
