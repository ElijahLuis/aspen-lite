export async function renderStudentList() {
    const root = document.getElementById('app-root');

    const res = await fetch('../data/students.json');
    const students = await res.json();

    root.innerHTML = `
    <h1>Student List</h1>
    <ul class="student-list">
      ${students.map(s => `
        <li>
          <a href="#/student/${s.id.aspen}">
            ${s.name.last}, ${s.name.first} — Grade ${s.enrollment.grade}
          </a>
        </li>
      `).join('')}
    </ul>
  `;
}
