// ============================================================
// Request Detail Page Logic
// Shows request details, lists suggestions, handles suggestion form
// ============================================================

/* global onAuthReady, injectNav, db, currentUser, escapeHTML, formatDate, timeAgo,
   requireRegistered, showAuthModal, showToast, showConfirmModal, trackRequestViewed,
   trackSuggestionCreated, getUrlParam, firebase */

let requestId = null;

document.addEventListener('DOMContentLoaded', () => {
  requestId = getUrlParam('id');

  if (!requestId) {
    document.getElementById('requestDetail').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">❌</div>
        <h3 class="empty-state-title">Request Not Found</h3>
        <p class="empty-state-text">This request doesn't exist or the link is invalid.</p>
        <a href="browse.html" class="btn btn-primary">Browse Requests</a>
      </div>
    `;
    return;
  }

  const suggestMovieBtn = document.getElementById('suggestMovieBtn');
  const suggestForm = document.getElementById('suggestForm');
  const cancelSuggestBtn = document.getElementById('cancelSuggestBtn');
  const suggestionForm = document.getElementById('suggestionForm');
  const reasonTextarea = document.getElementById('reason');
  const reasonCharCount = document.getElementById('reasonCharCount');

  // Character count for reason
  reasonTextarea.addEventListener('input', () => {
    reasonCharCount.textContent = reasonTextarea.value.length;
  });

  // Show suggest form
  suggestMovieBtn.addEventListener('click', () => {
    if (!currentUser || !requireRegistered()) {
      showAuthModal();
      return;
    }
    suggestForm.classList.remove('hidden');
    suggestMovieBtn.parentElement.style.display = 'none';
    document.getElementById('movieName').focus();
  });

  // Cancel suggest
  cancelSuggestBtn.addEventListener('click', () => {
    suggestForm.classList.add('hidden');
    suggestMovieBtn.parentElement.style.display = '';
    suggestionForm.reset();
    reasonCharCount.textContent = '0';
  });

  // Submit suggestion
  suggestionForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!requireRegistered()) {
      showAuthModal();
      return;
    }

    const movieName = document.getElementById('movieName').value.trim();
    const reason = reasonTextarea.value.trim();

    if (!movieName || reason.length < 10) {
      showToast('Please fill in all fields (reason must be at least 10 characters).', 'error');
      return;
    }

    const submitBtn = document.getElementById('submitSuggestionBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
      await db.collection('suggestions').add({
        requestId: requestId,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'User',
        movieName: movieName,
        reason: reason,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      trackSuggestionCreated(requestId);
      showToast('Suggestion submitted!', 'success');

      // Reset and hide form
      suggestionForm.reset();
      reasonCharCount.textContent = '0';
      suggestForm.classList.add('hidden');
      suggestMovieBtn.parentElement.style.display = '';

      // Reload suggestions
      loadSuggestions();
    } catch (error) {
      console.error('Failed to submit suggestion:', error);
      showToast('Failed to submit suggestion. Please try again.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Suggestion';
    }
  });

  // Load everything once auth is ready
  onAuthReady(() => {
    injectNav('');
    loadRequest();
    loadSuggestions();
    trackRequestViewed(requestId);
  });
});

async function loadRequest() {
  const container = document.getElementById('requestDetail');

  try {
    const doc = await db.collection('requests').doc(requestId).get();

    if (!doc.exists) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">❌</div>
          <h3 class="empty-state-title">Request Not Found</h3>
          <p class="empty-state-text">This request may have been deleted.</p>
          <a href="browse.html" class="btn btn-primary">Browse Requests</a>
        </div>
      `;
      return;
    }

    const data = doc.data();

    container.innerHTML = `
      <div class="request-detail fade-in">
        <div class="card-meta mb-md">
          <span class="card-meta-item">👤 ${escapeHTML(data.userName || 'Anonymous')}</span>
          <span class="card-meta-item">· ${formatDate(data.createdAt)}</span>
        </div>
        <div class="tags">
          <span class="tag tag-genre">🎭 ${escapeHTML(data.genre || 'Any')}</span>
          <span class="tag tag-language">🌐 ${escapeHTML(data.language || 'Any')}</span>
          <span class="tag tag-mood">✨ ${escapeHTML(data.mood || 'Any')}</span>
        </div>
        <div class="card-description full" style="-webkit-line-clamp:unset;">
          "${escapeHTML(data.description || '')}"
        </div>
      </div>
    `;

    // Update page title
    document.title = `${data.description ? data.description.substring(0, 50) : 'Request'} — MovieSuggest`;

    // Show suggestions section
    document.getElementById('suggestionsSection').style.display = '';
  } catch (error) {
    console.error('Failed to load request:', error);
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3 class="empty-state-title">Error Loading Request</h3>
        <p class="empty-state-text">Please check your connection and try again.</p>
        <a href="browse.html" class="btn btn-primary">Browse Requests</a>
      </div>
    `;
  }
}

async function loadSuggestions() {
  const suggestionsList = document.getElementById('suggestionsList');
  const sugCount = document.getElementById('sugCount');

  try {
    const snapshot = await db.collection('suggestions')
      .where('requestId', '==', requestId)
      .orderBy('createdAt', 'asc')
      .get();

    const count = snapshot.size;
    sugCount.innerHTML = `<span class="count">${count}</span> suggestion${count !== 1 ? 's' : ''}`;

    if (snapshot.empty) {
      suggestionsList.innerHTML = `
        <div class="empty-state" style="padding:32px 16px;">
          <div class="empty-state-icon">🍿</div>
          <h3 class="empty-state-title">No suggestions yet</h3>
          <p class="empty-state-text">Be the first to recommend a movie!</p>
        </div>
      `;
      return;
    }

    let html = '';
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const isOwner = currentUser && currentUser.uid === data.userId;
      html += `
        <div class="suggestion-card fade-in" id="suggestion-${doc.id}">
          <div class="flex-between">
            <h4 class="suggestion-movie-name">🎬 ${escapeHTML(data.movieName)}</h4>
            <div style="display:flex;gap:8px;align-items:center;">
              ${isOwner ? `
                <button class="btn btn-ghost btn-sm" onclick="editSuggestion('${doc.id}', ${JSON.stringify(data.movieName).replace(/'/g, "\\'")}, ${JSON.stringify(data.reason).replace(/'/g, "\\'")})">✏️</button>
                <button class="btn btn-ghost btn-sm" onclick="deleteSuggestion('${doc.id}')">🗑️</button>
              ` : ''}
              <button class="report-btn" onclick="reportContent('suggestion', '${doc.id}')" title="Report">⚑</button>
            </div>
          </div>
          <p class="suggestion-by">Recommended by <strong>${escapeHTML(data.userName || 'User')}</strong> · ${timeAgo(data.createdAt)}</p>
          <div class="suggestion-reason">"${escapeHTML(data.reason)}"</div>
        </div>
      `;
    });

    suggestionsList.innerHTML = html;
  } catch (error) {
    console.error('Failed to load suggestions:', error);
    suggestionsList.innerHTML = `<p class="text-secondary">Failed to load suggestions.</p>`;
  }
}

// ─── Edit Suggestion ───
function editSuggestion(suggestionId, currentName, currentReason) {
  const card = document.getElementById(`suggestion-${suggestionId}`);
  if (!card) return;

  card.innerHTML = `
    <form onsubmit="saveSuggestionEdit(event, '${suggestionId}')">
      <div class="form-group">
        <label class="form-label">Movie Name</label>
        <input type="text" class="form-input" id="editName-${suggestionId}" value="${escapeHTML(currentName)}" required maxlength="200">
      </div>
      <div class="form-group">
        <label class="form-label">Why do you recommend it?</label>
        <textarea class="form-textarea" id="editReason-${suggestionId}" required minlength="10" maxlength="500">${escapeHTML(currentReason)}</textarea>
      </div>
      <div style="display:flex;gap:12px;">
        <button type="submit" class="btn btn-primary btn-sm">Save</button>
        <button type="button" class="btn btn-secondary btn-sm" onclick="loadSuggestions()">Cancel</button>
      </div>
    </form>
  `;
}

async function saveSuggestionEdit(e, suggestionId) {
  e.preventDefault();

  const newName = document.getElementById(`editName-${suggestionId}`).value.trim();
  const newReason = document.getElementById(`editReason-${suggestionId}`).value.trim();

  if (!newName || newReason.length < 10) {
    showToast('Please fill in all fields properly.', 'error');
    return;
  }

  try {
    await db.collection('suggestions').doc(suggestionId).update({
      movieName: newName,
      reason: newReason
    });
    showToast('Suggestion updated!', 'success');
    loadSuggestions();
  } catch (error) {
    console.error('Failed to update suggestion:', error);
    showToast('Failed to update. Please try again.', 'error');
  }
}

// ─── Delete Suggestion ───
function deleteSuggestion(suggestionId) {
  showConfirmModal(
    'Delete Suggestion',
    'Are you sure you want to delete this movie suggestion? This action cannot be undone.',
    async () => {
      try {
        await db.collection('suggestions').doc(suggestionId).delete();
        showToast('Suggestion deleted.', 'success');
        loadSuggestions();
      } catch (error) {
        console.error('Failed to delete suggestion:', error);
        showToast('Failed to delete. Please try again.', 'error');
      }
    }
  );
}

// ─── Report Content ───
function reportContent(type, contentId) {
  if (!currentUser) {
    showAuthModal();
    return;
  }

  showConfirmModal(
    'Report Content',
    'Report this content as inappropriate, spam, or containing pirated/illegal links? Our team will review it.',
    async () => {
      try {
        await db.collection('reports').add({
          type: type,
          contentId: contentId,
          reportedBy: currentUser.uid,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showToast('Report submitted. Thank you!', 'success');
      } catch (error) {
        console.error('Failed to submit report:', error);
        showToast('Failed to submit report.', 'error');
      }
    }
  );
}
