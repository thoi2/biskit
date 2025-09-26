package com.example.backend.recommend.exception;

import com.example.backend.common.exception.BusinessException;

/**
 * 공통 BusinessException(ErrorCode, message) 생성자를 활용해
 * - 상태/시스템 코드는 공통에 위임
 * - 표시 메시지는 도메인 전용 메시지로 세팅
 */
public class RecommendException extends BusinessException {
    private final RecommendErrorCode recommendCode;
    public RecommendException(RecommendErrorCode recommendCode) {
        super(recommendCode.getCommonCode(), recommendCode.getMessage());
        this.recommendCode = recommendCode;
    }
    public RecommendErrorCode getRecommendCode() {
        return recommendCode;
    }
}
