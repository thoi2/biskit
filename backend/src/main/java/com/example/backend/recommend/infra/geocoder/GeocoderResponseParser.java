package com.example.backend.recommend.infra.geocoder;

import com.example.backend.common.exception.BusinessException;
import com.example.backend.recommend.exception.RecommendErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class GeocoderResponseParser {

    private final ObjectMapper objectMapper;

    ParsedRoadAddr parseReverse(String body) {
        try {
            ReverseGeocoderResponse parsed = objectMapper.readValue(body, ReverseGeocoderResponse.class);
            final ReverseGeocoderResponse.RoadAddr road  = parsed.getRoadAddr();
            final ReverseGeocoderResponse.JibunAddr jibun = parsed.getJibunAddr();

            final String adr = (road != null) ? road.getAdrMngNo() : null;
            if (hasText(adr) && hasText(road.getAddress())) {
                return new ParsedRoadAddr(adr, road.getAddress(), true);  // useAdr = true
            }

            final String pnu = (jibun != null) ? jibun.getPnu() : null;
            if (hasText(pnu) && hasText(jibun.getAddress())) {
                return new ParsedRoadAddr(pnu, jibun.getAddress(), false); // useAdr = false (adr 자리엔 PNU)
            }

            throw new BusinessException(
                    RecommendErrorCode.GEO_NOT_FOUND.getCommonCode(),
                    RecommendErrorCode.GEO_NOT_FOUND.getMessage()
            );

        } catch (BusinessException be) {
            throw be;
        } catch (Exception e) {
            throw new BusinessException(
                    RecommendErrorCode.GEO_UPSTREAM_BAD_RESPONSE.getCommonCode(),
                    RecommendErrorCode.GEO_UPSTREAM_BAD_RESPONSE.getMessage()
            );
        }
    }

    ParsedGeoPoint parseGeocode(String body) {
        try {
            var root = objectMapper.readTree(body);
            var results = root.path("results");

            if (!results.isArray() || results.isEmpty()) {
                throw new BusinessException(
                        RecommendErrorCode.GEO_NOT_FOUND.getCommonCode(),
                        RecommendErrorCode.GEO_NOT_FOUND.getMessage()
                );
            }
            var f = results.get(0);
            var x = f.path("x_axis").asText(null);
            var y = f.path("y_axis").asText(null);
            String bldMgtNo = f.path("bld_mgt_no").asText(null);
            if (!hasText(x) || !hasText(y) || !hasText(bldMgtNo)) {
                throw new BusinessException(
                        RecommendErrorCode.GEO_NOT_FOUND.getCommonCode(),
                        RecommendErrorCode.GEO_NOT_FOUND.getMessage()
                );
            }
            return new ParsedGeoPoint(new java.math.BigDecimal(y.trim()), new java.math.BigDecimal(x.trim()), bldMgtNo.trim());
        } catch (BusinessException be) {
            throw be;
        } catch (Exception e) {
            throw new BusinessException(
                    RecommendErrorCode.GEO_UPSTREAM_BAD_RESPONSE.getCommonCode(),
                    RecommendErrorCode.GEO_UPSTREAM_BAD_RESPONSE.getMessage()
            );
        }
    }

    private static boolean hasText(String s) { return s != null && !s.isBlank(); }
}
