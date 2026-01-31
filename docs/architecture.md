# Aspen-Lite: Technical Architecture

> **Philosophy:** Boring on purpose. No clever abstractions. Hard-code nurse assumptions.

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 14+ (App Router) | Server components, simple routing, API routes |
| Language | TypeScript | Catch errors early, self-documenting |
| Styling | Tailwind CSS | Utility-first, fast iteration |
| State | React Context + useReducer | Simple, no external deps |
| Persistence (v0) | None (mocked data) | Validate UX first |
| Persistence (v1) | localStorage + API routes | Simple, no backend |
| Persistence (v2+) | SQLite via Prisma or Drizzle | Already have SQLite infra |

---

## Folder Structure

```
aspen-lite/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (providers, shell)
│   ├── page.tsx                  # Clinician Cockpit (main screen)
│   ├── outputs/
│   │   └── page.tsx              # Full outputs view (v1+)
│   ├── settings/
│   │   └── page.tsx              # Preferences
│   └── api/                      # API routes (v1+)
│       ├── encounters/
│       │   └── route.ts          # CRUD for encounters
│       ├── students/
│       │   └── route.ts          # Student search
│       └── exports/
│           └── route.ts          # Generate exports
│
├── components/                   # React components
│   ├── cockpit/                  # Main screen components
│   │   ├── StudentSelector.tsx   # Search + recent students
│   │   ├── StudentContext.tsx    # Context strip (conditions, HSP status)
│   │   ├── EncounterComposer.tsx # The main form
│   │   ├── HspPrompt.tsx         # Conditional HSP update prompt
│   │   └── OutputsTray.tsx       # Collapsed outputs panel
│   ├── ui/                       # Primitive UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Chip.tsx
│   │   ├── Badge.tsx
│   │   └── Card.tsx
│   └── layout/                   # Layout components
│       ├── Header.tsx
│       └── Shell.tsx
│
├── lib/                          # Non-React utilities
│   ├── types.ts                  # TypeScript types/interfaces
│   ├── mock-data.ts              # Mocked students and encounters
│   ├── hsp-detection.ts          # HSP update trigger logic
│   ├── encounter-utils.ts        # Encounter helpers
│   └── constants.ts              # Chief complaints, dispositions, etc.
│
├── hooks/                        # Custom React hooks
│   ├── useEncounter.ts           # Encounter form state
│   ├── useStudentSearch.ts       # Student search with debounce
│   ├── useRecentStudents.ts      # Recent students (localStorage)
│   └── useHspDetection.ts        # Trigger HSP prompts
│
├── context/                      # React Context providers
│   └── EncounterContext.tsx      # App-wide encounter state
│
├── public/                       # Static assets
│   └── ...
│
├── docs/                         # Documentation (existing)
│   ├── product-brief.md
│   ├── ux-flow.md
│   └── architecture.md           # This file
│
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript config
├── package.json                  # Dependencies
└── next.config.js                # Next.js config
```

---

## Data Models

### Core Types

```typescript
// lib/types.ts

// ============================================
// STUDENT (reference data, not owned by us)
// ============================================

interface Student {
  id: string;                     // External ID from SSM/Aspen
  firstName: string;
  lastName: string;
  grade: number;
  room: string;
  schoolId: string;

  // Clinical context (denormalized for speed)
  conditions: Condition[];
  allergies: Allergy[];
  medications: Medication[];

  // HSP status
  hspStatus: 'current' | 'stale' | 'missing';
  hspLastUpdated: Date | null;

  // Visit history (last 5, for context strip)
  recentVisits: VisitSummary[];
}

interface Condition {
  id: string;
  name: string;                   // "Diabetes Type 1"
  severity: 'low' | 'medium' | 'high' | 'critical';
  notes?: string;
}

interface Allergy {
  id: string;
  allergen: string;               // "Peanuts"
  reaction: string;               // "Anaphylaxis"
  severity: 'mild' | 'moderate' | 'severe';
}

interface Medication {
  id: string;
  name: string;                   // "Insulin"
  dosage: string;                 // "As needed per pump"
  schedule: 'prn' | 'daily' | 'scheduled';
}

interface VisitSummary {
  date: Date;
  chiefComplaint: string;
  disposition: string;
  brief: string;                  // One-line summary
}


// ============================================
// ENCOUNTER (our core data)
// ============================================

interface Encounter {
  id: string;                     // UUID
  studentId: string;              // Reference to student
  createdAt: Date;
  updatedAt: Date;

  // Clinical documentation
  chiefComplaint: ChiefComplaint;
  subjective?: string;            // What student/teacher reported
  objective?: string;             // What nurse observed
  assessment: string;             // Nurse's assessment (required)

  // Actions
  actionsTaken: ActionTaken[];    // Multi-select
  disposition: Disposition;       // Required
  quickTags: QuickTag[];          // Optional checkboxes

  // Follow-up
  followUpNeeded: boolean;
  followUpDate?: Date;
  followUpNotes?: string;

  // HSP tracking
  triggeredHspPrompt: boolean;
  hspPromptAction?: 'reviewed' | 'dismissed';
  hspDismissReason?: HspDismissReason;

  // Metadata
  duration?: number;              // Seconds from start to save
  schoolId: string;
}

// Pre-defined options (hard-coded for nurses)
type ChiefComplaint =
  | 'headache'
  | 'stomach_ache'
  | 'injury'
  | 'fever'
  | 'medication_admin'
  | 'blood_sugar_check'
  | 'mental_health'
  | 'other';

type ActionTaken =
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

type Disposition =
  | 'returned_to_class'
  | 'sent_home'
  | 'parent_pickup'
  | 'ems_transport'
  | 'stayed_in_clinic'
  | 'referred_to_provider';

type QuickTag =
  | 'gave_ice'
  | 'gave_bandaid'
  | 'gave_crackers'
  | 'rest_15min'
  | 'rest_30min'
  | 'called_parent'
  | 'left_voicemail'
  | 'emailed_teacher';

type HspDismissReason =
  | 'already_in_hsp'
  | 'one_time_not_ongoing'
  | 'will_update_later';


// ============================================
// ARTIFACT (generated outputs)
// ============================================

interface Artifact {
  id: string;
  type: 'hsp_summary' | 'encounter_log' | 'ssm_export' | 'district_report';
  createdAt: Date;
  studentId?: string;             // If student-specific
  status: 'pending' | 'ready' | 'exported';
  content: string;                // The actual output (text, CSV, etc.)
}
```

