// 검색 기록을 저장하는 유틸리티 함수들

interface SearchHistoryParams {
  search_type: string
  search_params: Record<string, unknown>
}

export function saveSearchHistory(params: SearchHistoryParams) {
  // 실제로는 API 호출해야 하지만 현재는 로컬스토리지에 저장
  try {
    const existingHistory = getSearchHistory()
    const newEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...params
    }
    
    const updatedHistory = [newEntry, ...existingHistory.slice(0, 19)] // 최대 20개 저장
    localStorage.setItem('search_history', JSON.stringify(updatedHistory))
  } catch (error) {
    console.error('Failed to save search history:', error)
  }
}

export function getSearchHistory() {
  try {
    const history = localStorage.getItem('search_history')
    return history ? JSON.parse(history) : []
  } catch (error) {
    console.error('Failed to get search history:', error)
    return []
  }
}

export function clearSearchHistory() {
  try {
    localStorage.removeItem('search_history')
  } catch (error) {
    console.error('Failed to clear search history:', error)
  }
}