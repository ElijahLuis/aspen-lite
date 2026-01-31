'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { EncounterFormState, Student } from '@/lib/types';
import { initialEncounterForm } from '@/lib/types';

const DRAFT_KEY = 'aspen_lite_encounter_draft';
const DRAFT_STUDENT_KEY = 'aspen_lite_draft_student';
const DEBOUNCE_MS = 500;

interface DraftData {
  form: EncounterFormState;
  studentId: string;
  studentName: string;
  savedAt: string;
}

export function useDraft() {
  const [hasDraft, setHasDraft] = useState(false);
  const [draftData, setDraftData] = useState<DraftData | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Check for existing draft on mount
  useEffect(() => {
    const stored = localStorage.getItem(DRAFT_KEY);
    if (stored) {
      try {
        const data: DraftData = JSON.parse(stored);
        // Only show draft if it's less than 24 hours old
        const savedTime = new Date(data.savedAt).getTime();
        const now = Date.now();
        const hoursOld = (now - savedTime) / (1000 * 60 * 60);

        if (hoursOld < 24 && data.form.assessment.trim()) {
          setDraftData(data);
          setHasDraft(true);
        } else {
          // Clear stale draft
          localStorage.removeItem(DRAFT_KEY);
          localStorage.removeItem(DRAFT_STUDENT_KEY);
        }
      } catch {
        localStorage.removeItem(DRAFT_KEY);
      }
    }
  }, []);

  // Save draft (debounced)
  const saveDraft = useCallback((form: EncounterFormState, student: Student) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      // Only save if there's meaningful content
      if (form.assessment.trim() || form.chiefComplaint) {
        const data: DraftData = {
          form,
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
        localStorage.setItem(DRAFT_STUDENT_KEY, student.id);
      }
    }, DEBOUNCE_MS);
  }, []);

  // Clear draft
  const clearDraft = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(DRAFT_STUDENT_KEY);
    setHasDraft(false);
    setDraftData(null);
  }, []);

  // Recover draft
  const recoverDraft = useCallback((): { form: EncounterFormState; studentId: string } | null => {
    if (!draftData) return null;

    return {
      form: draftData.form,
      studentId: draftData.studentId,
    };
  }, [draftData]);

  // Dismiss draft (don't recover, just clear)
  const dismissDraft = useCallback(() => {
    clearDraft();
  }, [clearDraft]);

  return {
    hasDraft,
    draftData,
    saveDraft,
    clearDraft,
    recoverDraft,
    dismissDraft,
  };
}
