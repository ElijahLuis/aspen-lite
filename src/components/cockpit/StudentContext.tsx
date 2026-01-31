'use client';

import type { Student } from '@/lib/types';
import { SEVERITY_COLORS, HSP_STATUS_LABELS } from '@/lib/constants';

interface StudentContextProps {
  student: Student;
  encounterCount?: number;
  onViewHistory?: () => void;
}

export function StudentContext({ student, encounterCount = 0, onViewHistory }: StudentContextProps) {
  const hspInfo = HSP_STATUS_LABELS[student.hspStatus];

  return (
    <div className="card space-y-4">
      {/* Header with name and room */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            {student.firstName} {student.lastName}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Grade {student.grade} &middot; Room {student.room}
          </p>
        </div>
        <div className="text-right">
          <span className={`text-sm font-medium ${hspInfo.class}`}>
            HSP: {hspInfo.label}
          </span>
          {student.hspLastUpdated && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Updated {new Date(student.hspLastUpdated).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Conditions & Allergies Row */}
      <div className="flex flex-wrap gap-2">
        {/* Conditions */}
        {student.conditions.map((condition) => (
          <div
            key={condition.id}
            className={`${SEVERITY_COLORS[condition.severity]} flex items-center gap-1.5`}
            title={condition.notes}
          >
            {condition.severity === 'critical' && (
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            {condition.name}
          </div>
        ))}

        {/* Allergies */}
        {student.allergies.map((allergy) => (
          <div
            key={allergy.id}
            className={`badge ${allergy.severity === 'severe' ? 'badge-critical' : 'badge-high'} flex items-center gap-1.5`}
            title={`Reaction: ${allergy.reaction}`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {allergy.allergen}
          </div>
        ))}

        {/* Empty state */}
        {student.conditions.length === 0 && student.allergies.length === 0 && (
          <span className="text-sm text-slate-500 dark:text-slate-400">
            No conditions or allergies on file
          </span>
        )}
      </div>

      {/* Medications */}
      {student.medications.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
            Medications
          </p>
          <div className="flex flex-wrap gap-2">
            {student.medications.map((med) => (
              <span
                key={med.id}
                className="inline-flex items-center gap-1.5 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-full"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                {med.name}
                <span className="text-blue-500 dark:text-blue-500 text-xs">
                  {med.schedule === 'prn' ? 'PRN' : med.schedule === 'daily' ? 'Daily' : 'Scheduled'}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Visits */}
      <div className="pt-2 border-t">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Recent Visits
            {encounterCount > 0 && (
              <span className="ml-2 text-slate-400">({encounterCount} total)</span>
            )}
          </p>
          {onViewHistory && encounterCount > 0 && (
            <button
              onClick={onViewHistory}
              className="text-xs text-clinic-600 dark:text-clinic-400 hover:underline"
            >
              View All
            </button>
          )}
        </div>
        {student.recentVisits.length > 0 ? (
          <div className="space-y-2">
            {student.recentVisits.slice(0, 3).map((visit, i) => (
              <div
                key={i}
                className="flex items-start gap-3 text-sm"
              >
                <span className="text-slate-400 dark:text-slate-500 font-mono text-xs min-w-[80px]">
                  {new Date(visit.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span className="text-slate-600 dark:text-slate-300">
                  {visit.brief}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 dark:text-slate-500">
            No visits recorded
          </p>
        )}
      </div>
    </div>
  );
}
