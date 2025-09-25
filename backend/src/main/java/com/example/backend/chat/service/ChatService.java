package com.example.backend.chat.service;

import com.example.backend.chat.dto.ChatMessage;
import com.example.backend.chat.dto.response.ChatHistoryResponse;
import com.example.backend.chat.dto.request.RoomCreateRequest;
import com.example.backend.chat.dto.response.RoomResponse;
import com.example.backend.chat.dto.response.RoomListResponse;
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
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;
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
    private final ChatBuilderService chatBuilderService;
    private final ShardManager shardManager;
    private final ShardedBroadcastService shardedBroadcastService;

    /**
     * 채팅 메시지 전송 처리
     */
    public ChatMessage sendMessage(String roomId, String content, SimpMessageHeaderAccessor headerAccessor) {
        JwtUserInfo userInfo = extractJwtUserInfo(headerAccessor);
        try {
            // 1. 메시지 객체 생성
            ChatMessage message = ChatMessage.createChatMessage(
                roomId,
                userInfo.userId(),
                userInfo.username(),
                userInfo.profileImageUrl(),
                content
            );
            enrichMessage(message, roomId, userInfo.username());

            // 2. 캐시 저장 및 비동기 저장 처리
            saveMessageToCacheAndAsync(roomId, message);

            log.debug("메시지 전송 처리 완료: {} by {} in {}",
                message.getContent(), message.getSenderId(), message.getSenderName(), roomId);

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

            // 3. 참여자 상태 관리 및 입장 메시지 생성 여부 확인
            boolean isNewJoin = handleRoomParticipation(room, userInfo);

            // 4. 사용자를 샤드에 할당
            addUserToShard(roomId, userInfo.userId());

            ChatMessage joinMessage = null;
            // 5. 새로 입장하거나 복귀하는 경우에만 입장 메시지 생성
            if (isNewJoin) {
                joinMessage = ChatMessage.createJoinMessage(
                    roomId,
                    userInfo.userId(),
                    userInfo.username(),
                    userInfo.profileImageUrl()
                );
                enrichMessage(joinMessage, roomId, userInfo.username());

                // 6. 캐시 저장 및 비동기 저장 처리
                saveMessageToCacheAndAsync(roomId, joinMessage);
            }

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
     * 임시 나가기는 참여자 상태를 유지하고 메시지도 전송하지 않음
     */
    @Transactional
    public void leaveRoom(String roomId, SimpMessageHeaderAccessor headerAccessor) {
        JwtUserInfo userInfo = extractJwtUserInfo(headerAccessor);
        try {
            // 1. 방 존재 여부 확인
            Room room = roomRepository.findByRoomUuidAndIsActiveTrue(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHAT_ROOM_LEAVE_FAILED, "존재하지 않는 채팅방입니다."));

            // 2. 참여자 확인 (임시 나가기는 참여자 상태를 유지)
            boolean isParticipant = roomParticipantRepository.existsActiveParticipant(roomId, userInfo.userId());
            if (!isParticipant) {
                log.warn("참여하지 않은 방에서 나가기 시도: {} from {}", userInfo.username(), roomId);
            }

            log.info("사용자 임시 방 나가기: {} ← {} (WebSocket 연결 끊김)", userInfo.username(), roomId);

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("방 나가기 처리 실패", e);
            throw new BusinessException(ErrorCode.CHAT_ROOM_LEAVE_FAILED, e);
        }
    }



    /**
     * 최근 메시지 조회 (REST API용)
     * 캐시 우선 조회 후, 캐시가 비어있으면 DB에서 조회
     */
    public List<ChatMessage> getRecentMessages(String roomId, int limit) {
        try {
            // 1. 캐시에서 먼저 조회
            List<ChatMessage> messages = chatCacheService.getRecentMessages(roomId);

            // 2. 캐시가 비어있으면 DB에서 조회
            if (messages.isEmpty()) {
                log.debug("캐시가 비어있음 - DB에서 최근 메시지 조회: {}", roomId);

                List<ChatMessageEntity> entities = chatMessageRepository.findRecentMessages(
                    roomId,
                    PageRequest.of(0, limit)
                );

                messages = entities.stream()
                    .map(this::convertEntityToDto)
                    .collect(Collectors.toList());

                // DB에서 가져온 메시지들을 캐시에 저장 (역순으로)
                List<ChatMessage> reversedMessages = new ArrayList<>(messages);
                Collections.reverse(reversedMessages);
                for (ChatMessage message : reversedMessages) {
                    chatCacheService.addMessage(roomId, message);
                }

                log.debug("DB에서 메시지 조회 후 캐시 저장: {} (방: {}, 개수: {})", "SUCCESS", roomId, messages.size());
            } else {
                // 3. 캐시에서 가져온 경우 limit 적용
                if (messages.size() > limit) {
                    messages = messages.subList(Math.max(0, messages.size() - limit), messages.size());
                }
                log.debug("캐시에서 메시지 조회: {} (방: {}, 개수: {})", "SUCCESS", roomId, messages.size());
            }

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
     * 메시지 정보 완성 (private 메서드)
     */
    private void enrichMessage(ChatMessage message, String roomId, String username) {
        if (message.getId() == null) {
            message.setId(UUID.randomUUID().toString());
        }

        if (message.getTimestamp() == null) {
            message.setTimestamp(LocalDateTime.now(ZoneId.of("Asia/Seoul")));
        }

        if (message.getRoomId() == null) {
            message.setRoomId(roomId);
        }

        if (message.getSenderName() == null) {
            message.setSenderName(username);
        }
    }

    /**
     * 새 참가자에게 히스토리 전송 (private 메서드)
     * 이전 메시지들을 리스트로 한 번에 전송하여 네트워크 효율성 향상
     */
    private void sendHistoryToUser(String roomId, String sessionId) {
        try {
            List<ChatMessage> recentMessages = chatCacheService.getRecentMessages(roomId);

            if (recentMessages.isEmpty()) {
                log.debug("전송할 히스토리 메시지가 없음: {}", roomId);
                return;
            }

            // 히스토리 메시지들을 HISTORY 타입으로 변환
            List<ChatMessage> historyMessages = recentMessages.stream()
                .map(msg -> ChatMessage.createHistoryMessage(
                    msg.getRoomId(),
                    msg.getSenderId(),
                    msg.getSenderName(),
                    msg.getProfileImageUrl(),
                    msg.getContent(),
                    msg.getTimestamp()
                ))
                .collect(Collectors.toList());

            // 히스토리 응답 객체 생성
            ChatHistoryResponse historyResponse = chatBuilderService.buildChatHistoryResponse(roomId, historyMessages, historyMessages.size());

            // 한 번에 리스트로 전송
            messagingTemplate.convertAndSendToUser(
                sessionId,
                "/queue/history",
                historyResponse
            );

            log.debug("히스토리 일괄 전송 완료: {}개 메시지 → {}", historyMessages.size(), sessionId);

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
            .senderId(entity.getSenderId())
            .senderName(entity.getSenderName())
            .profileImageUrl(entity.getProfileImageUrl())
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
                .bigCategory(request.bigCategory())
                .isActive(true)
                .maxParticipants(request.maxParticipants())
                .currentParticipants(1) // 생성자 포함
                .build();

            room = roomRepository.save(room);

            // 3. 생성자를 참여자로 추가
            RoomParticipant creator = chatBuilderService.buildRoomParticipant(room, userInfo);

            roomParticipantRepository.save(creator);

            log.info("채팅방 생성 완료: {} by {}", request.roomName(), userInfo.username());

            // 4. 응답 데이터 생성
            return chatBuilderService.buildRoomResponse(room);

        } catch (Exception e) {
            log.error("채팅방 생성 실패: {}", request.roomName(), e);
            throw new BusinessException(ErrorCode.CHAT_ROOM_JOIN_FAILED, e);
        }
    }

    /**
     * 카테고리별 채팅방 목록 조회 (참여 인원 많은 순)
     */
    /**
     * 카테고리별 채팅방 목록 조회 (페이징 지원)
     * 생성시간 내림차순 + 방 ID 오름차순으로 정렬하여 커서 기반 페이징
     */
    public RoomListResponse getRoomsByCategory(String bigCategory, int limit, String cursor) {
        try {
            // 커서 파싱 (형식: "2024-01-15T10:30:00.123_방ID" 또는 null)
            LocalDateTime cursorCreatedAt = null;
            Long cursorRoomId = null;

            if (cursor != null && cursor.contains("_")) {
                String[] parts = cursor.split("_", 2);
                cursorCreatedAt = LocalDateTime.parse(parts[0], DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                cursorRoomId = Long.parseLong(parts[1]);
            }

            List<Room> rooms;
            if (bigCategory == null || bigCategory.trim().isEmpty()) {
                // 카테고리가 없으면 모든 방 조회
                if (cursor == null) {
                    rooms = roomRepository.findByIsActiveTrueOrderByCreatedAtDescRoomIdAsc(PageRequest.of(0, limit + 1));
                } else {
                    rooms = roomRepository.findByIsActiveTrueAndCursorOrderByCreatedAtDescRoomIdAsc(
                        cursorCreatedAt, cursorRoomId, PageRequest.of(0, limit + 1));
                }
            } else {
                // 특정 카테고리 방 조회
                if (cursor == null) {
                    rooms = roomRepository.findByBigCategoryAndIsActiveTrueOrderByCreatedAtDescRoomIdAsc(
                        bigCategory, PageRequest.of(0, limit + 1));
                } else {
                    rooms = roomRepository.findByBigCategoryAndIsActiveTrueAndCursorOrderByCreatedAtDescRoomIdAsc(
                        bigCategory, cursorCreatedAt, cursorRoomId, PageRequest.of(0, limit + 1));
                }
            }

            // hasMore 체크 및 다음 커서 생성
            boolean hasMore = rooms.size() > limit;
            if (hasMore) {
                rooms = rooms.subList(0, limit); // 실제 데이터는 limit만큼만
            }

            String nextCursor = null;
            if (hasMore && !rooms.isEmpty()) {
                Room lastRoom = rooms.get(rooms.size() - 1);
                // 생성시간을 ISO_LOCAL_DATE_TIME 형식으로 직렬화
                String createdAtStr = lastRoom.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                nextCursor = createdAtStr + "_" + lastRoom.getId();
            }

            // DTO 변환 (생성시간 순으로 정렬되어 있지만, 프론트에서 참여자 수로 정렬 표시 가능)
            List<RoomResponse> roomResponses = rooms.stream()
                .filter(room -> room.getCurrentParticipants() > 0) // 참여 인원이 0명인 방 제외
                .map(chatBuilderService::buildRoomResponse)
                .toList();

            return RoomListResponse.builder()
                .rooms(roomResponses)
                .nextCursor(nextCursor)
                .hasMore(hasMore)
                .totalCount(roomResponses.size()) // 실제로는 전체 카운트 쿼리가 필요하지만 일단 현재 페이지 크기
                .build();

        } catch (Exception e) {
            log.error("카테고리별 방 목록 조회 실패. 카테고리: {}, 커서: {}", bigCategory, cursor, e);
            throw new BusinessException(ErrorCode.COMMON_INTERNAL_SERVER_ERROR, "방 목록 조회에 실패했습니다.");
        }
    }

    public List<RoomResponse> getRoomsByCategory(String bigCategory) {
        try {
            List<Room> rooms;
            if (bigCategory == null || bigCategory.trim().isEmpty()) {
                // 카테고리가 없으면 모든 방 조회
                rooms = roomRepository.findByIsActiveTrueOrderByParticipantsDesc();
            } else {
                // 특정 카테고리 방 조회
                rooms = roomRepository.findByBigCategoryAndIsActiveTrueOrderByParticipantsDesc(bigCategory);
            }

            return rooms.stream()
                .filter(room -> room.getCurrentParticipants() > 0) // 참여 인원이 0명인 방 제외
                .map(room -> {
                    int messageCount = chatCacheService.getRecentMessages(room.getRoomUuid()).size();
                    return chatBuilderService.buildRoomResponseWithMessageCount(room, messageCount);
                })
                .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("카테고리별 방 목록 조회 실패: {}", bigCategory, e);
            throw new BusinessException(ErrorCode.CHAT_ROOM_INFO_FAILED, e);
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
                    int messageCount = chatCacheService.getRecentMessages(room.getRoomUuid()).size();
                    return chatBuilderService.buildRoomResponseWithMessageCount(room, messageCount);
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
                .map(chatBuilderService::buildParticipantResponse)
                .collect(Collectors.toList());

            // 4. 최근 메시지 정보 조회
            int messageCount = chatCacheService.getRecentMessages(roomId).size();

            // 5. RoomResponse 생성
            RoomResponse response = chatBuilderService.buildDetailedRoomResponse(room, messageCount, participantList);

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
            ChatMessage leaveMessage = ChatMessage.createLeaveMessage(
                roomId,
                userInfo.userId(),
                userInfo.username(),
                userInfo.profileImageUrl()
            );
            enrichMessage(leaveMessage, roomId, userInfo.username());

            // 5. 캐시 저장 및 비동기 저장 처리
            saveMessageToCacheAndAsync(roomId, leaveMessage);

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
     * @return true면 입장 메시지 표시 필요, false면 불필요 (재입장)
     */
    private boolean handleRoomParticipation(Room room, JwtUserInfo userInfo) {
        // 1. 기존 참여자 정보 조회
        Optional<RoomParticipant> existingParticipant = roomParticipantRepository
            .findByRoomUuidAndUserId(room.getRoomUuid(), userInfo.userId());

        if (existingParticipant.isPresent()) {
            RoomParticipant participant = existingParticipant.get();

            if (participant.getIsActive()) {
                // 이미 활성 참여자인 경우 (재입장) - 입장 메시지 불필요
                log.debug("기존 활성 참여자 재입장: {} in {}", userInfo.username(), room.getRoomUuid());
                return false;
            } else {
                // 비활성 참여자 재활성화 (복귀) - 입장 메시지 필요
                participant.rejoin();
                roomParticipantRepository.save(participant);

                // 방 참여자 수 증가
                room.incrementParticipants();
                roomRepository.save(room);

                log.info("참여자 복귀: {} in {} (참여자: {}명)",
                    userInfo.username(), room.getRoomUuid(), room.getCurrentParticipants());
                return true;
            }
        } else {
            // 새로운 참여자 추가 - 입장 메시지 필요
            RoomParticipant newParticipant = chatBuilderService.buildRoomParticipant(room, userInfo);

            roomParticipantRepository.save(newParticipant);

            // 방 참여자 수 증가
            room.incrementParticipants();
            roomRepository.save(room);

            log.info("새 참여자 추가: {} in {} (참여자: {}명)",
                userInfo.username(), room.getRoomUuid(), room.getCurrentParticipants());
            return true;
        }
    }

    // ========== 헬퍼 메서드들 ==========

    /**
     * 메시지 캐시 저장 및 비동기 저장 처리
     */
    private void saveMessageToCacheAndAsync(String roomId, ChatMessage message) {
        chatCacheService.addMessage(roomId, message);
        asyncBatchChatService.saveMessageAsync(message);

        // 샤딩 브로드캐스트 (실제 채팅에서도 적용)
        shardedBroadcastService.broadcastToAllShards(roomId, message);
    }

    /**
     * 테스트용 메시지 저장 메서드 (JWT 검증 없이 실제 로직 수행)
     */
    public void saveMessageToCacheAndAsyncForTest(String roomId, ChatMessage message) {
        enrichMessage(message, roomId, message.getSenderName());
        saveMessageToCacheAndAsync(roomId, message);

        // 샤딩 브로드캐스트 추가
        shardedBroadcastService.broadcastToAllShards(roomId, message);
    }

    /**
     * 사용자 샤드 할당 (방 입장 시)
     */
    public void addUserToShard(String roomId, String userId) {
        shardManager.addUserToShard(roomId, userId);
    }
}