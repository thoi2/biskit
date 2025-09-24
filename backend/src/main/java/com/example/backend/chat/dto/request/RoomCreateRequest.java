package com.example.backend.chat.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;

/**
 * 채팅방 생성 요청 DTO
 */
@Builder
public record RoomCreateRequest(

    @NotBlank(message = "방 이름은 필수입니다")
    @Size(min = 1, max = 100, message = "방 이름은 1~100자 이내여야 합니다")
    String roomName,

    @Size(max = 20, message = "대분류는 20자 이내여야 합니다")
    String bigCategory,

    @Min(value = 2, message = "최소 참여자는 2명 이상이어야 합니다")
    @Max(value = 1000, message = "최대 참여자는 1000명 이내여야 합니다")
    Integer maxParticipants
) {
    /**
     * 기본값 설정을 위한 생성자
     */
    public RoomCreateRequest {
        // maxParticipants가 null이면 기본값 1000 설정
        if (maxParticipants == null) {
            maxParticipants = 1000;
        }
    }

    /**
     * roomName만으로 생성하는 편의 생성자
     */
    public static RoomCreateRequest of(String roomName) {
        return new RoomCreateRequest(roomName, null, 100);
    }

    /**
     * 카테고리와 함께 생성하는 편의 생성자
     */
    public static RoomCreateRequest of(String roomName, String bigCategory) {
        return new RoomCreateRequest(roomName, bigCategory, 100);
    }

    /**
     * 모든 필드를 지정하는 생성자
     */
    public static RoomCreateRequest of(String roomName, String bigCategory, Integer maxParticipants) {
        return new RoomCreateRequest(roomName, bigCategory, maxParticipants);
    }
}