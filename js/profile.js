// ============================================================
// Profile Page Logic
// Displays user profile, stats, saved watchlist, and account management
// 100% Static & Client-Side
// ============================================================

/* global onAuthReady, injectNav, db, currentUser, logout, escapeHTML, showToast, MovieStore */

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
          <p class="empty-state-text">Login, create an account, or continue as guest to view your profile and saved watchlist.</p>
          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
            <a href="auth.html?mode=register" class="btn btn-primary">Create Account</a>
            <a href="auth.html?mode=login" class="btn btn-secondary">Login</a>
            <button class="btn btn-ghost" id="quickGuestProfileBtn">👤 Continue as Guest</button>
          </div>
        </div>
      `;

      const quickBtn = document.getElementById('quickGuestProfileBtn');
      if (quickBtn) {
        quickBtn.addEventListener('click', async () => {
          await window.loginAsGuest();
          window.location.reload();
        });
      }
      return;
    }

    // Fetch stats
    let requestCount = 0;
    let suggestionCount = 0;

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

    const isGuest = user.isAnonymous;
    const initial = isGuest ? '👤' : (user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U');
    const name = user.displayName || (isGuest ? 'Guest Movie Fan' : 'Movie Buff');
    const email = isGuest ? 'Local Session Account' : (user.email || 'Registered User');
    const watchlist = MovieStore.getWatchlist();

    profileContent.innerHTML = `
      <div class="fade-in">
        <!-- Profile Header -->
        <div class="profile-header">
          <div class="profile-avatar">${initial}</div>
          <div class="profile-info">
            <h1 id="userDisplayName">${escapeHTML(name)}</h1>
            <p>${escapeHTML(email)}</p>
            <div class="mt-sm" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
              ${isGuest
                ? '<span class="badge-guest">👤 Guest Session</span>'
                : '<span class="badge-registered">✓ Registered Account</span>'
              }
              <button class="btn btn-ghost btn-sm" id="editNameBtn" style="padding:2px 8px;font-size:0.75rem;">✏️ Edit Name</button>
            </div>
          </div>
        </div>

        <!-- Inline Name Edit Form (Hidden by default) -->
        <div class="auth-card hidden mb-md" id="editNameCard" style="margin-bottom: 24px;">
          <h3 style="font-size: 1rem; margin-bottom: 12px;">Update Display Name</h3>
          <div style="display:flex;gap:12px;">
            <input type="text" id="newNameInput" class="form-input" value="${escapeHTML(name)}" maxlength="40">
            <button class="btn btn-primary btn-sm" id="saveNameBtn">Save</button>
            <button class="btn btn-secondary btn-sm" id="cancelNameBtn">Cancel</button>
          </div>
        </div>

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
            <div class="stat-value">${watchlist.length}</div>
            <div class="stat-label">Watchlist</div>
          </div>
        </div>

        <!-- My Watchlist Section -->
        <div class="auth-card mb-md" style="margin-bottom: 24px;">
          <div class="flex-between" style="margin-bottom: 16px;">
            <h3 style="font-family:var(--font-heading);font-size:1.15rem;margin:0;">⭐ My Saved Watchlist (${watchlist.length})</h3>
            <a href="movies.html" class="btn btn-ghost btn-sm">Explore Movies →</a>
          </div>

          <div id="watchlistContainer">
            ${watchlist.length > 0 ? `
              <div style="display:flex;flex-direction:column;gap:10px;">
                ${watchlist.map(title => `
                  <div class="flex-between" style="padding:10px 14px;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:var(--radius-sm);">
                    <span style="font-weight:600;font-size:0.95rem;">🎬 ${escapeHTML(title)}</span>
                    <button class="btn btn-ghost btn-sm remove-watchlist-btn" data-title="${escapeHTML(title)}" style="color:var(--text-muted);font-size:0.8rem;">✕ Remove</button>
                  </div>
                `).join('')}
              </div>
            ` : `
              <p class="text-secondary" style="font-size:0.9rem;padding:12px 0;">
                Your watchlist is currently empty. Visit the <a href="movies.html" style="color:var(--accent-secondary);">Top 200+ Movies</a> page and click ⭐ to save films to your watchlist!
              </p>
            `}
          </div>
        </div>

        <!-- Account Actions -->
        <div class="auth-card" style="text-align:center;">
          ${isGuest ? `
            <h3 style="font-family:var(--font-heading);margin-bottom:8px;">Convert to Permanent Account</h3>
            <p class="text-secondary" style="margin-bottom:20px;font-size:0.9rem;">
              Create an account with email and password so you can access your profile and recommendations anytime.
            </p>
            <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
              <a href="auth.html?mode=register" class="btn btn-primary">Create Account</a>
              <button class="btn btn-secondary" id="logoutBtn">Sign Out</button>
            </div>
          ` : `
            <h3 style="font-family:var(--font-heading);margin-bottom:8px;">Account Settings</h3>
            <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:16px;">
              <a href="activity.html" class="btn btn-secondary">View My Activity</a>
              <button class="btn btn-danger" id="logoutBtn">Sign Out</button>
            </div>
          `}

          <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid var(--border);">
            <button class="btn btn-ghost btn-sm" id="resetDemoBtn" style="color:var(--text-muted);font-size:0.8rem;">
              🔄 Reset Community Sample Data
            </button>
          </div>
        </div>
      </div>
    `;

    // Edit Name handlers
    const editNameBtn = document.getElementById('editNameBtn');
    const editNameCard = document.getElementById('editNameCard');
    const newNameInput = document.getElementById('newNameInput');
    const saveNameBtn = document.getElementById('saveNameBtn');
    const cancelNameBtn = document.getElementById('cancelNameBtn');

    if (editNameBtn && editNameCard) {
      editNameBtn.addEventListener('click', () => {
        editNameCard.classList.remove('hidden');
        newNameInput.focus();
      });
      cancelNameBtn.addEventListener('click', () => {
        editNameCard.classList.add('hidden');
      });
      saveNameBtn.addEventListener('click', () => {
        const val = newNameInput.value.trim();
        if (val) {
          currentUser.displayName = val;
          localStorage.setItem('moviesuggest_current_user_v1', JSON.stringify(currentUser));
          document.getElementById('userDisplayName').textContent = val;
          editNameCard.classList.add('hidden');
          showToast('Display name updated!', 'success');
        }
      });
    }

    // Remove from watchlist handler
    document.querySelectorAll('.remove-watchlist-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const title = e.currentTarget.dataset.title;
        MovieStore.toggleWatchlist(title);
        window.location.reload();
      });
    });

    // Reset Demo Data
    const resetDemoBtn = document.getElementById('resetDemoBtn');
    if (resetDemoBtn) {
      resetDemoBtn.addEventListener('click', () => {
        if (confirm('Reset community requests and suggestions back to the initial sample data?')) {
          MovieStore.resetDemoData();
        }
      });
    }

    // Logout handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        logout();
      });
    }
  });
});
