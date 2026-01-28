// Student Detail View - Comprehensive student information for clinicians
// Fast tab switching, all relevant clinical information at a glance

let studentCache = null;

export async function renderStudentDetail(studentId) {
    const root = document.getElementById('app-root');

    // Show loading
    root.innerHTML = `<div class="loading-indicator">Loading student...</div>`;

    // Fetch data
    const res = await fetch('../data/students.json');
    const students = await res.json();
    const student = students.find(s => s.id.aspen === studentId);

    if (!student) {
        root.innerHTML = `
            <div class="error-state">
                <h2>Student Not Found</h2>
                <p>Could not find a student with ID: ${studentId}</p>
                <a href="#/students" class="btn-primary">Back to Directory</a>
            </div>
        `;
        return;
    }

    studentCache = student;

    // Calculate age
    const age = calculateAge(student.demographics.dob);

    root.innerHTML = `
        <div class="student-detail">
            <!-- Back Navigation -->
            <nav class="detail-nav">
                <a href="#/students" class="back-link">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <polyline points="15 18 9 12 15 6"/>
                    </svg>
                    Back to Directory
                </a>
            </nav>

            <!-- Student Header -->
            <header class="student-detail-header">
                <div class="student-avatar-large" aria-hidden="true">
                    ${student.name.first[0]}${student.name.last[0]}
                </div>
                <div class="student-header-info">
                    <h1>${student.name.first} ${student.name.last}</h1>
                    ${student.name.preferred !== student.name.first ? `<p class="preferred-name">Goes by "${student.name.preferred}"</p>` : ''}
                    <div class="student-quick-info">
                        <span class="info-item">
                            <strong>Grade ${student.enrollment.grade}</strong>
                        </span>
                        <span class="info-item">
                            Room ${student.enrollment.homeroom}
                        </span>
                        <span class="info-item">
                            ${student.enrollment.teacher}
                        </span>
                        <span class="info-item">
                            Age ${age}
                        </span>
                        <span class="info-item">
                            ID: ${student.id.aspen}
                        </span>
                    </div>
                    ${student.flags.length > 0 ? `
                        <div class="student-flags-header">
                            ${student.flags.map(flag => `<span class="flag-badge ${getFlagClass(flag)}">${flag}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            </header>

            <!-- Tab Navigation -->
            <div class="tabs-container">
                <div class="tabs" role="tablist">
                    <button class="tab-btn active" data-tab="demographics" role="tab" aria-selected="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                        Demographics
                    </button>
                    <button class="tab-btn" data-tab="contacts" role="tab" aria-selected="false">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"/>
                            <line x1="23" y1="1" x2="17" y2="1"/>
                        </svg>
                        Contacts
                    </button>
                    <button class="tab-btn ${hasHealthInfo(student) ? 'has-data' : ''}" data-tab="health" role="tab" aria-selected="false">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                        </svg>
                        Health
                    </button>
                    <button class="tab-btn ${hasPlans(student) ? 'has-data' : ''}" data-tab="plans" role="tab" aria-selected="false">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                        </svg>
                        Plans
                    </button>
                    <button class="tab-btn ${hasServices(student) ? 'has-data' : ''}" data-tab="services" role="tab" aria-selected="false">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 16v-4"/>
                            <path d="M12 8h.01"/>
                        </svg>
                        Services
                    </button>
                </div>
            </div>

            <!-- Tab Content -->
            <div id="tab-content" class="tab-content" role="tabpanel"></div>
        </div>
    `;

    // Setup tab switching
    const buttons = document.querySelectorAll('.tab-btn');
    const content = document.getElementById('tab-content');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            renderTab(btn.dataset.tab, student, content);
        });
    });

    // Auto-load demographics tab
    renderTab('demographics', student, content);
}

