export async function renderStudentDetail(studentId) {
    const root = document.getElementById('app-root');

    const res = await fetch('../data/students.json');
    const students = await res.json();

    const student = students.find(s => s.id.aspen == studentId);

    root.innerHTML = `
    <h1>${student.name.first} ${student.name.last}</h1>

    <p>Grade: ${student.enrollment.grade}</p>
    <p>Homeroom: ${student.enrollment.homeroom}</p>

    <h2>Health Alerts</h2>
    <ul>
      ${student.health.conditions.map(c => `<li>${c}</li>`).join('')}
    </ul>

    <p><a href="#/students">Back to list</a></p>
  `;
}
