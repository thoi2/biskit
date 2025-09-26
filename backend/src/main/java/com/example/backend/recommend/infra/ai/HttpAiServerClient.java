package com.example.backend.recommend.infra.ai;

import com.example.backend.common.exception.BusinessException;
import com.example.backend.recommend.exception.RecommendErrorCode;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import java.net.URI;

import java.math.BigDecimal;
import java.net.SocketTimeoutException;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class HttpAiServerClient implements AiServerClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${ai.server.base-url}")
    private String baseUrl;

    @Override
    public JsonNode requestAll(int id, BigDecimal lat, BigDecimal lng) {
        URI uri = UriComponentsBuilder
                .fromUriString(baseUrl)
                .path("/api/v1/ai/location")
                .build(true)
                .toUri();
        return postJson(uri.toString(), payload(id, lat, lng, null));
    }

//    @Override
//    public JsonNode requestCategory(BigDecimal lat, BigDecimal lng, int categoryId) {
//        URI uri = UriComponentsBuilder
//                .fromUriString(baseUrl)
//                .path("/ai/v1/recommend/category")
//                .build(true)
//                .toUri();
//        return postJson(uri.toString(), payload(lat, lng, categoryId));
//    }

    private Map<String, Object> payload(int id, BigDecimal lat, BigDecimal lng, Integer categoryId) {
        Map<String, Object> body = new HashMap<>();
        // 정밀도 보존을 위해 문자열로 직렬화
        body.put("building_id", id);
        body.put("lat", lat.toPlainString());
        body.put("lng", lng.toPlainString());
        if (categoryId != null) body.put("categoryId", categoryId);
        return body;
    }

    private JsonNode postJson(String url, Map<String, Object> body) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> req = new HttpEntity<>(body, headers);
            ResponseEntity<String> res = restTemplate.postForEntity(url, req, String.class);

            String responseBody = res.getBody();
            if (responseBody == null || responseBody.isBlank()) {
                throw new BusinessException(
                        RecommendErrorCode.AI_UPSTREAM_BAD_RESPONSE.getCommonCode(),
                        RecommendErrorCode.AI_UPSTREAM_BAD_RESPONSE.getMessage()
                );
            }

            try {
                return objectMapper.readTree(responseBody);
            } catch (Exception parseEx) {
                throw new BusinessException(
                        RecommendErrorCode.AI_UPSTREAM_BAD_RESPONSE.getCommonCode(),
                        RecommendErrorCode.AI_UPSTREAM_BAD_RESPONSE.getMessage()
                );
            }

        } catch (HttpStatusCodeException e) {
            // 4xx/5xx만 이쪽으로 들어옴 → 상태 코드 기반 단일 매핑 지점
            HttpStatusCode statusCode = e.getStatusCode();
            HttpStatus s = HttpStatus.valueOf(statusCode.value());
            int code = s.value();
            if (code == 401 || code == 403) {
                throw new BusinessException(
                        RecommendErrorCode.AI_UPSTREAM_AUTH_FAILED.getCommonCode(),
                        RecommendErrorCode.AI_UPSTREAM_AUTH_FAILED.getMessage()
                );
            }
            if (code == 429) {
                throw new BusinessException(
                        RecommendErrorCode.AI_UPSTREAM_RATE_LIMITED.getCommonCode(),
                        RecommendErrorCode.AI_UPSTREAM_RATE_LIMITED.getMessage()
                );
            }
            if (code == 503) {
                throw new BusinessException(
                        RecommendErrorCode.AI_UPSTREAM_UNAVAILABLE.getCommonCode(),
                        RecommendErrorCode.AI_UPSTREAM_UNAVAILABLE.getMessage()
                );
            }
            if (code == 504) {
                throw new BusinessException(
                        RecommendErrorCode.AI_UPSTREAM_TIMEOUT.getCommonCode(),
                        RecommendErrorCode.AI_UPSTREAM_TIMEOUT.getMessage()
                );
            }
            if (s.is5xxServerError()) {
                throw new BusinessException(
                        RecommendErrorCode.AI_UPSTREAM_UNAVAILABLE.getCommonCode(),
                        RecommendErrorCode.AI_UPSTREAM_UNAVAILABLE.getMessage()
                );
            }
            // 기타 4xx → BAD_RESPONSE
            throw new BusinessException(
                    RecommendErrorCode.AI_UPSTREAM_BAD_RESPONSE.getCommonCode(),
                    RecommendErrorCode.AI_UPSTREAM_BAD_RESPONSE.getMessage()
            );

        } catch (ResourceAccessException e) {
            // 네트워크 계열
            if (e.getCause() instanceof SocketTimeoutException) {
                throw new BusinessException(
                        RecommendErrorCode.AI_UPSTREAM_TIMEOUT.getCommonCode(),
                        RecommendErrorCode.AI_UPSTREAM_TIMEOUT.getMessage()
                );
            }
            throw new BusinessException(
                    RecommendErrorCode.AI_UPSTREAM_UNAVAILABLE.getCommonCode(),
                    RecommendErrorCode.AI_UPSTREAM_UNAVAILABLE.getMessage()
            );

        } catch (Exception e) {
            throw new BusinessException(
                    RecommendErrorCode.AI_UPSTREAM_UNAVAILABLE.getCommonCode(),
                    RecommendErrorCode.AI_UPSTREAM_UNAVAILABLE.getMessage()
            );
        }
    }
}
