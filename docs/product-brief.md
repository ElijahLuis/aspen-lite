# Aspen-Lite: Product Brief

> **One sentence:** A clinician-first encounter app that compiles nurse intent into artifacts for everyone else.

---

## The Problem

School nurses operate in a fragmented tool landscape:

| System | What it does | Pain |
|--------|--------------|------|
| **SSM** | Clinical documentation, service logs, compliance, IEPs | System of record, but heavy |
| **Aspen** | Health Safety Plans (HSPs), teacher alerts | Plans are too long; teachers don't read them |
| **Google Tools** | Quick notes, communication | Data doesn't flow back |

The result: **constant context switching**. Nurses document the same encounter 2-3 times across systems. Compliance becomes manual labor instead of a byproduct of good care.

---

## The Insight

Aspen-Lite is **not a re-skin of Aspen**. It's a different product.

**Aspen** = a database with many stakeholder dashboards
**Aspen-Lite** = a compiler that turns clinician intent into outputs

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  Nurse works    │ ──▶ │  Aspen-Lite      │ ──▶ │  Artifacts out      │
│  (encounters)   │     │  (the compiler)  │     │  (HSPs, exports)    │
└─────────────────┘     └──────────────────┘     └─────────────────────┘
```

Other stakeholders consume **outputs**, not dashboards.

---

## Jobs To Be Done

### Primary JTBD (Nurse)

1. **"Help me document this encounter before the next kid walks in"**
   - Student presented → I assessed → I acted → done
   - Speed is everything. Note should be complete before the bell rings.

2. **"Tell me if what I just did requires an HSP update"**
   - New diagnosis? New medication? Changed emergency action?
   - Don't make me remember compliance rules—detect and prompt.

3. **"Let me see this student's context instantly"**
   - Active conditions, meds, recent visits, HSP status
   - One glance, no digging.

4. **"Generate the paperwork I owe to others"**
   - HSP summary for teachers (short, actionable)
   - Export for district (counts, compliance)
   - I produce it; I don't manage their view of it.

### Secondary JTBD (Teacher—as output consumer)

5. **"Just tell me what I need to know about this kid"**
   - 3 bullets max. Emergency action if applicable.
   - Not a 4-page care plan.

### Tertiary JTBD (Admin—as export consumer)

6. **"Give me the numbers for the state report"**
   - Encounter counts, compliance percentages, export schemas
   - They get data, not workflow control.

---

## Primary User & Assumptions

### User: School Nurse (CPS)

**Hard-coded assumptions (v0–v1):**

- Works at 1 school at a time (multi-school floaters handled later)
- Uses SSM as clinical system of record
- Needs to produce HSPs for Aspen
- Has 5-15 minutes between students on a busy day; often less
- Prefers keyboard-first, minimal clicks
- Does not need granular permission controls (single-user app)

**Not our user (explicitly):**

- District administrators (they get exports)
- Teachers (they get summaries)
- IT departments (they get schemas)
- Parents (out of scope entirely for v0–v2)

---

## Out of Scope (Explicit)

| Category | What's excluded | Why |
|----------|-----------------|-----|
| **Multi-stakeholder dashboards** | No teacher portal, no admin dashboard | They consume artifacts, not app |
| **Role-based permissions** | No RBAC, no user management | Single clinician app |
| **SSM replacement** | No service logs, no IEP management | SSM is system of record |
| **Scheduling** | No appointment booking | Different problem |
| **Messaging/chat** | No teacher-nurse chat | Use existing channels |
| **Mobile-first** | Desktop-first; mobile is nice-to-have | Nurses work at desks |
| **Multi-district** | CPS only for now | Nail one district first |
| **Billing/insurance** | No claim generation | Out of scope |
| **Custom forms builder** | Hard-coded encounter structure | Avoid config hell |

---

## Success Metrics

### Speed (Primary)

| Metric | Target | How we measure |
|--------|--------|----------------|
| **Time to complete encounter note** | < 90 seconds | Timestamp: student selected → encounter saved |
| **Note done before bell** | 80%+ | Self-reported or timestamp vs. period schedule |
| **Clicks to start encounter** | ≤ 2 | Student select → encounter open |

### Compliance (Secondary)

| Metric | Target | How we measure |
|--------|--------|----------------|
| **HSP prompts acted on** | 90%+ | Prompt shown → user reviewed/dismissed with reason |
| **Stale HSP detection rate** | 100% | Encounters with HSP-trigger data always prompt |

### Adoption (Tertiary)

| Metric | Target | How we measure |
|--------|--------|----------------|
| **Daily active use** | 5+ encounters/day | Usage logs |
| **Replaces sticky notes** | Qualitative | User interviews |

---

## What This Is / Is Not

| Aspen-Lite IS | Aspen-Lite IS NOT |
|---------------|-------------------|
| A clinician cockpit | A student information system |
| An encounter compiler | A forms database |
| An HSP generator | An HSP editor for teachers |
| A nurse's daily driver | A district reporting dashboard |
| Boring infrastructure | Clever abstractions |

---

## Versioning Strategy

### v0: Static UI + Mocked Data
- Encounter flow UI with fake students
- No persistence
- Validate UX with real nurse

### v1: Local Persistence
- localStorage or simple API routes
- Real encounter capture
- HSP detection logic (local)

### v2: Integration Placeholders
- Export formats for SSM
- HSP summary generation
- District export schemas

### v3+ (Future)
- Actual SSM/Aspen API integration
- Multi-school support
- Sync and conflict resolution

---

## Open Questions (Parking Lot)

1. What's the minimum HSP summary format teachers will actually read?
2. How do we handle "I saw this kid but it's not worth documenting"?
3. Should encounters support voice-to-text for faster capture?
4. What's the compliance audit trail requirement from CPS?

---

*Last updated: 2025-01-31*
