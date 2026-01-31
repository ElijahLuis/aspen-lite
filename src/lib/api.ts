/**
 * API client for Flask backend
 * Falls back to mock data when API unavailable
 */

import type { Student } from './types';
import { MOCK_STUDENTS } from './mock-data';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

// Clinical data keyed by student ID (mock for now, would come from SSM in v2+)
const CLINICAL_DATA: Record<string, Partial<Student>> = {};

// Initialize clinical data map from mock students
MOCK_STUDENTS.forEach((s) => {
  CLINICAL_DATA[s.id] = {
    conditions: s.conditions,
    allergies: s.allergies,
    medications: s.medications,
    hspStatus: s.hspStatus,
    hspLastUpdated: s.hspLastUpdated,
    recentVisits: s.recentVisits,
  };
});

interface ApiStudent {
  studentId: string;
  firstName: string;
  lastName: string;
  grade: number;
  gender: string;
  ethnicity: string;
  address: string;
  zipCode: string;
  school?: string;
  schoolId?: number;
}

interface SearchResponse {
  students: ApiStudent[];
  total: number;
  hasMore: boolean;
}

/**
 * Check if API is available
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Search students via API, with fallback to mock data
 */
export async function searchStudentsApi(query: string): Promise<Student[]> {
  if (!query.trim()) return [];

  try {
    const response = await fetch(
      `${API_BASE}/search/students?q=${encodeURIComponent(query)}&limit=10`,
      { signal: AbortSignal.timeout(3000) }
    );

    if (!response.ok) {
      throw new Error('API error');
    }

    const data: SearchResponse = await response.json();

    // Convert API students to our Student type, enriching with clinical data
    return data.students.map((apiStudent) => enrichWithClinicalData(apiStudent));
  } catch (error) {
    console.warn('API unavailable, using mock data:', error);
    return searchStudentsMock(query);
  }
}

/**
 * Get a single student by ID
 */
export async function getStudentApi(studentId: string): Promise<Student | null> {
  try {
    const response = await fetch(`${API_BASE}/students/${studentId}`, {
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      throw new Error('Student not found');
    }

    const data = await response.json();
    return enrichWithClinicalData(data.student);
  } catch (error) {
    console.warn('API unavailable, using mock data:', error);
    return MOCK_STUDENTS.find((s) => s.id === studentId) || null;
  }
}

/**
 * Enrich API student data with clinical information
 */
function enrichWithClinicalData(apiStudent: ApiStudent): Student {
  const clinical = CLINICAL_DATA[apiStudent.studentId] || getDefaultClinicalData();

  return {
    id: apiStudent.studentId,
    firstName: apiStudent.firstName,
    lastName: apiStudent.lastName,
    grade: apiStudent.grade,
    room: generateRoom(apiStudent.grade), // Derive from grade for now
    schoolId: String(apiStudent.schoolId || 1),
    conditions: clinical.conditions || [],
    allergies: clinical.allergies || [],
    medications: clinical.medications || [],
    hspStatus: clinical.hspStatus || 'missing',
    hspLastUpdated: clinical.hspLastUpdated || null,
    recentVisits: clinical.recentVisits || [],
  };
}

/**
 * Default clinical data for students without records
 */
function getDefaultClinicalData(): Partial<Student> {
  return {
    conditions: [],
    allergies: [],
    medications: [],
    hspStatus: 'missing',
    hspLastUpdated: null,
    recentVisits: [],
  };
}

/**
 * Generate a room number based on grade
 */
function generateRoom(grade: number): string {
  const floor = Math.min(Math.floor(grade / 3) + 1, 3);
  const room = (grade % 10) * 2 + Math.floor(Math.random() * 10);
  return `${floor}${String(room).padStart(2, '0')}`;
}

/**
 * Fallback: Search mock students
 */
function searchStudentsMock(query: string): Student[] {
  const normalizedQuery = query.toLowerCase().trim();

  return MOCK_STUDENTS.filter((student) => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const lastFirst = `${student.lastName}, ${student.firstName}`.toLowerCase();

    return (
      fullName.includes(normalizedQuery) ||
      lastFirst.includes(normalizedQuery) ||
      student.firstName.toLowerCase().startsWith(normalizedQuery) ||
      student.lastName.toLowerCase().startsWith(normalizedQuery)
    );
  }).slice(0, 10);
}
