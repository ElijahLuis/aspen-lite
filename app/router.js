import { renderStudentList } from '../views/student-list.js';
import { renderStudentDetail } from '../views/student-detail.js';
import { renderClinicianLogin, restoreAppLayout } from '../views/clinician-login.js';

const routes = {
    '/': renderClinicianLogin,
    '/login': renderClinicianLogin,
    '/students': renderStudentList,
    '/student': renderStudentDetail,
};

function router() {
    const hash = location.hash || '#/';
    const [path, id] = hash.slice(1).split('/').filter(Boolean);

    // Restore app layout when navigating away from login
    if (path && path !== '' && path !== 'login') {
        restoreAppLayout();
    }

    // Handle root path
    const routePath = path ? `/${path}` : '/';
    const view = routes[routePath];

    if (view) {
        view(id);
    } else {
        document.getElementById('app-root').innerHTML = '<p>404 - Page not found</p>';
    }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);
