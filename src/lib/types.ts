// ============================================
// STUDENT (reference data, not owned by us)
// ============================================

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  grade: number;
  room: string;
  schoolId: string;
  conditions: Condition[];
  allergies: Allergy[];
  medications: Medication[];
  hspStatus: HspStatus;
  hspLastUpdated: string | null;
  recentVisits: VisitSummary[];
}

export interface Condition {
  id: string;
  name: string;
  severity: Severity;
  notes?: string;
}

export interface Allergy {
  id: string;
  allergen: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe';
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  schedule: 'prn' | 'daily' | 'scheduled';
}

export interface VisitSummary {
  date: string;
  chiefComplaint: string;
  disposition: string;
  brief: string;
}

export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type HspStatus = 'current' | 'stale' | 'missing';

// ============================================
// ENCOUNTER (our core data)
// ============================================

export interface Encounter {
  id: string;
  studentId: string;
  createdAt: string;
  updatedAt: string;
  chiefComplaint: ChiefComplaint;
  subjective?: string;
  objective?: string;
  assessment: string;
  actionsTaken: ActionTaken[];
  disposition: Disposition;
  quickTags: QuickTag[];
  followUpNeeded: boolean;
  followUpDate?: string;
  followUpNotes?: string;
  triggeredHspPrompt: boolean;
  hspPromptAction?: 'reviewed' | 'dismissed';
  hspDismissReason?: HspDismissReason;
  duration?: number;
  schoolId: string;
}

export type ChiefComplaint =
  | 'headache'
  | 'stomach_ache'
  | 'injury'
  | 'fever'
  | 'medication_admin'
  | 'blood_sugar_check'
  | 'mental_health'
  | 'nausea'
  | 'dizziness'
  | 'other';

export type ActionTaken =
  | 'rest_in_clinic'
  | 'ice_applied'
  | 'bandage_applied'
  | 'medication_given'
  | 'vital_signs_taken'
  | 'blood_sugar_checked'
  | 'parent_called'
  | 'teacher_notified'
  | 'ems_called'
  | 'other';

export type Disposition =
  | 'returned_to_class'
  | 'sent_home'
  | 'parent_pickup'
  | 'ems_transport'
  | 'stayed_in_clinic'
  | 'referred_to_provider';

export type QuickTag =
  | 'gave_ice'
  | 'gave_bandaid'
  | 'gave_crackers'
  | 'rest_15min'
  | 'rest_30min'
  | 'called_parent'
  | 'left_voicemail'
  | 'emailed_teacher';

export type HspDismissReason =
  | 'already_in_hsp'
  | 'one_time_not_ongoing'
  | 'will_update_later';

// ============================================
// ARTIFACT (generated outputs)
// ============================================

export interface Artifact {
  id: string;
  type: 'hsp_summary' | 'encounter_log' | 'ssm_export' | 'district_report';
  createdAt: string;
  studentId?: string;
  status: 'pending' | 'ready' | 'exported';
  content: string;
}

// ============================================
// HSP Detection
// ============================================

export interface HspTrigger {
  type: 'new_medication' | 'new_condition' | 'emergency_action' | 'condition_change';
  description: string;
  confidence: 'high' | 'medium';
}

// ============================================
// Form State
// ============================================

export interface EncounterFormState {
  chiefComplaint: ChiefComplaint | '';
  subjective: string;
  objective: string;
  assessment: string;
  actionsTaken: ActionTaken[];
  disposition: Disposition | '';
  quickTags: QuickTag[];
  followUpNeeded: boolean;
  followUpDate: string;
  followUpNotes: string;
}

export const initialEncounterForm: EncounterFormState = {
  chiefComplaint: '',
  subjective: '',
  objective: '',
  assessment: '',
  actionsTaken: [],
  disposition: '',
  quickTags: [],
  followUpNeeded: false,
  followUpDate: '',
  followUpNotes: '',
};
