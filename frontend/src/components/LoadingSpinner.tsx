interface LoadingSpinnerProps {
  message?: string;
  submessage?: string;
}

export function LoadingSpinner({
  message = 'Searching for activities...',
  submessage = 'This may take 10-20 seconds',
}: LoadingSpinnerProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="mt-4 text-gray-600 font-medium">{message}</p>
      <p className="mt-2 text-gray-500 text-sm">{submessage}</p>
    </div>
  );
}
