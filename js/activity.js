// ============================================================
// Activity Page Logic
// Shows user's requests and suggestions with edit/delete capabilities
// ============================================================

/* global onAuthReady, injectNav, db, currentUser, requireRegistered, escapeHTML, timeAgo,
   showToast, showConfirmModal, firebase */

document.addEventListener('DOMContentLoaded', () => {
  const authGuard = document.getElementById('authGuard');
  const activityContent = document.getElementById('activityContent');

  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`panel-${tab.dataset.tab}`).classList.add('active');
    });
  });

  onAuthReady((user) => {
    injectNav('activity');

    if (!requireRegistered()) {
      authGuard.classList.remove('hidden');
      activityContent.classList.add('hidden');
      return;
    }

    authGuard.classList.add('hidden');
    activityContent.classList.remove('hidden');

    loadMyRequests();
    loadMySuggestions();
  });
});

// ─── Load My Requests ───
async function loadMyRequests() {
  const container = document.getElementById('myRequestsList');

  try {
    const snapshot = await db.collection('requests')
      .where('userId', '==', currentUser.uid)
      .orderBy('createdAt', 'desc')
      .get();

    if (snapshot.empty) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <h3 class="empty-state-title">No requests yet</h3>
          <p class="empty-state-text">You haven't asked for any movie recommendations yet.</p>
          <a href="ask.html" class="btn btn-primary">Ask for a Recommendation</a>
        </div>
      `;
      return;
    }

    let html = '';
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      html += renderMyRequestCard(doc.id, data);
    });

    container.innerHTML = html;
  } catch (error) {
    console.error('Failed to load requests:', error);
    container.innerHTML = `<p class="text-secondary text-center">Failed to load your requests.</p>`;
  }
}

function renderMyRequestCard(id, data) {
  return `
    <div class="card mb-md fade-in" id="request-${id}">
      <div class="flex-between">
        <div class="card-meta">
          <span class="card-meta-item">${timeAgo(data.createdAt)}</span>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-ghost btn-sm" onclick="editRequest('${id}')">✏️ Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteRequest('${id}')">🗑️ Delete</button>
        </div>
      </div>
      <div class="tags mt-sm">
        <span class="tag tag-genre">🎭 ${escapeHTML(data.genre)}</span>
        <span class="tag tag-language">🌐 ${escapeHTML(data.language)}</span>
        <span class="tag tag-mood">✨ ${escapeHTML(data.mood)}</span>
      </div>
      <p class="card-description full">"${escapeHTML(data.description)}"</p>
      <div class="card-footer">
        <a href="request.html?id=${id}" class="btn btn-secondary btn-sm">View Suggestions →</a>
      </div>
    </div>
  `;
}

// ─── Edit Request ───
function editRequest(requestId) {
  const card = document.getElementById(`request-${requestId}`);
  if (!card) return;

  // Get current data from the card's content
  db.collection('requests').doc(requestId).get().then((doc) => {
    if (!doc.exists) return;
    const data = doc.data();

    card.innerHTML = `
      <form onsubmit="saveRequestEdit(event, '${requestId}')">
        <div class="form-group">
          <label class="form-label">Genre</label>
          <select class="form-select" id="editGenre-${requestId}" required>
            ${['Action','Comedy','Horror','Thriller','Romance','Drama','Sci-Fi','Any'].map(g =>
              `<option value="${g}" ${data.genre === g ? 'selected' : ''}>${g}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Language</label>
          <select class="form-select" id="editLang-${requestId}" required>
            ${['English','Hindi','Marathi','Korean','Tamil','Any'].map(l =>
              `<option value="${l}" ${data.language === l ? 'selected' : ''}>${l}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Mood</label>
          <select class="form-select" id="editMood-${requestId}" required>
            ${['Relaxing','Funny','Dark','Emotional','Exciting','Feel-good'].map(m =>
              `<option value="${m}" ${data.mood === m ? 'selected' : ''}>${m}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-textarea" id="editDesc-${requestId}" required minlength="10" maxlength="500">${escapeHTML(data.description)}</textarea>
        </div>
        <div style="display:flex;gap:12px;">
          <button type="submit" class="btn btn-primary btn-sm">Save Changes</button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="loadMyRequests()">Cancel</button>
        </div>
      </form>
    `;
  });
}

async function saveRequestEdit(e, requestId) {
  e.preventDefault();

  const genre = document.getElementById(`editGenre-${requestId}`).value;
  const language = document.getElementById(`editLang-${requestId}`).value;
  const mood = document.getElementById(`editMood-${requestId}`).value;
  const description = document.getElementById(`editDesc-${requestId}`).value.trim();

  if (!genre || !language || !mood || description.length < 10) {
    showToast('Please fill in all fields properly.', 'error');
    return;
  }

  try {
    await db.collection('requests').doc(requestId).update({
      genre, language, mood, description
    });
    showToast('Request updated!', 'success');
    loadMyRequests();
  } catch (error) {
    console.error('Failed to update request:', error);
    showToast('Failed to update. Please try again.', 'error');
  }
}

// ─── Delete Request ───
function deleteRequest(requestId) {
  showConfirmModal(
    'Delete Request',
    'Are you sure you want to delete this recommendation request? All associated suggestions will remain but the request will be removed. This cannot be undone.',
    async () => {
      try {
        await db.collection('requests').doc(requestId).delete();
        showToast('Request deleted.', 'success');
        loadMyRequests();
      } catch (error) {
        console.error('Failed to delete request:', error);
        showToast('Failed to delete. Please try again.', 'error');
      }
    }
  );
}

// ─── Load My Suggestions ───
async function loadMySuggestions() {
  const container = document.getElementById('mySuggestionsList');

  try {
    const snapshot = await db.collection('suggestions')
      .where('userId', '==', currentUser.uid)
      .orderBy('createdAt', 'desc')
      .get();

    if (snapshot.empty) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🍿</div>
          <h3 class="empty-state-title">No suggestions yet</h3>
          <p class="empty-state-text">You haven't suggested any movies yet. Browse requests to help others!</p>
          <a href="browse.html" class="btn btn-primary">Browse Requests</a>
        </div>
      `;
      return;
    }

    let html = '';
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      html += `
        <div class="suggestion-card fade-in" id="mySug-${doc.id}">
          <div class="flex-between">
            <h4 class="suggestion-movie-name">🎬 ${escapeHTML(data.movieName)}</h4>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-ghost btn-sm" onclick="editMySuggestion('${doc.id}')">✏️ Edit</button>
              <button class="btn btn-danger btn-sm" onclick="deleteMySuggestion('${doc.id}')">🗑️ Delete</button>
            </div>
          </div>
          <p class="suggestion-by">${timeAgo(data.createdAt)} · <a href="request.html?id=${data.requestId}" style="color:var(--accent-secondary);">View Request →</a></p>
          <div class="suggestion-reason">"${escapeHTML(data.reason)}"</div>
        </div>
      `;
    });

    container.innerHTML = html;
  } catch (error) {
    console.error('Failed to load suggestions:', error);
    container.innerHTML = `<p class="text-secondary text-center">Failed to load your suggestions.</p>`;
  }
}

// ─── Edit My Suggestion ───
function editMySuggestion(suggestionId) {
  const card = document.getElementById(`mySug-${suggestionId}`);
  if (!card) return;

  db.collection('suggestions').doc(suggestionId).get().then((doc) => {
    if (!doc.exists) return;
    const data = doc.data();

    card.innerHTML = `
      <form onsubmit="saveMySuggestionEdit(event, '${suggestionId}')">
        <div class="form-group">
          <label class="form-label">Movie Name</label>
          <input type="text" class="form-input" id="editSugName-${suggestionId}" value="${escapeHTML(data.movieName)}" required maxlength="200">
        </div>
        <div class="form-group">
          <label class="form-label">Why do you recommend it?</label>
          <textarea class="form-textarea" id="editSugReason-${suggestionId}" required minlength="10" maxlength="500">${escapeHTML(data.reason)}</textarea>
        </div>
        <div style="display:flex;gap:12px;">
          <button type="submit" class="btn btn-primary btn-sm">Save</button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="loadMySuggestions()">Cancel</button>
        </div>
      </form>
    `;
  });
}

async function saveMySuggestionEdit(e, suggestionId) {
  e.preventDefault();

  const newName = document.getElementById(`editSugName-${suggestionId}`).value.trim();
  const newReason = document.getElementById(`editSugReason-${suggestionId}`).value.trim();

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
    loadMySuggestions();
  } catch (error) {
    console.error('Failed to update suggestion:', error);
    showToast('Failed to update. Please try again.', 'error');
  }
}

// ─── Delete My Suggestion ───
function deleteMySuggestion(suggestionId) {
  showConfirmModal(
    'Delete Suggestion',
    'Are you sure you want to delete this movie suggestion? This cannot be undone.',
    async () => {
      try {
        await db.collection('suggestions').doc(suggestionId).delete();
        showToast('Suggestion deleted.', 'success');
        loadMySuggestions();
      } catch (error) {
        console.error('Failed to delete suggestion:', error);
        showToast('Failed to delete. Please try again.', 'error');
      }
    }
  );
}
