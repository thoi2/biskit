import Button from '@/components/ui/Button/Button'
import { Sparkles } from "lucide-react"

interface GuestModeNoticeProps {
  onLogin: () => void
}

export function GuestModeNotice({ onLogin }: GuestModeNoticeProps) {
  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-orange-200 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <Sparkles className="w-5 h-5 text-orange-600" />
        <p className="font-semibold text-orange-900">게스트 모드</p>
      </div>
      <p className="text-sm text-orange-700 mb-4">
        모든 기능을 이용할 수 있습니다. 로그인하면 찜과 검색기록을 저장할 수 있어요!
      </p>
      <Button
        onClick={onLogin}
        size="sm"
        className="w-full bg-amber-600 hover:bg-orange-700 text-white shadow-sm"
      >
        로그인하고 더 많은 기능 이용하기
      </Button>
    </div>
  )
}