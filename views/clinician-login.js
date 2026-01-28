export function renderClinicianLogin() {
    // Hide the default app layout for full-page login
    document.body.classList.add('login-page');

    const root = document.getElementById('app-root');

    root.innerHTML = `
        <div class="login-container">
            <!-- Skip link for accessibility -->
            <a href="#main-content" class="skip-link">Skip to main content</a>

            <!-- Header -->
            <header class="login-header">
                <div class="logo-container">
                    <div class="cps-logo" aria-hidden="true">
                        <svg viewBox="0 0 48 48" fill="currentColor" aria-hidden="true">
                            <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" stroke-width="3"/>
                            <text x="24" y="30" text-anchor="middle" font-size="16" font-weight="bold">CPS</text>
                        </svg>
                    </div>
                    <div class="logo-text">
                        <h1>Chicago Public Schools</h1>
                        <p>Clinician Portal</p>
                    </div>
                </div>
            </header>

            <!-- Main Content -->
            <main id="main-content" class="login-main">
                <!-- Hero Section -->
                <section class="hero-section" aria-labelledby="hero-title">
                    <div class="hero-content">
                        <h2 id="hero-title">Welcome, School Health Professionals</h2>
                        <p class="hero-subtitle">
                            Access student health records, manage caseloads, and collaborate with your school community.
                        </p>

                        <!-- Login Card -->
                        <div class="login-card" role="region" aria-label="Login options">
                            <h3>Sign In to Your Account</h3>

                            <form class="login-form" action="https://aspen.cps.edu" method="get" aria-label="Clinician login form">
                                <div class="form-group">
                                    <label for="username">CPS Username</label>
                                    <input
                                        type="text"
                                        id="username"
                                        name="username"
                                        autocomplete="username"
                                        placeholder="Enter your CPS username"
                                        required
                                        aria-required="true"
                                    >
                                </div>

                                <div class="form-group">
                                    <label for="password">Password</label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        autocomplete="current-password"
                                        placeholder="Enter your password"
                                        required
                                        aria-required="true"
                                    >
                                </div>

                                <button type="submit" class="btn-primary">
                                    Sign In
                                    <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                        <path d="M5 12h14M12 5l7 7-7 7"/>
                                    </svg>
                                </button>
                            </form>

                            <div class="login-divider">
                                <span>or</span>
                            </div>

                            <a href="https://aspen.cps.edu" class="btn-secondary" target="_blank" rel="noopener noreferrer">
                                Go to Aspen Login Portal
                                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                    <polyline points="15 3 21 3 21 9"/>
                                    <line x1="10" y1="14" x2="21" y2="3"/>
                                </svg>
                            </a>

                            <p class="help-text">
                                <a href="https://aspen.cps.edu" target="_blank" rel="noopener noreferrer">Forgot password?</a>
                                <span aria-hidden="true">|</span>
                                <a href="https://www.cps.edu/services-and-supports/technology-and-it-support/" target="_blank" rel="noopener noreferrer">IT Support</a>
                            </p>
                        </div>
                    </div>
                </section>

                <!-- Roles Section -->
                <section class="roles-section" aria-labelledby="roles-title">
                    <h3 id="roles-title" class="visually-hidden">Supported Clinician Roles</h3>
                    <div class="roles-grid">
                        <article class="role-card" tabindex="0">
                            <div class="role-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                                </svg>
                            </div>
                            <h4>School Nurses</h4>
                            <p>Manage student health records, immunizations, and medical action plans.</p>
                        </article>

                        <article class="role-card" tabindex="0">
                            <div class="role-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                    <circle cx="9" cy="7" r="4"/>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                </svg>
                            </div>
                            <h4>Social Workers</h4>
                            <p>Support student well-being, family engagement, and community resources.</p>
                        </article>

                        <article class="role-card" tabindex="0">
                            <div class="role-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <path d="M12 16v-4"/>
                                    <path d="M12 8h.01"/>
                                </svg>
                            </div>
                            <h4>Psychologists</h4>
                            <p>Conduct assessments, provide counseling, and support mental health needs.</p>
                        </article>

                        <article class="role-card" tabindex="0">
                            <div class="role-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                                    <line x1="12" y1="19" x2="12" y2="23"/>
                                    <line x1="8" y1="23" x2="16" y2="23"/>
                                </svg>
                            </div>
                            <h4>Speech Therapists</h4>
                            <p>Address communication disorders and support language development.</p>
                        </article>

                        <article class="role-card" tabindex="0">
                            <div class="role-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
                                    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                                    <line x1="6" y1="1" x2="6" y2="4"/>
                                    <line x1="10" y1="1" x2="10" y2="4"/>
                                    <line x1="14" y1="1" x2="14" y2="4"/>
                                </svg>
                            </div>
                            <h4>Occupational Therapists</h4>
                            <p>Enhance fine motor skills, sensory processing, and daily living activities.</p>
                        </article>
                    </div>
                </section>

                <!-- Features Section -->
                <section class="features-section" aria-labelledby="features-title">
                    <h3 id="features-title">What You Can Do</h3>
                    <ul class="features-list" role="list">
                        <li>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            <span>View and update student health information</span>
                        </li>
                        <li>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            <span>Manage your caseload and appointments</span>
                        </li>
                        <li>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            <span>Document services and interventions</span>
                        </li>
                        <li>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            <span>Collaborate with teachers and staff</span>
                        </li>
                        <li>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            <span>Generate reports and track outcomes</span>
                        </li>
                    </ul>
                </section>
            </main>

            <!-- Footer -->
            <footer class="login-footer">
                <div class="footer-content">
                    <div class="footer-links">
                        <a href="https://www.cps.edu" target="_blank" rel="noopener noreferrer">CPS Homepage</a>
                        <a href="https://www.cps.edu/about/accessibility/" target="_blank" rel="noopener noreferrer">Accessibility</a>
                        <a href="https://www.cps.edu/about/policies-and-guidelines/privacy-policy/" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
                        <a href="https://www.cps.edu/services-and-supports/technology-and-it-support/" target="_blank" rel="noopener noreferrer">IT Support</a>
                    </div>
                    <p class="footer-copyright">
                        &copy; ${new Date().getFullYear()} Chicago Public Schools. All rights reserved.
                    </p>
                    <p class="footer-tagline">
                        Supporting every student in every school, every day.
                    </p>
                </div>
            </footer>
        </div>
    `;

    // Add keyboard navigation for role cards
    const roleCards = root.querySelectorAll('.role-card');
    roleCards.forEach(card => {
        card.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                card.classList.toggle('expanded');
            }
        });
    });
}

// Function to restore normal layout when navigating away
export function restoreAppLayout() {
    document.body.classList.remove('login-page');
}
