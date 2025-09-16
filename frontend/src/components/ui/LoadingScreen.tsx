export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-white font-bold text-2xl">🍪</span>
        </div>
        <div className="space-y-2">
          <div className="w-32 h-2 bg-orange-200 rounded-full mx-auto overflow-hidden">
            <div className="w-full h-full bg-amber-600 animate-pulse"></div>
          </div>
          <p className="text-orange-800 font-medium">맛있는 비즈킷을 준비하고 있습니다...</p>
        </div>
      </div>
    </div>
  )
}