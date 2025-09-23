package com.example.backend.user.service;

import com.example.backend.user.dto.AIRecommendation;
import com.example.backend.user.dto.AIRecommendationRequest;
import com.example.backend.user.dto.AIRecommendationResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIRecommendationService {

    private final WebClient aiWebClient;
    private final ObjectMapper objectMapper;

    // 미리 준비된 창업 관련 질문들
    private static final List<String> PREDEFINED_QUESTIONS = List.of(
            "다음 설문조사 결과를 바탕으로 가장 적합한 창업 업종 3개를 추천해주세요.",
            "사용자의 배경과 관심사를 고려하여 성공 가능성이 높은 업종을 선별해주세요.",
            "초기 자본, 경험, 시장성을 종합적으로 고려한 업종 추천을 해주세요.",
            "사용자의 전문성과 시장 트렌드에 맞는 최적의 창업 아이템을 제안해주세요.",
            "리스크가 적고 수익성이 높은 업종을 우선순위로 추천해주세요."
    );

    public Mono<AIRecommendationResponse> generateRecommendations(AIRecommendationRequest request, Long userId) {
        String prompt = buildPrompt(request, userId);

        Map<String, Object> requestBody = Map.of(
                "model", "gpt-5-mini",
                "messages", List.of(
                        Map.of("role", "developer", "content", "Answer in Korean"),
                        Map.of("role", "system", "content", getSystemPrompt()),
                        Map.of("role", "user", "content", prompt)
                ),
                "max_tokens", 2000,
                "temperature", 0.7
        );

        return aiWebClient.post()
                .uri("/api.openai.com/v1/chat/completions")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(Map.class)
                .map(this::parseResponse)
                .doOnSuccess(response -> log.info("AI 추천 완료: userId={}", userId))  // 수정된 부분
                .doOnError(error -> log.error("AI API 호출 실패: userId={}", userId, error))  // 수정된 부분
                .onErrorReturn(createErrorResponse());
    }

    private String getSystemPrompt() {
        return """
            당신은 창업 컨설턴트입니다. 
            설문조사 결과를 바탕으로 상권업종분류 중에서 가장 적합한 창업 업종 3개를 추천해주세요.
            
            다음 업종들 중에서만 선택해주세요:
            - 소매업 (G2XXXX): 편의점(G20405), 카페(I21201), 의류(G20902), 화장품(G21503) 등
            - 음식업 (I2XXXX): 치킨(I21006), 한식(I20101), 카페(I21201), 피자(I21003) 등
            - 서비스업 (M1XXXX, N1XXXX): 미용실, 부동산, 광고 등
            
            응답은 반드시 아래 JSON 형식으로만 해주세요:
            {
              "success": true,
              "recommendations": [
                {
                  "industryCode": "I21201",
                  "industryName": "카페",
                  "category": "음식",
                  "reason": "구체적인 추천 이유 (100자 이내)",
                  "score": 85
                },
                {
                  "industryCode": "G20405", 
                  "industryName": "편의점",
                  "category": "소매",
                  "reason": "구체적인 추천 이유 (100자 이내)",
                  "score": 78
                },
                {
                  "industryCode": "I21006",
                  "industryName": "치킨",
                  "category": "음식", 
                  "reason": "구체적인 추천 이유 (100자 이내)",
                  "score": 72
                }
              ],
              "summary": "전체 추천 요약 (200자 이내)"
            }
            
            주의사항:
            1. industryCode는 위 분류 중에서만 선택
            2. 실제 존재하는 업종 코드만 사용
            3. 추천 이유는 구체적이고 실용적으로 작성
            4. JSON 형식을 정확히 지켜주세요
            """;
    }

    private String buildPrompt(AIRecommendationRequest request, Long userId) {  // 파라미터 추가
        StringBuilder prompt = new StringBuilder();

        String selectedQuestion = PREDEFINED_QUESTIONS.get(
                (int) (Math.random() * PREDEFINED_QUESTIONS.size())
        );

        prompt.append(selectedQuestion).append("\n\n");
        prompt.append("【설문조사 결과】\n");

        if (request.getAge() != null) {
            prompt.append("- 연령대: ").append(request.getAge()).append("\n");
        }
        if (request.getExperience() != null && !request.getExperience().isEmpty()) {
            prompt.append("- 경험 분야: ").append(String.join(", ", request.getExperience())).append("\n");
        }
        if (request.getBudget() != null) {
            prompt.append("- 초기 자본: ").append(request.getBudget()).append("\n");
        }
        if (request.getInterests() != null && !request.getInterests().isEmpty()) {
            prompt.append("- 관심사: ").append(String.join(", ", request.getInterests())).append("\n");
        }
        if (request.getWorkStyle() != null) {
            prompt.append("- 업무 스타일: ").append(request.getWorkStyle()).append("\n");
        }
        if (request.getLocation() != null) {
            prompt.append("- 희망 지역: ").append(request.getLocation()).append("\n");
        }
        if (request.getRiskTolerance() != null) {
            prompt.append("- 위험 감수 성향: ").append(request.getRiskTolerance()).append("\n");
        }

        return prompt.toString();
    }

    private AIRecommendationResponse parseResponse(Map<String, Object> response) {
        try {
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            if (choices == null || choices.isEmpty()) {
                log.warn("AI 응답에 choices가 없습니다");
                return createErrorResponse();
            }

            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            String content = (String) message.get("content");

            log.debug("AI 응답 내용: {}", content);

            // JSON 응답 파싱
            JsonNode jsonNode = objectMapper.readTree(content);

            List<AIRecommendation> recommendations = new ArrayList<>();
            JsonNode recArray = jsonNode.get("recommendations");

            if (recArray != null && recArray.isArray()) {
                for (JsonNode rec : recArray) {
                    AIRecommendation recommendation =
                            AIRecommendation.builder()
                                    .industryCode(rec.get("industryCode").asText())
                                    .industryName(rec.get("industryName").asText())
                                    .category(rec.get("category").asText())
                                    .reason(rec.get("reason").asText())
                                    .score(rec.get("score").asInt())
                                    .build();
                    recommendations.add(recommendation);
                }
            }

            return AIRecommendationResponse.builder()
                    .success(true)
                    .recommendations(recommendations)
                    .summary(jsonNode.has("summary") ? jsonNode.get("summary").asText() : "AI 기반 업종 추천이 완료되었습니다.")
                    .build();

        } catch (JsonProcessingException e) {
            log.error("JSON 파싱 실패", e);
            return createErrorResponse();
        } catch (Exception e) {
            log.error("AI 응답 파싱 실패", e);
            return createErrorResponse();
        }
    }

    private AIRecommendationResponse createErrorResponse() {
        return AIRecommendationResponse.builder()
                .success(false)
                .errorMessage("AI 서비스 일시적 오류입니다. 잠시 후 다시 시도해주세요.")
                .recommendations(new ArrayList<>())
                .build();
    }
}