---

## State Management

### Approach: React Context + useReducer

No Redux, no Zustand. Just React primitives.

```typescript
// context/EncounterContext.tsx

interface EncounterState {
  // Current session
  selectedStudent: Student | null;
  currentEncounter: Partial<Encounter>;
  recentStudents: Student[];      // Last 5

  // Pending outputs
  pendingArtifacts: Artifact[];

  // UI state
  hspPromptVisible: boolean;
  hspPromptData: HspPromptData | null;
}

type EncounterAction =
  | { type: 'SELECT_STUDENT'; student: Student }
  | { type: 'CLEAR_STUDENT' }
  | { type: 'UPDATE_ENCOUNTER'; field: string; value: unknown }
  | { type: 'SAVE_ENCOUNTER' }
  | { type: 'SHOW_HSP_PROMPT'; data: HspPromptData }
  | { type: 'DISMISS_HSP_PROMPT'; reason: HspDismissReason }
  | { type: 'REVIEW_HSP' }
  | { type: 'ADD_ARTIFACT'; artifact: Artifact };
```

### Why Not External State Library?

- App is single-screen, single-user
- No complex cross-component communication
- No need for time-travel debugging
- Fewer dependencies = faster load

---

## HSP Detection Logic

### Trigger Conditions

```typescript
// lib/hsp-detection.ts

interface HspTrigger {
  type: 'new_medication' | 'new_condition' | 'emergency_action' | 'condition_change';
  description: string;
  confidence: 'high' | 'medium';
}

function detectHspTriggers(
  encounter: Encounter,
  student: Student
): HspTrigger[] {
  const triggers: HspTrigger[] = [];

  // 1. New medication administered not in student's med list
  if (encounter.actionsTaken.includes('medication_given')) {
    const mentionedMeds = extractMedicationMentions(encounter.assessment);
    const knownMeds = student.medications.map(m => m.name.toLowerCase());

    for (const med of mentionedMeds) {
      if (!knownMeds.includes(med.toLowerCase())) {
        triggers.push({
          type: 'new_medication',
          description: `New medication "${med}" not in current HSP`,
          confidence: 'high'
        });
      }
    }
  }

  // 2. EMS called = emergency action
  if (encounter.actionsTaken.includes('ems_called')) {
    triggers.push({
      type: 'emergency_action',
      description: 'EMS was called - may need emergency action plan update',
      confidence: 'high'
    });
  }

  // 3. New condition mentioned in assessment
  const mentionedConditions = extractConditionMentions(encounter.assessment);
  const knownConditions = student.conditions.map(c => c.name.toLowerCase());

  for (const condition of mentionedConditions) {
    if (!knownConditions.includes(condition.toLowerCase())) {
      triggers.push({
        type: 'new_condition',
        description: `Possible new condition "${condition}" mentioned`,
        confidence: 'medium'
      });
    }
  }

  return triggers;
}
```

---

## API Routes (v1+)

### Encounters

```typescript
// app/api/encounters/route.ts

// GET /api/encounters?studentId=xxx
// Returns encounters for a student

// POST /api/encounters
// Create new encounter

// PATCH /api/encounters/:id
// Update encounter (HSP prompt response)
```

### Students

```typescript
// app/api/students/route.ts

// GET /api/students?q=search_term
// Search students by name

// GET /api/students/:id
// Get full student context
```

### Exports

