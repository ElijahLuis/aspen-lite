import type { Encounter, Student, HspTrigger, EncounterFormState } from './types';

// Common medication names to detect
const MEDICATION_PATTERNS = [
  'tylenol', 'acetaminophen', 'ibuprofen', 'advil', 'motrin',
  'benadryl', 'diphenhydramine', 'epipen', 'epinephrine',
  'albuterol', 'inhaler', 'insulin', 'glucagon',
  'adderall', 'ritalin', 'concerta', 'vyvanse',
  'keppra', 'depakote', 'diastat', 'diazepam',
  'zyrtec', 'claritin', 'flonase', 'singulair',
];

// Common condition names to detect
const CONDITION_PATTERNS = [
  'diabetes', 'asthma', 'seizure', 'epilepsy', 'allergy',
  'anaphylaxis', 'adhd', 'anxiety', 'depression',
  'migraine', 'celiac', 'concussion', 'fracture',
];

/**
 * Extract medication mentions from free text
 */
export function extractMedicationMentions(text: string): string[] {
  const normalizedText = text.toLowerCase();
  const found: string[] = [];

  for (const med of MEDICATION_PATTERNS) {
    if (normalizedText.includes(med)) {
      // Capitalize first letter for display
      found.push(med.charAt(0).toUpperCase() + med.slice(1));
    }
  }

  return found;
}

/**
 * Extract condition mentions from free text
 */
export function extractConditionMentions(text: string): string[] {
  const normalizedText = text.toLowerCase();
  const found: string[] = [];

  for (const condition of CONDITION_PATTERNS) {
    if (normalizedText.includes(condition)) {
      found.push(condition.charAt(0).toUpperCase() + condition.slice(1));
    }
  }

  return found;
}

/**
 * Detect if an encounter should trigger an HSP update prompt
 */
export function detectHspTriggers(
  form: EncounterFormState,
  student: Student
): HspTrigger[] {
  const triggers: HspTrigger[] = [];
  const assessmentText = form.assessment + ' ' + (form.subjective || '') + ' ' + (form.objective || '');

  // 1. New medication administered not in student's med list
  if (form.actionsTaken.includes('medication_given')) {
    const mentionedMeds = extractMedicationMentions(assessmentText);
    const knownMeds = student.medications.map((m) => m.name.toLowerCase());

    for (const med of mentionedMeds) {
      if (!knownMeds.some((k) => k.includes(med.toLowerCase()))) {
        triggers.push({
          type: 'new_medication',
          description: `New medication "${med}" not in current HSP`,
          confidence: 'high',
        });
      }
    }

    // If medication given but none detected in text
    if (mentionedMeds.length === 0) {
      triggers.push({
        type: 'new_medication',
        description: 'Medication administered - verify HSP has current med list',
        confidence: 'medium',
      });
    }
  }

  // 2. EMS called = emergency action
  if (form.actionsTaken.includes('ems_called')) {
    triggers.push({
      type: 'emergency_action',
      description: 'EMS was called - may need emergency action plan update',
      confidence: 'high',
    });
  }

  // 3. EMS transport disposition
  if (form.disposition === 'ems_transport') {
    triggers.push({
      type: 'emergency_action',
      description: 'Student transported by EMS - review emergency procedures',
      confidence: 'high',
    });
  }

  // 4. New condition mentioned in assessment
  const mentionedConditions = extractConditionMentions(assessmentText);
  const knownConditions = student.conditions.map((c) => c.name.toLowerCase());

  for (const condition of mentionedConditions) {
    const isKnown = knownConditions.some((k) => k.includes(condition.toLowerCase()));
    if (!isKnown) {
      triggers.push({
        type: 'new_condition',
        description: `Possible new condition "${condition}" mentioned`,
        confidence: 'medium',
      });
    }
  }

  // 5. Blood sugar checked for non-diabetic student
  if (form.actionsTaken.includes('blood_sugar_checked')) {
    const hasDiabetes = student.conditions.some((c) =>
      c.name.toLowerCase().includes('diabetes')
    );
    if (!hasDiabetes) {
      triggers.push({
        type: 'new_condition',
        description: 'Blood sugar checked - student may need diabetes monitoring in HSP',
        confidence: 'medium',
      });
    }
  }

  // 6. Stale HSP status
  if (student.hspStatus === 'stale') {
    triggers.push({
      type: 'condition_change',
      description: `HSP is marked as stale (last updated ${student.hspLastUpdated || 'unknown'})`,
      confidence: 'medium',
    });
  }

  // 7. Missing HSP for student with conditions
  if (student.hspStatus === 'missing' && (student.conditions.length > 0 || student.allergies.length > 0)) {
    triggers.push({
      type: 'condition_change',
      description: 'Student has conditions/allergies but no HSP on file',
      confidence: 'high',
    });
  }

  return triggers;
}
