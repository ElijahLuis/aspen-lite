'use client';

interface DraftRecoveryBannerProps {
  studentName: string;
  savedAt: string;
  onRecover: () => void;
  onDismiss: () => void;
}

export function DraftRecoveryBanner({
  studentName,
  savedAt,
  onRecover,
  onDismiss,
}: DraftRecoveryBannerProps) {
  const savedDate = new Date(savedAt);
  const timeAgo = getTimeAgo(savedDate);

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>

        <div className="flex-1">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Unsaved encounter found
          </h4>
          <p className="mt-1 text-sm text-blue-600 dark:text-blue-300">
            You have an unsaved encounter for <strong>{studentName}</strong> from {timeAgo}.
          </p>

          <div className="mt-3 flex gap-3">
            <button
              onClick={onRecover}
              className="btn bg-blue-600 text-white hover:bg-blue-700 px-3 py-1.5 text-sm"
            >
              Recover draft
            </button>
            <button
              onClick={onDismiss}
              className="btn text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 px-3 py-1.5 text-sm"
            >
              Discard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  return date.toLocaleString();
}
