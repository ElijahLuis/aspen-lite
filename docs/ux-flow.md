# Aspen-Lite: UX Flow & Information Architecture

> **Design principle:** One screen, one user, one atomic unit (the encounter).

---

## Information Architecture

### The "Clinician Cockpit" Model

There is **one main screen**. Everything happens here.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER: School context + time + dark mode                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  STUDENT SELECTOR (gate)                                         │   │
│  │  ┌──────────────────────────────────────────────┐               │   │
│  │  │ 🔍 Search: [___________________________]     │               │   │
│  │  │                                              │               │   │
│  │  │ Recent:  [Marcus J.] [Aisha T.] [Devon W.]  │               │   │
│  │  └──────────────────────────────────────────────┘               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  STUDENT CONTEXT STRIP (appears after selection)                 │   │
│  │                                                                   │   │
│  │  Marcus Johnson, Gr 7  │  🔴 Diabetes T1  ⚠️ Peanut allergy     │   │
│  │  Last visit: Jan 28 (headache)  │  HSP: Current ✓               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  ENCOUNTER COMPOSER (the main event)                             │   │
│  │                                                                   │   │
│  │  Chief complaint: [Stomach ache          ▼]                      │   │
│  │                                                                   │   │
│  │  Assessment:                                                      │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │ Mild abdominal discomfort, no fever. Ate breakfast.      │   │   │
│  │  │ No vomiting. Pain 3/10.                                   │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  │                                                                   │   │
│  │  Action taken: [Rest in clinic ▼] [Returned to class ▼]         │   │
│  │                                                                   │   │
│  │  Quick tags: [□ Gave ice] [□ Called parent] [□ Sent home]       │   │
│  │                                                                   │   │
│  │                              [Save Encounter]  [Save + Next]     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  HSP PROMPT (conditional—appears when encounter implies update)  │   │
│  │                                                                   │   │
│  │  ⚠️ This encounter may require HSP update                        │   │
│  │     Reason: New medication documented (Tylenol PRN)              │   │
│  │                                                                   │   │
│  │     [Review HSP Summary]  [Not needed—dismiss]                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌────────────────────────────┐                                        │
│  │  OUTPUTS TRAY (collapsed)  │  ← Expand to see generated artifacts  │
│  │  ▶ 3 pending exports       │                                        │
│  └────────────────────────────┘                                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Screen Components

### 1. Student Selector (Gate)

**Purpose:** Select who you're documenting for. This is the entry point.

**Behavior:**
- Search-as-you-type (debounced 200ms)
- Shows 5 most recent students as chips
- Keyboard-navigable (arrow keys + enter)
- Selecting a student reveals the Student Context Strip + Encounter Composer

**Wireframe notes:**
```
┌────────────────────────────────────────────────────────┐
│  🔍 [                                              ]   │
│                                                        │
│  Recent: ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│          │Maria │ │Devon │ │Aisha │ │James │         │
│          │  M.  │ │  W.  │ │  T.  │ │  K.  │         │
│          └──────┘ └──────┘ └──────┘ └──────┘         │
│                                                        │
│  [Search results appear here as you type]             │
└────────────────────────────────────────────────────────┘
```

**States:**
- Empty (no student selected) → Show search + recent
- Selected → Minimize to small bar showing selected student

---

### 2. Student Context Strip

**Purpose:** Instant situational awareness. What do I need to know RIGHT NOW?

**Always visible when student is selected:**
- Name, grade
- Active conditions (color-coded severity)
- Allergies (always prominent)
- Last visit summary
- HSP status (current/stale/missing)

**Design principle:** Glanceable. No clicking to see critical info.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Marcus Johnson                                                          │
│  Grade 7 • Room 204                                                      │
│                                                                          │
│  ┌──────────────┐ ┌─────────────────┐ ┌──────────────────┐              │
│  │ 🔴 Diabetes  │ │ ⚠️ Peanut       │ │ 💊 Insulin pump  │              │
│  │    Type 1   │ │    allergy      │ │                  │              │
│  └──────────────┘ └─────────────────┘ └──────────────────┘              │
│                                                                          │
│  Last visit: Jan 28 — "Headache, sent to class with ice"                │
│  HSP: ✓ Current (updated Jan 15)                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 3. Encounter Composer

**Purpose:** The core atomic unit. Document what happened.

**Fields (v0 hard-coded structure):**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Chief complaint | Dropdown + custom | Yes | Common complaints pre-loaded |
| Subjective | Text area | No | What the student/teacher reported |
| Objective | Text area | No | What you observed/measured |
| Assessment | Text area | Yes | Your clinical assessment |
| Action taken | Multi-select | Yes | What you did |
| Disposition | Single select | Yes | Returned to class / Sent home / etc. |
| Quick tags | Checkboxes | No | Common interventions (ice, band-aid, etc.) |
| Follow-up needed | Toggle + date | No | Schedule reminder |

**Keyboard shortcuts:**
- `Cmd/Ctrl + Enter` → Save encounter
- `Cmd/Ctrl + Shift + Enter` → Save + clear for next student
- `Escape` → Clear current student, return to selector

