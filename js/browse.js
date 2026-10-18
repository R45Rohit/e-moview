// ============================================================
// Browse Page Logic
// Loads community requests with filtering, live search, and pagination
// 100% Static & Client-Side
// ============================================================

/* global onAuthReady, injectNav, db, escapeHTML, timeAgo, showSkeletonGrid, trackBrowseUsed, getUrlParam */

const PAGE_SIZE = 9;
let lastDoc = null;
let isLoading = false;
let currentFilters = { genre: '', language: '', mood: '', query: '' };

document.addEventListener('DOMContentLoaded', () => {
  const requestsGrid = document.getElementById('requestsGrid');
  const filterGenre = document.getElementById('filterGenre');
  const filterLanguage = document.getElementById('filterLanguage');
  const filterMood = document.getElementById('filterMood');
  const searchRequests = document.getElementById('searchRequests');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  const loadMoreContainer = document.getElementById('loadMoreContainer');

  // Check URL query param (e.g. ?q=sci-fi or ?genre=Action)
  const urlQ = getUrlParam('q') || '';
  const urlGenre = getUrlParam('genre') || '';
  if (urlQ && searchRequests) {
    searchRequests.value = urlQ;
    currentFilters.query = urlQ.toLowerCase();
  }
  if (urlGenre && filterGenre) {
    filterGenre.value = urlGenre;
    currentFilters.genre = urlGenre;
  }

  // Show skeleton loading
  showSkeletonGrid(requestsGrid, PAGE_SIZE);

  onAuthReady(() => {
    injectNav('browse');
    loadRequests(true);
  });

  // Filter change handlers
  [filterGenre, filterLanguage, filterMood].forEach(filter => {
    if (!filter) return;
    filter.addEventListener('change', () => {
      currentFilters.genre = filterGenre.value;
      currentFilters.language = filterLanguage.value;
      currentFilters.mood = filterMood.value;

      trackBrowseUsed(currentFilters);
      lastDoc = null;
      loadRequests(true);
    });
  });

  // Live search handler
  if (searchRequests) {
    searchRequests.addEventListener('input', () => {
      currentFilters.query = searchRequests.value.trim().toLowerCase();
      lastDoc = null;
      loadRequests(true);
    });
  }

  // Load more
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      loadRequests(false);
    });
  }
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
  } else if (loadMoreBtn) {
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

    query = query.orderBy('createdAt', 'desc');

    const snapshot = await query.get();
    let docs = snapshot.docs;

    // Filter by text search if provided
    if (currentFilters.query) {
      const q = currentFilters.query;
      docs = docs.filter(doc => {
        const d = doc.data();
        const text = `${d.description || ''} ${d.userName || ''} ${d.genre || ''} ${d.language || ''} ${d.mood || ''}`.toLowerCase();
        return text.includes(q);
      });
    }

    if (docs.length === 0 && reset) {
      requestsGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🔍</div>
          <h3 class="empty-state-title">No requests found</h3>
          <p class="empty-state-text">Try adjusting your filters or search terms, or be the first to ask for a recommendation!</p>
          <a href="/ask" class="btn btn-primary mt-md">Ask for a Recommendation</a>
        </div>
      `;
      if (loadMoreContainer) loadMoreContainer.style.display = 'none';
      isLoading = false;
      return;
    }

    // Pagination slice
    const startIndex = reset ? 0 : (lastDoc ? docs.findIndex(d => d.id === lastDoc.id) + 1 : 0);
    const pageDocs = docs.slice(startIndex, startIndex + PAGE_SIZE);

    if (pageDocs.length === 0 && !reset) {
      if (loadMoreContainer) loadMoreContainer.style.display = 'none';
      isLoading = false;
      return;
    }

    // Track last document for pagination
    lastDoc = pageDocs[pageDocs.length - 1];

    // Fetch suggestion counts
    const requestIds = pageDocs.map(d => d.id);
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
    pageDocs.forEach((doc, index) => {
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
    const hasMore = startIndex + PAGE_SIZE < docs.length;
    if (loadMoreContainer) {
      loadMoreContainer.style.display = hasMore ? '' : 'none';
    }
    if (loadMoreBtn) {
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = 'Load More Requests';
    }

  } catch (error) {
    console.error('Failed to load requests:', error);
    if (reset) {
      requestsGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">⚠️</div>
          <h3 class="empty-state-title">Something went wrong</h3>
          <p class="empty-state-text">Please refresh the page to view requests.</p>
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
        <a href="/request?id=${id}" class="btn btn-secondary btn-sm">View Request →</a>
      </div>
    </div>
  `;
}
