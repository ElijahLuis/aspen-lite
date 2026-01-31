'use client';

import { useState, useEffect } from 'react';
import type { Encounter, Student } from '@/lib/types';
import { CHIEF_COMPLAINTS, DISPOSITIONS, ACTIONS_TAKEN } from '@/lib/constants';

interface EncounterHistoryProps {
  student: Student;
  encounters: Encounter[];
  isOpen: boolean;
  onClose: () => void;
}

export function EncounterHistory({
  student,
  encounters,
  isOpen,
  onClose,
}: EncounterHistoryProps) {
  const [selectedEncounter, setSelectedEncounter] = useState<Encounter | null>(null);

  // Filter encounters for this student
  const studentEncounters = encounters
    .filter((e) => e.studentId === student.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Reset selection when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedEncounter(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getComplaintLabel = (value: string) =>
    CHIEF_COMPLAINTS.find((c) => c.value === value)?.label || value;

  const getDispositionLabel = (value: string) =>
    DISPOSITIONS.find((d) => d.value === value)?.label || value;

  const getActionLabel = (value: string) =>
    ACTIONS_TAKEN.find((a) => a.value === value)?.label || value;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">
              Encounter History
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {student.firstName} {student.lastName} &middot; {studentEncounters.length} encounter{studentEncounters.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Encounter List */}
          <div className="w-1/2 border-r overflow-y-auto">
            {studentEncounters.length === 0 ? (
              <p className="p-4 text-sm text-slate-500 dark:text-slate-400 text-center">
                No encounters recorded for this student.
              </p>
            ) : (
              <div className="divide-y">
                {studentEncounters.map((enc) => (
                  <button
                    key={enc.id}
                    onClick={() => setSelectedEncounter(enc)}
                    className={`w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                      selectedEncounter?.id === enc.id ? 'bg-slate-50 dark:bg-slate-700/50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {getComplaintLabel(enc.chiefComplaint)}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(enc.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                      {enc.assessment}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        → {getDispositionLabel(enc.disposition)}
                      </span>
                      {enc.duration && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          ({enc.duration}s)
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Encounter Detail */}
          <div className="w-1/2 overflow-y-auto p-4">
            {selectedEncounter ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Date & Time
                  </p>
                  <p className="text-sm mt-1">
                    {new Date(selectedEncounter.createdAt).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Chief Complaint
                  </p>
                  <p className="text-sm mt-1 font-medium">
                    {getComplaintLabel(selectedEncounter.chiefComplaint)}
                  </p>
                </div>

                {selectedEncounter.subjective && (
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Subjective
                    </p>
                    <p className="text-sm mt-1">{selectedEncounter.subjective}</p>
                  </div>
                )}

                {selectedEncounter.objective && (
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Objective
                    </p>
                    <p className="text-sm mt-1">{selectedEncounter.objective}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Assessment
                  </p>
                  <p className="text-sm mt-1">{selectedEncounter.assessment}</p>
                </div>

                {selectedEncounter.actionsTaken.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Actions Taken
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedEncounter.actionsTaken.map((action) => (
                        <span
                          key={action}
                          className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full"
                        >
                          {getActionLabel(action)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Disposition
                  </p>
                  <p className="text-sm mt-1">
                    {getDispositionLabel(selectedEncounter.disposition)}
                  </p>
                </div>

                {selectedEncounter.triggeredHspPrompt && (
                  <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded text-xs">
                    <span className="font-medium text-amber-700 dark:text-amber-400">
                      HSP Prompt:
                    </span>{' '}
                    <span className="text-amber-600 dark:text-amber-300">
                      {selectedEncounter.hspPromptAction === 'reviewed'
                        ? 'Reviewed'
                        : selectedEncounter.hspPromptAction === 'dismissed'
                        ? `Dismissed (${selectedEncounter.hspDismissReason?.replace(/_/g, ' ')})`
                        : 'Pending'}
                    </span>
                  </div>
                )}

                {selectedEncounter.duration && (
                  <div className="text-xs text-slate-400 dark:text-slate-500">
                    Completed in {selectedEncounter.duration} seconds
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-400 dark:text-slate-500">
                Select an encounter to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
