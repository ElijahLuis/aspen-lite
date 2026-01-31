import type { ChiefComplaint, ActionTaken, Disposition, QuickTag, HspDismissReason } from './types';

export const CHIEF_COMPLAINTS: { value: ChiefComplaint; label: string }[] = [
  { value: 'headache', label: 'Headache' },
  { value: 'stomach_ache', label: 'Stomach ache' },
  { value: 'injury', label: 'Injury' },
  { value: 'fever', label: 'Fever' },
  { value: 'nausea', label: 'Nausea' },
  { value: 'dizziness', label: 'Dizziness' },
  { value: 'medication_admin', label: 'Medication administration' },
  { value: 'blood_sugar_check', label: 'Blood sugar check' },
  { value: 'mental_health', label: 'Mental health concern' },
  { value: 'other', label: 'Other' },
];

export const ACTIONS_TAKEN: { value: ActionTaken; label: string }[] = [
  { value: 'rest_in_clinic', label: 'Rest in clinic' },
  { value: 'ice_applied', label: 'Ice applied' },
  { value: 'bandage_applied', label: 'Bandage applied' },
  { value: 'medication_given', label: 'Medication given' },
  { value: 'vital_signs_taken', label: 'Vital signs taken' },
  { value: 'blood_sugar_checked', label: 'Blood sugar checked' },
  { value: 'parent_called', label: 'Parent called' },
  { value: 'teacher_notified', label: 'Teacher notified' },
  { value: 'ems_called', label: 'EMS called' },
  { value: 'other', label: 'Other action' },
];

export const DISPOSITIONS: { value: Disposition; label: string }[] = [
  { value: 'returned_to_class', label: 'Returned to class' },
  { value: 'sent_home', label: 'Sent home' },
  { value: 'parent_pickup', label: 'Parent pickup' },
  { value: 'stayed_in_clinic', label: 'Stayed in clinic' },
  { value: 'referred_to_provider', label: 'Referred to provider' },
  { value: 'ems_transport', label: 'EMS transport' },
];

export const QUICK_TAGS: { value: QuickTag; label: string }[] = [
  { value: 'gave_ice', label: 'Gave ice' },
  { value: 'gave_bandaid', label: 'Gave band-aid' },
  { value: 'gave_crackers', label: 'Gave crackers' },
  { value: 'rest_15min', label: 'Rest 15 min' },
  { value: 'rest_30min', label: 'Rest 30 min' },
  { value: 'called_parent', label: 'Called parent' },
  { value: 'left_voicemail', label: 'Left voicemail' },
  { value: 'emailed_teacher', label: 'Emailed teacher' },
];

export const HSP_DISMISS_REASONS: { value: HspDismissReason; label: string }[] = [
  { value: 'already_in_hsp', label: 'Already in HSP (system missed it)' },
  { value: 'one_time_not_ongoing', label: 'One-time, not ongoing' },
  { value: 'will_update_later', label: 'Will update later' },
];

export const SEVERITY_COLORS = {
  low: 'badge-low',
  medium: 'badge-medium',
  high: 'badge-high',
  critical: 'badge-critical',
} as const;

export const HSP_STATUS_LABELS = {
  current: { label: 'Current', class: 'text-green-600 dark:text-green-400' },
  stale: { label: 'Needs update', class: 'text-amber-600 dark:text-amber-400' },
  missing: { label: 'Missing', class: 'text-red-600 dark:text-red-400' },
} as const;
