package com.example.backend.recommend.infra.geocoder;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
class ParsedRoadAddr {
    private final String adr;
    private final String address;
    private final boolean useAdr;
}
