// components/LoadingAndError.tsx

interface LoadingAndErrorProps {
    isLoading: boolean;
    loadError: string | null;
}

export function LoadingAndError({ isLoading, loadError }: LoadingAndErrorProps) {
    if (isLoading) {
        return (
            <div className="relative w-full h-full">
            <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <div className="text-gray-600">카카오맵을 불러오는 중...</div>
        </div>
        </div>
        </div>
    );
    }

    if (loadError) {
        return (
            <div className="relative w-full h-full">
            <div className="w-full h-full bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
            <div className="text-center p-4">
            <div className="text-red-600 mb-2">⚠️ {loadError}</div>
        <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
            새로고침
            </button>
            </div>
            </div>
            </div>
    );
    }

    return null;
}
