package com.example.backend.recommend.infra.geocoder;

import com.example.backend.common.exception.BusinessException;
import com.example.backend.recommend.exception.RecommendErrorCode;
import com.example.backend.recommend.service.ExternalGeocoder;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class HttpGeocoderAdapter implements ExternalGeocoder {

    private final RestTemplate restTemplate;   // HttpClientConfig 에서 주입
    private final ObjectMapper objectMapper;   // 전역 ObjectMapper

    @Value("${geocoder.base-url:https://geocode.gimi9.com}")
    private String baseUrl;

    @Value("${geocoder.token}")
    private String token;
    @Override
    public Optional<String> reverseToAdr(BigDecimal lat, BigDecimal lng) {
        try {
            var uri = UriComponentsBuilder.fromHttpUrl(baseUrl)
                    .path("/reverse_geocode")
                    .queryParam("x", lng.toPlainString()) // x=경도
                    .queryParam("y", lat.toPlainString()) // y=위도
                    .queryParam("token", token)
                    .build(true)
                    .toUri();

            ResponseEntity<String> res = restTemplate.getForEntity(uri, String.class);
            if (!res.getStatusCode().is2xxSuccessful() || res.getBody() == null) {
                throw new BusinessException(
                        RecommendErrorCode.GEO_UPSTREAM_BAD_RESPONSE.getCommonCode(),
                        RecommendErrorCode.GEO_UPSTREAM_BAD_RESPONSE.getMessage()
                );
            }

            JsonNode root = objectMapper.readTree(res.getBody());
            String adr = pickAdr(root);

            if (adr == null || !adr.matches("^\\d{26}$")) {
                return Optional.empty();
            }
            return Optional.of(adr);

        } catch (HttpStatusCodeException se) {
            throw new BusinessException(
                    RecommendErrorCode.GEO_UPSTREAM_BAD_RESPONSE.getCommonCode(),
                    RecommendErrorCode.GEO_UPSTREAM_BAD_RESPONSE.getMessage()
            );
        } catch (ResourceAccessException rae) {
            // 타임아웃/연결 오류
            throw new BusinessException(
                    RecommendErrorCode.GEO_UPSTREAM_TIMEOUT.getCommonCode(),
                    RecommendErrorCode.GEO_UPSTREAM_TIMEOUT.getMessage()
            );
        } catch (BusinessException be) {
            throw be; // 이미 매핑했으면 그대로
        } catch (Exception e) {
            // 파싱 등 알 수 없는 예외도 BAD_RESPONSE로 정규화
            throw new BusinessException(
                    RecommendErrorCode.GEO_UPSTREAM_BAD_RESPONSE.getCommonCode(),
                    RecommendErrorCode.GEO_UPSTREAM_BAD_RESPONSE.getMessage()
            );
        }
    }

    /** 응답에서 ADR_MNG_NO를 다양한 키로 방어적으로 추출 */
    private String pickAdr(JsonNode root) {
        if (root == null) return null;
        // 대표: road_addr.ADR_MNG_NO
        JsonNode n1 = root.path("road_addr").path("ADR_MNG_NO");
        if (!n1.isMissingNode() && !n1.isNull()) return n1.asText();

        // 소문자 변종
        JsonNode n2 = root.path("road_addr").path("adr_mng_no");
        if (!n2.isMissingNode() && !n2.isNull()) return n2.asText();

        // 루트에 바로 내려오는 경우 대비
        JsonNode n3 = root.path("ADR_MNG_NO");
        if (!n3.isMissingNode() && !n3.isNull()) return n3.asText();

        JsonNode n4 = root.path("adr_mng_no");
        if (!n4.isMissingNode() && !n4.isNull()) return n4.asText();

        return null;
    }
}
