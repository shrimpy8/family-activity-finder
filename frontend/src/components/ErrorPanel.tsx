interface ErrorPanelProps {
  error: string;
  onDismiss: () => void;
  dismissLabel?: string;
}

export function ErrorPanel({ error, onDismiss, dismissLabel = 'Dismiss' }: ErrorPanelProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-12 text-center border-2 border-red-200 mb-6">
      <div className="text-6xl mb-4">⚠️</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Recommendations</h3>
      <p className="text-red-600 mb-4">{error}</p>
      <button
        onClick={onDismiss}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        aria-label={dismissLabel}
      >
        {dismissLabel}
      </button>
    </div>
  );
}
