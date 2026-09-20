// ============================================================
// Analytics Module
// Tracks user engagement events via Firebase Analytics / gtag.
// All events are privacy-respecting — no unnecessary personal data.
// ============================================================

/* global trackEvent */

// Event constants
const EVENTS = {
  USER_REGISTERED: 'user_registered',
  GUEST_STARTED: 'guest_started',
  REQUEST_CREATED: 'request_created',
  REQUEST_VIEWED: 'request_viewed',
  SUGGESTION_CREATED: 'suggestion_created',
  BROWSE_USED: 'browse_used'
};

// The actual tracking is done via the trackEvent() function in auth.js
// This file provides structured event helpers for cleaner code.

function trackRequestCreated(genre, language, mood) {
  trackEvent(EVENTS.REQUEST_CREATED, { genre, language, mood });
}

function trackRequestViewed(requestId) {
  trackEvent(EVENTS.REQUEST_VIEWED, { request_id: requestId });
}

function trackSuggestionCreated(requestId) {
  trackEvent(EVENTS.SUGGESTION_CREATED, { request_id: requestId });
}

function trackBrowseUsed(filters) {
  trackEvent(EVENTS.BROWSE_USED, filters || {});
}