**Interaction flow:**
```
1. Type chief complaint (or select from dropdown)
2. Tab to assessment (skip subjective/objective for quick visits)
3. Click action tags
4. Select disposition
5. Save

Target time: < 90 seconds for routine visit
```

---

### 4. HSP Prompt (Conditional)

**Purpose:** Invisible compliance. Detect when encounter implies HSP needs update.

**Triggers:**
- New diagnosis mentioned in assessment
- New medication administered (not previously documented)
- Emergency action change (e.g., "called 911")
- Condition status change (e.g., "diabetes now insulin-dependent")

**Behavior:**
- Appears AFTER encounter is saved (not blocking)
- Yellow/amber alert styling
- Two options: "Review HSP Summary" or "Not needed—dismiss"
- Dismissal requires selecting a reason (audit trail)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ⚠️  This encounter may require an HSP update                           │
│                                                                          │
│  Detected: New medication "Tylenol PRN" not in current HSP              │
│                                                                          │
│  ┌─────────────────────┐    ┌──────────────────────────────────────┐   │
│  │  Review HSP Summary │    │  Not needed ▼                        │   │
│  └─────────────────────┘    │  ○ Already in HSP (system missed it) │   │
│                              │  ○ One-time, not ongoing             │   │
│                              │  ○ Will update later                 │   │
│                              └──────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 5. Outputs Tray (Collapsed)

**Purpose:** Show what artifacts have been generated, without cluttering the main workflow.

**Default state:** Collapsed to single line showing count

**Expanded state:** List of pending exports and generated summaries

```
Collapsed:
┌──────────────────────────────────────┐
│  ▶ Outputs (3 pending)               │
└──────────────────────────────────────┘

Expanded:
┌──────────────────────────────────────────────────────────────────────────┐
│  ▼ Outputs                                                               │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ 📄 HSP Summary — Marcus Johnson                    [Copy] [Export] │ │
│  │    Generated: Jan 31, 10:42am                                      │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ 📊 Daily Encounter Log                             [Export CSV]    │ │
│  │    12 encounters today                                             │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ 📋 SSM Import Ready                                [Download]      │ │
│  │    Pending: 5 encounters                                           │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## User Flow: Complete Encounter

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  1. STUDENT ARRIVES                                                     │
│     └─▶ Nurse opens Aspen-Lite (or it's already open)                  │
│                                                                         │
│  2. SELECT STUDENT                                                      │
│     └─▶ Type first few letters of name                                 │
│     └─▶ Select from results (or click recent chip)                     │
│     └─▶ Context strip appears with conditions/allergies                │
│                                                                         │
│  3. DOCUMENT ENCOUNTER                                                  │
│     └─▶ Select chief complaint from dropdown                           │
│     └─▶ Type assessment (free text)                                    │
│     └─▶ Check action tags (ice, band-aid, called parent)              │
│     └─▶ Select disposition (returned to class)                         │
│                                                                         │
│  4. SAVE                                                                │
│     └─▶ Press Cmd+Enter or click Save                                  │
│     └─▶ Encounter saved, student added to "recent"                     │
│                                                                         │
│  5. HSP CHECK (conditional)                                             │
│     └─▶ If encounter triggers HSP detection:                           │
│         └─▶ Prompt appears                                              │
│         └─▶ Nurse reviews or dismisses with reason                     │
│                                                                         │
│  6. READY FOR NEXT                                                      │
│     └─▶ "Save + Next" clears form, returns to student selector         │
│     └─▶ Or close tab, encounter is persisted                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Navigation Model

### Routes (Minimal)

| Route | Purpose |
|-------|---------|
| `/` | Clinician Cockpit (the main app) |
| `/outputs` | Full outputs view (optional, v1+) |
| `/settings` | Preferences (school, quick tags, etc.) |

**That's it.** No student detail pages. No encounter history browser. No admin routes.

Student context is inline. Encounter history is a collapsible section in the context strip if needed.

---

## Responsive Behavior

**Primary target:** Desktop (1200px+)
**Secondary:** Tablet landscape (1024px)
**Not optimized for:** Phone

Layout adjustments:
- Cockpit is single-column on tablet
- Student context strip stacks vertically
- Outputs tray moves to bottom sheet on tablet

---

## Accessibility Notes

- All interactive elements keyboard accessible
- Focus management: After save, focus returns to student selector
- Screen reader: Announce HSP prompts as alerts
- Color is not the only indicator (icons + text labels)
- Minimum touch target: 44x44px

---

## Visual Design Direction

**Tone:** Clinical, calm, efficient. Not playful.

**Color palette:**
- Background: Neutral white / dark gray (dark mode)
- Primary action: Blue (save, confirm)
- Warning/HSP prompt: Amber
- Critical condition: Red badge
- Success: Green (brief flash on save)

**Typography:**
- System fonts (fast loading)
- Monospace for IDs/codes
- Clear hierarchy (name large, details smaller)

**Spacing:**
- Generous padding (reduce visual stress)
- Clear section separation
- Breathing room between interactive elements

---

*Last updated: 2025-01-31*
