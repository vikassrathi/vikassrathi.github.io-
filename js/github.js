// GitHub API Integration
const GITHUB_USERNAME = 'vikassrathi';
const GITHUB_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos`;

// Language color mapping
const languageColors = {
    'Python': 'python',
    'JavaScript': 'javascript',
    'TypeScript': 'typescript',
    'Java': 'java',
    'Scala': 'scala',
    'Go': 'go',
    'Rust': 'rust',
    'HTML': 'html',
    'CSS': 'css',
    'Shell': 'shell',
    'Jupyter Notebook': 'jupyter'
};

// Initialize projects
async function initializeProjects(featuredProjects = []) {
    const container = document.getElementById('projects-grid');
    if (!container) return;

    // Show loading
    container.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
        </div>
    `;

    try {
        const repos = await fetchGitHubRepos();
        renderProjects(container, repos, featuredProjects);
    } catch (error) {
        console.error('Failed to fetch GitHub repos:', error);
        container.innerHTML = `
            <div class="error-message">
                <p>Unable to load projects. Please visit my GitHub profile directly.</p>
            </div>
        `;
    }
}

// Fetch repos from GitHub API
async function fetchGitHubRepos() {
    const response = await fetch(`${GITHUB_API_URL}?per_page=100&sort=updated`);

    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
    }

    const repos = await response.json();

    // Filter out forks and sort by stars then update date
    return repos
        .filter(repo => !repo.fork)
        .sort((a, b) => {
            // Sort by stars first, then by updated date
            if (b.stargazers_count !== a.stargazers_count) {
                return b.stargazers_count - a.stargazers_count;
            }
            return new Date(b.updated_at) - new Date(a.updated_at);
        });
}

// Render projects
function renderProjects(container, repos, featuredProjects) {
    if (!repos || repos.length === 0) {
        container.innerHTML = `
            <div class="error-message">
                <p>No projects found.</p>
            </div>
        `;
        return;
    }

    // Separate featured and other projects
    const featured = [];
    const others = [];

    repos.forEach(repo => {
        if (featuredProjects.includes(repo.name)) {
            featured.push({ ...repo, isFeatured: true });
        } else {
            others.push(repo);
        }
    });

    // Sort featured by the order in config
    featured.sort((a, b) => {
        return featuredProjects.indexOf(a.name) - featuredProjects.indexOf(b.name);
    });

    // Combine: featured first, then others
    const sortedRepos = [...featured, ...others];

    container.innerHTML = sortedRepos.map((repo, index) => createProjectCard(repo, index)).join('');

    // Initialize filters after rendering
    if (window.initializeProjectFilters) {
        window.initializeProjectFilters();
    }
}

// Create project card HTML
function createProjectCard(repo, index) {
    const langClass = languageColors[repo.language] || 'default';
    const description = repo.description || 'No description available';
    const truncatedDesc = description.length > 120
        ? description.substring(0, 117) + '...'
        : description;

    return `
        <div class="project-card ${repo.isFeatured ? 'featured' : ''}"
             data-aos="fade-up"
             data-aos-delay="${Math.min(index * 50, 300)}">
            <div class="project-header">
                <a href="${repo.html_url}" target="_blank" rel="noopener" class="project-name">
                    ${escapeHtml(formatRepoName(repo.name))}
                </a>
                ${repo.isFeatured ? '<span class="project-featured-badge">Featured</span>' : ''}
            </div>
            <p class="project-description">${escapeHtml(truncatedDesc)}</p>
            <div class="project-meta">
                ${repo.language ? `
                    <span class="project-language">
                        <span class="language-dot lang-${langClass}"></span>
                        ${escapeHtml(repo.language)}
                    </span>
                ` : ''}
                ${repo.stargazers_count > 0 ? `
                    <span class="project-stars">
                        <svg viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>
                        </svg>
                        ${repo.stargazers_count}
                    </span>
                ` : ''}
            </div>
        </div>
    `;
}

// Format repository name (convert kebab-case to readable)
function formatRepoName(name) {
    return name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Utility: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Export for main.js
window.initializeProjects = initializeProjects;
