// ============================================================
// Profile Page Logic
// Displays user profile, stats, and account management
// ============================================================

/* global onAuthReady, injectNav, db, currentUser, logout, escapeHTML */

document.addEventListener('DOMContentLoaded', () => {
  const profileContent = document.getElementById('profileContent');

  onAuthReady(async (user) => {
    injectNav('profile');

    if (!user) {
      // Not logged in at all
      profileContent.innerHTML = `
        <div class="empty-state fade-in">
          <div class="empty-state-icon">👤</div>
          <h3 class="empty-state-title">Not Logged In</h3>
          <p class="empty-state-text">Login or create an account to view your profile.</p>
          <div style="display:flex;gap:12px;justify-content:center;">
            <a href="auth.html?mode=register" class="btn btn-primary">Create Account</a>
            <a href="auth.html?mode=login" class="btn btn-secondary">Login</a>
          </div>
        </div>
      `;
      return;
    }

    // Fetch stats
    let requestCount = 0;
    let suggestionCount = 0;

    if (!user.isAnonymous) {
      try {
        const [reqSnap, sugSnap] = await Promise.all([
          db.collection('requests').where('userId', '==', user.uid).get(),
          db.collection('suggestions').where('userId', '==', user.uid).get()
        ]);
        requestCount = reqSnap.size;
        suggestionCount = sugSnap.size;
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    }

    const isGuest = user.isAnonymous;
    const initial = isGuest ? '?' : (user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U');
    const name = isGuest ? 'Guest User' : (user.displayName || 'User');
    const email = isGuest ? 'No email — Guest account' : (user.email || 'No email');

    profileContent.innerHTML = `
      <div class="fade-in">
        <!-- Profile Header -->
        <div class="profile-header">
          <div class="profile-avatar">${initial}</div>
          <div class="profile-info">
            <h1>${escapeHTML(name)}</h1>
            <p>${escapeHTML(email)}</p>
            <div class="mt-sm">
              ${isGuest
                ? '<span class="badge-guest">👤 Guest Account</span>'
                : '<span class="badge-registered">✓ Registered Account</span>'
              }
            </div>
          </div>
        </div>

        ${!isGuest ? `
          <!-- Stats -->
          <div class="profile-stats">
            <div class="stat-card">
              <div class="stat-value">${requestCount}</div>
              <div class="stat-label">Requests</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${suggestionCount}</div>
              <div class="stat-label">Suggestions</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${requestCount + suggestionCount}</div>
              <div class="stat-label">Total Activity</div>
            </div>
          </div>
        ` : ''}

        <!-- Actions -->
        <div class="auth-card" style="text-align:center;">
          ${isGuest ? `
            <h3 style="font-family:var(--font-heading);margin-bottom:8px;">Upgrade Your Account</h3>
            <p class="text-secondary" style="margin-bottom:24px;font-size:0.9rem;">
              Create a permanent account to ask for recommendations and suggest movies to others.
            </p>
            <a href="auth.html?mode=register" class="btn btn-primary btn-lg btn-block">
              Create Account
            </a>
            <button class="btn btn-ghost btn-block mt-md" id="logoutBtn" style="margin-top:16px;">
              Sign Out (Guest)
            </button>
          ` : `
            <h3 style="font-family:var(--font-heading);margin-bottom:8px;">Account Actions</h3>
            <p class="text-secondary" style="margin-bottom:24px;font-size:0.9rem;">
              Manage your MovieSuggest account.
            </p>
            <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
              <a href="activity.html" class="btn btn-secondary">View My Activity</a>
              <button class="btn btn-danger" id="logoutBtn">Logout</button>
            </div>
          `}
        </div>
      </div>
    `;

    // Logout handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        logout();
      });
    }
  });
});
