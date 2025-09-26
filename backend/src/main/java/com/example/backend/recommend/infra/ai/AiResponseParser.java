package com.example.backend.recommend.infra.ai;

import com.example.backend.common.exception.BusinessException;
import com.example.backend.recommend.exception.RecommendErrorCode;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class AiResponseParser {

    private static final String[] METRIC_KEYS = {"1","2","3","4","5"};

    /** 카테고리 → 지표 리스트(Map<String, List<Double>>) */
    public Map<String, List<Double>> toCategoryMetricListV2(JsonNode aiResponse) {
        JsonNode data = requireDataArray(aiResponse); // 배열만 허용
        Map<String, List<Double>> out = new LinkedHashMap<>();

        for (JsonNode row : data) {
            // "category": "치과의원" 같은 문자열
            String category = row.path("category").asText(null);
            if (category == null || category.isBlank()) continue;

            // "1"..."5" 각 칸에서 숫자만 추출, 아니면 null로 채워 길이 5 고정
            var vals = new java.util.ArrayList<Double>(METRIC_KEYS.length);
            for (String k : METRIC_KEYS) {
                JsonNode v = row.get(k);
                vals.add((v != null && v.isNumber()) ? v.asDouble() : null);
            }
            out.put(category, java.util.Collections.unmodifiableList(vals));
        }
        return out;
    }

    // ---------- 내부 유틸 ----------

    /** data가 JSON '배열'이어야 할 때 */
    private JsonNode requireDataArray(JsonNode aiResponse) {
        JsonNode data = requireDataPresent(aiResponse);
        if (!data.isArray()) {
            throw new BusinessException(
                    RecommendErrorCode.AI_UPSTREAM_BAD_RESPONSE.getCommonCode(),
                    "AI 응답의 'data'가 JSON 배열이 아닙니다."
            );
        }
        return data;
    }

    /** data 필드 존재/널 검증 공통부 */
    private JsonNode requireDataPresent(JsonNode aiResponse) {
        if (aiResponse == null) {
            throw new BusinessException(
                    RecommendErrorCode.AI_UPSTREAM_BAD_RESPONSE.getCommonCode(),
                    "AI 응답이 null 입니다."
            );
        }
        JsonNode data = aiResponse.get("data");
        if (data == null || data.isNull()) {
            JsonNode body = aiResponse.get("body");
            if (body != null && !body.isNull()) {
                data = body.get("data");
            }
        }

        if (data == null || data.isNull()) {
            throw new BusinessException(
                    RecommendErrorCode.AI_UPSTREAM_BAD_RESPONSE.getCommonCode(),
                    "AI 응답에 'data' 필드가 없거나 null 입니다.(root/body)"
            );
        }
        return data;
    }
}
