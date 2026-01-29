import { getStudent } from '../app/api.js';

export async function renderStudentDetail(studentId) {
    const root = document.getElementById('app-root');

    // Show loading state
    root.innerHTML = `
        <div class="student-detail-container">
            <div class="loading-state">Loading student details...</div>
        </div>
    `;

    try {
        const { student } = await getStudent(studentId);

        if (!student) {
            root.innerHTML = `
                <div class="student-detail-container">
                    <div class="error-state">
                        <h2>Student Not Found</h2>
                        <p>Could not find student with ID: ${studentId}</p>
                        <button onclick="window.history.back()">Go Back</button>
                    </div>
                </div>
            `;
            return;
        }

        root.innerHTML = `
            <div class="student-detail-container">
                <div class="student-header">
                    <div class="header-content">
                        <h1>${student.firstName} ${student.lastName}</h1>
                        <p class="student-meta">
                            Grade ${student.grade} • ${student.school}
                        </p>
                    </div>
                    <button class="back-btn" onclick="window.history.back()">
                        ← Back to List
                    </button>
                </div>

                <div class="tabs">
                    <button class="tab-btn active" data-tab="demographics">Demographics</button>
                    <button class="tab-btn" data-tab="contact">Contact</button>
                    <button class="tab-btn" data-tab="enrollment">Enrollment</button>
                </div>

                <div id="tab-content" class="tab-content"></div>
            </div>
        `;

        const buttons = document.querySelectorAll('.tab-btn');
        const content = document.getElementById('tab-content');

        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active tab
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const tab = btn.dataset.tab;
                renderTab(tab, student, content);
            });
        });

        // Auto-load the first tab
        renderTab('demographics', student, content);

    } catch (error) {
        console.error('Failed to load student:', error);
        root.innerHTML = `
            <div class="student-detail-container">
                <div class="error-state">
                    <h2>Error Loading Student</h2>
                    <p>Failed to load student details. Please try again.</p>
                    <button onclick="location.reload()">Reload</button>
                    <button onclick="window.history.back()">Go Back</button>
                </div>
            </div>
        `;
    }
}

function renderTab(tab, student, content) {
    switch (tab) {
        case 'demographics':
            renderDemographics(student, content);
            break;
        case 'contact':
            renderContact(student, content);
            break;
        case 'enrollment':
            renderEnrollment(student, content);
            break;
        default:
            content.innerHTML = '<p>Tab not found</p>';
    }
}

function renderDemographics(student, content) {
    content.innerHTML = `
        <div class="detail-section">
            <h2>Demographics</h2>
            <div class="detail-grid">
                <div class="detail-item">
                    <label>Student ID</label>
                    <div class="detail-value">${student.studentId}</div>
                </div>
                <div class="detail-item">
                    <label>Full Name</label>
                    <div class="detail-value">${student.firstName} ${student.lastName}</div>
                </div>
                <div class="detail-item">
                    <label>Gender</label>
                    <div class="detail-value">${student.gender}</div>
                </div>
                <div class="detail-item">
                    <label>Ethnicity</label>
                    <div class="detail-value">${student.ethnicity}</div>
                </div>
            </div>
        </div>
    `;
}

function renderContact(student, content) {
    content.innerHTML = `
        <div class="detail-section">
            <h2>Contact Information</h2>
            <div class="detail-grid">
                <div class="detail-item">
                    <label>Address</label>
                    <div class="detail-value">${student.address || 'Not available'}</div>
                </div>
                <div class="detail-item">
                    <label>Zip Code</label>
                    <div class="detail-value">${student.zipCode || 'Not available'}</div>
                </div>
            </div>
            <div class="info-note">
                <p><strong>Note:</strong> Contact information for guardians and emergency contacts would be displayed here in the full application.</p>
            </div>
        </div>
    `;
}

function renderEnrollment(student, content) {
    content.innerHTML = `
        <div class="detail-section">
            <h2>Enrollment Information</h2>
            <div class="detail-grid">
                <div class="detail-item">
                    <label>School</label>
                    <div class="detail-value">${student.school}</div>
                </div>
                <div class="detail-item">
                    <label>Grade</label>
                    <div class="detail-value">${student.grade}</div>
                </div>
            </div>
            <div class="info-note">
                <p><strong>Note:</strong> Additional enrollment details such as homeroom, schedule, and attendance would be displayed here in the full application.</p>
            </div>
        </div>
    `;
}
