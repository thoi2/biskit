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
                "max_completion_tokens", 2000  // max_tokens → max_completion_tokens 변경
        );

        return aiWebClient.post()
                .uri("/api.openai.com/v1/chat/completions")
                .bodyValue(requestBody)
                .retrieve()
                .onStatus(status -> status.isError(), response ->
                        response.bodyToMono(String.class)
                                .map(body -> {
                                    log.error("GMS API 오류: status={}, body={}", response.statusCode(), body);
                                    return new RuntimeException("GMS API 오류: " + body);
                                })
                )
                .bodyToMono(Map.class)
                .map(this::parseResponse)
                .doOnSuccess(response -> log.info("AI 추천 완료: userId={}", userId))
                .doOnError(error -> log.error("AI API 호출 실패: userId={}", userId, error))
                .onErrorReturn(createErrorResponse());
    }

    private String getSystemPrompt() {
        return """
            당신은 창업 컨설턴트입니다. 
            설문조사 결과를 바탕으로 아래 상권업종분류 코드 중에서 가장 적합한 창업 업종 3개를 추천해주세요.
            
            【사용 가능한 업종 코드】
            
            ## 소매업 (G2)
            - G20902: 여성 의류 소매업
            - G20404: 슈퍼마켓  
            - G21201: 전기용품/조명장치 소매업
            - G21503: 화장품 소매업
            - G20405: 편의점
            - G20901: 남성 의류 소매업
            - G21501: 약국
            - G21001: 철물/공구 소매업
            - G21701: 시계/귀금속 소매업
            - G20602: 주류 소매업
            - G20910: 신발 소매업
            - G20506: 채소/과일 소매업
            - G21302: 문구/회화용품 소매업
            - G20911: 가방 소매업
            - G21304: 운동용품 소매업
            - G21101: 가구 소매업
            - G20802: 핸드폰 소매업
            - G22201: 중고 상품 소매업
            - G20508: 건강보조식품 소매업
            - G20701: 담배/전자담배 소매업
            - G21901: 꽃집
            - G20803: 가전제품 소매업
            - G21301: 서점
            - G20505: 수산물 소매업
            - G20509: 반찬/식료품 소매업
            - G22001: 애완동물/애완용품 소매업
            - G21306: 장난감 소매업
            - G20503: 정육점
            - G20801: 컴퓨터/소프트웨어 소매업
            
            ## 숙박업 (I1)
            - I10102: 여관/모텔
            - I10201: 기숙사/고시원
            - I10101: 호텔/리조트
            - I10103: 펜션
            - I10104: 캠핑/글램핑
            
            ## 음식업 (I2)
            - I21201: 카페
            - I21006: 치킨
            - I21104: 요리 주점
            - I20302: 일식 카레/돈가스/덮밥
            - I20101: 백반/한정식
            - I20110: 닭/오리고기 구이/찜
            - I20701: 구내식당
            - I20105: 국수/칼국수
            - I21103: 생맥주 전문
            - I20107: 돼지고기 구이/찜
            - I20201: 중국집
            - I20112: 해산물 구이/찜
            - I20109: 곱창 전골/구이
            - I21003: 피자
            - I21001: 빵/도넛
            - I20301: 일식 회/초밥
            - I21101: 일반 유흥 주점
            - I20501: 베트남식 전문
            - I21007: 김밥/만두/분식
            - I20102: 국/탕/찌개류
            - I20106: 냉면/밀면
            - I21002: 떡/한과
            - I20103: 족발/보쌈
            - I21004: 버거
            - I21005: 토스트/샌드위치/샐러드
            - I20401: 경양식
            - I20111: 횟집
            - I21008: 아이스크림/빙수
            - I20108: 소고기 구이/찜
            - I20202: 마라탕/훠궈
            - I20104: 전/부침개
            - I21102: 무도 유흥 주점
            - I20403: 패밀리레스토랑
            - I20601: 분류 안된 외국식 음식점
            - I20303: 일식 면 요리
            - I20702: 뷔페
            - I20402: 파스타/스테이크
            - I20113: 복 요리 전문
            
            ## 전문과학기술서비스업 (M1)
            - M11401: 명함/간판/광고물 제작
            - M10303: 법무사
            - M10402: 세무사
            - M10901: 건축 설계 및 관련 서비스업
            - M10501: 광고 대행업
            - M10301: 변호사
            - M10703: 경영 컨설팅업
            - M11203: 시각 디자인업
            - M11202: 제품 디자인업
            - M11101: 동물병원
            - M11201: 인테리어 디자인업
            - M11301: 사진촬영업
            - M10401: 공인회계사
            
            ## 사업시설관리·사업지원서비스업 (N1)
            - N10203: 부동산 중개/대리업
            - N10403: 상용 인력 공급 및 인사관리 서비스업
            - N10201: 건축물 일반 청소업
            - N10501: 여행사
            - N10101: 사업시설 유지·관리 서비스업
            - N10805: 포장/충전업
            - N11101: 건설기계/장비 대여업
            - N10402: 임시/일용 인력 공급업
            - N10802: 전시/컨벤션/행사 대행 서비스업
            - N11102: 컴퓨터/사무기기 대여업
            - N10401: 고용 알선업
            - N10703: 복사업
            - N11001: 스포츠/레크리에이션 용품 대여업
            - N10901: 자동차 대여업
            - N10301: 조경 유지·관리 서비스업
            - N11002: 음반/비디오물 대여업
            - N11003: 만화방
            
            ## 교육서비스업 (P1)
            - P10501: 입시·교과학원
            - P10611: 미술학원
            - P10609: 음악학원
            - P10603: 요가/필라테스 학원
            - P10621: 직원 훈련기관
            - P10615: 외국어학원
            - P10625: 기타 기술/직업 훈련학원
            - P10613: 기타 예술/스포츠 교육기관
            - P10605: 레크리에이션 교육기관
            - P10601: 태권도/무술학원
            - P10617: 전문자격/고시학원
            - P10619: 사회교육시설
            - P10627: 컴퓨터 학원
            - P10623: 운전학원
            
            ## 보건업·사회복지서비스업 (Q1)
            - Q10210: 치과의원
            - Q10402: 유사 의료업
            - Q10204: 피부/비뇨기과 의원
            - Q10208: 성형외과 의원
            - Q10104: 한방병원
            - Q10209: 기타 의원
            - Q10102: 일반병원
            - Q10205: 안과 의원
            - Q10201: 내과/소아과 의원
            - Q10103: 치과병원
            - Q10211: 한의원
            - Q10212: 방사선 진단/병리 검사 의원
            - Q10203: 신경/정신과 의원
            - Q10202: 외과 의원
            - Q10207: 산부인과 의원
            - Q10105: 요양병원
            - Q10206: 이비인후과 의원
            - Q10101: 종합병원
            
            ## 예술·스포츠·여가관련서비스업 (R1)
            - R10407: 노래방
            - R10307: 헬스장
            - R10312: 테니스장
            - R10311: 골프 연습장
            - R10202: 독서실/스터디 카페
            - R10310: 당구장
            - R10314: 기타 스포츠시설 운영업
            - R10405: 기타 오락장
            - R10410: 복권 발행/판매업
            - R10313: 탁구장
            - R10406: PC방
            - R10414: 바둑/장기/체스 경기 운영업
            - R10309: 볼링장
            - R10402: 비디오방
            - R10408: 낚시터 운영업
            - R10404: 전자 게임장
            - R10308: 수영장
            - R10306: 종합 스포츠시설
            - R10316: 스쿼시/라켓볼장
            - R10409: 수상/해양 레저업
            
            ## 협회·단체·수리·기타개인서비스업 (S2)
            - S20802: 마사지/안마
            - S20601: 의류/이불 수선업
            - S20301: 자동차 정비소
            - S20703: 네일숍
            - S20702: 피부 관리실
            - S20701: 미용실
            - S20901: 세탁소
            - S20101: 컴퓨터/노트북/프린터 수리업
            - S20302: 자동차 세차장
            - S20501: 가전제품 수리업
            - S20902: 셀프 빨래방
            - S20201: 핸드폰/통신장비 수리업
            - S20602: 가죽/가방/신발 수선업
            - S21001: 장례식장
            - S20401: 모터사이클 수리업
            - S21002: 화장터/묘지/납골당
            - S21105: 결혼 상담 서비스업
            - S20603: 시계/귀금속/악기 수리업
            - S20801: 목욕탕/사우나
            - S21101: 예식장업
            - S20803: 체형/비만 관리
            
            응답은 반드시 아래 JSON 형식으로만 해주세요:
            {
              "success": true,
              "recommendations": [
                {
                  "industryCode": "I21201",
                  "industryName": "카페",
                  "category": "음식업",
                  "reason": "구체적인 추천 이유 (100자 이내)",
                  "score": 85
                },
                {
                  "industryCode": "G20405", 
                  "industryName": "편의점",
                  "category": "소매업",
                  "reason": "구체적인 추천 이유 (100자 이내)",
                  "score": 78
                },
                {
                  "industryCode": "I21006",
                  "industryName": "치킨",
                  "category": "음식업", 
                  "reason": "구체적인 추천 이유 (100자 이내)",
                  "score": 72
                }
              ],
              "summary": "전체 추천 요약 (200자 이내)"
            }
            
            주의사항:
            1. 위 목록의 정확한 업종 코드만 사용하세요
            2. industryCode와 industryName이 정확히 매칭되어야 합니다
            3. category는 대분류명을 사용하세요 (소매업, 음식업, 숙박업, 전문과학기술서비스업, 사업시설관리·사업지원서비스업, 교육서비스업, 보건업·사회복지서비스업, 예술·스포츠·여가관련서비스업, 협회·단체·수리·기타개인서비스업)
            4. 추천 이유는 사용자의 설문 결과와 연관지어 구체적으로 작성하세요
            5. JSON 형식을 정확히 지켜주세요
            6. 반드시 한국어로 응답해주세요
            """;
    }

    private String buildPrompt(AIRecommendationRequest request, Long userId) {
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
