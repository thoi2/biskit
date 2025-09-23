package com.example.backend.user.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class IndustrySurveyRequest {
    // userId 제거 (JWT에서 추출)

    @NotNull(message = "1순위 업종은 필수입니다.")
    @Size(max = 20, message = "업종 코드는 최대 20자입니다.")
    private String industry1st;

    @Size(max = 20, message = "업종 코드는 최대 20자입니다.")
    private String industry2nd;

    @Size(max = 20, message = "업종 코드는 최대 20자입니다.")
    private String industry3rd;
}
