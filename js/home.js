// ============================================================
// Home Page Logic
// Loads recent community requests and handles guest CTA
// ============================================================

/* global onAuthReady, injectNav, db, currentUser, loginAsGuest, escapeHTML, timeAgo, showSkeletonGrid */

document.addEventListener('DOMContentLoaded', () => {
  const recentGrid = document.getElementById('recentGrid');
  const heroGuestBtn = document.getElementById('heroGuestBtn');
  const heroAskBtn = document.getElementById('heroAskBtn');

  // Show skeleton loading immediately
  showSkeletonGrid(recentGrid, 6);

  onAuthReady((user) => {
    injectNav('home');

    // Show/hide guest button based on auth state
    if (!user) {
      heroGuestBtn.style.display = '';
    } else {
      heroGuestBtn.style.display = 'none';
    }

    // If user is a guest, redirect Ask button to auth modal
    if (user && user.isAnonymous) {
      heroAskBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showAuthModal();
      });
    } else if (!user) {
      heroAskBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showAuthModal();
      });
    }

    // Load recent requests
    loadRecentRequests();
  });

  // Guest login handler
  heroGuestBtn.addEventListener('click', async () => {
    heroGuestBtn.disabled = true;
    heroGuestBtn.textContent = 'Loading...';
    try {
      await loginAsGuest();
      heroGuestBtn.style.display = 'none';
      injectNav('home');
    } catch (error) {
      heroGuestBtn.disabled = false;
      heroGuestBtn.textContent = '👤 Continue as Guest';
    }
  });
});

async function loadRecentRequests() {
  const recentGrid = document.getElementById('recentGrid');

  try {
    // Fetch last 6 requests
    const snapshot = await db.collection('requests')
      .orderBy('createdAt', 'desc')
      .limit(6)
      .get();

    if (snapshot.empty) {
      recentGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🎬</div>
          <h3 class="empty-state-title">No requests yet</h3>
          <p class="empty-state-text">Be the first to ask the community for a movie recommendation!</p>
          <a href="ask.html" class="btn btn-primary">Ask for a Recommendation</a>
        </div>
      `;
      return;
    }

    // Get suggestion counts for each request
    const requestIds = snapshot.docs.map(doc => doc.id);
    const suggestionCounts = {};

    // Fetch suggestion counts in parallel
    const countPromises = requestIds.map(async (id) => {
      const sugSnap = await db.collection('suggestions')
        .where('requestId', '==', id)
        .get();
      suggestionCounts[id] = sugSnap.size;
    });
    await Promise.all(countPromises);

    // Render cards
    let cardsHTML = '';
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      const count = suggestionCounts[doc.id] || 0;
      cardsHTML += renderRequestCard(doc.id, data, count, index);
    });

    recentGrid.innerHTML = cardsHTML;
  } catch (error) {
    console.error('Failed to load recent requests:', error);
    recentGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">⚠️</div>
        <h3 class="empty-state-title">Couldn't load requests</h3>
        <p class="empty-state-text">Please check your connection and try again.</p>
      </div>
    `;
  }
}

function renderRequestCard(id, data, suggestionCount, index) {
  return `
    <div class="card fade-in-up stagger-${(index % 6) + 1}">
      <div class="card-meta">
        <span class="card-meta-item">👤 ${escapeHTML(data.userName || 'Anonymous')}</span>
        <span class="card-meta-item">· ${timeAgo(data.createdAt)}</span>
      </div>
      <h3 class="card-title">${escapeHTML(data.description ? data.description.substring(0, 60) : 'Movie Recommendation Request')}${data.description && data.description.length > 60 ? '...' : ''}</h3>
      <div class="tags">
        <span class="tag tag-genre">🎭 ${escapeHTML(data.genre || 'Any')}</span>
        <span class="tag tag-language">🌐 ${escapeHTML(data.language || 'Any')}</span>
        <span class="tag tag-mood">✨ ${escapeHTML(data.mood || 'Any')}</span>
      </div>
      <p class="card-description">"${escapeHTML(data.description || '')}"</p>
      <div class="card-footer">
        <span class="suggestion-count">💡 <span class="count">${suggestionCount}</span> suggestion${suggestionCount !== 1 ? 's' : ''}</span>
        <a href="request.html?id=${id}" class="btn btn-secondary btn-sm">View Suggestions →</a>
      </div>
    </div>
  `;
}
