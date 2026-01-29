import { getCurrentSchool, getCurrentSchoolId, onSchoolChange } from '../app/state.js';
import { getSchoolStudents, getSchoolFilters } from '../app/api.js';
import { debounce } from '../app/utils.js';

// State
let currentSchoolName = null;
let loadedStudents = [];
let totalStudents = 0;
let hasMore = false;
let currentOffset = 0;
let isLoading = false;
let unsubscribeSchoolChange = null;

// Current filters
let currentFilters = {
    grade: '',
    gender: '',
    ethnicity: '',
    search: ''
};

// Filter options from API
let filterOptions = {
    grades: [],
    genders: [],
    ethnicities: []
};

const STUDENTS_PER_PAGE = 50;

export async function renderStudentList() {
    const root = document.getElementById('app-root');
    const selectedSchool = getCurrentSchool();

    // Check if a school is selected
    if (!selectedSchool) {
        root.innerHTML = `
            <div class="student-list-container">
                <div class="no-school-selected">
                    <h2>No School Selected</h2>
                    <p>Please select a school from the dropdown in the header to view students.</p>
                </div>
            </div>
        `;
        return;
    }

    // Listen for school changes and re-render
    if (!unsubscribeSchoolChange) {
        unsubscribeSchoolChange = onSchoolChange(() => {
            renderStudentList();
        });
    }

    // Check if school changed - if so, reset state
    if (selectedSchool !== currentSchoolName) {
        currentSchoolName = selectedSchool;
        loadedStudents = [];
        currentOffset = 0;
        currentFilters = { grade: '', gender: '', ethnicity: '', search: '' };
    }

    // Show loading state
    root.innerHTML = `
        <div class="student-list-container">
            <h1>Students at ${selectedSchool}</h1>
            <div class="loading-state">Loading students...</div>
        </div>
    `;

    try {
        // Load filter options first
        await loadFilterOptions();

        // Load initial students
        await loadStudents(true);

        // Render the full UI
        renderUI();
        attachFilterListeners();
    } catch (error) {
        console.error('Failed to load students:', error);
        root.innerHTML = `
            <div class="student-list-container">
                <h1>Students at ${selectedSchool}</h1>
                <div class="error-state">
                    <p>Failed to load students. Please try again.</p>
                    <button onclick="location.reload()">Reload Page</button>
                </div>
            </div>
        `;
    }
}

async function loadFilterOptions() {
    const schoolId = getCurrentSchoolId();

    if (!schoolId) {
        console.warn('No school ID available yet, skipping filter load');
        return;
    }

    try {
        filterOptions = await getSchoolFilters(schoolId);
    } catch (error) {
        console.error('Failed to load filter options:', error);
        filterOptions = { grades: [], genders: [], ethnicities: [] };
    }
}

async function loadStudents(reset = false) {
    if (isLoading) return;

    const schoolId = getCurrentSchoolId();
    if (!schoolId) {
        console.error('Cannot load students: No school ID available');
        throw new Error('No school selected');
    }

    if (reset) {
        currentOffset = 0;
        loadedStudents = [];
    }

    isLoading = true;

    try {
        const response = await getSchoolStudents(schoolId, {
            limit: STUDENTS_PER_PAGE,
            offset: currentOffset,
            grade: currentFilters.grade || undefined,
            gender: currentFilters.gender || undefined,
            ethnicity: currentFilters.ethnicity || undefined,
            search: currentFilters.search || undefined
        });

        if (reset) {
            loadedStudents = response.students;
        } else {
            loadedStudents = [...loadedStudents, ...response.students];
        }

        totalStudents = response.total;
        hasMore = response.hasMore;
        currentOffset += STUDENTS_PER_PAGE;
    } catch (error) {
        console.error('Failed to load students:', error);
        throw error;
    } finally {
        isLoading = false;
    }
}

