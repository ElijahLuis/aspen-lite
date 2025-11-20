import { renderStudentList } from '../views/student-list.js';
import { renderStudentDetail } from '../views/student-detail.js';

const routes = {
    '/students': renderStudentList,
    '/student': renderStudentDetail,
};

function router() {
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
