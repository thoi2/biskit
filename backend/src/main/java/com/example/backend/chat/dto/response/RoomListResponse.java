package com.example.backend.chat.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * 채팅방 목록 응답 DTO (페이징 포함)
 */
@Getter
@Builder
public class RoomListResponse {
    private final List<RoomResponse> rooms;
    private final String nextCursor;
    private final boolean hasMore;
    private final int totalCount;
}