// School Selector Component

import { getCurrentSchool, setCurrentSchool, getFavorites, toggleFavorite, isFavorite, getRecentlySelected } from './state.js';
import { debounce } from './utils.js';
import { getSchools, getFavoriteSchools } from './api.js';

let allSchools = [];  // Array of {id, name, studentCount}
let filteredSchools = [];
let isOpen = false;
let isLoading = false;
let favoriteSchoolsData = [];
let recentlySelectedSchoolsData = [];

export async function initSchoolSelector() {
    const container = document.getElementById('school-selector-container');
    if (!container) {
        console.error('School selector container not found');
        return;
    }

    // Load schools from API
    await loadSchools();

    render();
    attachListeners();
}

async function loadSchools(search = '') {
    isLoading = true;
    try {
        const { schools } = await getSchools({ search, limit: 100 });
        allSchools = schools;
        filteredSchools = [...allSchools];

        // Load favorite schools details
        await loadFavoriteSchools();

        // Load recently selected schools details
        await loadRecentlySelectedSchools();
    } catch (error) {
        console.error('Failed to load schools:', error);
        allSchools = [];
        filteredSchools = [];
    } finally {
        isLoading = false;
    }
}

async function loadFavoriteSchools() {
    const favoriteNames = getFavorites();
    if (favoriteNames.length === 0) {
        favoriteSchoolsData = [];
        return;
    }

    try {
        // Find favorite school IDs from allSchools
        const favoriteIds = favoriteNames
            .map(name => allSchools.find(s => s.name === name)?.id)
            .filter(id => id !== undefined);

        if (favoriteIds.length > 0) {
            const { schools } = await getFavoriteSchools(favoriteIds);
            favoriteSchoolsData = schools;
        } else {
            favoriteSchoolsData = [];
        }
    } catch (error) {
        console.error('Failed to load favorite schools:', error);
        favoriteSchoolsData = [];
    }
}

async function loadRecentlySelectedSchools() {
    const recentlySelected = getRecentlySelected();
    if (recentlySelected.length === 0) {
        recentlySelectedSchoolsData = [];
        return;
    }

    try {
        // Get IDs from recently selected
        const recentIds = recentlySelected.map(s => s.id).filter(id => id !== undefined);

        if (recentIds.length > 0) {
            const { schools } = await getFavoriteSchools(recentIds);
            // Preserve the order from recentlySelected
            recentlySelectedSchoolsData = recentlySelected
                .map(recent => schools.find(s => s.id === recent.id))
                .filter(s => s !== undefined);
        } else {
            recentlySelectedSchoolsData = [];
        }
    } catch (error) {
        console.error('Failed to load recently selected schools:', error);
        recentlySelectedSchoolsData = [];
    }
}

function render() {
    const container = document.getElementById('school-selector-container');
    const currentSchool = getCurrentSchool();

    container.innerHTML = `
        <div class="school-selector">
            <button class="school-selector-button" id="school-selector-button">
                <span class="school-icon">🏫</span>
                <span class="school-selector-text">
                    ${currentSchool || 'Select a school'}
                </span>
                <span class="dropdown-arrow">▼</span>
            </button>

            <div class="school-dropdown ${isOpen ? 'open' : ''}" id="school-dropdown">
                <div class="school-search">
                    <input
                        type="text"
                        id="school-search-input"
                        placeholder="Search schools..."
                        autocomplete="off"
                    />
                </div>

                ${renderFavorites()}
                ${renderRecentlySelected()}
                ${renderSchoolList()}
            </div>
        </div>
    `;
}

function renderFavorites() {
    if (favoriteSchoolsData.length === 0) {
        return `
            <div class="favorites-section">
                <div class="section-header">Favorites</div>
                <div class="empty-favorites">No favorites yet. Click ★ to add schools to your favorites.</div>
            </div>
        `;
    }

    return `
        <div class="favorites-section">
            <div class="section-header">Favorites</div>
            <div class="school-list">
                ${favoriteSchoolsData.map(school => renderSchoolItem(school, true)).join('')}
            </div>
        </div>
        <div class="section-divider"></div>
    `;
}

