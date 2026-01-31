'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Student, Encounter, Artifact, HspTrigger, HspDismissReason, EncounterFormState } from '@/lib/types';
import { MOCK_STUDENTS, getStudentById } from '@/lib/mock-data';
import { detectHspTriggers } from '@/lib/hsp-detection';
import { generateHspSummary, generateEncounterLogCsv, generateSsmExport } from '@/lib/hsp-generator';
import { StudentSelector } from '@/components/cockpit/StudentSelector';
import { StudentContext } from '@/components/cockpit/StudentContext';
import { EncounterComposer } from '@/components/cockpit/EncounterComposer';
import { HspPrompt } from '@/components/cockpit/HspPrompt';
import { OutputsTray } from '@/components/cockpit/OutputsTray';
import { DraftRecoveryBanner } from '@/components/cockpit/DraftRecoveryBanner';
import { EncounterHistory } from '@/components/cockpit/EncounterHistory';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { useDraft } from '@/hooks/useDraft';

const RECENT_STUDENTS_KEY = 'aspen_lite_recent_students';
const ENCOUNTERS_KEY = 'aspen_lite_encounters';

export default function ClinicalCockpit() {
  // Core state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [currentForm, setCurrentForm] = useState<EncounterFormState | null>(null);

  // HSP prompt state
  const [hspTriggers, setHspTriggers] = useState<HspTrigger[]>([]);
  const [showHspPrompt, setShowHspPrompt] = useState(false);

  // Encounter history modal
  const [showEncounterHistory, setShowEncounterHistory] = useState(false);

  // Encounter timing
  const [encounterStartTime, setEncounterStartTime] = useState<Date | null>(null);

  // Toast notifications
  const toast = useToast();

  // Draft recovery
  const { hasDraft, draftData, saveDraft, clearDraft, recoverDraft, dismissDraft } = useDraft();

  // Load recent students and encounters from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_STUDENTS_KEY);
    if (stored) {
      try {
        const ids = JSON.parse(stored) as string[];
        const students = ids
          .map((id) => MOCK_STUDENTS.find((s) => s.id === id))
          .filter((s): s is Student => s !== undefined);
        setRecentStudents(students);
      } catch {
        // Ignore parse errors
      }
    }

    // Load encounters
    const storedEncounters = localStorage.getItem(ENCOUNTERS_KEY);
    if (storedEncounters) {
      try {
        setEncounters(JSON.parse(storedEncounters));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Auto-save draft when form changes
  useEffect(() => {
    if (selectedStudent && currentForm) {
      saveDraft(currentForm, selectedStudent);
    }
  }, [currentForm, selectedStudent, saveDraft]);

  // Handle draft recovery
  const handleRecoverDraft = useCallback(() => {
    const draft = recoverDraft();
    if (draft) {
      const student = getStudentById(draft.studentId);
      if (student) {
        setSelectedStudent(student);
        setCurrentForm(draft.form);
        setEncounterStartTime(new Date());
        toast.info('Draft recovered', `Continuing encounter for ${student.firstName}`);
      }
    }
  }, [recoverDraft, toast]);

  // Handle student selection
  const handleSelectStudent = useCallback((student: Student) => {
    setSelectedStudent(student);
    setEncounterStartTime(new Date());
    setShowHspPrompt(false);
    setHspTriggers([]);
    setCurrentForm(null);

    // Update recent students
    setRecentStudents((prev) => {
      const filtered = prev.filter((s) => s.id !== student.id);
      const updated = [student, ...filtered].slice(0, 5);

      // Persist to localStorage
      localStorage.setItem(
        RECENT_STUDENTS_KEY,
        JSON.stringify(updated.map((s) => s.id))
      );

      return updated;
    });
  }, []);

  // Handle clearing student
  const handleClearStudent = useCallback(() => {
    setSelectedStudent(null);
    setEncounterStartTime(null);
    setShowHspPrompt(false);
    setHspTriggers([]);
    setCurrentForm(null);
    clearDraft();
  }, [clearDraft]);

  // Handle form changes (for draft saving)
  const handleFormChange = useCallback((form: EncounterFormState) => {
    setCurrentForm(form);
  }, []);

  // Handle saving encounter
  const handleSaveEncounter = useCallback(
    (form: EncounterFormState) => {
      if (!selectedStudent) return;

      // Calculate duration
      const duration = encounterStartTime
        ? Math.round((new Date().getTime() - encounterStartTime.getTime()) / 1000)
        : undefined;

      // Create encounter
      const encounter: Encounter = {
        id: `enc_${Date.now()}`,
        studentId: selectedStudent.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        chiefComplaint: form.chiefComplaint as Encounter['chiefComplaint'],
        subjective: form.subjective || undefined,
        objective: form.objective || undefined,
        assessment: form.assessment,
        actionsTaken: form.actionsTaken,
        disposition: form.disposition as Encounter['disposition'],
        quickTags: form.quickTags,
        followUpNeeded: form.followUpNeeded,
        followUpDate: form.followUpDate || undefined,
        followUpNotes: form.followUpNotes || undefined,
        triggeredHspPrompt: false,
        duration,
        schoolId: selectedStudent.schoolId,
      };

      // Detect HSP triggers
      const triggers = detectHspTriggers(form, selectedStudent);

      if (triggers.length > 0) {
        encounter.triggeredHspPrompt = true;
        setHspTriggers(triggers);
        setShowHspPrompt(true);
      }

      // Save encounter
      setEncounters((prev) => {
        const updated = [...prev, encounter];
        localStorage.setItem(ENCOUNTERS_KEY, JSON.stringify(updated));
        return updated;
      });

      // Clear draft
      clearDraft();

      // Show success toast
      const durationText = duration ? ` (${duration}s)` : '';
      toast.success(
        'Encounter saved',
        `${selectedStudent.firstName} ${selectedStudent.lastName}${durationText}`
      );
    },
    [selectedStudent, encounterStartTime, clearDraft, toast]
  );

  // Handle save and next
  const handleSaveAndNext = useCallback(
    (form: EncounterFormState) => {
      handleSaveEncounter(form);

      // Clear student if no HSP prompt needed
      if (!detectHspTriggers(form, selectedStudent!).length) {
        handleClearStudent();
      }
    },
    [handleSaveEncounter, handleClearStudent, selectedStudent]
  );

  // Handle HSP review
  const handleHspReview = useCallback(() => {
    if (!selectedStudent) return;

    // Generate HSP summary
    const studentEncounters = encounters.filter(e => e.studentId === selectedStudent.id);
    const hspContent = generateHspSummary(selectedStudent, studentEncounters);

    // Add artifact
    const artifact: Artifact = {
      id: `art_${Date.now()}`,
      type: 'hsp_summary',
      createdAt: new Date().toISOString(),
      studentId: selectedStudent.id,
      status: 'ready',
      content: hspContent,
    };

    setArtifacts((prev) => [...prev, artifact]);
    setShowHspPrompt(false);

    toast.success('HSP Summary generated', 'Available in Outputs tray');
  }, [selectedStudent, encounters, toast]);

  // Handle HSP dismiss
  const handleHspDismiss = useCallback(
    (reason: HspDismissReason) => {
      // Update the last encounter with dismiss reason
      setEncounters((prev) => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        const lastEncounter = updated[updated.length - 1];
        lastEncounter.hspPromptAction = 'dismissed';
        lastEncounter.hspDismissReason = reason;
        localStorage.setItem(ENCOUNTERS_KEY, JSON.stringify(updated));
        return updated;
      });

      setShowHspPrompt(false);
      setHspTriggers([]);

      toast.info('HSP prompt dismissed', reason.replace(/_/g, ' '));
    },
    [toast]
  );

  // Handle export actions
  const handleExportDailyLog = useCallback(() => {
    const todayEncounters = encounters.filter((e) => {
      const today = new Date().toDateString();
      return new Date(e.createdAt).toDateString() === today;
    });

    if (todayEncounters.length === 0) {
      toast.warning('No encounters today', 'Complete an encounter first');
      return;
    }

    // Build student map
    const studentMap = new Map<string, Student>();
    MOCK_STUDENTS.forEach(s => studentMap.set(s.id, s));

    const csv = generateEncounterLogCsv(todayEncounters, studentMap);

    // Create artifact
    const artifact: Artifact = {
      id: `art_${Date.now()}`,
      type: 'encounter_log',
      createdAt: new Date().toISOString(),
      status: 'ready',
      content: csv,
    };

    setArtifacts((prev) => [...prev, artifact]);
    toast.success('Daily log generated', `${todayEncounters.length} encounters`);
  }, [encounters, toast]);

  const handleExportSsm = useCallback(() => {
    const todayEncounters = encounters.filter((e) => {
      const today = new Date().toDateString();
      return new Date(e.createdAt).toDateString() === today;
    });

    if (todayEncounters.length === 0) {
      toast.warning('No encounters today', 'Complete an encounter first');
      return;
    }

    const ssmData = generateSsmExport(todayEncounters);

    // Create artifact
    const artifact: Artifact = {
      id: `art_${Date.now()}`,
      type: 'ssm_export',
      createdAt: new Date().toISOString(),
      status: 'ready',
      content: JSON.stringify(ssmData, null, 2),
    };

    setArtifacts((prev) => [...prev, artifact]);
    toast.success('SSM export ready', `${todayEncounters.length} encounters`);
  }, [encounters, toast]);

  // Handle global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedStudent) {
        handleClearStudent();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedStudent, handleClearStudent]);

  // Count today's encounters
  const todayEncounters = encounters.filter((e) => {
    const today = new Date().toDateString();
    return new Date(e.createdAt).toDateString() === today;
  });

  return (
    <div className="space-y-4">
      {/* Draft Recovery Banner */}
      {hasDraft && !selectedStudent && draftData && (
        <DraftRecoveryBanner
          studentName={draftData.studentName}
          savedAt={draftData.savedAt}
          onRecover={handleRecoverDraft}
          onDismiss={dismissDraft}
        />
      )}

      {/* Student Selector */}
      <StudentSelector
        selectedStudent={selectedStudent}
        recentStudents={recentStudents}
        onSelectStudent={handleSelectStudent}
        onClearStudent={handleClearStudent}
      />

      {/* Main Content (when student selected) */}
      {selectedStudent && (
        <>
          {/* Student Context */}
          <StudentContext
            student={selectedStudent}
            encounterCount={encounters.filter(e => e.studentId === selectedStudent.id).length}
            onViewHistory={() => setShowEncounterHistory(true)}
          />

          {/* HSP Prompt (conditional) */}
          {showHspPrompt && hspTriggers.length > 0 && (
            <HspPrompt
              triggers={hspTriggers}
              studentName={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
              onReview={handleHspReview}
              onDismiss={handleHspDismiss}
            />
          )}

          {/* Encounter Composer */}
          <EncounterComposer
            student={selectedStudent}
            initialForm={currentForm}
            onFormChange={handleFormChange}
            onSave={handleSaveEncounter}
            onSaveAndNext={handleSaveAndNext}
          />
        </>
      )}

      {/* Outputs Tray (always visible) */}
      <OutputsTray
        artifacts={artifacts}
        encounterCount={todayEncounters.length}
        onExportDailyLog={handleExportDailyLog}
        onExportSsm={handleExportSsm}
      />

      {/* Toast Container */}
      <ToastContainer messages={toast.messages} onDismiss={toast.dismissToast} />

      {/* Encounter History Modal */}
      {selectedStudent && (
        <EncounterHistory
          student={selectedStudent}
          encounters={encounters}
          isOpen={showEncounterHistory}
          onClose={() => setShowEncounterHistory(false)}
        />
      )}

      {/* Development Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-slate-400 dark:text-slate-600 text-center py-4">
          v1 — API + Mock Clinical Data — {MOCK_STUDENTS.length} students
        </div>
      )}
    </div>
  );
}
