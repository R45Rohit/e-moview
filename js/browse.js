// ============================================================
// Browse Page Logic
// Loads community requests with filtering and pagination
// ============================================================

/* global onAuthReady, injectNav, db, escapeHTML, timeAgo, showSkeletonGrid, trackBrowseUsed */

const PAGE_SIZE = 9;
let lastDoc = null;
let isLoading = false;
let currentFilters = { genre: '', language: '', mood: '' };

document.addEventListener('DOMContentLoaded', () => {
  const requestsGrid = document.getElementById('requestsGrid');
  const filterGenre = document.getElementById('filterGenre');
  const filterLanguage = document.getElementById('filterLanguage');
  const filterMood = document.getElementById('filterMood');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  const loadMoreContainer = document.getElementById('loadMoreContainer');

  // Show skeleton loading
  showSkeletonGrid(requestsGrid, PAGE_SIZE);

  onAuthReady(() => {
    injectNav('browse');
    loadRequests(true);
  });

  // Filter change handlers
  [filterGenre, filterLanguage, filterMood].forEach(filter => {
    filter.addEventListener('change', () => {
      currentFilters.genre = filterGenre.value;
      currentFilters.language = filterLanguage.value;
      currentFilters.mood = filterMood.value;

      trackBrowseUsed(currentFilters);
      lastDoc = null;
      loadRequests(true);
    });
  });

  // Load more
  loadMoreBtn.addEventListener('click', () => {
    loadRequests(false);
  });
});

async function loadRequests(reset) {
  if (isLoading) return;
  isLoading = true;

  const requestsGrid = document.getElementById('requestsGrid');
  const loadMoreContainer = document.getElementById('loadMoreContainer');
  const loadMoreBtn = document.getElementById('loadMoreBtn');

  if (reset) {
    showSkeletonGrid(requestsGrid, PAGE_SIZE);
    lastDoc = null;
  } else {
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = 'Loading...';
  }

  try {
    // Build query
    let query = db.collection('requests');

    if (currentFilters.genre) {
      query = query.where('genre', '==', currentFilters.genre);
    }
    if (currentFilters.language) {
      query = query.where('language', '==', currentFilters.language);
    }
    if (currentFilters.mood) {
      query = query.where('mood', '==', currentFilters.mood);
    }

    query = query.orderBy('createdAt', 'desc').limit(PAGE_SIZE);

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();

    if (snapshot.empty && reset) {
      requestsGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🔍</div>
          <h3 class="empty-state-title">No requests found</h3>
          <p class="empty-state-text">Try adjusting your filters, or be the first to ask for a recommendation!</p>
          <a href="ask.html" class="btn btn-primary mt-md">Ask for a Recommendation</a>
        </div>
      `;
      loadMoreContainer.style.display = 'none';
      isLoading = false;
      return;
    }

    if (snapshot.empty && !reset) {
      loadMoreContainer.style.display = 'none';
      isLoading = false;
      return;
    }

    // Track last document for pagination
    lastDoc = snapshot.docs[snapshot.docs.length - 1];

    // Fetch suggestion counts
    const requestIds = snapshot.docs.map(d => d.id);
    const suggestionCounts = {};
    const countPromises = requestIds.map(async (id) => {
      const sugSnap = await db.collection('suggestions')
        .where('requestId', '==', id)
        .get();
      suggestionCounts[id] = sugSnap.size;
    });
    await Promise.all(countPromises);

    // Render cards
    let html = '';
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      const count = suggestionCounts[doc.id] || 0;
      html += renderBrowseCard(doc.id, data, count, index);
    });

    if (reset) {
      requestsGrid.innerHTML = html;
    } else {
      requestsGrid.insertAdjacentHTML('beforeend', html);
    }

    // Show/hide load more
    loadMoreContainer.style.display = snapshot.docs.length < PAGE_SIZE ? 'none' : '';
    loadMoreBtn.disabled = false;
    loadMoreBtn.textContent = 'Load More Requests';

  } catch (error) {
    console.error('Failed to load requests:', error);
    if (reset) {
      requestsGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">⚠️</div>
          <h3 class="empty-state-title">Something went wrong</h3>
          <p class="empty-state-text">Please check your connection and refresh the page.</p>
        </div>
      `;
    }
  }

  isLoading = false;
}

function renderBrowseCard(id, data, suggestionCount, index) {
  return `
    <div class="card fade-in-up stagger-${(index % 6) + 1}">
      <div class="card-meta">
        <span class="card-meta-item">👤 ${escapeHTML(data.userName || 'Anonymous')}</span>
        <span class="card-meta-item">· ${timeAgo(data.createdAt)}</span>
      </div>
      <h3 class="card-title">${escapeHTML(data.description ? data.description.substring(0, 60) : 'Movie Request')}${data.description && data.description.length > 60 ? '...' : ''}</h3>
      <div class="tags">
        <span class="tag tag-genre">🎭 ${escapeHTML(data.genre || 'Any')}</span>
        <span class="tag tag-language">🌐 ${escapeHTML(data.language || 'Any')}</span>
        <span class="tag tag-mood">✨ ${escapeHTML(data.mood || 'Any')}</span>
      </div>
      <p class="card-description">"${escapeHTML(data.description || '')}"</p>
      <div class="card-footer">
        <span class="suggestion-count">💡 <span class="count">${suggestionCount}</span> suggestion${suggestionCount !== 1 ? 's' : ''}</span>
        <a href="request.html?id=${id}" class="btn btn-secondary btn-sm">View Request →</a>
      </div>
    </div>
  `;
}
