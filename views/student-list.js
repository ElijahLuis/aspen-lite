// Student List View - Fast, searchable, filterable student directory
// Optimized for clinician workflows

let studentsCache = null;
let currentFilters = {
    search: '',
    grade: 'all',
    service: 'all',
    flag: 'all'
};

export async function renderStudentList() {
    const root = document.getElementById('app-root');

    // Show loading state
    root.innerHTML = `
        <div class="student-directory">
            <div class="directory-header">
                <h1>Student Directory</h1>
                <p class="school-name">Example Elementary School</p>
            </div>
            <div class="loading-indicator">Loading students...</div>
        </div>
    `;

    // Fetch data (with caching)
    if (!studentsCache) {
        const res = await fetch('../data/students.json');
        studentsCache = await res.json();
    }

    const students = studentsCache;

    // Get unique values for filters
    const grades = [...new Set(students.map(s => s.enrollment.grade))].sort((a, b) => a - b);
    const services = ['nursing', 'speech', 'occupational', 'psychology', 'socialWork'];
    const flags = [...new Set(students.flatMap(s => s.flags))].filter(Boolean).sort();

    // Render full interface
    root.innerHTML = `
        <div class="student-directory">
            <header class="directory-header">
                <div class="header-top">
                    <h1>Student Directory</h1>
                    <span class="student-count" id="student-count">${students.length} students</span>
                </div>
                <p class="school-name">Example Elementary School</p>
            </header>

            <!-- Quick Search -->
            <div class="search-container">
                <div class="search-box">
                    <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="M21 21l-4.35-4.35"/>
                    </svg>
                    <input
                        type="search"
                        id="student-search"
                        class="search-input"
                        placeholder="Search by name, ID, teacher, or homeroom..."
                        autocomplete="off"
                        aria-label="Search students"
                    >
                    <kbd class="search-shortcut" aria-hidden="true">/</kbd>
                </div>
            </div>

            <!-- Quick Filters -->
            <div class="filters-container" role="group" aria-label="Filter options">
                <div class="filter-group">
                    <label for="grade-filter">Grade</label>
                    <select id="grade-filter" class="filter-select">
                        <option value="all">All Grades</option>
                        ${grades.map(g => `<option value="${g}">Grade ${g}</option>`).join('')}
                    </select>
                </div>

                <div class="filter-group">
                    <label for="service-filter">Service</label>
                    <select id="service-filter" class="filter-select">
                        <option value="all">All Services</option>
                        <option value="nursing">Nursing</option>
                        <option value="speech">Speech Therapy</option>
                        <option value="occupational">Occupational Therapy</option>
                        <option value="psychology">Psychology</option>
                        <option value="socialWork">Social Work</option>
                    </select>
                </div>

                <div class="filter-group">
                    <label for="flag-filter">Flag</label>
                    <select id="flag-filter" class="filter-select">
                        <option value="all">All Students</option>
                        ${flags.map(f => `<option value="${f}">${f}</option>`).join('')}
                    </select>
                </div>

                <button id="clear-filters" class="btn-clear" type="button">
                    Clear Filters
                </button>
            </div>

            <!-- Student List -->
            <div class="student-list-container" role="list" aria-label="Student list">
                <div id="student-results"></div>
            </div>
        </div>
    `;

    // Initial render
    renderStudentResults(students);

    // Setup event listeners
    setupEventListeners(students);
}

