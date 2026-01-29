// State management with localStorage persistence

const STORAGE_KEYS = {
    CURRENT_SCHOOL: 'aspen-lite-current-school',
    CURRENT_SCHOOL_ID: 'aspen-lite-current-school-id',
    FAVORITES: 'aspen-lite-school-favorites'
};

// Internal state
let currentSchool = null;
let currentSchoolId = null;
let favorites = [];
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
        saveState();
        notifySchoolChange(school);
    }
}

// Get favorites list
export function getFavorites() {
    return [...favorites];
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
    try {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_SCHOOL);
        localStorage.removeItem(STORAGE_KEYS.CURRENT_SCHOOL_ID);
        localStorage.removeItem(STORAGE_KEYS.FAVORITES);
    } catch (e) {
        console.warn('Failed to clear localStorage:', e);
    }
}
