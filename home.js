/* ============================================================
   BLOKFALL — HOME.JS
   Landing page interactivity
   ============================================================ */

(function () {
  'use strict';

  /* ──────────────────────────────────────────
     1. STARFIELD BACKGROUND CANVAS
  ────────────────────────────────────────── */
  (function initStarfield() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W, H, stars;

    const STAR_COUNT = 120;
    const SPEED_MIN  = 0.04;
    const SPEED_MAX  = 0.18;

    function Star() {
      this.reset(true);
    }

    Star.prototype.reset = function (initial) {
      this.x  = Math.random() * W;
      this.y  = initial ? Math.random() * H : -2;
      this.r  = Math.random() * 1.2 + 0.3;
      this.vx = (Math.random() - 0.5) * 0.06;
      this.vy = SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN);
      this.a  = Math.random() * 0.5 + 0.15;
      // Occasionally a gold-tinted star
      this.gold = Math.random() < 0.12;
    };

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }

    function initStars() {
      stars = Array.from({ length: STAR_COUNT }, () => new Star());
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      for (const s of stars) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        if (s.gold) {
          ctx.fillStyle = `rgba(240,192,64,${s.a})`;
        } else {
          ctx.fillStyle = `rgba(200,200,220,${s.a})`;
        }
        ctx.fill();

        s.x += s.vx;
        s.y += s.vy;

        if (s.y > H + 4 || s.x < -4 || s.x > W + 4) {
          s.reset(false);
        }
      }

      requestAnimationFrame(draw);
    }

    window.addEventListener('resize', () => { resize(); });
    resize();
    initStars();
    draw();
  })();


  /* ──────────────────────────────────────────
     2. TETRIS PREVIEW ANIMATION
  ────────────────────────────────────────── */
  (function initPreview() {
    const canvas = document.getElementById('preview-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const COLS   = 10;
    const ROWS   = 20;
    const CW     = canvas.width  / COLS;   // cell width
    const CH     = canvas.height / ROWS;   // cell height

    // All 7 tetrominoes — using 4-cell coordinate arrays [col, row]
    const PIECES = [
      { cells: [[0,0],[1,0],[2,0],[3,0]], color: '#00cfcf' }, // I
      { cells: [[0,0],[0,1],[1,0],[2,0]], color: '#2070ff' }, // J
      { cells: [[2,0],[0,1],[1,1],[2,1]], color: '#f07020' }, // L  (note: bottom row spawns below)
      { cells: [[0,0],[1,0],[0,1],[1,1]], color: '#f0c040' }, // O
      { cells: [[1,0],[2,0],[0,1],[1,1]], color: '#50e050' }, // S
      { cells: [[0,0],[1,0],[2,0],[1,1]], color: '#b050f0' }, // T
      { cells: [[0,0],[1,0],[1,1],[2,1]], color: '#f04040' }, // Z
    ];

    // Board: 2D array of colors or null
    let board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

    let current  = null;
    let curX     = 0;
    let curY     = 0;
    let dropTimer = 0;
    let dropInterval = 500; // ms between auto-drops
    let lastTime  = 0;
    let clearFlash = 0;      // flash timer (ms)
    let flashRows  = [];

    function spawnPiece() {
      const template = PIECES[Math.floor(Math.random() * PIECES.length)];
      current = JSON.parse(JSON.stringify(template));
      curX    = Math.floor(COLS / 2) - 2;
      curY    = 0;

      // If spawn blocked, reset board
      if (collides(curX, curY, current.cells)) {
        board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
        dropInterval = 500;
      }
    }

    function collides(ox, oy, cells) {
      for (const [c, r] of cells) {
        const nc = ox + c;
        const nr = oy + r;
        if (nc < 0 || nc >= COLS || nr >= ROWS) return true;
        if (nr >= 0 && board[nr][nc]) return true;
      }
      return false;
    }

    function lockPiece() {
      for (const [c, r] of current.cells) {
        const nc = curX + c;
        const nr = curY + r;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
          board[nr][nc] = current.color;
        }
      }
    }

    function clearLines() {
      const full = [];
      for (let r = 0; r < ROWS; r++) {
        if (board[r].every(cell => cell !== null)) full.push(r);
      }
      if (full.length === 0) return;

      flashRows   = full;
      clearFlash  = 260;

      // Remove lines after flash
      setTimeout(() => {
        for (const r of full.sort((a, b) => b - a)) {
          board.splice(r, 1);
          board.unshift(Array(COLS).fill(null));
        }
        flashRows = [];
        // Speed up slightly (capped)
        dropInterval = Math.max(160, dropInterval - 12);
      }, 240);
    }

    function rotateCells(cells) {
      // 90° clockwise around the bounding box centre
      const maxC = Math.max(...cells.map(([c]) => c));
      return cells.map(([c, r]) => [maxC - r, c]);
    }

    // Auto-rotate current piece for visual variety
    let rotTimer = 0;
    const ROT_INTERVAL = 2800;

    function update(ts) {
      const dt = ts - lastTime;
      lastTime = ts;

      if (clearFlash > 0) {
        clearFlash -= dt;
      }

      dropTimer += dt;
      if (dropTimer >= dropInterval) {
        dropTimer = 0;

        if (!current) { spawnPiece(); }
        else {
          if (!collides(curX, curY + 1, current.cells)) {
            curY++;
          } else {
            lockPiece();
            clearLines();
            current = null;
          }
        }
      }

      // Occasional rotation for visual interest
      rotTimer += dt;
      if (current && rotTimer > ROT_INTERVAL) {
        rotTimer = 0;
        const rotated = rotateCells(current.cells);
        if (!collides(curX, curY, rotated)) {
          current.cells = rotated;
        }
      }

      draw(ts);
      requestAnimationFrame(update);
    }

    function drawCell(c, r, color, alpha) {
      const x = c * CW;
      const y = r * CH;
      ctx.globalAlpha = alpha ?? 1;
      // Fill
      ctx.fillStyle = color;
      ctx.fillRect(x + 1, y + 1, CW - 2, CH - 2);
      // Bright top-left bevel
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(x + 1, y + 1, CW - 2, 3);
      ctx.fillRect(x + 1, y + 1, 3, CH - 2);
      // Dark bottom-right
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(x + 1, y + CH - 4, CW - 2, 3);
      ctx.fillRect(x + CW - 4, y + 1, 3, CH - 2);
      ctx.globalAlpha = 1;
    }

    function draw(ts) {
      // Background
      ctx.fillStyle = '#0e0e1c';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle grid
      ctx.strokeStyle = 'rgba(240,192,64,0.05)';
      ctx.lineWidth = 0.5;
      for (let c = 0; c <= COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * CW, 0);
        ctx.lineTo(c * CW, canvas.height);
        ctx.stroke();
      }
      for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * CH);
        ctx.lineTo(canvas.width, r * CH);
        ctx.stroke();
      }

      // Board cells
      for (let r = 0; r < ROWS; r++) {
        // Flash clear
        if (flashRows.includes(r)) {
          const phase = Math.sin(ts / 30) * 0.5 + 0.5;
          ctx.fillStyle = `rgba(240,192,64,${0.5 * phase})`;
          ctx.fillRect(0, r * CH, canvas.width, CH);
          continue;
        }
        for (let c = 0; c < COLS; c++) {
          if (board[r][c]) {
            drawCell(c, r, board[r][c]);
          }
        }
      }

      // Ghost piece
      if (current) {
        let ghostY = curY;
        while (!collides(curX, ghostY + 1, current.cells)) ghostY++;
        if (ghostY !== curY) {
          for (const [c, r] of current.cells) {
            const gc = curX + c;
            const gr = ghostY + r;
            if (gr >= 0 && gr < ROWS) {
              ctx.globalAlpha = 0.2;
              ctx.fillStyle = current.color;
              ctx.fillRect(gc * CW + 1, gr * CH + 1, CW - 2, CH - 2);
              ctx.globalAlpha = 1;
            }
          }
        }

        // Active piece
        for (const [c, r] of current.cells) {
          const nc = curX + c;
          const nr = curY + r;
          if (nr >= 0) drawCell(nc, nr, current.color);
        }
      }

      // Top vignette
      const vgrd = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.2);
      vgrd.addColorStop(0, 'rgba(8,8,16,0.5)');
      vgrd.addColorStop(1, 'rgba(8,8,16,0)');
      ctx.fillStyle = vgrd;
      ctx.fillRect(0, 0, canvas.width, canvas.height * 0.2);
    }

    spawnPiece();
    requestAnimationFrame((ts) => { lastTime = ts; update(ts); });
  })();


  /* ──────────────────────────────────────────
     3. MODAL LOGIC
  ────────────────────────────────────────── */
  const overlay       = document.getElementById('modal-overlay');
  const modal         = document.getElementById('modal');
  const modalClose    = document.getElementById('modal-close');
  const modalError    = document.getElementById('modal-error');
  const submitBtn     = document.getElementById('modal-submit-btn');
  const switchBtn     = document.getElementById('modal-switch-btn');
  const modalAlt      = document.querySelector('.modal-alt');
  const emailWrap     = document.getElementById('field-email-wrap');
  const tabs          = document.querySelectorAll('.modal-tab');

  let currentTab = 'login';

  function openModal() {
    overlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
    document.getElementById('field-username').focus();
  }

  function closeModal() {
    overlay.classList.remove('visible');
    document.body.style.overflow = '';
    modalError.textContent = '';
  }

  // Open triggers
  const loginBtns = ['btn-login-nav', 'btn-login-hero', 'btn-login-lb'];
  loginBtns.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', openModal);
  });

  // PLAY NOW — go straight to game (auth gate handled by game page)
  ['btn-play-hero', 'btn-play-cta'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', () => {
      window.location.href = 'game.html';
    });
  });

  // Close triggers
  if (modalClose) modalClose.addEventListener('click', closeModal);

  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('visible')) closeModal();
  });

  /* ──────────────────────────────────────────
     4. TAB SWITCHING
  ────────────────────────────────────────── */
  function setTab(tab) {
    currentTab = tab;

    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));

    const submitText = submitBtn.querySelector('.btn-gold-text') || submitBtn;
    const labelUsername = document.getElementById('label-username');
    if (tab === 'signup') {
      emailWrap.style.display = 'flex';
      submitText.textContent  = 'CREATE ACCOUNT';
      switchBtn.textContent   = 'Log in instead';
      modalAlt.childNodes[0].textContent = 'Already have an account? ';
      if (labelUsername) labelUsername.textContent = 'USERNAME';
      document.getElementById('field-username').placeholder = 'your_username';
    } else {
      emailWrap.style.display = 'none';
      submitText.textContent  = 'LOG IN';
      switchBtn.textContent   = 'Sign up free';
      modalAlt.childNodes[0].textContent = 'No account? ';
      if (labelUsername) labelUsername.textContent = 'USERNAME OR EMAIL';
      document.getElementById('field-username').placeholder = 'username or email';
    }

    modalError.textContent = '';
    document.getElementById('field-username').value = '';
    document.getElementById('field-password').value = '';
    if (emailWrap.querySelector('input')) {
      emailWrap.querySelector('input').value = '';
    }
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => setTab(tab.dataset.tab));
  });

  if (switchBtn) {
    switchBtn.addEventListener('click', () => {
      setTab(currentTab === 'login' ? 'signup' : 'login');
    });
  }


  /* ──────────────────────────────────────────
     5. FORM SUBMIT — FAKE AUTH
  ────────────────────────────────────────── */
  const form = document.getElementById('modal-form');

  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem('blokfall_users') || '[]');
    } catch {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem('blokfall_users', JSON.stringify(users));
  }

  function setError(msg) {
    modalError.textContent = msg;
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      setError('');

      const username = document.getElementById('field-username').value.trim();
      const password = document.getElementById('field-password').value;
      const email    = document.getElementById('field-email')
                        ? document.getElementById('field-email').value.trim()
                        : '';

      if (!username) { setError('Username is required.'); return; }
      if (!password) { setError('Password is required.'); return; }
      if (password.length < 4) { setError('Password must be at least 4 characters.'); return; }

      const users = getUsers();

      if (currentTab === 'login') {
        const match = users.find(u =>
          (u.username === username || u.email === username) && u.password === password
        );
        if (!match) {
          setError('Invalid username/email or password.');
          return;
        }
        localStorage.setItem('blokfall_user', JSON.stringify({ username: match.username }));
        window.location.href = 'game.html';

      } else {
        // Signup
        if (!email) { setError('Email is required.'); return; }

        const usernameTaken = users.find(u => u.username === username);
        if (usernameTaken) {
          setError('That username is already taken.');
          return;
        }

        const emailTaken = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (emailTaken) {
          setError('An account with that email already exists.');
          return;
        }

        const newUser = { username, password, email: email.toLowerCase() };
        users.push(newUser);
        saveUsers(users);

        localStorage.setItem('blokfall_user', JSON.stringify({ username }));
        window.location.href = 'game.html';
      }
    });
  }


  /* ──────────────────────────────────────────
     6. NAV SCROLL EFFECT
  ────────────────────────────────────────── */
  const nav = document.getElementById('nav');

  function onScroll() {
    if (!nav) return;
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load


  /* ──────────────────────────────────────────
     7. INTERSECTION OBSERVER — REVEAL
  ────────────────────────────────────────── */

  // Assign --i CSS vars to leaderboard rows for staggered delay
  document.querySelectorAll('.lb-row').forEach((row, i) => {
    row.style.setProperty('--i', i);
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const section = entry.target;

      // Reveal section itself
      section.classList.add('visible');

      // Feat cards
      section.querySelectorAll('.feat-card').forEach(card => {
        card.classList.add('visible');
      });

      // Howto cards
      section.querySelectorAll('.howto-card').forEach(card => {
        card.classList.add('visible');
      });

      // Leaderboard rows
      section.querySelectorAll('.lb-row').forEach(row => {
        row.classList.add('visible');
      });

      // Unobserve after reveal (one-shot)
      revealObserver.unobserve(section);
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -60px 0px',
  });

  document.querySelectorAll('[data-reveal]').forEach(section => {
    revealObserver.observe(section);
  });

  /* ──────────────────────────────────────────
     X. MARQUEE — duplicate content for seamless loop
  ────────────────────────────────────────── */
  const marqueeTrack = document.querySelector('.marquee-track');
  if (marqueeTrack) {
    marqueeTrack.innerHTML = marqueeTrack.innerHTML + marqueeTrack.innerHTML;
  }

  /* ──────────────────────────────────────────
     9. THEME TOGGLE
  ────────────────────────────────────────── */
  (function initTheme() {
    const btn = document.getElementById('btn-theme');
    const html = document.documentElement;

    function applyTheme(theme) {
      html.setAttribute('data-theme', theme);
      if (btn) btn.textContent = theme === 'light' ? '☾' : '☀';
      localStorage.setItem('blokfall_theme', theme);
    }

    const saved = localStorage.getItem('blokfall_theme') || 'dark';
    applyTheme(saved);

    if (btn) {
      btn.addEventListener('click', () => {
        const next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        applyTheme(next);
      });
    }
  })();

  /* ──────────────────────────────────────────
     8. CURSOR GLOW — follows pointer subtly
  ────────────────────────────────────────── */
  const cursorGlow = document.getElementById('cursor-glow');
  if (cursorGlow) {
    let tx = 0, ty = 0, cx = 0, cy = 0;
    document.addEventListener('mousemove', (e) => {
      tx = e.clientX;
      ty = e.clientY;
    });
    function animateCursor() {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      cursorGlow.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(animateCursor);
    }
    animateCursor();
  }

})();
