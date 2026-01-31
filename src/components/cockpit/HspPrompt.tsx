'use client';

import { useState } from 'react';
import type { HspTrigger, HspDismissReason } from '@/lib/types';
import { HSP_DISMISS_REASONS } from '@/lib/constants';

interface HspPromptProps {
  triggers: HspTrigger[];
  studentName: string;
  onReview: () => void;
  onDismiss: (reason: HspDismissReason) => void;
}

export function HspPrompt({
  triggers,
  studentName,
  onReview,
  onDismiss,
}: HspPromptProps) {
  const [showDismissOptions, setShowDismissOptions] = useState(false);

  if (triggers.length === 0) return null;

  return (
    <div className="border-2 border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
      <div className="flex items-start gap-3">
        {/* Warning Icon */}
        <div className="flex-shrink-0">
          <svg
            className="h-6 w-6 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <div className="flex-1">
          <h4 className="font-medium text-amber-800 dark:text-amber-200">
            This encounter may require an HSP update
          </h4>

          <div className="mt-2 space-y-1">
            {triggers.map((trigger, i) => (
              <p key={i} className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                  trigger.confidence === 'high' ? 'bg-amber-500' : 'bg-amber-400'
                }`} />
                {trigger.description}
              </p>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={onReview}
              className="btn bg-amber-600 text-white hover:bg-amber-700 px-4 py-2"
            >
              Review HSP Summary
            </button>

            {!showDismissOptions ? (
              <button
                onClick={() => setShowDismissOptions(true)}
                className="btn text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 px-4 py-2"
              >
                Not needed
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-amber-600 dark:text-amber-400">
                  Reason:
                </span>
                {HSP_DISMISS_REASONS.map((reason) => (
                  <button
                    key={reason.value}
                    onClick={() => onDismiss(reason.value)}
                    className="chip text-sm hover:bg-amber-100 dark:hover:bg-amber-900/30"
                  >
                    {reason.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
