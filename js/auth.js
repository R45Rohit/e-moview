// ============================================================
// Auth Module
// Handles Firebase Authentication (anonymous, email/password, account linking)
// and injects the navigation bar on every page.
// ============================================================

/* global firebase, firebaseConfig */

// ─── Initialize Firebase ───
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Try initializing Analytics (won't break if measurementId is missing)
let analytics = null;
try {
  if (firebaseConfig.measurementId) {
    analytics = firebase.analytics();
  }
} catch (e) {
  console.log('Analytics not available');
}

// ─── Globals ───
let currentUser = null;

// ─── Navigation ───
function getNavHTML(activePage) {
  const isLoggedIn = !!currentUser;
  const isRegistered = isLoggedIn && !currentUser.isAnonymous;

  return `
    <nav class="nav" role="navigation" aria-label="Main navigation">
      <div class="nav-inner">
        <a href="index.html" class="nav-brand" aria-label="MovieSuggest Home">
          <span class="nav-brand-icon">🎬</span>
          <span>MovieSuggest</span>
        </a>
        <div class="nav-links" id="navLinks">
          <a href="index.html" class="nav-link ${activePage === 'home' ? 'active' : ''}">Home</a>
          <a href="browse.html" class="nav-link ${activePage === 'browse' ? 'active' : ''}">Browse</a>
          ${isRegistered ? `<a href="ask.html" class="nav-link ${activePage === 'ask' ? 'active' : ''}">Ask</a>` : ''}
          ${isRegistered ? `<a href="activity.html" class="nav-link ${activePage === 'activity' ? 'active' : ''}">My Activity</a>` : ''}
          <a href="profile.html" class="nav-link ${activePage === 'profile' ? 'active' : ''}">Profile</a>
        </div>
        <div class="nav-hamburger" id="navHamburger" aria-label="Toggle menu" role="button" tabindex="0">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </nav>
    <div class="nav-mobile" id="navMobile">
      <a href="index.html" class="nav-link ${activePage === 'home' ? 'active' : ''}">🏠  Home</a>
      <a href="browse.html" class="nav-link ${activePage === 'browse' ? 'active' : ''}">🔍  Browse</a>
      ${isRegistered ? `<a href="ask.html" class="nav-link ${activePage === 'ask' ? 'active' : ''}">💬  Ask</a>` : ''}
      ${isRegistered ? `<a href="activity.html" class="nav-link ${activePage === 'activity' ? 'active' : ''}">📋  My Activity</a>` : ''}
      <a href="profile.html" class="nav-link ${activePage === 'profile' ? 'active' : ''}">👤  Profile</a>
    </div>
  `;
}

function injectNav(activePage) {
  const navContainer = document.getElementById('nav-container');
  if (navContainer) {
    navContainer.innerHTML = getNavHTML(activePage);
    setupHamburger();
  }
}

function setupHamburger() {
  const hamburger = document.getElementById('navHamburger');
  const mobileNav = document.getElementById('navMobile');
  if (!hamburger || !mobileNav) return;

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileNav.classList.toggle('show');
  });

  hamburger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      hamburger.click();
    }
  });

  // Close mobile nav when a link is clicked
  mobileNav.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileNav.classList.remove('show');
    });
  });
}

// ─── Auth State Observer ───
function onAuthReady(callback) {
  auth.onAuthStateChanged((user) => {
    currentUser = user;
    if (callback) callback(user);
  });
}

// ─── Guest Login ───
async function loginAsGuest() {
  try {
    const result = await auth.signInAnonymously();
    trackEvent('guest_started');
    return result.user;
  } catch (error) {
    console.error('Guest login failed:', error);
    throw error;
  }
}

// ─── Email/Password Registration ───
async function registerWithEmail(name, email, password) {
  try {
    let result;

    // If currently anonymous, link the account instead of creating new
    if (currentUser && currentUser.isAnonymous) {
      const credential = firebase.auth.EmailAuthProvider.credential(email, password);
      result = await currentUser.linkWithCredential(credential);
    } else {
      result = await auth.createUserWithEmailAndPassword(email, password);
    }

    // Update display name
    await result.user.updateProfile({ displayName: name });

    // Save/update user document in Firestore
    await db.collection('users').doc(result.user.uid).set({
      name: name,
      email: email,
      isAnonymous: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    trackEvent('user_registered');
    return result.user;
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
}

// ─── Email/Password Login ───
async function loginWithEmail(email, password) {
  try {
    const result = await auth.signInWithEmailAndPassword(email, password);
    return result.user;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

// ─── Logout ───
async function logout() {
  try {
    await auth.signOut();
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  }
}

// ─── Auth Guards ───
function requireAuth(redirectUrl) {
  if (!currentUser) {
    window.location.href = redirectUrl || 'auth.html?redirect=' + encodeURIComponent(window.location.href);
    return false;
  }
  return true;
}

function requireRegistered() {
  if (!currentUser || currentUser.isAnonymous) {
    return false;
  }
  return true;
}

// ─── Show Auth Modal ───
function showAuthModal() {
  // Remove existing modal
  const existing = document.querySelector('.modal-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h2 class="modal-title">Create an account to continue</h2>
      <p class="modal-text">You need a registered account to post requests and suggest movies to other users.</p>
      <div class="modal-actions">
        <a href="auth.html?mode=register&redirect=${encodeURIComponent(window.location.href)}" class="btn btn-primary">Create Account</a>
        <a href="auth.html?mode=login&redirect=${encodeURIComponent(window.location.href)}" class="btn btn-secondary">Login</a>
      </div>
      <button class="btn btn-ghost btn-block mt-md modal-close" style="margin-top: 12px;">Cancel</button>
    </div>
  `;

  document.body.appendChild(overlay);

  // Close on overlay click or cancel button
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());

  // Close on Escape
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      overlay.remove();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

// ─── Confirmation Modal ───
function showConfirmModal(title, text, onConfirm) {
  const existing = document.querySelector('.modal-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h2 class="modal-title">${title}</h2>
      <p class="modal-text">${text}</p>
      <div class="modal-actions">
        <button class="btn btn-danger" id="confirmYes">Delete</button>
        <button class="btn btn-secondary modal-close">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#confirmYes').addEventListener('click', () => {
    overlay.remove();
    onConfirm();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
}

// ─── Toast Notifications ───
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${escapeHTML(message)}`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ─── Analytics Helper ───
function trackEvent(eventName, params) {
  try {
    if (analytics) {
      firebase.analytics().logEvent(eventName, params || {});
    }
  } catch (e) {
    // Silently fail — analytics is optional
  }
}

// ─── Utility Functions ───
function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function timeAgo(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function getUrlParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

// ─── Skeleton Loaders ───
function skeletonCard() {
  return `
    <div class="card" style="pointer-events:none;">
      <div class="skeleton skeleton-title"></div>
      <div style="display:flex;gap:8px;margin-bottom:16px;">
        <div class="skeleton skeleton-tag"></div>
        <div class="skeleton skeleton-tag"></div>
        <div class="skeleton skeleton-tag"></div>
      </div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text short"></div>
    </div>
  `;
}

function showSkeletonGrid(container, count = 6) {
  container.innerHTML = Array(count).fill(skeletonCard()).join('');
}
