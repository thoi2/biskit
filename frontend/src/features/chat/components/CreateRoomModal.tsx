'use client';

import { useState } from 'react';
import { Button } from '@/lib/components/ui/button';
import { Input } from '@/lib/components/ui/input';
import { Label } from '@/lib/components/ui/label';
import { Select } from '@/lib/components/ui/select';
import { chatApi } from '../api/chatApi';
import { RoomCreateRequest } from '../types/chat';
import { BIG_CATEGORIES } from '@/constants/categories';
import { X } from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated: (roomId: string) => void;
  defaultCategory?: string;
}

export function CreateRoomModal({
  isOpen,
  onClose,
  onRoomCreated,
  defaultCategory
}: CreateRoomModalProps) {
  const [formData, setFormData] = useState<RoomCreateRequest>({
    roomName: '',
    bigCategory: defaultCategory || '',
    maxParticipants: 500
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.roomName.trim()) {
      setError('방 이름을 입력해주세요.');
      return;
    }

    if (formData.maxParticipants! < 2 || formData.maxParticipants! > 500) {
      setError('참여자 수는 2명 이상 500명 이하여야 합니다.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const room = await chatApi.createRoom(formData);
      onRoomCreated(room.roomId);
      onClose();

      // 폼 초기화
      setFormData({
        roomName: '',
        bigCategory: defaultCategory || '',
        maxParticipants: 500
      });
    } catch (err: any) {
      console.error('방 생성 실패:', err);
      setError(err.response?.data?.message || '방 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">새 채팅방 만들기</h2>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            className="p-1"
            disabled={isLoading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 방 이름 */}
          <div>
            <Label htmlFor="roomName">방 이름 *</Label>
            <Input
              id="roomName"
              type="text"
              value={formData.roomName}
              onChange={(e) =>
                setFormData({ ...formData, roomName: e.target.value })
              }
              placeholder="채팅방 이름을 입력하세요"
              maxLength={100}
              disabled={isLoading}
              required
            />
          </div>

          {/* 대분류 카테고리 */}
          <div>
            <Label htmlFor="bigCategory">업종 대분류 (선택)</Label>
            <select
              id="bigCategory"
              value={formData.bigCategory}
              onChange={(e) =>
                setFormData({ ...formData, bigCategory: e.target.value })
              }
              disabled={isLoading}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">카테고리를 선택하세요</option>
              {BIG_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              업종별 채팅방을 만들려면 대분류를 선택하세요
            </p>
          </div>

          {/* 최대 참여자 수 */}
          <div>
            <Label htmlFor="maxParticipants">최대 참여자 수 *</Label>
            <Input
              id="maxParticipants"
              type="number"
              value={formData.maxParticipants}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxParticipants: parseInt(e.target.value) || 500
                })
              }
              min={2}
              max={500}
              disabled={isLoading}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              2명 이상 500명 이하로 설정할 수 있습니다
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.roomName.trim()}
              className="flex-1"
            >
              {isLoading ? '생성 중...' : '방 만들기'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}