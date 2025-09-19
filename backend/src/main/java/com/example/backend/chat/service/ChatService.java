package com.example.backend.chat.service;

import com.example.backend.chat.dto.ChatMessage;
import com.example.backend.chat.dto.RoomCreateRequest;
import com.example.backend.chat.dto.RoomResponse;
import com.example.backend.chat.entity.ChatMessageEntity;
import com.example.backend.chat.entity.Room;
import com.example.backend.chat.entity.RoomParticipant;
import com.example.backend.chat.repository.ChatMessageRepository;
import com.example.backend.chat.repository.RoomRepository;
import com.example.backend.chat.repository.RoomParticipantRepository;
import com.example.backend.common.security.authentication.jwt.JwtUserInfo;
import com.example.backend.common.exception.BusinessException;
import com.example.backend.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 채팅 도메인의 비즈니스 로직을 담당하는 서비스
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final AsyncBatchChatService asyncBatchChatService;
    private final ChatCacheService chatCacheService;
    private final ChatMessageRepository chatMessageRepository;
    private final RoomRepository roomRepository;
    private final RoomParticipantRepository roomParticipantRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * 채팅 메시지 전송 처리
     */
    public ChatMessage sendMessage(String roomId, ChatMessage message, SimpMessageHeaderAccessor headerAccessor) {
        JwtUserInfo userInfo = extractJwtUserInfo(headerAccessor);
        try {
            // 1. 메시지 정보 완성
            enrichMessage(message, roomId, userInfo.username());

            // 2. 즉시 캐시에 저장 (실시간 응답 보장)
            chatCacheService.addMessage(roomId, message);

            // 3. 비동기 배치 저장 큐에 추가 (성능 최적화)
            asyncBatchChatService.saveMessageAsync(message);

            log.debug("메시지 전송 처리 완료: {} by {} in {}",
                message.getContent(), message.getSender(), roomId);

            return message;

        } catch (Exception e) {
            log.error("메시지 전송 처리 실패", e);
            throw new BusinessException(ErrorCode.CHAT_MESSAGE_SEND_FAILED, e);
        }
    }

    /**
     * 방 입장 처리 (참여자 관리 포함)
     */
    @Transactional
    public ChatMessage joinRoom(String roomId, SimpMessageHeaderAccessor headerAccessor) {
        JwtUserInfo userInfo = extractJwtUserInfo(headerAccessor);
        String sessionId = headerAccessor.getSessionId();
        try {
            // 1. 방 존재 여부 확인
            Room room = roomRepository.findByRoomUuidAndIsActiveTrue(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHAT_ROOM_JOIN_FAILED, "존재하지 않는 채팅방입니다."));

            // 2. 방이 가득 찼는지 확인
            if (room.isFull()) {
                throw new BusinessException(ErrorCode.CHAT_ROOM_JOIN_FAILED, "채팅방이 가득 찼습니다.");
            }

            // 3. 참여자 상태 관리
            handleRoomParticipation(room, userInfo);

            // 4. 입장 메시지 생성
            ChatMessage joinMessage = ChatMessage.createJoinMessage(roomId, userInfo.username());
            enrichMessage(joinMessage, roomId, userInfo.username());

            // 5. 캐시에 저장
            chatCacheService.addMessage(roomId, joinMessage);

            // 6. 비동기 저장
            asyncBatchChatService.saveMessageAsync(joinMessage);

            // 7. 새 참가자에게 최근 메시지 히스토리 전송
            sendHistoryToUser(roomId, sessionId);

            log.info("사용자 방 입장: {} → {} (참여자: {}명)", userInfo.username(), roomId, room.getCurrentParticipants());

            return joinMessage;

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("방 입장 처리 실패", e);
            throw new BusinessException(ErrorCode.CHAT_ROOM_JOIN_FAILED, e);
        }
    }

    /**
     * 방 나가기 처리 (임시 나가기 - WebSocket 연결 끊김 등)
     */
    @Transactional
    public ChatMessage leaveRoom(String roomId, SimpMessageHeaderAccessor headerAccessor) {
        JwtUserInfo userInfo = extractJwtUserInfo(headerAccessor);
        try {
            // 1. 방 존재 여부 확인
            Room room = roomRepository.findByRoomUuidAndIsActiveTrue(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHAT_ROOM_LEAVE_FAILED, "존재하지 않는 채팅방입니다."));

            // 2. 참여자 확인 (임시 나가기는 참여자 상태를 유지)
            boolean isParticipant = roomParticipantRepository.existsActiveParticipant(roomId, userInfo.userId());
            if (!isParticipant) {
                log.warn("참여하지 않은 방에서 나가기 시도: {} from {}", userInfo.username(), roomId);
                // 에러를 던지지 않고 메시지만 생성
            }

            // 3. 나가기 메시지 생성
            ChatMessage leaveMessage = ChatMessage.createLeaveMessage(roomId, userInfo.username());
            enrichMessage(leaveMessage, roomId, userInfo.username());

            // 4. 캐시에 저장
            chatCacheService.addMessage(roomId, leaveMessage);

            // 5. 비동기 저장
            asyncBatchChatService.saveMessageAsync(leaveMessage);

            log.info("사용자 임시 방 나가기: {} ← {} (WebSocket 연결 끊김)", userInfo.username(), roomId);

            return leaveMessage;

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("방 나가기 처리 실패", e);
            throw new BusinessException(ErrorCode.CHAT_ROOM_LEAVE_FAILED, e);
        }
    }



    /**
     * 최근 메시지 조회 (REST API용)
     */
    public List<ChatMessage> getRecentMessages(String roomId, int limit) {
        try {
            List<ChatMessage> messages = chatCacheService.getRecentMessages(roomId);

            // limit 적용
            if (messages.size() > limit) {
                messages = messages.subList(Math.max(0, messages.size() - limit), messages.size());
            }

            log.debug("최근 메시지 조회: {} (방: {}, 개수: {})", "SUCCESS", roomId, messages.size());

            return messages;

        } catch (Exception e) {
            log.error("최근 메시지 조회 실패 - 방: {}", roomId, e);
            throw new BusinessException(ErrorCode.CHAT_MESSAGE_HISTORY_FAILED, e);
        }
    }

    /**
     * 무한 스크롤용 이전 메시지 조회
     */
    public List<ChatMessage> getMessagesBefore(String roomId, String cursor, int limit) {
        try {
            // 메시지 ID를 Long으로 변환 (DB auto increment ID 가정)
            Long beforeId = Long.parseLong(cursor);

            List<ChatMessage> messages = chatMessageRepository
                .findMessagesBeforeId(roomId, beforeId, PageRequest.of(0, limit))
                .stream()
                .map(this::convertEntityToDto)
                .collect(Collectors.toList());

            log.debug("이전 메시지 조회: {} (방: {}, beforeId: {}, 개수: {})",
                "SUCCESS", roomId, beforeId, messages.size());

            return messages;

        } catch (NumberFormatException e) {
            log.warn("잘못된 메시지 ID 형식: {}", cursor);
            throw new BusinessException(ErrorCode.COMMON_INVALID_INPUT, e);
        } catch (Exception e) {
            log.error("이전 메시지 조회 실패 - 방: {}, beforeId: {}", roomId, cursor, e);
            throw new BusinessException(ErrorCode.CHAT_MESSAGE_HISTORY_FAILED, e);
        }
    }

    /**
     * 특정 기간의 메시지 조회 (문자열 날짜 버전)
     */
    public List<ChatMessage> getMessagesByPeriod(String roomId, String startTime, String endTime) {
        LocalDateTime start = LocalDateTime.parse(startTime);
        LocalDateTime end = LocalDateTime.parse(endTime);
        return getMessagesByPeriod(roomId, start, end);
    }

    /**
     * 특정 기간의 메시지 조회
     */
    public List<ChatMessage> getMessagesByPeriod(String roomId, LocalDateTime startTime, LocalDateTime endTime) {
        try {
            List<ChatMessage> messages = chatMessageRepository
                .findMessagesBetween(roomId, startTime, endTime)
                .stream()
                .map(this::convertEntityToDto)
                .collect(Collectors.toList());

            log.debug("기간별 메시지 조회: {} (방: {}, 기간: {} ~ {}, 개수: {})",
                "SUCCESS", roomId, startTime, endTime, messages.size());

            return messages;

        } catch (Exception e) {
            log.error("기간별 메시지 조회 실패 - 방: {}", roomId, e);
            throw new BusinessException(ErrorCode.CHAT_MESSAGE_HISTORY_FAILED, e);
        }
    }

    /**
     * 메시지 정보 완성 (private 메서드)
     */
    private void enrichMessage(ChatMessage message, String roomId, String username) {
        if (message.getId() == null) {
            message.setId(UUID.randomUUID().toString());
        }

        if (message.getTimestamp() == null) {
            message.setTimestamp(LocalDateTime.now());
        }

        if (message.getRoomId() == null) {
            message.setRoomId(roomId);
        }

        if (message.getSender() == null) {
            message.setSender(username);
        }
    }

    /**
     * 새 참가자에게 히스토리 전송 (private 메서드)
     */
    private void sendHistoryToUser(String roomId, String sessionId) {
        try {
            List<ChatMessage> recentMessages = chatCacheService.getRecentMessages(roomId);

            // 히스토리 메시지들을 개별적으로 전송
            for (ChatMessage msg : recentMessages) {
                ChatMessage historyMessage = ChatMessage.createHistoryMessage(
                    msg.getRoomId(),
                    msg.getSender(),
                    msg.getContent(),
                    msg.getTimestamp()
                );

                messagingTemplate.convertAndSendToUser(
                    sessionId,
                    "/queue/history",
                    historyMessage
                );
            }

            log.debug("히스토리 전송 완료: {}개 메시지 → {}", recentMessages.size(), sessionId);

        } catch (Exception e) {
            log.error("히스토리 전송 실패", e);
        }
    }

    /**
     * 에러 메시지 생성
     */
    public ChatMessage createErrorMessage(SimpMessageHeaderAccessor headerAccessor, Exception exception) {
        try {
            JwtUserInfo userInfo = extractJwtUserInfo(headerAccessor);
            String username = userInfo.username();

            log.error("STOMP 메시지 처리 중 예외 발생", exception);
            String errorMessage = username + "님의 메시지 처리 중 오류가 발생했습니다: " + exception.getMessage();
            return ChatMessage.createErrorMessage(null, errorMessage);

        } catch (BusinessException e) {
            // 인증되지 않은 사용자의 경우 기본 에러 메시지
            log.error("STOMP 메시지 처리 중 예외 발생", exception);
            String errorMessage = "Guest님의 메시지 처리 중 오류가 발생했습니다: " + exception.getMessage();
            return ChatMessage.createErrorMessage(null, errorMessage);
        }
    }

    /**
     * 헤더에서 JwtUserInfo 추출
     */
    private JwtUserInfo extractJwtUserInfo(SimpMessageHeaderAccessor headerAccessor) {
        // 세션 속성에서 JwtUserInfo 가져오기
        JwtUserInfo userInfo = (JwtUserInfo) headerAccessor.getSessionAttributes().get("jwtUserInfo");

        if (userInfo == null) {
            // 인증되지 않은 사용자 처리
            String sessionId = headerAccessor.getSessionId();
            String guestUsername = "Guest_" + sessionId.substring(0, 8);
            log.warn("채팅 인증 실패: {}", guestUsername);

            throw new BusinessException(ErrorCode.CHAT_USER_NOT_AUTHENTICATED);
        }

        return userInfo;
    }

    /**
     * ChatMessageEntity를 ChatMessage DTO로 변환
     */
    private ChatMessage convertEntityToDto(ChatMessageEntity entity) {
        return ChatMessage.builder()
            .id(entity.getMessageId())
            .type(entity.getMessageType())
            .roomId(entity.getRoomId())
            .sender(entity.getSender())
            .content(entity.getContent())
            .timestamp(entity.getCreatedAt())
            .build();
    }

    // ========== 방 관리 메서드들 ==========

    /**
     * 채팅방 생성
     */
    @Transactional
    public RoomResponse createRoom(RoomCreateRequest request, JwtUserInfo userInfo) {
        try {
            // 1. 고유한 roomUuid 생성
            String roomUuid;
            do {
                roomUuid = UUID.randomUUID().toString();
            } while (roomRepository.existsByRoomUuid(roomUuid));

            // 2. 방 생성
            Room room = Room.builder()
                .roomName(request.roomName())
                .roomUuid(roomUuid)
                .creatorId(userInfo.userId())
                .creatorUsername(userInfo.username())
                .isActive(true)
                .maxParticipants(request.maxParticipants())
                .currentParticipants(1) // 생성자 포함
                .build();

            room = roomRepository.save(room);

            // 3. 생성자를 참여자로 추가
            RoomParticipant creator = RoomParticipant.builder()
                .room(room)
                .userId(userInfo.userId())
                .username(userInfo.username())
                .isActive(true)
                .build();

            roomParticipantRepository.save(creator);

            log.info("채팅방 생성 완료: {} by {}", request.roomName(), userInfo.username());

            // 4. 응답 데이터 생성
            return RoomResponse.builder()
                .roomId(room.getRoomUuid())
                .roomName(room.getRoomName())
                .creatorId(room.getCreatorId())
                .creatorUsername(room.getCreatorUsername())
                .maxParticipants(room.getMaxParticipants())
                .currentParticipants(room.getCurrentParticipants())
                .isActive(room.getIsActive())
                .createdAt(room.getCreatedAt())
                .updatedAt(room.getUpdatedAt())
                .build();

        } catch (Exception e) {
            log.error("채팅방 생성 실패: {}", request.roomName(), e);
            throw new BusinessException(ErrorCode.CHAT_ROOM_JOIN_FAILED, e);
        }
    }

    /**
     * 사용자의 채팅방 목록 조회
     */
    public List<RoomResponse> getUserRooms(JwtUserInfo userInfo) {
        try {
            List<Room> rooms = roomRepository.findUserActiveRooms(userInfo.userId());

            return rooms.stream()
                .map(room -> {
                    // 최근 메시지 수 조회
                    List<ChatMessage> recentMessages = chatCacheService.getRecentMessages(room.getRoomUuid());

                    return RoomResponse.builder()
                        .roomId(room.getRoomUuid())
                        .roomName(room.getRoomName())
                        .creatorId(room.getCreatorId())
                        .creatorUsername(room.getCreatorUsername())
                        .maxParticipants(room.getMaxParticipants())
                        .currentParticipants(room.getCurrentParticipants())
                        .isActive(room.getIsActive())
                        .createdAt(room.getCreatedAt())
                        .updatedAt(room.getUpdatedAt())
                        .recentMessageCount(recentMessages.size())
                        .build();
                })
                .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("사용자 방 목록 조회 실패: {}", userInfo.username(), e);
            throw new BusinessException(ErrorCode.CHAT_ROOM_INFO_FAILED, e);
        }
    }

    /**
     * 채팅방 상세 정보 조회
     */
    public RoomResponse getRoomDetails(String roomId, JwtUserInfo userInfo) {
        try {
            // 1. 방 존재 여부 확인
            Room room = roomRepository.findByRoomUuidAndIsActiveTrue(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHAT_ROOM_INFO_FAILED, "존재하지 않는 채팅방입니다."));

            // 2. 사용자가 참여중인지 확인
            boolean isParticipant = roomParticipantRepository.existsActiveParticipant(roomId, userInfo.userId());
            if (!isParticipant) {
                throw new BusinessException(ErrorCode.CHAT_USER_NOT_AUTHENTICATED, "채팅방에 참여하지 않은 사용자입니다.");
            }

            // 3. 참여자 목록 조회
            List<RoomParticipant> participants = roomParticipantRepository.findActiveParticipantsByRoomUuid(roomId);
            List<RoomResponse.ParticipantResponse> participantList = participants.stream()
                .map(p -> RoomResponse.ParticipantResponse.builder()
                    .userId(p.getUserId())
                    .username(p.getUsername())
                    .isActive(p.getIsActive())
                    .joinedAt(p.getJoinedAt())
                    .leftAt(p.getLeftAt())
                    .build())
                .collect(Collectors.toList());

            // 4. 최근 메시지 정보 조회
            List<ChatMessage> recentMessages = chatCacheService.getRecentMessages(roomId);

            // 5. RoomResponse 생성
            RoomResponse response = RoomResponse.builder()
                .roomId(room.getRoomUuid())
                .roomName(room.getRoomName())
                .creatorId(room.getCreatorId())
                .creatorUsername(room.getCreatorUsername())
                .maxParticipants(room.getMaxParticipants())
                .currentParticipants(room.getCurrentParticipants())
                .isActive(room.getIsActive())
                .createdAt(room.getCreatedAt())
                .updatedAt(room.getUpdatedAt())
                .recentMessageCount(recentMessages.size())
                .participants(participantList)
                .build();

            log.debug("방 상세 정보 조회 완료: {} for {}", roomId, userInfo.username());

            return response;

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("방 상세 정보 조회 실패: {} for {}", roomId, userInfo.username(), e);
            throw new BusinessException(ErrorCode.CHAT_ROOM_INFO_FAILED, e);
        }
    }

    /**
     * 채팅방 영구 나가기 (REST API용)
     */
    @Transactional
    public void leaveRoomPermanently(String roomId, JwtUserInfo userInfo) {
        try {
            // 1. 방 존재 여부 확인
            Room room = roomRepository.findByRoomUuidAndIsActiveTrue(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHAT_ROOM_INFO_FAILED, "존재하지 않는 채팅방입니다."));

            // 2. 참여자 상태 비활성화
            int updatedCount = roomParticipantRepository.deactivateParticipant(roomId, userInfo.userId());
            if (updatedCount == 0) {
                throw new BusinessException(ErrorCode.CHAT_USER_NOT_AUTHENTICATED, "채팅방에 참여하지 않은 사용자입니다.");
            }

            // 3. 방 참여자 수 감소
            room.decrementParticipants();
            roomRepository.save(room);

            // 4. 방이 비었으면 캐시 정리
            if (room.getCurrentParticipants() == 0) {
                chatCacheService.cleanupInactiveRoomCache(roomId);
            }

            // 5. 방 나가기 메시지 전송 (실시간 알림)
            ChatMessage leaveMessage = ChatMessage.createLeaveMessage(roomId, userInfo.username());
            enrichMessage(leaveMessage, roomId, userInfo.username());

            // 5. 캐시에 저장 및 비동기 저장
            chatCacheService.addMessage(roomId, leaveMessage);
            asyncBatchChatService.saveMessageAsync(leaveMessage);

            log.info("사용자 방 영구 나가기 완료: {} ← {}", userInfo.username(), roomId);

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("방 나가기 처리 실패: {} for {}", roomId, userInfo.username(), e);
            throw new BusinessException(ErrorCode.CHAT_ROOM_LEAVE_FAILED, e);
        }
    }

    // ========== 참여자 관리 헬퍼 메서드들 ==========

    /**
     * 방 참여자 상태 관리 (입장 시)
     */
    private void handleRoomParticipation(Room room, JwtUserInfo userInfo) {
        // 1. 기존 참여자 정보 조회
        Optional<RoomParticipant> existingParticipant = roomParticipantRepository
            .findByRoomUuidAndUserId(room.getRoomUuid(), userInfo.userId());

        if (existingParticipant.isPresent()) {
            RoomParticipant participant = existingParticipant.get();

            if (participant.getIsActive()) {
                // 이미 활성 참여자인 경우 (재입장)
                log.debug("기존 활성 참여자 재입장: {} in {}", userInfo.username(), room.getRoomUuid());
            } else {
                // 비활성 참여자 재활성화 (복귀)
                participant.rejoin();
                roomParticipantRepository.save(participant);

                // 방 참여자 수 증가
                room.incrementParticipants();
                roomRepository.save(room);

                log.info("참여자 복귀: {} in {} (참여자: {}명)",
                    userInfo.username(), room.getRoomUuid(), room.getCurrentParticipants());
            }
        } else {
            // 새로운 참여자 추가
            RoomParticipant newParticipant = RoomParticipant.builder()
                .room(room)
                .userId(userInfo.userId())
                .username(userInfo.username())
                .isActive(true)
                .build();

            roomParticipantRepository.save(newParticipant);

            // 방 참여자 수 증가
            room.incrementParticipants();
            roomRepository.save(room);

            log.info("새 참여자 추가: {} in {} (참여자: {}명)",
                userInfo.username(), room.getRoomUuid(), room.getCurrentParticipants());
        }
    }
}