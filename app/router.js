import { renderStudentList } from '../views/student-list.js';
import { renderStudentDetail } from '../views/student-detail.js';
import { loadState, setCurrentSchool, getCurrentSchool } from './state.js';
import { initSchoolSelector } from './school-selector.js';
import { getSchools } from './api.js';

const routes = {
    '/students': renderStudentList,
    '/student': renderStudentDetail,
};

let isInitialized = false;

async function initialize() {
    if (isInitialized) return;

    // Load state from localStorage
    loadState();

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

    const hash = location.hash || '#/students';
    const [path, id] = hash.slice(1).split('/').filter(Boolean);

    const view = routes[`/${path}`];
    if (view) {
        view(id);
    } else {
        document.getElementById('app-root').innerHTML = '<p>404</p>';
    }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);