```typescript
// app/api/exports/route.ts

// POST /api/exports/hsp-summary
// Generate HSP summary for student

// POST /api/exports/daily-log
// Generate daily encounter log

// POST /api/exports/ssm-format
// Generate SSM-compatible export
```

---

## Persistence Strategy

### v0: Mocked Data Only

```typescript
// lib/mock-data.ts

export const MOCK_STUDENTS: Student[] = [
  {
    id: 'stu_001',
    firstName: 'Marcus',
    lastName: 'Johnson',
    grade: 7,
    room: '204',
    conditions: [
      { id: 'c1', name: 'Diabetes Type 1', severity: 'critical' }
    ],
    allergies: [
      { id: 'a1', allergen: 'Peanuts', reaction: 'Anaphylaxis', severity: 'severe' }
    ],
    // ... etc
  },
  // 10 more students for testing
];

export const MOCK_ENCOUNTERS: Encounter[] = [];
```

### v1: localStorage + API Routes

```typescript
// Encounters saved to localStorage
localStorage.setItem('aspen_lite_encounters', JSON.stringify(encounters));

// Students still mocked (or pulled from existing Flask API)
```

### v2+: SQLite via Existing Flask Backend

Reuse existing `server_v2.py` infrastructure. Add new tables:

```sql
CREATE TABLE encounters (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  chief_complaint TEXT NOT NULL,
  assessment TEXT NOT NULL,
  actions_taken TEXT,           -- JSON array
  disposition TEXT NOT NULL,
  quick_tags TEXT,              -- JSON array
  triggered_hsp_prompt BOOLEAN DEFAULT FALSE,
  hsp_prompt_action TEXT,
  FOREIGN KEY (student_id) REFERENCES students(student_id)
);

CREATE TABLE artifacts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  student_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'pending',
  content TEXT
);
```

---

## Component Hierarchy

```
Shell
├── Header
│   ├── SchoolBadge
│   ├── Clock
│   └── DarkModeToggle
│
└── ClinicalCockpit (page.tsx)
    ├── StudentSelector
    │   ├── SearchInput
    │   ├── RecentChips
    │   └── SearchResults
    │
    ├── StudentContext (visible when student selected)
    │   ├── StudentHeader
    │   ├── ConditionBadges
    │   ├── AllergyBadges
    │   ├── MedicationList
    │   ├── RecentVisits
    │   └── HspStatus
    │
    ├── EncounterComposer (visible when student selected)
    │   ├── ChiefComplaintSelect
    │   ├── AssessmentTextarea
    │   ├── ActionsTakenCheckboxes
    │   ├── DispositionSelect
    │   ├── QuickTagsChips
    │   ├── FollowUpToggle
    │   └── SaveButtons
    │
    ├── HspPrompt (conditional)
    │   ├── TriggerDescription
    │   ├── ReviewButton
    │   └── DismissDropdown
    │
    └── OutputsTray
        ├── CollapseToggle
        └── ArtifactList
            └── ArtifactCard (repeated)
```

---

## Key Implementation Notes

### 1. No Role-Based Permissions

Hard-code nurse role. No auth system in v0-v1. Single-user app.

```typescript
// Just assume nurse role everywhere
const USER_ROLE = 'nurse' as const;
```

### 2. Keyboard-First

```typescript
// Global keyboard shortcuts
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.metaKey && e.key === 'Enter') {
      saveEncounter();
    }
    if (e.key === 'Escape') {
      clearStudent();
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []);
```

### 3. Speed Metrics Built-In

```typescript
// Track encounter timing
const [startTime, setStartTime] = useState<Date | null>(null);

function onStudentSelect(student: Student) {
  setStartTime(new Date());
  // ...
}

function onSaveEncounter(encounter: Encounter) {
  const duration = startTime
    ? (new Date().getTime() - startTime.getTime()) / 1000
    : undefined;

  saveEncounter({ ...encounter, duration });
}
```

### 4. Fail-Safe Saving

```typescript
// Save to localStorage on every keystroke (debounced)
// Recover draft on page reload
const DRAFT_KEY = 'aspen_lite_encounter_draft';

useEffect(() => {
  const draft = localStorage.getItem(DRAFT_KEY);
  if (draft) {
    // Prompt: "Recover unsaved encounter?"
  }
}, []);
```

---

## Migration Plan from Existing Codebase

The existing vanilla JS + Flask app is a **student browser**. We're building something different.

**Keep:**
- `server_v2.py` (for student data)
- `data/aspen.db` (student records)
- `docs/integrations/` (reference material)

**Replace:**
- All of `app/` (vanilla JS → Next.js)
- All of `views/` (replaced by components)
- `css/main.css` (→ Tailwind)
- `index.html` (→ Next.js layout)

**Coexistence (optional):**
- Keep Flask running on port 5001
- Next.js dev server on port 3000
- Next.js API routes proxy to Flask for student data

---

*Last updated: 2025-01-31*
