'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Student, EncounterFormState, ActionTaken, QuickTag } from '@/lib/types';
import { initialEncounterForm } from '@/lib/types';
import {
  CHIEF_COMPLAINTS,
  ACTIONS_TAKEN,
  DISPOSITIONS,
  QUICK_TAGS,
} from '@/lib/constants';

interface EncounterComposerProps {
  student: Student;
  initialForm?: EncounterFormState | null;
  onFormChange?: (form: EncounterFormState) => void;
  onSave: (form: EncounterFormState) => void;
  onSaveAndNext: (form: EncounterFormState) => void;
}

export function EncounterComposer({
  student,
  initialForm,
  onFormChange,
  onSave,
  onSaveAndNext,
}: EncounterComposerProps) {
  const [form, setForm] = useState<EncounterFormState>(initialForm || initialEncounterForm);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Reset form when student changes or initialForm is provided
  useEffect(() => {
    if (initialForm) {
      setForm(initialForm);
    } else {
      setForm(initialEncounterForm);
    }
  }, [student.id, initialForm]);

  // Notify parent of form changes for draft saving
  useEffect(() => {
    onFormChange?.(form);
  }, [form, onFormChange]);

  const updateField = useCallback(<K extends keyof EncounterFormState>(
    field: K,
    value: EncounterFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const toggleAction = (action: ActionTaken) => {
    setForm((prev) => ({
      ...prev,
      actionsTaken: prev.actionsTaken.includes(action)
        ? prev.actionsTaken.filter((a) => a !== action)
        : [...prev.actionsTaken, action],
    }));
  };

  const toggleTag = (tag: QuickTag) => {
    setForm((prev) => ({
      ...prev,
      quickTags: prev.quickTags.includes(tag)
        ? prev.quickTags.filter((t) => t !== tag)
        : [...prev.quickTags, tag],
    }));
  };

  const handleSave = () => {
    if (!isValid) return;
    onSave(form);
  };

  const handleSaveAndNext = () => {
    if (!isValid) return;
    onSaveAndNext(form);
    setForm(initialEncounterForm);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.metaKey && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.metaKey && e.shiftKey && e.key === 'Enter') {
      e.preventDefault();
      handleSaveAndNext();
    }
  };

  const isValid = form.chiefComplaint && form.assessment.trim() && form.disposition;

  return (
    <div className="card space-y-5" onKeyDown={handleKeyDown}>
      <h3 className="text-lg font-medium flex items-center gap-2">
        <svg className="h-5 w-5 text-clinic-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        New Encounter
      </h3>

      {/* Chief Complaint */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Chief Complaint <span className="text-red-500">*</span>
        </label>
        <select
          value={form.chiefComplaint}
          onChange={(e) => updateField('chiefComplaint', e.target.value as typeof form.chiefComplaint)}
          className="input"
        >
          <option value="">Select reason for visit...</option>
          {CHIEF_COMPLAINTS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Assessment */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Assessment <span className="text-red-500">*</span>
        </label>
        <textarea
          value={form.assessment}
          onChange={(e) => updateField('assessment', e.target.value)}
          placeholder="What did you observe and assess?"
          rows={3}
          className="input resize-none"
        />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Your clinical assessment. This is the core of the encounter note.
        </p>
      </div>

      {/* Subjective/Objective (collapsible) */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
        >
          <svg
            className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {showAdvanced ? 'Hide' : 'Show'} subjective/objective fields
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-4 pl-6 border-l-2 border-slate-200 dark:border-slate-700">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Subjective
              </label>
              <textarea
                value={form.subjective}
                onChange={(e) => updateField('subjective', e.target.value)}
                placeholder="What did the student or teacher report?"
                rows={2}
                className="input resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Objective
              </label>
              <textarea
                value={form.objective}
                onChange={(e) => updateField('objective', e.target.value)}
                placeholder="Vital signs, observations..."
                rows={2}
                className="input resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions Taken */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Actions Taken
        </label>
        <div className="flex flex-wrap gap-2">
          {ACTIONS_TAKEN.map((action) => (
            <button
              key={action.value}
              type="button"
              onClick={() => toggleAction(action.value)}
              className={`chip ${form.actionsTaken.includes(action.value) ? 'chip-selected' : ''}`}
            >
              {form.actionsTaken.includes(action.value) && (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Tags */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Quick Tags
        </label>
        <div className="flex flex-wrap gap-2">
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag.value}
              type="button"
              onClick={() => toggleTag(tag.value)}
              className={`chip text-sm ${form.quickTags.includes(tag.value) ? 'chip-selected' : ''}`}
            >
              {form.quickTags.includes(tag.value) && (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      {/* Disposition */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Disposition <span className="text-red-500">*</span>
        </label>
        <select
          value={form.disposition}
          onChange={(e) => updateField('disposition', e.target.value as typeof form.disposition)}
          className="input"
        >
          <option value="">Where did the student go?</option>
          {DISPOSITIONS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      {/* Follow-up */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.followUpNeeded}
            onChange={(e) => updateField('followUpNeeded', e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-clinic-600 focus:ring-clinic-500"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">Follow-up needed</span>
        </label>

        {form.followUpNeeded && (
          <input
            type="date"
            value={form.followUpDate}
            onChange={(e) => updateField('followUpDate', e.target.value)}
            className="input w-auto"
          />
        )}
      </div>

      {/* Save Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">⌘ Enter</kbd> to save
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={!isValid}
            className="btn-primary"
          >
            Save Encounter
          </button>
          <button
            type="button"
            onClick={handleSaveAndNext}
            disabled={!isValid}
            className="btn-secondary"
          >
            Save + Next
          </button>
        </div>
      </div>
    </div>
  );
}
