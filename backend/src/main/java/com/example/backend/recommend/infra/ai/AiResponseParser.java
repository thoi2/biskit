package com.example.backend.recommend.infra.ai;

import com.example.backend.common.exception.BusinessException;
import com.example.backend.recommend.exception.RecommendErrorCode;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;

import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.ArrayList;
import java.util.Map;
import java.util.List;

@Component
public class AiResponseParser {

    public Map<String, List<Double>> toCategoryMetricListV2(JsonNode aiResponse) {
        JsonNode data = requireDataArray(aiResponse); // ← 배열만 허용
        Map<String, List<Double>> out = new LinkedHashMap<>();

        for (JsonNode row : data) {
            String category = row.path("category").asText(null);
            if (category == null || category.isBlank()) continue;

            List<Double> vals = new ArrayList<>(5);
            for (String k : new String[]{"1","2","3","4","5"}) {
                JsonNode v = row.get(k);
                // 숫자만 반영, 없거나 숫자 아니면 null로 채워 길이 5 유지
                vals.add(v != null && v.isNumber() ? v.asDouble() : null);
            }
            out.put(category, vals);
        }
        return out;
    }

    /** (V2) 단일 카테고리 → [v1..v5] */
    public List<Double> toCategoryMetricListV2For(JsonNode aiResponse, String categoryId) {
        JsonNode data = requireDataArray(aiResponse);
        for (JsonNode row : data) {
            String category = row.path("category").asText(null);
            if (categoryId != null && categoryId.equals(category)) {
                List<Double> vals = new ArrayList<>(5);
                for (String k : new String[]{"1","2","3","4","5"}) {
                    JsonNode v = row.get(k);
                    vals.add(v != null && v.isNumber() ? v.asDouble() : null);
                }
                return vals;
            }
        }
        throw new BusinessException(
                RecommendErrorCode.AI_UPSTREAM_BAD_RESPONSE.getCommonCode(),
                "AI 응답에 카테고리 없음: " + categoryId
        );
    }

    /** 전체 카테고리 → Double 값 맵 (catId -> value) */
    public Map<String, Double> toCategoryDoubleMap(JsonNode aiResponse) {
        JsonNode data = requireData(aiResponse);
        Map<String, Double> out = new LinkedHashMap<>();

        Iterator<String> fields = data.fieldNames();
        while (fields.hasNext()) {
            String key = fields.next();
            JsonNode fragment = data.get(key);
            Double v = extractDouble(fragment, key);
            if (v != null) out.put(key, v);
        }
        return out;
    }

    /** 단일 카테고리 → Double */
    public Double toCategoryDouble(JsonNode aiResponse, String categoryId) {
        JsonNode data = requireData(aiResponse);
        if (!data.has(categoryId)) {
            throw new BusinessException(
                    RecommendErrorCode.AI_UPSTREAM_BAD_RESPONSE.getCommonCode(),
                    "AI 응답에 카테고리 없음: " + categoryId
            );
        }
        return extractDouble(data.get(categoryId), categoryId);
    }

    /** 저장/조회 일관성을 위한 키 규칙 */

    // ---------- 내부 유틸 ----------

    private JsonNode requireData(JsonNode aiResponse) {

        if (aiResponse == null) {
            throw new BusinessException(
                    RecommendErrorCode.AI_UPSTREAM_BAD_RESPONSE.getCommonCode(),
                    "AI 응답이 null 입니다."
            );
        }
        JsonNode data = aiResponse.get("data");
        if (data == null || data.isNull()) {
            throw new BusinessException(
                    RecommendErrorCode.AI_UPSTREAM_BAD_RESPONSE.getCommonCode(),
                    "AI 응답에 'data' 필드가 없거나 null 입니다."
            );
        }
        if (!data.isObject()) {
            throw new BusinessException(
                    RecommendErrorCode.AI_UPSTREAM_BAD_RESPONSE.getCommonCode(),
                    "AI 응답의 'data'가 JSON 객체가 아닙니다."
            );
        }
        return data;
    }

    private JsonNode requireDataArray(JsonNode aiResponse) {
        if (aiResponse == null) {
            throw new BusinessException(
                    RecommendErrorCode.AI_UPSTREAM_BAD_RESPONSE.getCommonCode(),
                    "AI 응답이 null 입니다."
            );
        }
        JsonNode data = aiResponse.get("data");
        if (data == null || data.isNull()) {
            throw new BusinessException(
                    RecommendErrorCode.AI_UPSTREAM_BAD_RESPONSE.getCommonCode(),
                    "AI 응답에 'data' 필드가 없거나 null 입니다."
            );
        }
        if (!data.isArray()) {
            throw new BusinessException(
                    RecommendErrorCode.AI_UPSTREAM_BAD_RESPONSE.getCommonCode(),
                    "AI 응답의 'data'가 JSON 배열이 아닙니다. (V2 포맷)"
            );
        }
        return data;
    }

    private Double extractDouble(JsonNode fragment, String keyForMsg) {
        if (fragment == null || fragment.isNull()) {
            throw new BusinessException(
                    RecommendErrorCode.AI_UPSTREAM_BAD_RESPONSE.getCommonCode(),
                    "카테고리 값이 비어있습니다: " + keyForMsg
            );
        }
        if (!fragment.isNumber()) {
            throw new BusinessException(
                    RecommendErrorCode.AI_UPSTREAM_BAD_RESPONSE.getCommonCode(),
                    "카테고리에서 숫자 값을 추출하지 못했습니다: " + keyForMsg
            );
        }
        return fragment.asDouble();
    }
}
