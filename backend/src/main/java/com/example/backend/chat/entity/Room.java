package com.example.backend.chat.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 채팅방 엔티티
 */
@Entity
@Table(name = "rooms")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "room_id")
    private Long id;

    @Column(name = "room_name", nullable = false, length = 100)
    private String roomName;

    @Column(name = "room_uuid", nullable = false, unique = true, length = 36)
    private String roomUuid; // 외부에서 사용하는 roomId

    @Column(name = "creator_id", nullable = false)
    private String creatorId; // 방 생성자

    @Column(name = "creator_username", nullable = false, length = 50)
    private String creatorUsername;

    @Column(name = "big_category", length = 20)
    private String bigCategory; // 상권업종대분류명 (소매, 음식, 교육 등)

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "max_participants")
    @Builder.Default
    private Integer maxParticipants = 1000; // 최대 참여자 수

    @Column(name = "current_participants")
    @Builder.Default
    private Integer currentParticipants = 0; // 현재 참여자 수

    @CreatedDate
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // 방 참여자 목록 (양방향 관계)
    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<RoomParticipant> participants = new ArrayList<>();

    /**
     * 참여자 수 증가
     */
    public void incrementParticipants() {
        this.currentParticipants++;
    }

    /**
     * 참여자 수 감소
     */
    public void decrementParticipants() {
        if (this.currentParticipants > 0) {
            this.currentParticipants--;
        }
    }

    /**
     * 방이 가득 찼는지 확인
     */
    public boolean isFull() {
        return this.currentParticipants >= this.maxParticipants;
    }

    /**
     * 방 비활성화
     */
    public void deactivate() {
        this.isActive = false;
    }
}