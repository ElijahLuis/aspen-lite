import type { Student, Encounter } from './types';

export const MOCK_STUDENTS: Student[] = [
  {
    id: 'stu_001',
    firstName: 'Marcus',
    lastName: 'Johnson',
    grade: 7,
    room: '204',
    schoolId: 'sch_001',
    conditions: [
      { id: 'c1', name: 'Diabetes Type 1', severity: 'critical', notes: 'Insulin pump, check before lunch' },
    ],
    allergies: [
      { id: 'a1', allergen: 'Peanuts', reaction: 'Anaphylaxis', severity: 'severe' },
    ],
    medications: [
      { id: 'm1', name: 'Insulin', dosage: 'Per pump settings', schedule: 'scheduled' },
      { id: 'm2', name: 'Glucagon', dosage: '1mg IM', schedule: 'prn' },
    ],
    hspStatus: 'current',
    hspLastUpdated: '2025-01-15',
    recentVisits: [
      { date: '2025-01-28', chiefComplaint: 'headache', disposition: 'returned_to_class', brief: 'Mild headache, gave ice, returned to class' },
      { date: '2025-01-22', chiefComplaint: 'blood_sugar_check', disposition: 'returned_to_class', brief: 'Routine BG check: 142 mg/dL' },
    ],
  },
  {
    id: 'stu_002',
    firstName: 'Aisha',
    lastName: 'Thompson',
    grade: 5,
    room: '112',
    schoolId: 'sch_001',
    conditions: [
      { id: 'c2', name: 'Asthma', severity: 'medium', notes: 'Exercise-induced, has inhaler' },
    ],
    allergies: [],
    medications: [
      { id: 'm3', name: 'Albuterol inhaler', dosage: '2 puffs', schedule: 'prn' },
    ],
    hspStatus: 'current',
    hspLastUpdated: '2024-09-05',
    recentVisits: [
      { date: '2025-01-27', chiefComplaint: 'other', disposition: 'returned_to_class', brief: 'Used inhaler after PE, breathing normalized' },
    ],
  },
  {
    id: 'stu_003',
    firstName: 'Devon',
    lastName: 'Williams',
    grade: 8,
    room: '301',
    schoolId: 'sch_001',
    conditions: [],
    allergies: [
      { id: 'a2', allergen: 'Bee stings', reaction: 'Swelling', severity: 'moderate' },
    ],
    medications: [],
    hspStatus: 'missing',
    hspLastUpdated: null,
    recentVisits: [],
  },
  {
    id: 'stu_004',
    firstName: 'Sofia',
    lastName: 'Rodriguez',
    grade: 6,
    room: '215',
    schoolId: 'sch_001',
    conditions: [
      { id: 'c3', name: 'Epilepsy', severity: 'high', notes: 'Seizure action plan on file' },
    ],
    allergies: [],
    medications: [
      { id: 'm4', name: 'Keppra', dosage: '500mg', schedule: 'daily' },
    ],
    hspStatus: 'stale',
    hspLastUpdated: '2024-03-10',
    recentVisits: [
      { date: '2025-01-20', chiefComplaint: 'dizziness', disposition: 'parent_pickup', brief: 'Dizzy, mild confusion. Parent picked up for neuro follow-up.' },
    ],
  },
  {
    id: 'stu_005',
    firstName: 'James',
    lastName: 'Kim',
    grade: 4,
    room: '108',
    schoolId: 'sch_001',
    conditions: [],
    allergies: [
      { id: 'a3', allergen: 'Latex', reaction: 'Rash', severity: 'mild' },
    ],
    medications: [],
    hspStatus: 'current',
    hspLastUpdated: '2024-08-20',
    recentVisits: [
      { date: '2025-01-29', chiefComplaint: 'stomach_ache', disposition: 'returned_to_class', brief: 'Mild stomach ache, rested 15 min, felt better' },
      { date: '2025-01-24', chiefComplaint: 'injury', disposition: 'returned_to_class', brief: 'Scraped knee at recess, cleaned and bandaged' },
    ],
  },
  {
    id: 'stu_006',
    firstName: 'Maya',
    lastName: 'Patel',
    grade: 3,
    room: '105',
    schoolId: 'sch_001',
    conditions: [
      { id: 'c4', name: 'Anxiety disorder', severity: 'medium', notes: 'Has calming strategies, sees school counselor' },
    ],
    allergies: [],
    medications: [],
    hspStatus: 'current',
    hspLastUpdated: '2024-11-12',
    recentVisits: [
      { date: '2025-01-30', chiefComplaint: 'mental_health', disposition: 'returned_to_class', brief: 'Anxious before test, used breathing exercises, returned calm' },
    ],
  },
  {
    id: 'stu_007',
    firstName: 'Ethan',
    lastName: 'Brown',
    grade: 7,
    room: '207',
    schoolId: 'sch_001',
    conditions: [
      { id: 'c5', name: 'ADHD', severity: 'low' },
    ],
    allergies: [
      { id: 'a4', allergen: 'Penicillin', reaction: 'Hives', severity: 'moderate' },
    ],
    medications: [
      { id: 'm5', name: 'Adderall', dosage: '10mg', schedule: 'daily' },
    ],
    hspStatus: 'current',
    hspLastUpdated: '2024-09-01',
    recentVisits: [],
  },
  {
    id: 'stu_008',
    firstName: 'Olivia',
    lastName: 'Chen',
    grade: 2,
    room: '102',
    schoolId: 'sch_001',
    conditions: [],
    allergies: [
      { id: 'a5', allergen: 'Tree nuts', reaction: 'Throat swelling', severity: 'severe' },
    ],
    medications: [
      { id: 'm6', name: 'EpiPen', dosage: '0.15mg', schedule: 'prn' },
    ],
    hspStatus: 'current',
    hspLastUpdated: '2024-08-15',
    recentVisits: [
      { date: '2025-01-26', chiefComplaint: 'headache', disposition: 'returned_to_class', brief: 'Mild headache, drank water, felt better' },
    ],
  },
  {
    id: 'stu_009',
    firstName: 'Jayden',
    lastName: 'Martinez',
    grade: 5,
    room: '114',
    schoolId: 'sch_001',
    conditions: [
      { id: 'c6', name: 'Celiac disease', severity: 'medium', notes: 'Strict gluten-free diet' },
    ],
    allergies: [],
    medications: [],
    hspStatus: 'current',
    hspLastUpdated: '2024-10-05',
    recentVisits: [
      { date: '2025-01-25', chiefComplaint: 'stomach_ache', disposition: 'stayed_in_clinic', brief: 'GI distress, possible gluten exposure. Parent notified.' },
    ],
  },
  {
    id: 'stu_010',
    firstName: 'Emma',
    lastName: 'Taylor',
    grade: 6,
    room: '210',
    schoolId: 'sch_001',
    conditions: [],
    allergies: [],
    medications: [],
    hspStatus: 'missing',
    hspLastUpdated: null,
    recentVisits: [
      { date: '2025-01-29', chiefComplaint: 'fever', disposition: 'sent_home', brief: 'Temp 101.2F, sent home' },
    ],
  },
];

// Start with empty encounters - they get added during the session
export const MOCK_ENCOUNTERS: Encounter[] = [];

// Helper to search students
export function searchStudents(query: string): Student[] {
  if (!query.trim()) return [];

  const normalizedQuery = query.toLowerCase().trim();

  return MOCK_STUDENTS.filter(student => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const lastFirst = `${student.lastName}, ${student.firstName}`.toLowerCase();

    return (
      fullName.includes(normalizedQuery) ||
      lastFirst.includes(normalizedQuery) ||
      student.firstName.toLowerCase().startsWith(normalizedQuery) ||
      student.lastName.toLowerCase().startsWith(normalizedQuery)
    );
  }).slice(0, 8); // Limit results
}

// Helper to get student by ID
export function getStudentById(id: string): Student | undefined {
  return MOCK_STUDENTS.find(s => s.id === id);
}
