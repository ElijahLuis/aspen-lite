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
  chiefComplaint: string;
  disposition: string;
  duration?: number;
  triggeredHspPrompt: boolean;
  hspPromptAction?: string;
}

async function readEncounters(): Promise<Encounter[]> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// GET /api/encounters/stats - Get encounter statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('from'); // YYYY-MM-DD
    const dateTo = searchParams.get('to'); // YYYY-MM-DD

    let encounters = await readEncounters();

    // Filter by date range
    if (dateFrom) {
      encounters = encounters.filter((e) => e.createdAt >= dateFrom);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setDate(toDate.getDate() + 1);
      encounters = encounters.filter((e) => e.createdAt < toDate.toISOString());
    }

    // Calculate statistics
    const totalEncounters = encounters.length;
    const uniqueStudents = new Set(encounters.map((e) => e.studentId)).size;

    // Chief complaints breakdown
    const chiefComplaints: Record<string, number> = {};
    encounters.forEach((e) => {
      chiefComplaints[e.chiefComplaint] = (chiefComplaints[e.chiefComplaint] || 0) + 1;
    });

    // Dispositions breakdown
    const dispositions: Record<string, number> = {};
    encounters.forEach((e) => {
      dispositions[e.disposition] = (dispositions[e.disposition] || 0) + 1;
    });

    // Average duration (only for encounters with duration)
    const durationsWithData = encounters.filter((e) => e.duration && e.duration > 0);
    const avgDuration = durationsWithData.length > 0
      ? Math.round(durationsWithData.reduce((sum, e) => sum + (e.duration || 0), 0) / durationsWithData.length)
      : 0;

    // HSP prompt stats
    const hspTriggered = encounters.filter((e) => e.triggeredHspPrompt).length;
    const hspReviewed = encounters.filter((e) => e.hspPromptAction === 'reviewed').length;
    const hspDismissed = encounters.filter((e) => e.hspPromptAction === 'dismissed').length;

    // Encounters by day (last 7 days)
    const byDay: Record<string, number> = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      byDay[dateStr] = 0;
    }
    encounters.forEach((e) => {
      const dateStr = e.createdAt.split('T')[0];
      if (byDay.hasOwnProperty(dateStr)) {
        byDay[dateStr]++;
      }
    });

    return NextResponse.json({
      stats: {
        totalEncounters,
        uniqueStudents,
        avgDuration,
        chiefComplaints,
        dispositions,
        hsp: {
          triggered: hspTriggered,
          reviewed: hspReviewed,
          dismissed: hspDismissed,
        },
        byDay,
      },
    });
  } catch (error) {
    console.error('Error calculating stats:', error);
    return NextResponse.json({ error: 'Failed to calculate stats' }, { status: 500 });
  }
}
