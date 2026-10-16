// ============================================================
// Ask Page Logic
// Handles the recommendation request form submission
// 100% Static & Client-Side
// ============================================================

/* global onAuthReady, injectNav, db, currentUser, loginAsGuest, showToast, trackRequestCreated, firebase */

document.addEventListener('DOMContentLoaded', () => {
  const askForm = document.getElementById('askForm');
  const askFormCard = document.getElementById('askFormCard');
  const authGuard = document.getElementById('authGuard');
  const description = document.getElementById('description');
  const charCount = document.getElementById('charCount');
  const quickGuestAskBtn = document.getElementById('quickGuestAskBtn');

  // Character count
  if (description && charCount) {
    description.addEventListener('input', () => {
      charCount.textContent = description.value.length;
    });
  }

  function updateFormVisibility(user) {
    injectNav('ask');

    if (!user) {
      askFormCard.classList.add('hidden');
      authGuard.classList.remove('hidden');
      return;
    }

    askFormCard.classList.remove('hidden');
    authGuard.classList.add('hidden');
  }

  onAuthReady((user) => {
    updateFormVisibility(user);
  });

  // Quick guest handler
  if (quickGuestAskBtn) {
    quickGuestAskBtn.addEventListener('click', async () => {
      quickGuestAskBtn.disabled = true;
      quickGuestAskBtn.textContent = 'Setting up...';
      try {
        const guest = await loginAsGuest();
        updateFormVisibility(guest);
        showToast('Logged in as Guest! You can now post your request.', 'success');
      } catch (e) {
        quickGuestAskBtn.disabled = false;
        quickGuestAskBtn.textContent = '👤 Continue with Quick Name';
      }
    });
  }

  // Form submission
  askForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentUser) {
      try {
        await loginAsGuest();
      } catch (err) {
        showToast('Please login or enter a name to post.', 'error');
        return;
      }
    }

    const genre = document.getElementById('genre').value;
    const language = document.getElementById('language').value;
    const mood = document.getElementById('mood').value;
    const desc = description.value.trim();

    if (!genre || !language || !mood || desc.length < 10) {
      showToast('Please fill in all fields (description must be at least 10 characters).', 'error');
      return;
    }

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Posting...';

    try {
      const docRef = await db.collection('requests').add({
        userId: currentUser.uid,
        userName: currentUser.displayName || (currentUser.isAnonymous ? 'Guest Movie Fan' : 'Movie Buff'),
        genre: genre,
        language: language,
        mood: mood,
        description: desc,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      trackRequestCreated(genre, language, mood);
      showToast('Request posted successfully!', 'success');

      // Redirect to the new request page
      setTimeout(() => {
        window.location.href = `request.html?id=${docRef.id}`;
      }, 500);
    } catch (error) {
      console.error('Failed to post request:', error);
      showToast('Failed to post request. Please try again.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = '🎬 Post Request';
    }
  });
});
