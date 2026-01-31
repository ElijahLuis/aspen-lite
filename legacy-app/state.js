// State management with localStorage persistence

const STORAGE_KEYS = {
    CURRENT_SCHOOL: 'aspen-lite-current-school',
    CURRENT_SCHOOL_ID: 'aspen-lite-current-school-id',
    FAVORITES: 'aspen-lite-school-favorites',
    RECENTLY_SELECTED: 'aspen-lite-recently-selected'
};

// Internal state
let currentSchool = null;
let currentSchoolId = null;
let favorites = [];
let recentlySelected = [];  // Array of {name, id, timestamp}
let schoolChangeListeners = [];

// Initialize state from localStorage
export function loadState() {
    try {
        // Load current school
        const savedSchool = localStorage.getItem(STORAGE_KEYS.CURRENT_SCHOOL);
        if (savedSchool) {
            currentSchool = savedSchool;
        }

        // Load current school ID
        const savedSchoolId = localStorage.getItem(STORAGE_KEYS.CURRENT_SCHOOL_ID);
        if (savedSchoolId) {
            currentSchoolId = parseInt(savedSchoolId, 10);
        }

        // Load favorites
        const savedFavorites = localStorage.getItem(STORAGE_KEYS.FAVORITES);
        if (savedFavorites) {
            favorites = JSON.parse(savedFavorites);
        }

        // Load recently selected
        const savedRecent = localStorage.getItem(STORAGE_KEYS.RECENTLY_SELECTED);
        if (savedRecent) {
            recentlySelected = JSON.parse(savedRecent);
        }
    } catch (e) {
        console.warn('Failed to load state from localStorage:', e);
    }
}

// Save state to localStorage
function saveState() {
    try {
        if (currentSchool) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_SCHOOL, currentSchool);
        }
        if (currentSchoolId) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_SCHOOL_ID, currentSchoolId.toString());
        }
        localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
        localStorage.setItem(STORAGE_KEYS.RECENTLY_SELECTED, JSON.stringify(recentlySelected));
    } catch (e) {
        console.warn('Failed to save state to localStorage:', e);
    }
}

// Get current selected school
export function getCurrentSchool() {
    return currentSchool;
}

// Get current selected school ID
export function getCurrentSchoolId() {
    return currentSchoolId;
}

// Set current school (with optional ID)
export function setCurrentSchool(school, schoolId = null) {
    if (currentSchool !== school) {
        currentSchool = school;
        if (schoolId !== null) {
            currentSchoolId = schoolId;
        }

        // Add to recently selected (max 10, most recent first)
        if (school && schoolId) {
            // Remove if already exists
            recentlySelected = recentlySelected.filter(s => s.id !== schoolId);
            // Add to front
            recentlySelected.unshift({
                name: school,
                id: schoolId,
                timestamp: Date.now()
            });
            // Keep only last 10
            recentlySelected = recentlySelected.slice(0, 10);
        }

        saveState();
        notifySchoolChange(school);
    }
}

// Get favorites list
export function getFavorites() {
    return [...favorites];
}

// Get recently selected schools
export function getRecentlySelected() {
    return [...recentlySelected];
}

// Add school to favorites
export function addFavorite(school) {
    if (!favorites.includes(school)) {
        favorites.push(school);
        saveState();
        return true;
    }
    return false;
}

// Remove school from favorites
export function removeFavorite(school) {
    const index = favorites.indexOf(school);
    if (index > -1) {
        favorites.splice(index, 1);
        saveState();
        return true;
    }
    return false;
}

// Check if school is a favorite
export function isFavorite(school) {
    return favorites.includes(school);
}

// Toggle favorite status
export function toggleFavorite(school) {
    if (isFavorite(school)) {
        removeFavorite(school);
        return false;
    } else {
        addFavorite(school);
        return true;
    }
}

// School change notification system
export function onSchoolChange(callback) {
    schoolChangeListeners.push(callback);
    return () => {
        const index = schoolChangeListeners.indexOf(callback);
        if (index > -1) {
            schoolChangeListeners.splice(index, 1);
        }
    };
}

function notifySchoolChange(school) {
    schoolChangeListeners.forEach(callback => {
        try {
            callback(school);
        } catch (e) {
            console.error('Error in school change listener:', e);
        }
    });
}

// Clear all state (useful for testing)
export function clearState() {
    currentSchool = null;
    currentSchoolId = null;
    favorites = [];
    recentlySelected = [];
    try {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_SCHOOL);
        localStorage.removeItem(STORAGE_KEYS.CURRENT_SCHOOL_ID);
        localStorage.removeItem(STORAGE_KEYS.FAVORITES);
        localStorage.removeItem(STORAGE_KEYS.RECENTLY_SELECTED);
    } catch (e) {
        console.warn('Failed to clear localStorage:', e);
    }
}