function renderUI() {
    const root = document.getElementById('app-root');

    root.innerHTML = `
        <div class="student-list-container">
            <h1>Students at ${currentSchoolName}</h1>

            <div class="search-filters">
                <div class="filter-row">
                    <div class="filter-group">
                        <label for="search-all">Search Students</label>
                        <input
                            type="text"
                            id="search-all"
                            placeholder="Search by name or student ID..."
                            autocomplete="off"
                            value="${currentFilters.search}"
                        />
                    </div>
                </div>

                <div class="filter-row">
                    <div class="filter-group">
                        <label for="filter-grade">Grade</label>
                        <select id="filter-grade">
                            <option value="">All Grades</option>
                            ${filterOptions.grades.map(g =>
                                `<option value="${g}" ${currentFilters.grade == g ? 'selected' : ''}>${g}th Grade</option>`
                            ).join('')}
                        </select>
                    </div>

                    <div class="filter-group">
                        <label for="filter-gender">Gender</label>
                        <select id="filter-gender">
                            <option value="">All Genders</option>
                            ${filterOptions.genders.map(g =>
                                `<option value="${g}" ${currentFilters.gender === g ? 'selected' : ''}>${g}</option>`
                            ).join('')}
                        </select>
                    </div>

                    <div class="filter-group">
                        <label for="filter-ethnicity">Ethnicity</label>
                        <select id="filter-ethnicity">
                            <option value="">All Ethnicities</option>
                            ${filterOptions.ethnicities.map(e =>
                                `<option value="${e}" ${currentFilters.ethnicity === e ? 'selected' : ''}>${e}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>

                <div class="filter-actions">
                    <button id="clear-filters" class="btn-secondary">Clear All Filters</button>
                    <span class="results-count" id="results-count">
                        Showing ${loadedStudents.length} of ${totalStudents} student${totalStudents !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            <div class="student-table-container">
                <table class="student-table">
                    <thead>
                        <tr>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>Grade</th>
                            <th>Gender</th>
                            <th>Ethnicity</th>
                            <th>Zip Code</th>
                        </tr>
                    </thead>
                    <tbody id="student-table-body">
                        ${renderStudentRows(loadedStudents)}
                    </tbody>
                </table>
            </div>

            ${hasMore ? `
                <div class="load-more-container">
                    <button id="load-more-btn" class="btn-primary">
                        Load More Students (${loadedStudents.length} of ${totalStudents})
                    </button>
                </div>
            ` : ''}
        </div>
    `;
}

function renderStudentRows(students) {
    if (students.length === 0) {
        return `
            <tr class="no-results">
                <td colspan="6">No students found matching your criteria</td>
            </tr>
        `;
    }

    return students.map(student => `
        <tr class="student-row" onclick="window.location.hash='#/student/${student.studentId}'">
            <td class="student-id">${student.studentId}</td>
            <td class="student-name">${student.lastName}, ${student.firstName}</td>
            <td>${student.grade}</td>
            <td>${student.gender}</td>
            <td>${student.ethnicity}</td>
            <td>${student.zipCode}</td>
        </tr>
    `).join('');
}

function attachFilterListeners() {
    const searchAll = document.getElementById('search-all');
    const filterGrade = document.getElementById('filter-grade');
    const filterGender = document.getElementById('filter-gender');
    const filterEthnicity = document.getElementById('filter-ethnicity');
    const clearButton = document.getElementById('clear-filters');
    const loadMoreBtn = document.getElementById('load-more-btn');

    // Debounced search for name/ID
    const debouncedSearch = debounce(async (query) => {
        currentFilters.search = query.trim();
        await loadStudents(true);
        renderUI();
        attachFilterListeners();
    }, 400);

    searchAll.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
    });

    // Filter changes trigger immediate reload
    const applyFilters = async () => {
        currentFilters.grade = filterGrade.value;
        currentFilters.gender = filterGender.value;
        currentFilters.ethnicity = filterEthnicity.value;

        await loadStudents(true);
        renderUI();
        attachFilterListeners();
    };

    filterGrade.addEventListener('change', applyFilters);
    filterGender.addEventListener('change', applyFilters);
    filterEthnicity.addEventListener('change', applyFilters);

    // Clear all filters
    clearButton.addEventListener('click', async () => {
        currentFilters = { grade: '', gender: '', ethnicity: '', search: '' };
        await loadStudents(true);
        renderUI();
        attachFilterListeners();
    });

    // Load more button
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', async () => {
            await loadStudents(false);
            renderUI();
            attachFilterListeners();
        });
    }
}
