package com.example.backend.chat.controller;

import com.example.backend.chat.dto.ChatMessage;
import com.example.backend.chat.dto.request.RoomCreateRequest;
import com.example.backend.chat.dto.response.RoomResponse;
import com.example.backend.chat.dto.response.RoomListResponse;
import com.example.backend.chat.service.ChatService;
import com.example.backend.common.response.ApiResponse;
import com.example.backend.common.security.authentication.jwt.JwtUserInfo;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"}, allowCredentials = "true")
public class ChatRestController {

    private final ChatService chatService;

    /**
     * 방의 최근 메시지 조회
     */
    @GetMapping("/rooms/{roomId}/messages")
    public ApiResponse<List<ChatMessage>> getRecentMessages(
        @PathVariable String roomId,
        @RequestParam(defaultValue = "50") int limit) {

        // 입력 값 검증
        if (roomId == null || roomId.trim().isEmpty()) {
            throw new IllegalArgumentException("방 ID는 필수입니다.");
        }

        if (limit <= 0 || limit > 100) {
            throw new IllegalArgumentException("조회 개수는 1~100 사이여야 합니다.");
        }

        List<ChatMessage> messages = chatService.getRecentMessages(roomId, limit);
        return ApiResponse.of(messages);
    }

    /**
     * 무한 스크롤용 이전 메시지 조회
     */
    @GetMapping("/rooms/{roomId}/messages/before")
    public ApiResponse<List<ChatMessage>> getMessagesBefore(
        @PathVariable String roomId,
        @RequestParam String cursor,
        @RequestParam(defaultValue = "50") int limit) {

        // 입력 값 검증
        if (roomId == null || roomId.trim().isEmpty()) {
            throw new IllegalArgumentException("방 ID는 필수입니다.");
        }

        if (cursor == null || cursor.trim().isEmpty()) {
            throw new IllegalArgumentException("커서는 필수입니다.");
        }

        if (limit <= 0 || limit > 100) {
            throw new IllegalArgumentException("조회 개수는 1~100 사이여야 합니다.");
        }

        List<ChatMessage> messages = chatService.getMessagesBefore(roomId, cursor, limit);
        return ApiResponse.of(messages);
    }


    /**
     * 채팅방 생성
     */
    @PostMapping("/rooms")
    public ApiResponse<RoomResponse> createRoom(
        @Valid @RequestBody RoomCreateRequest request,
        @AuthenticationPrincipal JwtUserInfo userInfo) {

        RoomResponse room = chatService.createRoom(request, userInfo);
        return ApiResponse.of(room);
    }

    /**
     * 카테고리별 채팅방 목록 조회 (참여 인원 많은 순, 페이징 지원)
     */
    @GetMapping("/rooms/public")
    public ApiResponse<RoomListResponse> getPublicRooms(
        @RequestParam(required = false) String bigCategory,
        @RequestParam(defaultValue = "20") int limit,
        @RequestParam(required = false) String cursor) {

        // 입력 값 검증
        if (limit <= 0 || limit > 100) {
            throw new IllegalArgumentException("조회 개수는 1~100 사이여야 합니다.");
        }

        RoomListResponse roomList = chatService.getRoomsByCategory(bigCategory, limit, cursor);
        return ApiResponse.of(roomList);
    }

    /**
     * 내가 참여한 채팅방 목록 조회
     */
    @GetMapping("/rooms")
    public ApiResponse<List<RoomResponse>> getRooms(
        @AuthenticationPrincipal JwtUserInfo userInfo) {

        List<RoomResponse> rooms = chatService.getUserRooms(userInfo);
        return ApiResponse.of(rooms);
    }

    /**
     * 채팅방 정보 조회
     */
    @GetMapping("/rooms/{roomId}")
    public ApiResponse<RoomResponse> getRoomInfo(
        @PathVariable String roomId,
        @AuthenticationPrincipal JwtUserInfo userInfo) {

        RoomResponse roomInfo = chatService.getRoomDetails(roomId, userInfo);
        return ApiResponse.of(roomInfo);
    }

    /**
     * 채팅방 나가기
     */
    @DeleteMapping("/rooms/{roomId}/leave")
    public ApiResponse<String> leaveRoom(
        @PathVariable String roomId,
        @AuthenticationPrincipal JwtUserInfo userInfo) {

        chatService.leaveRoomPermanently(roomId, userInfo);
        return ApiResponse.of("채팅방에서 나갔습니다.");
    }
}