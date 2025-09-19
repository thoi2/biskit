package com.example.backend.chat.controller;

import com.example.backend.chat.dto.ChatMessage;
import com.example.backend.chat.dto.RoomCreateRequest;
import com.example.backend.chat.dto.RoomResponse;
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
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Slf4j
public class ChatRestController {

    private final ChatService chatService;

    /**
     * 방의 최근 메시지 조회
     */
    @GetMapping("/rooms/{roomId}/messages")
    public ApiResponse<List<ChatMessage>> getRecentMessages(
        @PathVariable String roomId,
        @RequestParam(defaultValue = "50") int limit) {

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

        List<ChatMessage> messages = chatService.getMessagesBefore(roomId, cursor, limit);
        return ApiResponse.of(messages);
    }

    /**
     * 특정 기간의 메시지 조회
     */
    @GetMapping("/rooms/{roomId}/messages/period")
    public ApiResponse<List<ChatMessage>> getMessagesByPeriod(
        @PathVariable String roomId,
        @RequestParam String startTime,
        @RequestParam String endTime) {

        List<ChatMessage> messages = chatService.getMessagesByPeriod(roomId, startTime, endTime);
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
     * 채팅방 목록 조회
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