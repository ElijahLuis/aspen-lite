export async function renderStudentDetail(studentId) {
  const root = document.getElementById('app-root');

  const res = await fetch('../data/students.json');
  const students = await res.json();

  const student = students.find(s => s.id.aspen == studentId);

  root.innerHTML = `
  <div class="student-header">
    <h1>${student.name.first} ${student.name.last}</h1>
    <p>Grade ${student.enrollment.grade} – Room ${student.enrollment.homeroom}</p>
  </div>

  <div class="tabs">
    <button class="tab-btn" data-tab="demographics">Demographics</button>
    <button class="tab-btn" data-tab="contacts">Contacts</button>
    <button class="tab-btn" data-tab="health">Health</button>
    <button class="tab-btn" data-tab="plans">Plans</button>
  </div>

  <div id="tab-content"></div>
`;

const buttons = document.querySelectorAll('.tab-btn');
const content = document.getElementById('tab-content');

buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    renderTab(tab, student, content);
  });
});

// auto-load the first tab
renderTab('demographics', student, content);

}
