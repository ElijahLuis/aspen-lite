import { getCurrentSchool } from '../app/state.js';

export function renderHome() {
    const root = document.getElementById('app-root');
    const selectedSchool = getCurrentSchool();

    root.innerHTML = `
        <div class="home-container" role="main" aria-label="Home page content">
            <section class="welcome-section" aria-labelledby="welcome-heading">
                <h1 id="welcome-heading">Welcome to Aspen Lite</h1>
                <p class="subtitle">A lightweight student information system for Chicago Public Schools</p>
            </section>

            <section class="stats-grid" aria-label="Quick stats and access">
                <article class="stat-card" aria-labelledby="current-school-heading">
                    <div class="stat-icon" aria-hidden="true">🏫</div>
                    <div class="stat-content">
                        <h3 id="current-school-heading">Current School</h3>
                        <p class="stat-value">${selectedSchool || 'No school selected'}</p>
                        <p class="stat-hint">Use the school selector above to change schools</p>
                    </div>
                </article>

                <article class="stat-card" aria-labelledby="quick-access-heading">
                    <div class="stat-icon" aria-hidden="true">👥</div>
                    <div class="stat-content">
                        <h3 id="quick-access-heading">Quick Access</h3>
                        <p class="stat-value"><a href="#/students" class="stat-link" aria-label="Navigate to student list">View Students</a></p>
                        <p class="stat-hint">Browse and filter student records</p>
                    </div>
                </article>
            </section>

            <section class="info-section" aria-labelledby="features-heading">
                <h2 id="features-heading">Features</h2>
                <div class="features-grid">
                    <article class="feature-item">
                        <h4><span aria-hidden="true">🔍</span> Search & Filter</h4>
                        <p>Quickly find students by name, grade, gender, or ethnicity</p>
                    </article>
                    <article class="feature-item">
                        <h4><span aria-hidden="true">⭐</span> Favorites</h4>
                        <p>Bookmark your frequently accessed schools for quick access</p>
                    </article>
                    <article class="feature-item">
                        <h4><span aria-hidden="true">📊</span> Real-time Data</h4>
                        <p>Powered by a backend API with 390,000+ student records</p>
                    </article>
                    <article class="feature-item">
                        <h4><span aria-hidden="true">⚡</span> Lightning Fast</h4>
                        <p>Optimized pagination and caching for instant performance</p>
                    </article>
                </div>
            </section>
        </div>
    `;
}
