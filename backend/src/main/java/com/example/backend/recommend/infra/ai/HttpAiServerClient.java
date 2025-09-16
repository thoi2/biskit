package com.example.backend.recommend.infra.ai;

import com.example.backend.common.exception.BusinessException;
import com.example.backend.common.exception.ErrorCode;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class HttpAiServerClient implements AiServerClient {

    private final RestTemplate restTemplate; // Bean 등록 필요
    private final ObjectMapper objectMapper;

    @Value("${ai.server.base-url:http://ai-server.internal}")
    private String baseUrl;

    @Override
    public JsonNode requestAll(BigDecimal lat, BigDecimal lng, String correlationId) {
        String url = baseUrl + "/api/v1/recommend/all";
        return postJson(url, payload(lat, lng, null), correlationId);
    }

    @Override
    public JsonNode requestCategory(BigDecimal lat, BigDecimal lng, int categoryId, String correlationId) {
        String url = baseUrl + "/api/v1/recommend/category";
        return postJson(url, payload(lat, lng, categoryId), correlationId);
    }

    private Map<String, Object> payload(BigDecimal lat, BigDecimal lng, Integer categoryId) {
        Map<String, Object> body = new HashMap<>();
        // 정밀도 보존을 위해 문자열로 직렬화
        body.put("lat", lat.toPlainString());
        body.put("lng", lng.toPlainString());
        if (categoryId != null) body.put("categoryId", categoryId);
        return body;
    }

    private JsonNode postJson(String url, Map<String, Object> body, String correlationId) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (correlationId != null) headers.set("X-Correlation-Id", correlationId);

            HttpEntity<Map<String, Object>> req = new HttpEntity<>(body, headers);
            ResponseEntity<String> res = restTemplate.postForEntity(url, req, String.class);

            if (!res.getStatusCode().is2xxSuccessful() || res.getBody() == null) {
                throw new BusinessException(ErrorCode.COMMON_BAD_GATEWAY,
                        "AI 서버 응답 코드: " + res.getStatusCode());
            }
            return objectMapper.readTree(res.getBody());

        } catch (BusinessException be) {
            throw be;
        } catch (Exception e) {
            // 타임아웃/통신/파싱 모두 게이트웨이 오류로 래핑
            throw new BusinessException(ErrorCode.COMMON_GATEWAY_TIMEOUT, "AI 서버 호출 실패: " + e.getMessage());
        }
    }
}
