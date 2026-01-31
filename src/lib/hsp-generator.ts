import type { Student, Encounter } from './types';
import { CHIEF_COMPLAINTS, DISPOSITIONS, ACTIONS_TAKEN } from './constants';

/**
 * Generate an HSP (Health Safety Plan) summary for a student
 * This is the teacher-facing summary: short, actionable, 3 bullets max
 */
export function generateHspSummary(student: Student, recentEncounters: Encounter[]): string {
  const lines: string[] = [];

  // Header
  lines.push(`# Health Safety Plan Summary`);
  lines.push(`**${student.firstName} ${student.lastName}** | Grade ${student.grade} | Room ${student.room}`);
  lines.push(`Generated: ${new Date().toLocaleDateString()}`);
  lines.push('');

  // Critical alerts (conditions + allergies)
  const alerts: string[] = [];

  student.conditions
    .filter(c => c.severity === 'critical' || c.severity === 'high')
    .forEach(c => {
      alerts.push(`- **${c.name}**${c.notes ? `: ${c.notes}` : ''}`);
    });

  student.allergies
    .filter(a => a.severity === 'severe' || a.severity === 'moderate')
    .forEach(a => {
      alerts.push(`- **ALLERGY: ${a.allergen}** → ${a.reaction}`);
    });

  if (alerts.length > 0) {
    lines.push('## ⚠️ Critical Alerts');
    lines.push(...alerts);
    lines.push('');
  }

  // Medications (if any)
  if (student.medications.length > 0) {
    lines.push('## 💊 Medications');
    student.medications.forEach(med => {
      const scheduleLabel = med.schedule === 'prn' ? 'As needed' : med.schedule === 'daily' ? 'Daily' : 'Scheduled';
      lines.push(`- ${med.name} (${med.dosage}) - ${scheduleLabel}`);
    });
    lines.push('');
  }

  // Emergency actions
  const emergencyConditions = student.conditions.filter(c => c.severity === 'critical');
  const severeAllergies = student.allergies.filter(a => a.severity === 'severe');

  if (emergencyConditions.length > 0 || severeAllergies.length > 0) {
    lines.push('## 🚨 Emergency Actions');

    if (severeAllergies.some(a => a.reaction.toLowerCase().includes('anaphylaxis'))) {
      lines.push('- **Anaphylaxis**: Administer EpiPen immediately, call 911, notify nurse');
    }

    if (emergencyConditions.some(c => c.name.toLowerCase().includes('diabetes'))) {
      lines.push('- **Low blood sugar**: Give juice/glucose tabs, notify nurse if unresponsive');
    }

    if (emergencyConditions.some(c => c.name.toLowerCase().includes('seizure') || c.name.toLowerCase().includes('epilepsy'))) {
      lines.push('- **Seizure**: Clear area, do not restrain, time the seizure, call nurse immediately');
    }

    if (emergencyConditions.some(c => c.name.toLowerCase().includes('asthma'))) {
      lines.push('- **Asthma attack**: Allow use of inhaler, sit upright, call nurse if no improvement');
    }

    lines.push('');
  }

  // Recent visit summary (last 3)
  if (recentEncounters.length > 0) {
    lines.push('## 📋 Recent Visits');
    recentEncounters.slice(0, 3).forEach(enc => {
      const complaint = CHIEF_COMPLAINTS.find(c => c.value === enc.chiefComplaint)?.label || enc.chiefComplaint;
      const disposition = DISPOSITIONS.find(d => d.value === enc.disposition)?.label || enc.disposition;
      const date = new Date(enc.createdAt).toLocaleDateString();
      lines.push(`- ${date}: ${complaint} → ${disposition}`);
    });
    lines.push('');
  }

  // Teacher quick reference
  lines.push('## 📞 Quick Reference');
  lines.push('- **School Nurse**: Ext. 100');
  lines.push('- **Emergency**: Call 911, then notify office');
  lines.push('');

  lines.push('---');
  lines.push('*This summary is for staff reference only. Full HSP on file in nurse\'s office.*');

  return lines.join('\n');
}

/**
 * Generate a short 3-line teacher alert card
 */
export function generateTeacherAlert(student: Student): string[] {
  const alerts: string[] = [];

  // Line 1: Critical condition or allergy
  const criticalCondition = student.conditions.find(c => c.severity === 'critical');
  const severeAllergy = student.allergies.find(a => a.severity === 'severe');

  if (criticalCondition) {
    alerts.push(`⚠️ ${criticalCondition.name}`);
  }
  if (severeAllergy) {
    alerts.push(`🚫 ${severeAllergy.allergen} allergy (${severeAllergy.reaction})`);
  }

  // Line 2: Key medication if any
  const keyMed = student.medications.find(m => m.schedule === 'prn' || m.schedule === 'scheduled');
  if (keyMed) {
    alerts.push(`💊 Has ${keyMed.name} ${keyMed.schedule === 'prn' ? '(PRN)' : ''}`);
  }

  // Line 3: Emergency action if needed
  if (severeAllergy?.reaction.toLowerCase().includes('anaphylaxis')) {
    alerts.push(`🚨 EpiPen required for reactions`);
  } else if (criticalCondition?.name.toLowerCase().includes('diabetes')) {
    alerts.push(`🚨 Monitor for low blood sugar symptoms`);
  } else if (criticalCondition?.name.toLowerCase().includes('seizure') || criticalCondition?.name.toLowerCase().includes('epilepsy')) {
    alerts.push(`🚨 Seizure protocol on file`);
  }

  return alerts.slice(0, 3);
}

/**
 * Generate encounter log export (CSV format)
 */
export function generateEncounterLogCsv(encounters: Encounter[], students: Map<string, Student>): string {
  const headers = [
    'Date',
    'Time',
    'Student',
    'Grade',
    'Chief Complaint',
    'Assessment',
    'Actions',
    'Disposition',
    'Duration (sec)',
  ];

  const rows = encounters.map(enc => {
    const student = students.get(enc.studentId);
    const date = new Date(enc.createdAt);
    const complaint = CHIEF_COMPLAINTS.find(c => c.value === enc.chiefComplaint)?.label || enc.chiefComplaint;
    const disposition = DISPOSITIONS.find(d => d.value === enc.disposition)?.label || enc.disposition;
    const actions = enc.actionsTaken
      .map(a => ACTIONS_TAKEN.find(at => at.value === a)?.label || a)
      .join('; ');

    return [
      date.toLocaleDateString(),
      date.toLocaleTimeString(),
      student ? `${student.lastName}, ${student.firstName}` : enc.studentId,
      student?.grade || '',
      complaint,
      `"${enc.assessment.replace(/"/g, '""')}"`,
      `"${actions}"`,
      disposition,
      enc.duration || '',
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Generate SSM-compatible export format
 */
export function generateSsmExport(encounters: Encounter[]): object[] {
  return encounters.map(enc => ({
    encounter_id: enc.id,
    student_id: enc.studentId,
    encounter_date: enc.createdAt,
    chief_complaint_code: enc.chiefComplaint,
    assessment_notes: enc.assessment,
    subjective_notes: enc.subjective || null,
    objective_notes: enc.objective || null,
    interventions: enc.actionsTaken,
    disposition_code: enc.disposition,
    follow_up_required: enc.followUpNeeded,
    follow_up_date: enc.followUpDate || null,
    duration_seconds: enc.duration || null,
    hsp_update_triggered: enc.triggeredHspPrompt,
    hsp_action: enc.hspPromptAction || null,
  }));
}