function renderStudentResults(students) {
    const filtered = filterStudents(students);
    const resultsContainer = document.getElementById('student-results');
    const countElement = document.getElementById('student-count');

    if (countElement) {
        countElement.textContent = `${filtered.length} student${filtered.length !== 1 ? 's' : ''}`;
    }

    if (filtered.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M8 15s1.5-2 4-2 4 2 4 2"/>
                    <line x1="9" y1="9" x2="9.01" y2="9"/>
                    <line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
                <p>No students match your search criteria</p>
                <button id="reset-search" class="btn-reset">Reset Search</button>
            </div>
        `;

        const resetBtn = document.getElementById('reset-search');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                currentFilters = { search: '', grade: 'all', service: 'all', flag: 'all' };
                document.getElementById('student-search').value = '';
                document.getElementById('grade-filter').value = 'all';
                document.getElementById('service-filter').value = 'all';
                document.getElementById('flag-filter').value = 'all';
                renderStudentResults(studentsCache);
            });
        }
        return;
    }

    resultsContainer.innerHTML = filtered.map(student => `
        <a href="#/student/${student.id.aspen}" class="student-card" role="listitem" data-id="${student.id.aspen}">
            <div class="student-avatar" aria-hidden="true">
                ${getInitials(student.name)}
            </div>
            <div class="student-info">
                <div class="student-name-row">
                    <span class="student-name">${student.name.last}, ${student.name.first}</span>
                    ${student.name.preferred !== student.name.first ? `<span class="preferred-name">"${student.name.preferred}"</span>` : ''}
                </div>
                <div class="student-meta">
                    <span class="grade-badge">Grade ${student.enrollment.grade}</span>
                    <span class="homeroom">Room ${student.enrollment.homeroom}</span>
                    <span class="teacher">${student.enrollment.teacher}</span>
                </div>
                ${student.flags.length > 0 ? `
                    <div class="student-flags">
                        ${student.flags.map(flag => `<span class="flag-badge ${getFlagClass(flag)}">${flag}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="student-services" aria-label="Active services">
                ${getServiceIcons(student.services)}
            </div>
            <svg class="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <polyline points="9 18 15 12 9 6"/>
            </svg>
        </a>
    `).join('');
}

function filterStudents(students) {
    return students.filter(student => {
        // Text search
        if (currentFilters.search) {
            const searchLower = currentFilters.search.toLowerCase();
            const searchableText = [
                student.name.first,
                student.name.last,
                student.name.preferred,
                student.id.aspen,
                student.enrollment.teacher,
                student.enrollment.homeroom,
                `grade ${student.enrollment.grade}`
            ].join(' ').toLowerCase();

            if (!searchableText.includes(searchLower)) {
                return false;
            }
        }

        // Grade filter
        if (currentFilters.grade !== 'all' && student.enrollment.grade !== parseInt(currentFilters.grade)) {
            return false;
        }

        // Service filter
        if (currentFilters.service !== 'all' && !student.services[currentFilters.service]) {
            return false;
        }

        // Flag filter
        if (currentFilters.flag !== 'all' && !student.flags.includes(currentFilters.flag)) {
            return false;
        }

        return true;
    });
}

function setupEventListeners(students) {
    const searchInput = document.getElementById('student-search');
    const gradeFilter = document.getElementById('grade-filter');
    const serviceFilter = document.getElementById('service-filter');
    const flagFilter = document.getElementById('flag-filter');
    const clearBtn = document.getElementById('clear-filters');

    // Debounced search
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentFilters.search = e.target.value;
            renderStudentResults(students);
        }, 150);
    });

    // Filter changes
    gradeFilter.addEventListener('change', (e) => {
        currentFilters.grade = e.target.value;
        renderStudentResults(students);
    });

    serviceFilter.addEventListener('change', (e) => {
        currentFilters.service = e.target.value;
        renderStudentResults(students);
    });

    flagFilter.addEventListener('change', (e) => {
        currentFilters.flag = e.target.value;
        renderStudentResults(students);
    });

    // Clear filters
    clearBtn.addEventListener('click', () => {
        currentFilters = { search: '', grade: 'all', service: 'all', flag: 'all' };
        searchInput.value = '';
        gradeFilter.value = 'all';
        serviceFilter.value = 'all';
        flagFilter.value = 'all';
        renderStudentResults(students);
    });

    // Keyboard shortcut for search
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== searchInput) {
            e.preventDefault();
            searchInput.focus();
        }
        if (e.key === 'Escape' && document.activeElement === searchInput) {
            searchInput.blur();
        }
    });
}

function getInitials(name) {
    return `${name.first[0]}${name.last[0]}`.toUpperCase();
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

function getServiceIcons(services) {
    const icons = [];

    if (services.nursing) {
        icons.push(`<span class="service-icon service-nursing" title="Nursing Services">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
        </span>`);
    }

    if (services.speech) {
        icons.push(`<span class="service-icon service-speech" title="Speech Therapy">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            </svg>
        </span>`);
    }

    if (services.occupational) {
        icons.push(`<span class="service-icon service-ot" title="Occupational Therapy">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
            </svg>
        </span>`);
    }

    if (services.psychology) {
        icons.push(`<span class="service-icon service-psych" title="Psychology Services">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4"/>
                <path d="M12 8h.01"/>
            </svg>
        </span>`);
    }

    if (services.socialWork) {
        icons.push(`<span class="service-icon service-sw" title="Social Work Services">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
        </span>`);
    }

    return icons.join('') || '<span class="no-services">-</span>';
}
