// Dark Mode Toggle Module

const STORAGE_KEY = 'aspen-lite-dark-mode';
let isDarkMode = false;

// Initialize dark mode from localStorage
export function initDarkMode() {
    const savedMode = localStorage.getItem(STORAGE_KEY);

    // Check system preference if no saved preference
    if (savedMode === null) {
        isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
        isDarkMode = savedMode === 'true';
    }

    applyDarkMode();
    renderToggleButton();
}

// Apply dark mode to document
function applyDarkMode() {
    if (isDarkMode) {
        document.body.setAttribute('data-theme', 'dark');
    } else {
        document.body.removeAttribute('data-theme');
    }
}

// Toggle dark mode
export function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    localStorage.setItem(STORAGE_KEY, isDarkMode.toString());
    applyDarkMode();
    updateToggleButton();
}

// Get current dark mode state
export function getDarkMode() {
    return isDarkMode;
}

// Render toggle button in header
function renderToggleButton() {
    const header = document.querySelector('.top-bar');
    if (!header) return;

    const existingToggle = document.getElementById('dark-mode-toggle');
    if (existingToggle) {
        existingToggle.remove();
    }

    const toggleButton = document.createElement('button');
    toggleButton.id = 'dark-mode-toggle';
    toggleButton.className = 'dark-mode-toggle';
    toggleButton.setAttribute('aria-label', isDarkMode ? 'Switch to light mode' : 'Switch to dark mode');
    toggleButton.innerHTML = `
        <span class="dark-mode-icon">${isDarkMode ? '🌙' : '☀️'}</span>
        <span class="dark-mode-text">Dark Mode: <strong>${isDarkMode ? 'On' : 'Off'}</strong></span>
    `;
    toggleButton.addEventListener('click', toggleDarkMode);

    // Insert before school selector
    const schoolSelector = document.getElementById('school-selector-container');
    if (schoolSelector) {
        header.insertBefore(toggleButton, schoolSelector);
    } else {
        header.appendChild(toggleButton);
    }
}

// Update toggle button icon and text
function updateToggleButton() {
    const toggleButton = document.getElementById('dark-mode-toggle');
    if (toggleButton) {
        toggleButton.innerHTML = `
            <span class="dark-mode-icon">${isDarkMode ? '🌙' : '☀️'}</span>
            <span class="dark-mode-text">Dark Mode: <strong>${isDarkMode ? 'On' : 'Off'}</strong></span>
        `;
        toggleButton.setAttribute('aria-label', isDarkMode ? 'Switch to light mode' : 'Switch to dark mode');
    }
}

// Listen for system theme changes
if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        const savedMode = localStorage.getItem(STORAGE_KEY);
        // Only auto-switch if user hasn't set a preference
        if (savedMode === null) {
            isDarkMode = e.matches;
            applyDarkMode();
            updateToggleButton();
        }
    });
}
