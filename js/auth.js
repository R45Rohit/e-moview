// ============================================================
// MovieSuggest — Static Database, Auth & UI Module
// 100% Static & Client-Side. No external Firebase dependency.
// Uses LocalStorage for persistent requests, suggestions,
// user accounts, and movie watchlists.
// ============================================================

(function () {
  'use strict';

  // ─── Default Sample Data (Seeded if LocalStorage is empty) ───
  const INITIAL_REQUESTS = [
    {
      id: "req-1",
      userId: "seed-user-1",
      userName: "Arjun Sharma",
      genre: "Sci-Fi",
      language: "English",
      mood: "Exciting",
      description: "Looking for mind-bending sci-fi movies that will keep me thinking for days after watching, similar to Interstellar, Inception, or Arrival.",
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
    },
    {
      id: "req-2",
      userId: "seed-user-2",
      userName: "Maya Lin",
      genre: "Comedy",
      language: "English",
      mood: "Feel-good",
      description: "Need warm, cozy, feel-good comfort movies for a rainy Sunday evening. Wholesome humor, great heart, and pure good vibes only!",
      createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
    },
    {
      id: "req-3",
      userId: "seed-user-3",
      userName: "Karthik Raja",
      genre: "Action",
      language: "Tamil",
      mood: "Exciting",
      description: "Looking for intense South Indian action thrillers with high-octane background music, incredible mass elevation scenes, and smart screenplay.",
      createdAt: new Date(Date.now() - 11 * 3600 * 1000).toISOString()
    },
    {
      id: "req-4",
      userId: "seed-user-4",
      userName: "David Miller",
      genre: "Thriller",
      language: "Any",
      mood: "Dark",
      description: "Recommend me a psychological thriller where the plot twist hits like a freight train and genuinely cannot be guessed ahead of time.",
      createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    },
    {
      id: "req-5",
      userId: "seed-user-5",
      userName: "Pooja Deshmukh",
      genre: "Drama",
      language: "Hindi",
      mood: "Emotional",
      description: "Searching for gripping, realistic Bollywood / Hindi cinema with incredible storytelling and strong performances, like Swades, Tumbbad, or Udaan.",
      createdAt: new Date(Date.now() - 32 * 3600 * 1000).toISOString()
    },
    {
      id: "req-6",
      userId: "seed-user-6",
      userName: "Ji-hoon Park",
      genre: "Thriller",
      language: "Korean",
      mood: "Dark",
      description: "Looking for top-tier Korean thrillers or neo-noir detective stories with dark gritty tone and brilliant cinematography beyond Parasite.",
      createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
    },
    {
      id: "req-7",
      userId: "seed-user-7",
      userName: "Hannah Baker",
      genre: "Horror",
      language: "English",
      mood: "Dark",
      description: "Super atmospheric, slow-burn supernatural horror that crawls under your skin. No cheap loud jump scares, just creeping dread and folklore.",
      createdAt: new Date(Date.now() - 60 * 3600 * 1000).toISOString()
    },
    {
      id: "req-8",
      userId: "seed-user-8",
      userName: "Liam Gallagher",
      genre: "Romance",
      language: "Any",
      mood: "Emotional",
      description: "A mature romantic film focused on real conversation, vulnerability, and lingering connections between two people, like Before Sunrise or Past Lives.",
      createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString()
    },
    {
      id: "req-9",
      userId: "seed-user-9",
      userName: "Carlos Mendoza",
      genre: "Comedy",
      language: "Hindi",
      mood: "Funny",
      description: "Need legendary Hindi cult comedy movies that you can rewatch 100 times and still laugh at every single dialogue and punchline.",
      createdAt: new Date(Date.now() - 96 * 3600 * 1000).toISOString()
    }
  ];

  const INITIAL_SUGGESTIONS = [
    // Suggestions for req-1 (Sci-Fi)
    {
      id: "sug-1",
      requestId: "req-1",
      userId: "seed-user-10",
      userName: "Elena R.",
      movieName: "Coherence (2014)",
      reason: "An incredible low-budget indie sci-fi thriller about a dinner party during a passing comet. The parallel reality twists will melt your brain. Don't read anything beforehand!",
      createdAt: new Date(Date.now() - 1.8 * 3600 * 1000).toISOString()
    },
    {
      id: "sug-2",
      requestId: "req-1",
      userId: "seed-user-11",
      userName: "Marcus Vance",
      movieName: "Predestination (2014)",
      reason: "Ethan Hawke stars in one of the most intricately woven time-travel paradox stories ever filmed. The ending ties together every tiny clue seamlessly.",
      createdAt: new Date(Date.now() - 1.2 * 3600 * 1000).toISOString()
    },
    {
      id: "sug-3",
      requestId: "req-1",
      userId: "seed-user-12",
      userName: "Sophia Chen",
      movieName: "Dark City (1998)",
      reason: "Before The Matrix, there was Dark City. Brilliant neo-noir atmosphere with deep existential questions about memory, identity, and simulated realities.",
      createdAt: new Date(Date.now() - 0.7 * 3600 * 1000).toISOString()
    },

    // Suggestions for req-2 (Comfort Comedy)
    {
      id: "sug-4",
      requestId: "req-2",
      userId: "seed-user-13",
      userName: "Oliver Twist",
      movieName: "Paddington 2 (2017)",
      reason: "Genuinely one of the funniest, sweetest, and most heartwarming movies ever made. Hugh Grant gives a career-best comedic performance as Phoenix Buchanan.",
      createdAt: new Date(Date.now() - 4.2 * 3600 * 1000).toISOString()
    },
    {
      id: "sug-5",
      requestId: "req-2",
      userId: "seed-user-14",
      userName: "Chloe Davis",
      movieName: "About Time (2013)",
      reason: "Sweet, genuinely funny, and packed with emotional wisdom about savoring ordinary days with loved ones. Keep tissues nearby for the third act.",
      createdAt: new Date(Date.now() - 3.1 * 3600 * 1000).toISOString()
    },
    {
      id: "sug-6",
      requestId: "req-2",
      userId: "seed-user-15",
      userName: "Nate Robinson",
      movieName: "The Grand Budapest Hotel (2014)",
      reason: "Wes Anderson's visual masterpiece is witty, eccentric, and hilarious from start to finish. Ralph Fiennes is pure comedic perfection.",
      createdAt: new Date(Date.now() - 2.0 * 3600 * 1000).toISOString()
    },

    // Suggestions for req-3 (South Indian Action)
    {
      id: "sug-7",
      requestId: "req-3",
      userId: "seed-user-16",
      userName: "Vignesh K.",
      movieName: "Vikram (2022)",
      reason: "Kamal Haasan, Fahadh Faasil, and Vijay Sethupathi deliver peak action cinema. Anirudh's score will literally give you goosebumps throughout every sequence.",
      createdAt: new Date(Date.now() - 9 * 3600 * 1000).toISOString()
    },
    {
      id: "sug-8",
      requestId: "req-3",
      userId: "seed-user-17",
      userName: "Dinesh M.",
      movieName: "Kaithi (2019)",
      reason: "Set entirely over one frantic, adrenaline-fueled night. Karthi's raw performance and Lokesh Kanagaraj's tight direction make it an instant classic.",
      createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString()
    },
    {
      id: "sug-9",
      requestId: "req-3",
      userId: "seed-user-18",
      userName: "Ananya Iyer",
      movieName: "Thani Oruvan (2015)",
      reason: "Arvind Swamy as Siddharth Abhimanyu created one of the smartest and most charismatic villains in modern Indian cinema. Cat-and-mouse gold.",
      createdAt: new Date(Date.now() - 7 * 3600 * 1000).toISOString()
    },

    // Suggestions for req-4 (Plot Twist Thriller)
    {
      id: "sug-10",
      requestId: "req-4",
      userId: "seed-user-19",
      userName: "Lucas Moreau",
      movieName: "Incendies (2010)",
      reason: "Denis Villeneuve directs this profound mystery about twins uncovering their late mother's past in the Middle East. The climax is an emotional shockwave.",
      createdAt: new Date(Date.now() - 22 * 3600 * 1000).toISOString()
    },
    {
      id: "sug-11",
      requestId: "req-4",
      userId: "seed-user-20",
      userName: "Gabriela S.",
      movieName: "The Invisible Guest (Contratiempo, 2016)",
      reason: "A Spanish locked-room murder mystery with layer after layer of deceit. Kept me gasping until the final frame.",
      createdAt: new Date(Date.now() - 19 * 3600 * 1000).toISOString()
    },
    {
      id: "sug-12",
      requestId: "req-4",
      userId: "seed-user-21",
      userName: "Leo Thorne",
      movieName: "The Prestige (2006)",
      reason: "Nolan's tale of rival magicians. Are you watching closely? Every single scene is engineered for the final reveal.",
      createdAt: new Date(Date.now() - 15 * 3600 * 1000).toISOString()
    },

    // Suggestions for req-5 (Bollywood Cinema)
    {
      id: "sug-13",
      requestId: "req-5",
      userId: "seed-user-22",
      userName: "Rohit Verma",
      movieName: "Tumbbad (2018)",
      reason: "A visually stunning mythological folk-horror and drama about human greed. The world-building, sound design, and atmosphere are unmatched.",
      createdAt: new Date(Date.now() - 30 * 3600 * 1000).toISOString()
    },
    {
      id: "sug-14",
      requestId: "req-5",
      userId: "seed-user-23",
      userName: "Sameer Joshi",
      movieName: "Udaan (2010)",
      reason: "Vikramaditya Motwane's coming-of-age masterpiece about an aspiring young writer breaking free from an authoritarian father. Raw, poetic, and triumphant.",
      createdAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString()
    },

    // Suggestions for req-6 (Korean Thrillers)
    {
      id: "sug-15",
      requestId: "req-6",
      userId: "seed-user-24",
      userName: "Min-ji Kim",
      movieName: "Memories of Murder (2003)",
      reason: "Bong Joon-ho's masterpiece based on Korea's first serial murder cases. Song Kang-ho's final gaze into the camera will stay with you forever.",
      createdAt: new Date(Date.now() - 40 * 3600 * 1000).toISOString()
    },
    {
      id: "sug-16",
      requestId: "req-6",
      userId: "seed-user-25",
      userName: "Sean Kelly",
      movieName: "Decision to Leave (2022)",
      reason: "Park Chan-wook's mesmerizing, intoxicating romantic detective mystery. Breathtaking visual poetry and layered storytelling.",
      createdAt: new Date(Date.now() - 35 * 3600 * 1000).toISOString()
    },

    // Suggestions for req-7 (Horror)
    {
      id: "sug-17",
      requestId: "req-7",
      userId: "seed-user-26",
      userName: "Clara Oswald",
      movieName: "The Witch (2015)",
      reason: "A 1630s New England folktale that feels genuinely centuries-old. The acoustic soundtrack and isolated forest setting create unbearable, authentic tension.",
      createdAt: new Date(Date.now() - 55 * 3600 * 1000).toISOString()
    },
    {
      id: "sug-18",
      requestId: "req-7",
      userId: "seed-user-27",
      userName: "Sam Winchester",
      movieName: "The Wailing (2016)",
      reason: "A Korean supernatural horror tour de force spanning shamans, demons, and epidemics. You won't know who to trust until the horrifying climax.",
      createdAt: new Date(Date.now() - 50 * 3600 * 1000).toISOString()
    },

    // Suggestions for req-8 (Romance)
    {
      id: "sug-19",
      requestId: "req-8",
      userId: "seed-user-28",
      userName: "Julie Delpy Fan",
      movieName: "Before Sunrise (1995)",
      reason: "Two strangers meet on a train in Europe and spend a single night wandering Vienna talking about love and mortality. Pure cinematic magic.",
      createdAt: new Date(Date.now() - 65 * 3600 * 1000).toISOString()
    },
    {
      id: "sug-20",
      requestId: "req-8",
      userId: "seed-user-29",
      userName: "Grace Kim",
      movieName: "Past Lives (2023)",
      reason: "A quiet, devastating contemplation of childhood sweethearts, destiny (In-Yun), and paths not taken. Beautifully acted and deeply moving.",
      createdAt: new Date(Date.now() - 62 * 3600 * 1000).toISOString()
    },

    // Suggestions for req-9 (Comedy)
    {
      id: "sug-21",
      requestId: "req-9",
      userId: "seed-user-30",
      userName: "Akshay P.",
      movieName: "Hera Pheri (2000)",
      reason: "Babu Rao Ganpatrao Apte is the greatest comedic character in Hindi cinema history. Every single line is a legendary, unforgettable meme.",
      createdAt: new Date(Date.now() - 80 * 3600 * 1000).toISOString()
    },
    {
      id: "sug-22",
      requestId: "req-9",
      userId: "seed-user-31",
      userName: "Varun Nair",
      movieName: "Andaz Apna Apna (1994)",
      reason: "Amar and Prem competing for an heiress with Crime Master Gogo and Teja. Absolute comedic gold from start to finish.",
      createdAt: new Date(Date.now() - 75 * 3600 * 1000).toISOString()
    }
  ];

  // ─── LocalStorage Keys ───
  const STORAGE_KEYS = {
    REQUESTS: 'moviesuggest_requests_v1',
    SUGGESTIONS: 'moviesuggest_suggestions_v1',
    USERS: 'moviesuggest_users_v1',
    CURRENT_USER: 'moviesuggest_current_user_v1',
    WATCHLIST: 'moviesuggest_watchlist_v1',
    LIKES: 'moviesuggest_likes_v1'
  };

  // ─── Initialize Storage with Seeds ───
  function getRaw(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function setRaw(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  function ensureInitialized() {
    if (!localStorage.getItem(STORAGE_KEYS.REQUESTS)) {
      setRaw(STORAGE_KEYS.REQUESTS, INITIAL_REQUESTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SUGGESTIONS)) {
      setRaw(STORAGE_KEYS.SUGGESTIONS, INITIAL_SUGGESTIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      setRaw(STORAGE_KEYS.USERS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.WATCHLIST)) {
      setRaw(STORAGE_KEYS.WATCHLIST, ["The Dark Knight", "Inception", "Interstellar"]);
    }
    if (!localStorage.getItem(STORAGE_KEYS.LIKES)) {
      setRaw(STORAGE_KEYS.LIKES, {});
    }
  }

  ensureInitialized();

  // ─── Static Auth State ───
  let currentUser = getRaw(STORAGE_KEYS.CURRENT_USER, null);
  const authListeners = [];

  function notifyAuthListeners() {
    authListeners.forEach((fn) => {
      try {
        fn(currentUser);
      } catch (e) {
        console.error(e);
      }
    });
  }

  function setCurrentUser(user) {
    currentUser = user;
    if (user) {
      setRaw(STORAGE_KEYS.CURRENT_USER, user);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    notifyAuthListeners();
  }

  // ─── Auth API Implementation ───
  async function loginAsGuest() {
    const guestUser = {
      uid: 'guest_' + Math.random().toString(36).substring(2, 10),
      displayName: 'Guest Movie Fan',
      email: '',
      isAnonymous: true,
      createdAt: new Date().toISOString()
    };
    setCurrentUser(guestUser);
    trackEvent('guest_started');
    return guestUser;
  }

  async function registerWithEmail(name, email, password) {
    const users = getRaw(STORAGE_KEYS.USERS, []);
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      const err = new Error('This email is already registered. Try logging in instead.');
      err.code = 'auth/email-already-in-use';
      throw err;
    }

    const newUser = {
      uid: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      displayName: name || 'Movie Buff',
      email: email,
      isAnonymous: false,
      createdAt: new Date().toISOString()
    };

    users.push({ ...newUser, password });
    setRaw(STORAGE_KEYS.USERS, users);
    setCurrentUser(newUser);
    trackEvent('user_registered');
    return newUser;
  }

  async function loginWithEmail(email, password) {
    const users = getRaw(STORAGE_KEYS.USERS, []);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Auto-register demo/static convenience account if none exists
      return await registerWithEmail(email.split('@')[0], email, password);
    }

    if (user.password && user.password !== password) {
      const err = new Error('Incorrect password. Please try again.');
      err.code = 'auth/wrong-password';
      throw err;
    }

    const loggedInUser = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      isAnonymous: false,
      createdAt: user.createdAt
    };

    setCurrentUser(loggedInUser);
    return loggedInUser;
  }

  async function logout() {
    setCurrentUser(null);
    window.location.href = 'index.html';
  }

  function onAuthReady(callback) {
    if (callback) {
      authListeners.push(callback);
      // Run asynchronously to allow page setup
      setTimeout(() => callback(currentUser), 10);
    }
  }

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

  // ─── Static Firestore Simulation (db) ───
  function makeTimestamp(val) {
    if (!val) return null;
    const d = new Date(val);
    return {
      toDate: () => d,
      toISOString: () => d.toISOString(),
      toString: () => d.toISOString()
    };
  }

  class StaticCollection {
    constructor(collectionName, filters = [], sortField = null, sortDir = 'asc', limitCount = null, startAfterDoc = null) {
      this.name = collectionName;
      this.filters = filters;
      this.sortField = sortField;
      this.sortDir = sortDir;
      this.limitCount = limitCount;
      this.startAfterDoc = startAfterDoc;
    }

    where(field, op, val) {
      return new StaticCollection(
        this.name,
        [...this.filters, { field, op, val }],
        this.sortField,
        this.sortDir,
        this.limitCount,
        this.startAfterDoc
      );
    }

    orderBy(field, dir = 'asc') {
      return new StaticCollection(
        this.name,
        this.filters,
        field,
        dir,
        this.limitCount,
        this.startAfterDoc
      );
    }

    limit(n) {
      return new StaticCollection(
        this.name,
        this.filters,
        this.sortField,
        this.sortDir,
        n,
        this.startAfterDoc
      );
    }

    startAfter(doc) {
      return new StaticCollection(
        this.name,
        this.filters,
        this.sortField,
        this.sortDir,
        this.limitCount,
        doc
      );
    }

    doc(id) {
      return new StaticDocRef(this.name, id);
    }

    async add(data) {
      const items = getRaw(
        this.name === 'requests' ? STORAGE_KEYS.REQUESTS : STORAGE_KEYS.SUGGESTIONS,
        []
      );

      const id = (this.name === 'requests' ? 'req-' : 'sug-') + Date.now();
      const createdAt = new Date().toISOString();

      const newItem = {
        id,
        ...data,
        createdAt
      };

      items.unshift(newItem);

      setRaw(
        this.name === 'requests' ? STORAGE_KEYS.REQUESTS : STORAGE_KEYS.SUGGESTIONS,
        items
      );

      return { id };
    }

    async get() {
      let items = getRaw(
        this.name === 'requests' ? STORAGE_KEYS.REQUESTS : STORAGE_KEYS.SUGGESTIONS,
        []
      );

      // Apply filters
      for (const f of this.filters) {
        if (f.op === '==') {
          items = items.filter(item => item[f.field] === f.val);
        }
      }

      // Apply sort
      if (this.sortField) {
        items.sort((a, b) => {
          let va = a[this.sortField];
          let vb = b[this.sortField];
          if (va < vb) return this.sortDir === 'asc' ? -1 : 1;
          if (va > vb) return this.sortDir === 'asc' ? 1 : -1;
          return 0;
        });
      }

      // Apply pagination cursor
      if (this.startAfterDoc && this.startAfterDoc.id) {
        const idx = items.findIndex(item => item.id === this.startAfterDoc.id);
        if (idx !== -1) {
          items = items.slice(idx + 1);
        }
      }

      // Apply limit
      if (this.limitCount && this.limitCount > 0) {
        items = items.slice(0, this.limitCount);
      }

      const docs = items.map((item) => {
        return {
          id: item.id,
          data: () => ({
            ...item,
            createdAt: makeTimestamp(item.createdAt)
          })
        };
      });

      return {
        empty: docs.length === 0,
        size: docs.length,
        docs
      };
    }
  }

  class StaticDocRef {
    constructor(collectionName, id) {
      this.collectionName = collectionName;
      this.id = id;
    }

    async get() {
      const storageKey = this.collectionName === 'requests'
        ? STORAGE_KEYS.REQUESTS
        : (this.collectionName === 'suggestions' ? STORAGE_KEYS.SUGGESTIONS : STORAGE_KEYS.USERS);
      const items = getRaw(storageKey, []);
      const item = items.find(i => i.id === this.id || i.uid === this.id);

      if (!item) {
        return {
          id: this.id,
          exists: false,
          data: () => null
        };
      }

      return {
        id: this.id,
        exists: true,
        data: () => ({
          ...item,
          createdAt: makeTimestamp(item.createdAt)
        })
      };
    }

    async update(updates) {
      const storageKey = this.collectionName === 'requests'
        ? STORAGE_KEYS.REQUESTS
        : (this.collectionName === 'suggestions' ? STORAGE_KEYS.SUGGESTIONS : STORAGE_KEYS.USERS);
      const items = getRaw(storageKey, []);
      const idx = items.findIndex(i => i.id === this.id || i.uid === this.id);

      if (idx !== -1) {
        items[idx] = { ...items[idx], ...updates };
        setRaw(storageKey, items);
      }
    }

    async set(data, options = {}) {
      const storageKey = this.collectionName === 'requests'
        ? STORAGE_KEYS.REQUESTS
        : (this.collectionName === 'suggestions' ? STORAGE_KEYS.SUGGESTIONS : STORAGE_KEYS.USERS);
      const items = getRaw(storageKey, []);
      const idx = items.findIndex(i => i.id === this.id || i.uid === this.id);

      if (idx !== -1 && options.merge) {
        items[idx] = { ...items[idx], ...data };
      } else if (idx !== -1) {
        items[idx] = { id: this.id, ...data };
      } else {
        items.push({ id: this.id, ...data });
      }
      setRaw(storageKey, items);
    }

    async delete() {
      const storageKey = this.collectionName === 'requests'
        ? STORAGE_KEYS.REQUESTS
        : (this.collectionName === 'suggestions' ? STORAGE_KEYS.SUGGESTIONS : STORAGE_KEYS.USERS);
      let items = getRaw(storageKey, []);
      items = items.filter(i => i.id !== this.id && i.uid !== this.id);
      setRaw(storageKey, items);
    }
  }

  const staticDb = {
    collection: (name) => new StaticCollection(name)
  };

  // ─── Watchlist API (For movies.html and profile.html) ───
  function getWatchlist() {
    return getRaw(STORAGE_KEYS.WATCHLIST, []);
  }

  function toggleWatchlist(title) {
    let list = getWatchlist();
    const idx = list.indexOf(title);
    let added = false;
    if (idx === -1) {
      list.push(title);
      added = true;
    } else {
      list.splice(idx, 1);
      added = false;
    }
    setRaw(STORAGE_KEYS.WATCHLIST, list);
    showToast(added ? `⭐ "${title}" added to your Watchlist!` : `Removed "${title}" from Watchlist`, added ? 'success' : 'info');
    return added;
  }

  function isInWatchlist(title) {
    return getWatchlist().includes(title);
  }

  // ─── Reset Demo Data Utility ───
  function resetDemoData() {
    setRaw(STORAGE_KEYS.REQUESTS, INITIAL_REQUESTS);
    setRaw(STORAGE_KEYS.SUGGESTIONS, INITIAL_SUGGESTIONS);
    showToast('Community data reset to defaults!', 'success');
    setTimeout(() => window.location.reload(), 600);
  }

  // ─── Navigation HTML & Injection ───
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
            <a href="movies.html" class="nav-link ${activePage === 'movies' ? 'active' : ''}">🍿 Top Movies</a>
            <a href="browse.html" class="nav-link ${activePage === 'browse' ? 'active' : ''}">🔍 Browse</a>
            <a href="ask.html" class="nav-link ${activePage === 'ask' ? 'active' : ''}">💬 Ask</a>
            <a href="activity.html" class="nav-link ${activePage === 'activity' ? 'active' : ''}">📋 My Activity</a>
            <a href="profile.html" class="nav-link ${activePage === 'profile' ? 'active' : ''}">👤 Profile</a>
          </div>
          <div class="nav-hamburger" id="navHamburger" aria-label="Toggle menu" role="button" tabindex="0">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </nav>
      <div class="nav-mobile" id="navMobile">
        <a href="index.html" class="nav-link ${activePage === 'home' ? 'active' : ''}">🏠 Home</a>
        <a href="movies.html" class="nav-link ${activePage === 'movies' ? 'active' : ''}">🍿 Top 200+ Movies</a>
        <a href="browse.html" class="nav-link ${activePage === 'browse' ? 'active' : ''}">🔍 Browse Requests</a>
        <a href="ask.html" class="nav-link ${activePage === 'ask' ? 'active' : ''}">💬 Ask Community</a>
        <a href="activity.html" class="nav-link ${activePage === 'activity' ? 'active' : ''}">📋 My Activity</a>
        <a href="profile.html" class="nav-link ${activePage === 'profile' ? 'active' : ''}">👤 Profile</a>
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

    mobileNav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileNav.classList.remove('show');
      });
    });
  }

  // ─── Modal Dialogs ───
  function showAuthModal() {
    const existing = document.querySelector('.modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <h2 class="modal-title">Join MovieSuggest</h2>
        <p class="modal-text">Create an account or continue as a guest to post requests and share movie recommendations.</p>
        <div class="modal-actions">
          <a href="auth.html?mode=register&redirect=${encodeURIComponent(window.location.href)}" class="btn btn-primary">Create Account</a>
          <a href="auth.html?mode=login&redirect=${encodeURIComponent(window.location.href)}" class="btn btn-secondary">Login</a>
        </div>
        <div style="margin-top: 14px; text-align: center;">
          <button class="btn btn-ghost btn-sm" id="modalGuestBtn">👤 Quick Continue as Guest</button>
        </div>
        <button class="btn btn-ghost btn-block mt-md modal-close" style="margin-top: 8px;">Cancel</button>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#modalGuestBtn').addEventListener('click', async () => {
      await loginAsGuest();
      overlay.remove();
      window.location.reload();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
    overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());

    const escHandler = (e) => {
      if (e.key === 'Escape') {
        overlay.remove();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

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
          <button class="btn btn-danger" id="confirmYes">Confirm</button>
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

  // ─── Analytics / Event Logger ───
  function trackEvent(eventName, params) {
    try {
      // Safe local tracking for events
      if (window.console && window.console.info) {
        console.info(`[MovieSuggest Event] ${eventName}`, params || {});
      }
    } catch (e) {}
  }

  // ─── Utilities ───
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
    if (container) {
      container.innerHTML = Array(count).fill(skeletonCard()).join('');
    }
  }

  // ─── Export Global API ───
  window.db = staticDb;
  window.auth = {
    currentUser: currentUser,
    onAuthStateChanged: (cb) => {
      onAuthReady(cb);
    },
    signInAnonymously: loginAsGuest,
    createUserWithEmailAndPassword: (e, p) => registerWithEmail('', e, p),
    signInWithEmailAndPassword: loginWithEmail,
    signOut: logout
  };

  window.firebase = {
    firestore: {
      FieldValue: {
        serverTimestamp: () => new Date().toISOString()
      }
    },
    auth: () => window.auth,
    analytics: () => ({ logEvent: trackEvent })
  };

  // Expose top-level variables and functions
  Object.defineProperty(window, 'currentUser', {
    get: () => currentUser,
    set: (val) => setCurrentUser(val)
  });

  window.onAuthReady = onAuthReady;
  window.injectNav = injectNav;
  window.loginAsGuest = loginAsGuest;
  window.registerWithEmail = registerWithEmail;
  window.loginWithEmail = loginWithEmail;
  window.logout = logout;
  window.requireAuth = requireAuth;
  window.requireRegistered = requireRegistered;
  window.showAuthModal = showAuthModal;
  window.showConfirmModal = showConfirmModal;
  window.showToast = showToast;
  window.trackEvent = trackEvent;
  window.escapeHTML = escapeHTML;
  window.timeAgo = timeAgo;
  window.formatDate = formatDate;
  window.getUrlParam = getUrlParam;
  window.showSkeletonGrid = showSkeletonGrid;

  // MovieStore custom API
  window.MovieStore = {
    getWatchlist,
    toggleWatchlist,
    isInWatchlist,
    resetDemoData
  };
})();
