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
    return [];
  }
}

async function writeEncounters(encounters: Encounter[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(encounters, null, 2));
}

// GET /api/encounters/:id - Get single encounter
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const encounters = await readEncounters();
    const encounter = encounters.find((e) => e.id === id);

    if (!encounter) {
      return NextResponse.json({ error: 'Encounter not found' }, { status: 404 });
    }

    return NextResponse.json({ encounter });
  } catch (error) {
    console.error('Error reading encounter:', error);
    return NextResponse.json({ error: 'Failed to read encounter' }, { status: 500 });
  }
}

// PATCH /api/encounters/:id - Update encounter
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    const encounters = await readEncounters();
    const index = encounters.findIndex((e) => e.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Encounter not found' }, { status: 404 });
    }

    // Merge updates
    encounters[index] = {
      ...encounters[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await writeEncounters(encounters);

    return NextResponse.json({ encounter: encounters[index] });
  } catch (error) {
    console.error('Error updating encounter:', error);
    return NextResponse.json({ error: 'Failed to update encounter' }, { status: 500 });
  }
}

// DELETE /api/encounters/:id - Delete encounter
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const encounters = await readEncounters();
    const index = encounters.findIndex((e) => e.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Encounter not found' }, { status: 404 });
    }

    encounters.splice(index, 1);
    await writeEncounters(encounters);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting encounter:', error);
    return NextResponse.json({ error: 'Failed to delete encounter' }, { status: 500 });
  }
}
