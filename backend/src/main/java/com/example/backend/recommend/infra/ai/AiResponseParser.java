package com.example.backend.recommend.infra.ai;

import com.example.backend.common.exception.BusinessException;
import com.example.backend.common.exception.ErrorCode;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;

import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class AiResponseParser {

    /** 전체 카테고리 → Double 값 맵 (catId -> value) */
    public Map<Integer, Double> toCategoryDoubleMap(JsonNode aiResponse) {
        JsonNode data = requireData(aiResponse);
        Map<Integer, Double> out = new LinkedHashMap<>();

        Iterator<String> fields = data.fieldNames();
        while (fields.hasNext()) {
            String key = fields.next();
            Integer catId = parseCategoryId(key);
            if (catId == null) continue;

            JsonNode fragment = data.get(key);
            Double v = extractDouble(fragment, key);
            if (v != null) out.put(catId, v);
        }
        return out;
    }

    /** 단일 카테고리 → Double */
    public Double toCategoryDouble(JsonNode aiResponse, int categoryId) {
        String catKey = categoryKey(categoryId);
        JsonNode data = requireData(aiResponse);
        if (!data.has(catKey)) {
            throw new BusinessException(ErrorCode.COMMON_INVALID_REQUEST,
                    "AI 응답에 카테고리 없음: " + catKey);
        }
        return extractDouble(data.get(catKey), catKey);
    }

    /** 저장/조회 일관성을 위한 키 규칙 */
    public String categoryKey(int categoryId) {
        return "cat_" + categoryId;
    }

    // ---------- 내부 유틸 ----------

    private JsonNode requireData(JsonNode aiResponse) {
        if (aiResponse == null || !aiResponse.has("data") || aiResponse.get("data") == null) {
            throw new BusinessException(ErrorCode.COMMON_INVALID_REQUEST, "AI 응답이 비어있거나 'data'가 없습니다.");
        }
        JsonNode data = aiResponse.get("data");
        if (!data.isObject()) {
            throw new BusinessException(ErrorCode.COMMON_INVALID_REQUEST, "'data'가 JSON 객체가 아닙니다.");
        }
        return data;
    }

    private Integer parseCategoryId(String key) {
        if (key == null || !key.startsWith("cat_")) return null;
        try { return Integer.parseInt(key.substring(4)); }
        catch (NumberFormatException e) { return null; }
    }

    /**
     * fragment에서 Double 하나를 뽑는다.
     * - 숫자면 그대로
     * - 객체면:
     *   1) 연도(\\d{4}) 키 중 가장 최신 연도의 값
     *   2) 'value' 숫자 필드
     *   3) 그 외 첫 번째 숫자 필드
     *   없으면 오류
     */
    private Double extractDouble(JsonNode fragment, String keyForMsg) {
        if (fragment == null || fragment.isNull()) {
            throw new BusinessException(ErrorCode.COMMON_INVALID_REQUEST,
                    "카테고리 값이 비어있습니다: " + keyForMsg);
        }
        if (fragment.isNumber()) {
            return fragment.asDouble();
        }
        if (fragment.isObject()) {
            // 1) 최신 연도(4자리 숫자 키) 찾기
            int bestYear = Integer.MIN_VALUE;
            Double bestVal = null;

            Iterator<String> it = fragment.fieldNames();
            while (it.hasNext()) {
                String k = it.next();
                JsonNode v = fragment.get(k);
                if (k != null && k.length() == 4 && k.chars().allMatch(Character::isDigit) && v != null && v.isNumber()) {
                    int y = Integer.parseInt(k);
                    if (y > bestYear) {
                        bestYear = y;
                        bestVal = v.asDouble();
                    }
                }
            }
            if (bestVal != null) return bestVal;

            // 2) 'value' 필드
            JsonNode valueNode = fragment.get("value");
            if (valueNode != null && valueNode.isNumber()) {
                return valueNode.asDouble();
            }

            // 3) 그 외 첫 숫자 필드
            it = fragment.fieldNames();
            while (it.hasNext()) {
                String k = it.next();
                JsonNode v = fragment.get(k);
                if (v != null && v.isNumber()) {
                    return v.asDouble();
                }
            }
        }

        throw new BusinessException(ErrorCode.COMMON_INVALID_REQUEST,
                "카테고리에서 숫자 값을 추출하지 못했습니다: " + keyForMsg);
    }
}