function renderTab(tab, student, container) {
    switch (tab) {
        case 'demographics':
            renderDemographicsTab(student, container);
            break;
        case 'contacts':
            renderContactsTab(student, container);
            break;
        case 'health':
            renderHealthTab(student, container);
            break;
        case 'plans':
            renderPlansTab(student, container);
            break;
        case 'services':
            renderServicesTab(student, container);
            break;
        default:
            container.innerHTML = '<p>Tab not found</p>';
    }
}

function renderDemographicsTab(student, container) {
    const d = student.demographics;
    const e = student.enrollment;

    container.innerHTML = `
        <div class="tab-panel">
            <div class="info-grid">
                <section class="info-section">
                    <h3>Personal Information</h3>
                    <dl class="info-list">
                        <div class="info-row">
                            <dt>Full Name</dt>
                            <dd>${student.name.first} ${student.name.last}</dd>
                        </div>
                        ${student.name.preferred !== student.name.first ? `
                        <div class="info-row">
                            <dt>Preferred Name</dt>
                            <dd>${student.name.preferred}</dd>
                        </div>
                        ` : ''}
                        <div class="info-row">
                            <dt>Date of Birth</dt>
                            <dd>${formatDate(d.dob)} (Age ${calculateAge(d.dob)})</dd>
                        </div>
                        <div class="info-row">
                            <dt>Gender</dt>
                            <dd>${d.gender}</dd>
                        </div>
                        <div class="info-row">
                            <dt>Ethnicity</dt>
                            <dd>${d.ethnicity}</dd>
                        </div>
                        <div class="info-row">
                            <dt>Primary Language</dt>
                            <dd>${d.language}</dd>
                        </div>
                        <div class="info-row">
                            <dt>Address</dt>
                            <dd>${d.address}</dd>
                        </div>
                    </dl>
                </section>

                <section class="info-section">
                    <h3>Enrollment Information</h3>
                    <dl class="info-list">
                        <div class="info-row">
                            <dt>Student ID</dt>
                            <dd>${student.id.aspen}</dd>
                        </div>
                        <div class="info-row">
                            <dt>State ID</dt>
                            <dd>${student.id.state}</dd>
                        </div>
                        <div class="info-row">
                            <dt>School</dt>
                            <dd>${e.school}</dd>
                        </div>
                        <div class="info-row">
                            <dt>Grade</dt>
                            <dd>${e.grade}</dd>
                        </div>
                        <div class="info-row">
                            <dt>Homeroom</dt>
                            <dd>Room ${e.homeroom}</dd>
                        </div>
                        <div class="info-row">
                            <dt>Teacher</dt>
                            <dd>${e.teacher}</dd>
                        </div>
                        <div class="info-row">
                            <dt>Enrollment Date</dt>
                            <dd>${formatDate(e.enrollDate)}</dd>
                        </div>
                        <div class="info-row">
                            <dt>Status</dt>
                            <dd><span class="status-badge status-${e.status.toLowerCase()}">${e.status}</span></dd>
                        </div>
                    </dl>
                </section>
            </div>
        </div>
    `;
}

