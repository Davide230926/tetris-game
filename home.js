/* ============================================================
   BLOKFALL — HOME.JS  v2
   ============================================================ */

(function () {
  'use strict';

  /* ──────────────────────────────────────────
     1. TETRIS PREVIEW ANIMATION
  ────────────────────────────────────────── */
  (function initPreview() {
    const canvas = document.getElementById('preview-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const COLS = 10, ROWS = 20;
    const CW = canvas.width / COLS;
    const CH = canvas.height / ROWS;

    const PIECES = [
      { cells: [[0,0],[1,0],[2,0],[3,0]], color: '#00cfcf' },
      { cells: [[0,0],[0,1],[1,0],[2,0]], color: '#2070ff' },
      { cells: [[2,0],[0,1],[1,1],[2,1]], color: '#f07020' },
      { cells: [[0,0],[1,0],[0,1],[1,1]], color: '#f0c040' },
      { cells: [[1,0],[2,0],[0,1],[1,1]], color: '#50e050' },
      { cells: [[0,0],[1,0],[2,0],[1,1]], color: '#b050f0' },
      { cells: [[0,0],[1,0],[1,1],[2,1]], color: '#f04040' },
    ];

    let board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    let current = null, curX = 0, curY = 0;
    let dropTimer = 0, dropInterval = 520, lastTime = 0;
    let clearFlash = 0, flashRows = [];

    function spawnPiece() {
      const t = PIECES[Math.floor(Math.random() * PIECES.length)];
      current = JSON.parse(JSON.stringify(t));
      curX = Math.floor(COLS / 2) - 2;
      curY = 0;
      if (collides(curX, curY, current.cells)) {
        board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
        dropInterval = 520;
      }
    }

    function collides(ox, oy, cells) {
      for (const [c, r] of cells) {
        const nc = ox + c, nr = oy + r;
        if (nc < 0 || nc >= COLS || nr >= ROWS) return true;
        if (nr >= 0 && board[nr][nc]) return true;
      }
      return false;
    }

    function lockPiece() {
      for (const [c, r] of current.cells) {
        const nc = curX + c, nr = curY + r;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) board[nr][nc] = current.color;
      }
    }

    function clearLines() {
      const full = [];
      for (let r = 0; r < ROWS; r++) {
        if (board[r].every(c => c !== null)) full.push(r);
      }
      if (!full.length) return;
      flashRows = full; clearFlash = 280;
      setTimeout(() => {
        for (const r of full.sort((a, b) => b - a)) {
          board.splice(r, 1);
          board.unshift(Array(COLS).fill(null));
        }
        flashRows = [];
        dropInterval = Math.max(160, dropInterval - 14);
      }, 260);
    }

    function rotateCells(cells) {
      const maxC = Math.max(...cells.map(([c]) => c));
      return cells.map(([c, r]) => [maxC - r, c]);
    }

    let rotTimer = 0;

    function update(ts) {
      const dt = ts - lastTime; lastTime = ts;
      if (clearFlash > 0) clearFlash -= dt;
      dropTimer += dt;
      if (dropTimer >= dropInterval) {
        dropTimer = 0;
        if (!current) { spawnPiece(); }
        else if (!collides(curX, curY + 1, current.cells)) { curY++; }
        else { lockPiece(); clearLines(); current = null; }
      }
      rotTimer += dt;
      if (current && rotTimer > 2600) {
        rotTimer = 0;
        const rot = rotateCells(current.cells);
        if (!collides(curX, curY, rot)) current.cells = rot;
      }
      draw(ts);
      requestAnimationFrame(update);
    }

    function drawCell(c, r, color, alpha) {
      const x = c * CW, y = r * CH;
      ctx.globalAlpha = alpha ?? 1;
      ctx.fillStyle = color;
      ctx.fillRect(x + 1, y + 1, CW - 2, CH - 2);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(x + 1, y + 1, CW - 2, 3);
      ctx.fillRect(x + 1, y + 1, 3, CH - 2);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(x + 1, y + CH - 4, CW - 2, 3);
      ctx.fillRect(x + CW - 4, y + 1, 3, CH - 2);
      ctx.globalAlpha = 1;
    }

    function draw(ts) {
      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'rgba(240,192,64,0.04)';
      ctx.lineWidth = 0.5;
      for (let c = 0; c <= COLS; c++) {
        ctx.beginPath(); ctx.moveTo(c * CW, 0); ctx.lineTo(c * CW, canvas.height); ctx.stroke();
      }
      for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath(); ctx.moveTo(0, r * CH); ctx.lineTo(canvas.width, r * CH); ctx.stroke();
      }

      for (let r = 0; r < ROWS; r++) {
        if (flashRows.includes(r)) {
          const phase = Math.sin(ts / 28) * 0.5 + 0.5;
          ctx.fillStyle = `rgba(240,192,64,${0.5 * phase})`;
          ctx.fillRect(0, r * CH, canvas.width, CH);
          continue;
        }
        for (let c = 0; c < COLS; c++) {
          if (board[r][c]) drawCell(c, r, board[r][c]);
        }
      }

      if (current) {
        let ghostY = curY;
        while (!collides(curX, ghostY + 1, current.cells)) ghostY++;
        if (ghostY !== curY) {
          for (const [c, r] of current.cells) {
            const gc = curX + c, gr = ghostY + r;
            if (gr >= 0 && gr < ROWS) {
              ctx.globalAlpha = 0.18;
              ctx.fillStyle = current.color;
              ctx.fillRect(gc * CW + 1, gr * CH + 1, CW - 2, CH - 2);
              ctx.globalAlpha = 1;
            }
          }
        }
        for (const [c, r] of current.cells) {
          const nc = curX + c, nr = curY + r;
          if (nr >= 0) drawCell(nc, nr, current.color);
        }
      }
    }

    spawnPiece();
    requestAnimationFrame((ts) => { lastTime = ts; update(ts); });
  })();


  /* ──────────────────────────────────────────
     2. TICKER — duplicate for seamless loop
  ────────────────────────────────────────── */
  const tickerTrack = document.querySelector('.ticker-track');
  if (tickerTrack) {
    tickerTrack.innerHTML += tickerTrack.innerHTML;
  }


  /* ──────────────────────────────────────────
     3. NAV SCROLL EFFECT
  ────────────────────────────────────────── */
  const nav = document.getElementById('nav');
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();


  /* ──────────────────────────────────────────
     4. SCROLL REVEAL
  ────────────────────────────────────────── */
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('visible');
      el.querySelectorAll('.bento-card').forEach(c => c.classList.add('visible'));
      el.querySelectorAll('.ctrl-row').forEach(c => c.classList.add('visible'));
      el.querySelectorAll('.lb-row').forEach(r => r.classList.add('visible'));
      revealObs.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -48px 0px' });

  document.querySelectorAll('[data-reveal]').forEach(el => revealObs.observe(el));


  /* ──────────────────────────────────────────
     5. MODAL
  ────────────────────────────────────────── */
  const overlay    = document.getElementById('modal-overlay');
  const modalClose = document.getElementById('modal-close');
  const submitBtn  = document.getElementById('modal-submit-btn');
  const switchBtn  = document.getElementById('modal-switch-btn');
  const modalAlt   = document.querySelector('.modal-alt');
  const emailWrap  = document.getElementById('field-email-wrap');
  const tabs       = document.querySelectorAll('.modal-tab');
  const modalError = document.getElementById('modal-error');

  let currentTab = 'login';

  function openModal() {
    overlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
    document.getElementById('field-username').focus();
  }
  function closeModal() {
    overlay.classList.remove('visible');
    document.body.style.overflow = '';
    if (modalError) modalError.textContent = '';
  }

  ['btn-login-nav','btn-login-hero','btn-login-lb'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', openModal);
  });

  ['btn-play-nav','btn-play-hero'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', () => {
      if (localStorage.getItem('blokfall_token')) {
        window.location.href = 'game.html';
      } else {
        openModal();
      }
    });
  });

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (overlay) overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay && overlay.classList.contains('visible')) closeModal();
  });


  /* ──────────────────────────────────────────
     6. TABS
  ────────────────────────────────────────── */
  function setTab(tab) {
    currentTab = tab;
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));

    const isSignup = tab === 'signup';
    const t = window.i18n ? window.i18n.t.bind(window.i18n) : k => k;
    emailWrap.style.display = isSignup ? 'flex' : 'none';
    submitBtn.textContent = isSignup ? t('modal_submit_signup') : t('modal_submit_login');

    const labelEl = document.getElementById('label-username');
    if (labelEl) {
      labelEl.textContent = isSignup ? t('modal_lbl_user_signup') : t('modal_lbl_user_login');
    }
    document.getElementById('field-username').placeholder = isSignup ? t('modal_ph_user_signup') : t('modal_ph_user_login');

    if (switchBtn) switchBtn.textContent = isSignup ? t('modal_switch_signup') : t('modal_switch_login');
    const altText = document.getElementById('modal-alt-text');
    if (altText) altText.textContent = isSignup ? t('modal_alt_signup') : t('modal_alt_login');

    if (modalError) modalError.textContent = '';
    document.getElementById('field-username').value = '';
    document.getElementById('field-password').value = '';
    const emailInput = emailWrap ? emailWrap.querySelector('input') : null;
    if (emailInput) emailInput.value = '';
  }

  tabs.forEach(t => t.addEventListener('click', () => setTab(t.dataset.tab)));
  if (switchBtn) switchBtn.addEventListener('click', () => {
    setTab(currentTab === 'login' ? 'signup' : 'login');
  });


  /* ──────────────────────────────────────────
     7. AUTH
  ────────────────────────────────────────── */
  function setError(msg) { if (modalError) modalError.textContent = msg; }
  function setSubmitLoading(on) {
    if (!submitBtn) return;
    submitBtn.disabled = on;
    submitBtn.textContent = on ? 'Please wait…' : (currentTab === 'signup' ? 'Create Account' : 'Log In');
  }

  const form = document.getElementById('modal-form');
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      setError('');

      const username = document.getElementById('field-username').value.trim();
      const password = document.getElementById('field-password').value;
      const emailEl  = document.getElementById('field-email');
      const email    = emailEl ? emailEl.value.trim() : '';

      if (!username) { setError('Username is required.'); return; }
      if (!password) { setError('Password is required.'); return; }
      if (password.length < 4) { setError('Password must be at least 4 characters.'); return; }

      setSubmitLoading(true);

      try {
        let res, data;

        if (currentTab === 'login') {
          res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: username, password })
          });
          data = await res.json();
          if (!res.ok) { setError(data.error || 'Login failed.'); setSubmitLoading(false); return; }
        } else {
          if (!email) { setError('Email is required.'); setSubmitLoading(false); return; }
          res = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, email })
          });
          data = await res.json();
          if (!res.ok) { setError(data.error || 'Signup failed.'); setSubmitLoading(false); return; }
        }

        localStorage.setItem('blokfall_token', data.token);
        localStorage.setItem('blokfall_user', JSON.stringify({ username: data.username }));
        window.location.href = 'game.html';
      } catch {
        setError('Network error — please try again.');
        setSubmitLoading(false);
      }
    });
  }

})();
