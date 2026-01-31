import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

const DATA_FILE = path.join(process.cwd(), 'data', 'encounters.json');

interface Encounter {
  id: string;
  studentId: string;
  createdAt: string;
  updatedAt: string;
  chiefComplaint: string;
  subjective?: string;
  objective?: string;
  assessment: string;
  actionsTaken: string[];
  disposition: string;
  quickTags: string[];
  followUpNeeded: boolean;
  followUpDate?: string;
  followUpNotes?: string;
  triggeredHspPrompt: boolean;
  hspPromptAction?: string;
  hspDismissReason?: string;
  duration?: number;
  schoolId: string;
}

async function readEncounters(): Promise<Encounter[]> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    // File doesn't exist yet, return empty array
    return [];
  }
}

async function writeEncounters(encounters: Encounter[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(encounters, null, 2));
}

// GET /api/encounters - List encounters with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const date = searchParams.get('date'); // YYYY-MM-DD format
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let encounters = await readEncounters();

    // Filter by student
    if (studentId) {
      encounters = encounters.filter((e) => e.studentId === studentId);
    }

    // Filter by date
    if (date) {
      encounters = encounters.filter((e) => e.createdAt.startsWith(date));
    }

    // Sort by most recent first
    encounters.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Paginate
    const total = encounters.length;
    const paginatedEncounters = encounters.slice(offset, offset + limit);

    return NextResponse.json({
      encounters: paginatedEncounters,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error('Error reading encounters:', error);
    return NextResponse.json({ error: 'Failed to read encounters' }, { status: 500 });
  }
}

// POST /api/encounters - Create new encounter
export async function POST(request: NextRequest) {
  try {
    const encounter: Encounter = await request.json();

    // Validate required fields
    if (!encounter.studentId || !encounter.assessment || !encounter.disposition) {
      return NextResponse.json(
        { error: 'Missing required fields: studentId, assessment, disposition' },
        { status: 400 }
      );
    }

    // Generate ID if not provided
    if (!encounter.id) {
      encounter.id = `enc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }

    // Set timestamps
    const now = new Date().toISOString();
    encounter.createdAt = encounter.createdAt || now;
    encounter.updatedAt = now;

    // Read existing encounters and add new one
    const encounters = await readEncounters();
    encounters.push(encounter);
    await writeEncounters(encounters);

    return NextResponse.json({ encounter }, { status: 201 });
  } catch (error) {
    console.error('Error creating encounter:', error);
    return NextResponse.json({ error: 'Failed to create encounter' }, { status: 500 });
  }
}