function renderContactsTab(student, container) {
    const contacts = student.contacts;

    container.innerHTML = `
        <div class="tab-panel">
            <div class="contacts-grid">
                ${contacts.map((contact, index) => `
                    <div class="contact-card ${contact.primary ? 'primary-contact' : ''}">
                        <div class="contact-header">
                            <h4>${contact.name}</h4>
                            <span class="contact-relation">${contact.relation}</span>
                        </div>
                        <div class="contact-badges">
                            ${contact.primary ? '<span class="badge badge-primary">Primary</span>' : ''}
                            ${contact.emergency ? '<span class="badge badge-emergency">Emergency</span>' : ''}
                        </div>
                        <div class="contact-info">
                            <a href="tel:${contact.phone}" class="contact-item">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"/>
                                </svg>
                                ${contact.phone}
                            </a>
                            ${contact.email ? `
                            <a href="mailto:${contact.email}" class="contact-item">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                    <polyline points="22,6 12,13 2,6"/>
                                </svg>
                                ${contact.email}
                            </a>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderHealthTab(student, container) {
    const h = student.health;

    container.innerHTML = `
        <div class="tab-panel">
            <div class="info-grid">
                <!-- Allergies Section -->
                <section class="info-section ${h.allergies.length > 0 ? 'alert-section' : ''}">
                    <h3>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        Allergies
                    </h3>
                    ${h.allergies.length > 0 ? `
                        <ul class="allergy-list">
                            ${h.allergies.map(a => `<li class="allergy-item">${a}</li>`).join('')}
                        </ul>
                    ` : '<p class="no-data">No known allergies</p>'}
                </section>

                <!-- Medications Section -->
                <section class="info-section ${h.medications.length > 0 ? 'highlight-section' : ''}">
                    <h3>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <line x1="12" y1="8" x2="12" y2="16"/>
                            <line x1="8" y1="12" x2="16" y2="12"/>
                        </svg>
                        Medications
                    </h3>
                    ${h.medications.length > 0 ? `
                        <ul class="medication-list">
                            ${h.medications.map(m => `<li class="medication-item">${m}</li>`).join('')}
                        </ul>
                    ` : '<p class="no-data">No medications on file</p>'}
                </section>

                <!-- Conditions Section -->
                <section class="info-section">
                    <h3>Medical Conditions</h3>
                    ${h.conditions.length > 0 ? `
                        <ul class="condition-list">
                            ${h.conditions.map(c => `<li>${c}</li>`).join('')}
                        </ul>
                    ` : '<p class="no-data">No medical conditions on file</p>'}
                </section>

                <!-- Screenings Section -->
                <section class="info-section">
                    <h3>Screenings</h3>
                    <dl class="info-list">
                        <div class="info-row">
                            <dt>Vision</dt>
                            <dd>${h.vision}</dd>
                        </div>
                        <div class="info-row">
                            <dt>Hearing</dt>
                            <dd>${h.hearing}</dd>
                        </div>
                        <div class="info-row">
                            <dt>Immunizations</dt>
                            <dd>${h.immunizations}</dd>
                        </div>
                        <div class="info-row">
                            <dt>Last Physical</dt>
                            <dd>${formatDate(h.lastPhysical)}</dd>
                        </div>
                    </dl>
                </section>

                ${h.notes ? `
                <section class="info-section full-width">
                    <h3>Health Notes</h3>
                    <div class="notes-content">
                        ${h.notes}
                    </div>
                </section>
                ` : ''}
            </div>
        </div>
    `;
}

function renderPlansTab(student, container) {
    const p = student.plans;
    const hasAnyPlan = p.iep || p.plan504 || p.healthPlan || p.behaviorPlan;

    container.innerHTML = `
        <div class="tab-panel">
            ${!hasAnyPlan ? `
                <div class="no-plans">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <p>No active plans on file for this student.</p>
                </div>
            ` : `
                <div class="plans-grid">
                    ${p.iep ? `
                    <div class="plan-card plan-iep">
                        <div class="plan-header">
                            <h4>IEP</h4>
                            <span class="plan-badge active">Active</span>
                        </div>
                        <p class="plan-date">Last Updated: ${formatDate(p.iepDate)}</p>
                        ${p.iepGoals && p.iepGoals.length > 0 ? `
                        <div class="plan-goals">
                            <h5>Goals:</h5>
                            <ul>
                                ${p.iepGoals.map(g => `<li>${g}</li>`).join('')}
                            </ul>
                        </div>
                        ` : ''}
                    </div>
                    ` : ''}

                    ${p.plan504 ? `
                    <div class="plan-card plan-504">
                        <div class="plan-header">
                            <h4>504 Plan</h4>
                            <span class="plan-badge active">Active</span>
                        </div>
                        <p class="plan-date">Last Updated: ${formatDate(p.plan504Date)}</p>
                        ${p.plan504Accommodations && p.plan504Accommodations.length > 0 ? `
                        <div class="plan-accommodations">
                            <h5>Accommodations:</h5>
                            <ul>
                                ${p.plan504Accommodations.map(a => `<li>${a}</li>`).join('')}
                            </ul>
                        </div>
                        ` : ''}
                    </div>
                    ` : ''}

                    ${p.healthPlan ? `
                    <div class="plan-card plan-health">
                        <div class="plan-header">
                            <h4>Health Plan</h4>
                            <span class="plan-badge active">Active</span>
                        </div>
                        <p class="plan-type">${p.healthPlanType}</p>
                    </div>
                    ` : ''}

                    ${p.behaviorPlan ? `
                    <div class="plan-card plan-behavior">
                        <div class="plan-header">
                            <h4>Behavior Plan</h4>
                            <span class="plan-badge active">Active</span>
                        </div>
                        <p class="plan-type">${p.behaviorPlanType}</p>
                    </div>
                    ` : ''}
                </div>
            `}
        </div>
    `;
}

function renderServicesTab(student, container) {
    const s = student.services;
    const activeServices = [];

    if (s.nursing) activeServices.push({ name: 'Nursing', notes: s.nursingNotes, icon: 'nursing' });
    if (s.speech) activeServices.push({ name: 'Speech Therapy', notes: s.speechNotes, icon: 'speech' });
    if (s.occupational) activeServices.push({ name: 'Occupational Therapy', notes: s.occupationalNotes, icon: 'ot' });
    if (s.psychology) activeServices.push({ name: 'Psychology', notes: s.psychologyNotes, icon: 'psych' });
    if (s.socialWork) activeServices.push({ name: 'Social Work', notes: s.socialWorkNotes, icon: 'sw' });

    container.innerHTML = `
        <div class="tab-panel">
            ${activeServices.length === 0 ? `
                <div class="no-services-message">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 16v-4"/>
                        <path d="M12 8h.01"/>
                    </svg>
                    <p>No active clinical services for this student.</p>
                </div>
            ` : `
                <div class="services-grid">
                    ${activeServices.map(service => `
                    <div class="service-card service-${service.icon}">
                        <div class="service-header">
                            ${getServiceIcon(service.icon)}
                            <h4>${service.name}</h4>
                        </div>
                        <div class="service-notes">
                            <p>${service.notes || 'No notes available'}</p>
                        </div>
                    </div>
                    `).join('')}
                </div>
            `}
        </div>
    `;
}

// Helper Functions

function calculateAge(dob) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getFlagClass(flag) {
    const flagClasses = {
        'IEP': 'flag-iep',
        '504 Plan': 'flag-504',
        'Health Plan': 'flag-health',
        'Behavior Plan': 'flag-behavior',
        'ELL': 'flag-ell',
        'New Student': 'flag-new',
        'Severe Allergies': 'flag-allergy',
        'Diabetes': 'flag-health',
        'Autism': 'flag-iep',
        'Seizure Disorder': 'flag-health',
        'Mental Health': 'flag-mental',
        'Hearing': 'flag-iep',
        'Physical Disability': 'flag-iep'
    };
    return flagClasses[flag] || 'flag-default';
}

function hasHealthInfo(student) {
    const h = student.health;
    return h.allergies.length > 0 || h.medications.length > 0 || h.conditions.length > 0;
}

function hasPlans(student) {
    const p = student.plans;
    return p.iep || p.plan504 || p.healthPlan || p.behaviorPlan;
}

function hasServices(student) {
    const s = student.services;
    return s.nursing || s.speech || s.occupational || s.psychology || s.socialWork;
}

function getServiceIcon(type) {
    const icons = {
        nursing: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
        speech: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>`,
        ot: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/></svg>`,
        psych: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
        sw: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
    };
    return icons[type] || '';
}
