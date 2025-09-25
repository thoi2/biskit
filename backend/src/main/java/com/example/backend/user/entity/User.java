package com.example.backend.user.entity;

import com.example.backend.common.enums.OAuth2Provider;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 사용자 엔티티 (간소화 버전)
 */
@Entity
@Table(name = "user")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String name;

    private String profileImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "oauth2_provider", nullable = false)
    private OAuth2Provider oauth2Provider;

    @Column(name = "oauth2_provider_id", nullable = false)
    private String oauth2ProviderId;

    // 설문조사 및 업종 추천 관련 컬럼
    @Column(name = "survey_completed_at")
    private LocalDateTime surveyCompletedAt;

    @Column(name = "industry_1st", length = 10)
    private String industry1st;

    @Column(name = "industry_2nd", length = 10)
    private String industry2nd;

    @Column(name = "industry_3rd", length = 10)
    private String industry3rd;

    /**
     * 추천 결과가 존재하는지 확인
     */
    public boolean hasRecommendation() {
        return industry1st != null;
    }

    /**
     * 설문조사를 완료했는지 확인
     */
    public boolean isSurveyCompleted() {
        return surveyCompletedAt != null;
    }

    /**
     * 업종 추천 정보 초기화
     */
    public void clearRecommendations() {
        this.surveyCompletedAt = null;
        this.industry1st = null;
        this.industry2nd = null;
        this.industry3rd = null;
    }

    /**
     * 업종 추천 정보 업데이트
     */
    public void updateRecommendations(String industry1st, String industry2nd, String industry3rd) {
        this.surveyCompletedAt = LocalDateTime.now();
        this.industry1st = industry1st;
        this.industry2nd = industry2nd;
        this.industry3rd = industry3rd;
    }
}