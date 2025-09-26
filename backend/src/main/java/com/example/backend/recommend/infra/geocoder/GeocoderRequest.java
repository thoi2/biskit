package com.example.backend.recommend.infra.geocoder;

import com.example.backend.common.exception.BusinessException;
import com.example.backend.recommend.exception.RecommendErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
class GeocoderRequest {

    private final RestTemplate restTemplate;

    @Value("${geocoder.base-url}")
    private String baseUrl;

    @Value("${geocoder.token}")
    private String token;

    String callReverse(BigDecimal lat, BigDecimal lng) {
        var uri = UriComponentsBuilder.fromUriString(baseUrl)
                .path("/reverse_geocode")
                .queryParam("x", lng.toPlainString())
                .queryParam("y", lat.toPlainString())
                .queryParam("token", token)
                .build(true)
                .toUri();
        return doCall(uri);
    }

    String callGeocode(String address) {
        var uri = UriComponentsBuilder.fromUriString(baseUrl)
                .path("/geocode")
                .queryParam("q", address)
                .queryParam("token", token)
                .build()
                .encode(StandardCharsets.UTF_8)
                .toUri();
        return doCall(uri);
    }

    private String doCall(java.net.URI uri) {
        try {
            ResponseEntity<String> res = restTemplate.getForEntity(uri, String.class);
            if (!res.getStatusCode().is2xxSuccessful() || res.getBody() == null || res.getBody().isBlank()) {
                throw new BusinessException(
                        RecommendErrorCode.GEO_UPSTREAM_BAD_RESPONSE.getCommonCode(),
                        RecommendErrorCode.GEO_UPSTREAM_BAD_RESPONSE.getMessage()
                );
            }
            return res.getBody();
        } catch (ResourceAccessException e) {
            throw new BusinessException(
                    RecommendErrorCode.GEO_UPSTREAM_TIMEOUT.getCommonCode(),
                    RecommendErrorCode.GEO_UPSTREAM_TIMEOUT.getMessage()
            );
        } catch (HttpStatusCodeException e) {
            throw new BusinessException(
                    RecommendErrorCode.GEO_UPSTREAM_BAD_RESPONSE.getCommonCode(),
                    RecommendErrorCode.GEO_UPSTREAM_BAD_RESPONSE.getMessage()
            );
        }
    }
}
