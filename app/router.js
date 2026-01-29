import { renderHome } from '../views/home.js';
import { renderStudentList } from '../views/student-list.js';
import { renderStudentDetail } from '../views/student-detail.js';
import { loadState, setCurrentSchool, getCurrentSchool } from './state.js';
import { initSchoolSelector } from './school-selector.js';
import { getSchools } from './api.js';
import { initDarkMode } from './dark-mode.js';

const routes = {
    '/home': renderHome,
    '/students': renderStudentList,
    '/student': renderStudentDetail,
};

let isInitialized = false;

async function initialize() {
    if (isInitialized) return;

    // Load state from localStorage
    loadState();

    // Initialize dark mode
    initDarkMode();

    // Initialize school selector (it will fetch schools from API)
    await initSchoolSelector();

    // If no school is selected, fetch schools and set first as default
    if (!getCurrentSchool()) {
        try {
            const { schools } = await getSchools({ limit: 1 });
            if (schools && schools.length > 0) {
                setCurrentSchool(schools[0].name, schools[0].id);
            }
        } catch (error) {
            console.error('Failed to load default school:', error);
        }
    }

    isInitialized = true;
}

async function router() {
    // Initialize app on first load
    await initialize();

    const hash = location.hash || '#/home';
    const [path, id] = hash.slice(1).split('/').filter(Boolean);

    // Update active nav link
    document.querySelectorAll('.side-nav a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#/${path}`) {
            link.classList.add('active');
        }
    });

    const view = routes[`/${path}`];
    if (view) {
        view(id);
    } else {
        document.getElementById('app-root').innerHTML = '<p>404</p>';
    }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);