function renderRecentlySelected() {
    // Don't show if no recently selected schools (excluding current)
    const currentSchoolName = getCurrentSchool();
    const recentExcludingCurrent = recentlySelectedSchoolsData.filter(s => s.name !== currentSchoolName);

    if (recentExcludingCurrent.length === 0) {
        return '';  // Don't show empty section
    }

    return `
        <div class="recently-selected-section">
            <div class="section-header">Previously Selected</div>
            <div class="school-list">
                ${recentExcludingCurrent.map(school => renderSchoolItem(school, false)).join('')}
            </div>
        </div>
        <div class="section-divider"></div>
    `;
}

function renderSchoolList() {
    if (filteredSchools.length === 0) {
        return `
            <div class="all-schools-section">
                <div class="section-header">All Schools</div>
                <div class="no-results">No schools found</div>
            </div>
        `;
    }

    return `
        <div class="all-schools-section">
            <div class="section-header">All Schools</div>
            <div class="school-list" id="school-list">
                ${filteredSchools.map(school => renderSchoolItem(school, false)).join('')}
            </div>
        </div>
    `;
}

function renderSchoolItem(school, inFavoritesSection) {
    const currentSchool = getCurrentSchool();
    const isSelected = school.name === currentSchool;
    const favorite = isFavorite(school.name);
    const count = school.studentCount || 0;

    return `
        <div class="school-item ${isSelected ? 'selected' : ''}" data-school="${school.name}" data-school-id="${school.id}">
            <div class="school-item-content">
                <div class="school-name">${school.name}</div>
                <div class="student-count">${count} students</div>
            </div>
            <button
                class="favorite-toggle ${favorite ? 'favorited' : ''}"
                data-school="${school.name}"
                data-action="toggle-favorite"
                aria-label="${favorite ? 'Remove from' : 'Add to'} favorites"
            >
                ${favorite ? '★' : '☆'}
            </button>
        </div>
    `;
}

function attachListeners() {
    const button = document.getElementById('school-selector-button');
    const dropdown = document.getElementById('school-dropdown');
    const searchInput = document.getElementById('school-search-input');

    // Toggle dropdown
    button.addEventListener('click', async (e) => {
        e.stopPropagation();
        isOpen = !isOpen;

        if (isOpen) {
            // Reload schools and favorites when opening
            await loadSchools();
        }

        render();
        attachListeners();

        if (isOpen) {
            // Focus search input when opened
            setTimeout(() => {
                const input = document.getElementById('school-search-input');
                if (input) input.focus();
            }, 10);
        }
    });

    // Search functionality
    if (searchInput) {
        const debouncedSearch = debounce(async (query) => {
            const trimmedQuery = query.trim();
            try {
                const { schools } = await getSchools({ search: trimmedQuery, limit: 100 });
                filteredSchools = schools;
                renderDropdownContent();
            } catch (error) {
                console.error('Search failed:', error);
            }
        }, 300);

        searchInput.addEventListener('input', (e) => {
            debouncedSearch(e.target.value);
        });

        // Prevent dropdown close when clicking search input
        searchInput.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // Click on school items or favorite buttons
    dropdown.addEventListener('click', async (e) => {
        const target = e.target.closest('[data-school]');
        if (!target) return;

        const schoolName = target.dataset.school;
        const schoolId = target.dataset.schoolId;
        const action = target.dataset.action;

        if (action === 'toggle-favorite') {
            e.stopPropagation();
            toggleFavorite(schoolName);
            await loadFavoriteSchools();
            render();
            attachListeners();
        } else if (target.classList.contains('school-item')) {
            setCurrentSchool(schoolName, schoolId ? parseInt(schoolId, 10) : null);
            isOpen = false;
            render();
            attachListeners();
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', closeDropdown);
}

async function closeDropdown(e) {
    const selector = document.querySelector('.school-selector');
    if (selector && !selector.contains(e.target) && isOpen) {
        isOpen = false;
        // Reset search by reloading schools
        await loadSchools();
        render();
        attachListeners();
    }
}

function renderDropdownContent() {
    const dropdown = document.getElementById('school-dropdown');
    const searchInput = document.getElementById('school-search-input');
    const searchValue = searchInput ? searchInput.value : '';

    dropdown.querySelector('.all-schools-section').outerHTML = renderSchoolList();

    // Restore search value and listeners
    const newSearchInput = document.getElementById('school-search-input');
    if (newSearchInput && searchValue) {
        newSearchInput.value = searchValue;
    }
}

export function updateSchoolSelector() {
    render();
    attachListeners();
}
