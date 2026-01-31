'use client';

import { useState, useCallback } from 'react';
import type { Artifact } from '@/lib/types';

interface OutputsTrayProps {
  artifacts: Artifact[];
  encounterCount: number;
  onExportDailyLog?: () => void;
  onExportSsm?: () => void;
}

export function OutputsTray({
  artifacts,
  encounterCount,
  onExportDailyLog,
  onExportSsm,
}: OutputsTrayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const readyCount = artifacts.filter((a) => a.status === 'ready').length;

  const handleCopy = useCallback(async (artifact: Artifact) => {
    try {
      await navigator.clipboard.writeText(artifact.content);
      setCopiedId(artifact.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, []);

  const handleDownload = useCallback((artifact: Artifact) => {
    const extension = artifact.type === 'encounter_log' ? 'csv' :
                      artifact.type === 'ssm_export' ? 'json' : 'md';
    const mimeType = artifact.type === 'encounter_log' ? 'text/csv' :
                     artifact.type === 'ssm_export' ? 'application/json' : 'text/markdown';

    const blob = new Blob([artifact.content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.type}_${new Date().toISOString().slice(0, 10)}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="border rounded-lg bg-white dark:bg-slate-800">
      {/* Collapsed Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg"
      >
        <div className="flex items-center gap-2">
          <svg
            className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Outputs
          </span>
          {readyCount > 0 && (
            <span className="badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              {readyCount} ready
            </span>
          )}
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {encounterCount} encounter{encounterCount !== 1 ? 's' : ''} today
        </span>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {artifacts.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-2">
              No outputs yet. Complete encounters to generate artifacts.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {artifacts.slice().reverse().map((artifact) => (
                <div
                  key={artifact.id}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {artifact.type === 'hsp_summary' && (
                        <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                      {artifact.type === 'encounter_log' && (
                        <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      )}
                      {artifact.type === 'ssm_export' && (
                        <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      )}
                      {artifact.type === 'district_report' && (
                        <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {artifact.type === 'hsp_summary' && 'HSP Summary'}
                        {artifact.type === 'encounter_log' && 'Daily Encounter Log'}
                        {artifact.type === 'ssm_export' && 'SSM Export'}
                        {artifact.type === 'district_report' && 'District Report'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(artifact.createdAt).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                        {artifact.status === 'ready' && (
                          <span className="ml-2 text-green-600 dark:text-green-400">Ready</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(artifact)}
                      className="btn-ghost text-xs px-2 py-1"
                      title="Copy to clipboard"
                    >
                      {copiedId === artifact.id ? (
                        <span className="text-green-600 dark:text-green-400">Copied!</span>
                      ) : (
                        'Copy'
                      )}
                    </button>
                    <button
                      onClick={() => handleDownload(artifact)}
                      className="btn-ghost text-xs px-2 py-1"
                      title="Download file"
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Export Actions */}
          <div className="pt-3 border-t flex gap-2">
            <button
              onClick={onExportDailyLog}
              className="btn-secondary text-sm flex-1"
            >
              <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Export Daily Log
            </button>
            <button
              onClick={onExportSsm}
              className="btn-secondary text-sm flex-1"
            >
              <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Generate SSM File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
