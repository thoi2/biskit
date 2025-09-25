package com.example.backend.recommend.infra.geocoder;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
class ReverseGeocoderResponse {

    @JsonProperty("road_addr")
    private RoadAddr roadAddr;

    @JsonProperty("jibun_addr")
    private JibunAddr jibunAddr;

    private boolean success;

    @Getter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class RoadAddr {
        @JsonProperty("ADR_MNG_NO")
        private String adrMngNo;
        private String address;
        private boolean success;
    }

    @Getter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class JibunAddr {
        @JsonProperty("PNU")
        private String pnu;
        private String address;
        private boolean success;
    }
}
