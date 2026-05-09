/* ============================================================
   BLOKFALL — i18n.js
   Shared by index.html and game.html
   ============================================================ */
(function () {
  const LANGS = ['en', 'it', 'de'];

  const T = {
    en: {
      // Nav
      nav_features:    'Features',
      nav_howto:       'How to Play',
      nav_rankings:    'Rankings',
      nav_about:       'About',
      nav_login:       'Log in',
      nav_play:        'Play Free',
      // Hero
      hero_badge:      'Free to play  •  No download  •  No ads',
      hero_heading1:   'The block game',
      hero_heading2:   'rebuilt for 2025.',
      hero_body:       'Stack. Clear. Survive. A browser-native Tetris with real-time synthesized audio, SRS rotation, particle effects, and a global leaderboard — crafted from scratch by one person.',
      hero_play:       "Play Now — It’s Free",
      hero_signup:     'Create Account',
      hero_social:     '<strong>284,400</strong> top score  •  Global leaderboard live',
      // Features
      sec_features_label: '01 — Features',
      sec_features_h:  'Built <em>different.</em>',
      f1_title: 'SRS Rotation',
      f1_body:  'Full Super Rotation System with wall kicks — exactly like guideline Tetris. No shortcuts, no compromises.',
      f2_title: 'Live Audio Engine',
      f2_body:  'Korobeiniki synthesized in real-time via Web Audio API. No MP3s — pure sound design.',
      f3_title: 'Ghost Piece',
      f3_body:  'Ghost projection and 7-bag randomizer for fair, strategic play every session.',
      f4_title: 'Particle FX',
      f4_body:  'Line clears trigger particle explosions, screen shake, and full-screen flash effects that make every clear feel earned.',
      // How to play
      sec_howto_label: '02 — Controls',
      sec_howto_h:     'How to <em>play.</em>',
      ctrl_move:       'Move',
      ctrl_move_desc:  'Slide the piece left or right',
      ctrl_rotate:     'Rotate',
      ctrl_rotate_desc:'Spin clockwise with wall kicks',
      ctrl_soft:       'Soft Drop',
      ctrl_soft_desc:  'Speed up the fall, earn bonus points',
      ctrl_hard:       'Hard Drop',
      ctrl_hard_desc:  'Slam the piece down instantly',
      ctrl_pause:      'Pause',
      ctrl_pause_desc: 'Take a breather',
      // Leaderboard
      sec_lb_label:    '03 — Rankings',
      sec_lb_h:        'Top<br><em>players.</em>',
      lb_copy:         'Create an account to save your scores and climb the global leaderboard. The top spot is waiting.',
      lb_join:         'Join the Ranks',
      lb_rank:         'Rank',
      lb_player:       'Player',
      lb_score:        'Score',
      lb_you:          'You?',
      // About
      sec_about_label: '04 — About',
      sec_about_h:     'Built by<br><em>Davide.</em>',
      about_p1:        'Hi — I’m <strong>Davide</strong>, a student and AI enthusiast. I built BLOKFALL completely from scratch, for free, as a personal project to push what’s possible in the browser.',
      about_p2:        'No team. No budget. Just curiosity, code, and a lot of late nights.',
      about_p3:        'Every piece of this — the SRS rotation engine, the synthesized audio, the particle effects, the UI — was hand-crafted with the help of AI tools that made it possible to build something this polished as a solo student.',
      about_p4:        'Free to play. Free forever. Enjoy.',
      // Footer
      footer_controls: 'Controls',
      footer_rankings: 'Rankings',
      footer_play:     'Play',
      footer_copy:     '© 2025 — Built with obsession',
      // Modal
      modal_tab_login:  'Log In',
      modal_tab_signup: 'Sign Up',
      modal_lbl_user_login:  'Username or Email',
      modal_lbl_user_signup: 'Username',
      modal_lbl_email:  'Email',
      modal_lbl_pass:   'Password',
      modal_ph_user_login:  'username or email',
      modal_ph_user_signup: 'your_username',
      modal_ph_email:   'you@example.com',
      modal_submit_login:  'Log In',
      modal_submit_signup: 'Create Account',
      modal_alt_login:  'No account? ',
      modal_alt_signup: 'Already have an account? ',
      modal_switch_login:  'Sign up free',
      modal_switch_signup: 'Log in instead',
      // Game page
      game_score:    'SCORE',
      game_best:     'BEST',
      game_level:    'LEVEL',
      game_lines:    'LINES',
      game_next:     'NEXT',
      game_controls: 'CONTROLS',
      game_move:     'Move',
      game_rotate:   'Rotate',
      game_softdrop: 'Soft drop',
      game_harddrop: 'Hard drop',
      game_pause:    'Pause',
      game_restart:  'Restart',
      btn_restart:   'RESTART',
      btn_pause:     'PAUSE',
      btn_resume:    'RESUME',
      btn_sound_on:  'SOUND',
      btn_sound_off: 'SOUND',
      btn_logout:    'LOG OUT',
      btn_start:     'START GAME',
      ov_eyebrow:    'NEON EDITION',
      ov_any_key:    'OR PRESS ANY KEY',
      ov_retry:      'PRESS ANY KEY TO RETRY',
      ov_play_again: 'PLAY AGAIN',
      ov_final:      'FINAL SCORE',
      ov_paused_sub: 'GAME PAUSED',
    },

    it: {
      nav_features:    'Funzioni',
      nav_howto:       'Come Giocare',
      nav_rankings:    'Classifica',
      nav_about:       'Chi Siamo',
      nav_login:       'Accedi',
      nav_play:        'Gioca Gratis',
      hero_badge:      'Gratis  •  Nessun download  •  Nessuna pub',
      hero_heading1:   'Il gioco dei blocchi',
      hero_heading2:   'rifatto per 2025.',
      hero_body:       'Impila. Elimina. Sopravvivi. Un Tetris nativo nel browser con audio sintetizzato in tempo reale, rotazione SRS, effetti particellari e una classifica globale — creato da zero da una sola persona.',
      hero_play:       'Gioca Ora — È Gratis',
      hero_signup:     'Crea Account',
      hero_social:     '<strong>284.400</strong> punteggio massimo  •  Classifica globale attiva',
      sec_features_label: '01 — Funzioni',
      sec_features_h:  'Costruito <em>diversamente.</em>',
      f1_title: 'Rotazione SRS',
      f1_body:  'Sistema di Super Rotazione completo con wall kicks — esattamente come il Tetris ufficiale. Nessuna scorciatoia.',
      f2_title: 'Motore Audio Live',
      f2_body:  'Korobeiniki sintetizzato in tempo reale via Web Audio API. Nessun MP3 — puro sound design.',
      f3_title: 'Pezzo Fantasma',
      f3_body:  'Proiezione fantasma e randomizzatore a 7 sacchi per un gioco equo e strategico ad ogni sessione.',
      f4_title: 'Effetti Particellari',
      f4_body:  'Le eliminazioni di righe scatenano esplosioni di particelle, scuotimento dello schermo ed effetti flash a tutto schermo.',
      sec_howto_label: '02 — Controlli',
      sec_howto_h:     'Come <em>giocare.</em>',
      ctrl_move:       'Muovi',
      ctrl_move_desc:  'Scorri il pezzo a sinistra o a destra',
      ctrl_rotate:     'Ruota',
      ctrl_rotate_desc:'Gira in senso orario con wall kicks',
      ctrl_soft:       'Caduta Lenta',
      ctrl_soft_desc:  'Accelera la caduta, guadagna punti bonus',
      ctrl_hard:       'Caduta Rapida',
      ctrl_hard_desc:  'Fai cadere il pezzo istantaneamente',
      ctrl_pause:      'Pausa',
      ctrl_pause_desc: 'Prenditi una pausa',
      sec_lb_label:    '03 — Classifica',
      sec_lb_h:        'I migliori<br><em>giocatori.</em>',
      lb_copy:         'Crea un account per salvare i tuoi punteggi e scalare la classifica globale. Il primo posto ti aspetta.',
      lb_join:         'Entra in Classifica',
      lb_rank:         'Pos.',
      lb_player:       'Giocatore',
      lb_score:        'Punteggio',
      lb_you:          'Tu?',
      sec_about_label: '04 — Chi Siamo',
      sec_about_h:     'Creato da<br><em>Davide.</em>',
      about_p1:        'Ciao — sono <strong>Davide</strong>, uno studente appassionato di AI. Ho costruito BLOKFALL completamente da zero, gratuitamente, come progetto personale.',
      about_p2:        'Nessun team. Nessun budget. Solo curiosità, codice e tante notti in bianco.',
      about_p3:        'Ogni parte di questo — il motore di rotazione SRS, l’audio sintetizzato, gli effetti particellari, l’interfaccia — è stata creata a mano con l’aiuto di strumenti AI.',
      about_p4:        'Gratis per sempre. Divertiti.',
      footer_controls: 'Controlli',
      footer_rankings: 'Classifica',
      footer_play:     'Gioca',
      footer_copy:     '© 2025 — Fatto con ossessione',
      modal_tab_login:  'Accedi',
      modal_tab_signup: 'Registrati',
      modal_lbl_user_login:  'Username o Email',
      modal_lbl_user_signup: 'Username',
      modal_lbl_email:  'Email',
      modal_lbl_pass:   'Password',
      modal_ph_user_login:  'username o email',
      modal_ph_user_signup: 'il_tuo_username',
      modal_ph_email:   'tu@esempio.com',
      modal_submit_login:  'Accedi',
      modal_submit_signup: 'Crea Account',
      modal_alt_login:  'Nessun account? ',
      modal_alt_signup: 'Hai già un account? ',
      modal_switch_login:  'Registrati gratis',
      modal_switch_signup: 'Accedi invece',
      game_score:    'PUNTI',
      game_best:     'RECORD',
      game_level:    'LIVELLO',
      game_lines:    'RIGHE',
      game_next:     'PROSSIMO',
      game_controls: 'CONTROLLI',
      game_move:     'Muovi',
      game_rotate:   'Ruota',
      game_softdrop: 'Caduta lenta',
      game_harddrop: 'Caduta rapida',
      game_pause:    'Pausa',
      game_restart:  'Ricomincia',
      btn_restart:   'RICOMINCIA',
      btn_pause:     'PAUSA',
      btn_resume:    'RIPRENDI',
      btn_sound_on:  'AUDIO',
      btn_sound_off: 'AUDIO',
      btn_logout:    'ESCI',
      btn_start:     'INIZIA',
      ov_eyebrow:    'NEON EDITION',
      ov_any_key:    'O PREMI UN TASTO',
      ov_retry:      'PREMI UN TASTO PER RIPROVARE',
      ov_play_again: 'GIOCA ANCORA',
      ov_final:      'PUNTEGGIO FINALE',
      ov_paused_sub: 'GIOCO IN PAUSA',
    },

    de: {
      nav_features:    'Funktionen',
      nav_howto:       'Anleitung',
      nav_rankings:    'Rangliste',
      nav_about:       'Über uns',
      nav_login:       'Anmelden',
      nav_play:        'Kostenlos spielen',
      hero_badge:      'Kostenlos  •  Kein Download  •  Keine Werbung',
      hero_heading1:   'Das Blockspiel',
      hero_heading2:   'neu gebaut für 2025.',
      hero_body:       'Stapeln. Löschen. Überleben. Ein Browser-Tetris mit Echtzeit-Audiosynthese, SRS-Rotation, Partikeleffekten und einer globalen Bestenliste — von Grund auf von einer Person gebaut.',
      hero_play:       'Jetzt spielen — Kostenlos',
      hero_signup:     'Konto erstellen',
      hero_social:     '<strong>284.400</strong> Höchstpunktzahl  •  Globale Rangliste live',
      sec_features_label: '01 — Funktionen',
      sec_features_h:  'Anders <em>gebaut.</em>',
      f1_title: 'SRS-Rotation',
      f1_body:  'Vollständiges Super-Rotationssystem mit Wall-Kicks — genau wie das offizielle Tetris. Keine Abkürzungen.',
      f2_title: 'Live-Audio-Engine',
      f2_body:  'Korobeiniki in Echtzeit über Web Audio API synthetisiert. Keine MP3s — reines Sounddesign.',
      f3_title: 'Geisterfigur',
      f3_body:  'Geisterprojektion und 7-Beutel-Zufallsgenerator für faires, strategisches Spiel in jeder Runde.',
      f4_title: 'Partikeleffekte',
      f4_body:  'Zeilenlöschungen lösen Partikelexplosionen, Bildschirmzittern und Vollbild-Blitzeffekte aus.',
      sec_howto_label: '02 — Steuerung',
      sec_howto_h:     'Wie man <em>spielt.</em>',
      ctrl_move:       'Bewegen',
      ctrl_move_desc:  'Teil nach links oder rechts verschieben',
      ctrl_rotate:     'Drehen',
      ctrl_rotate_desc:'Im Uhrzeigersinn mit Wall-Kicks drehen',
      ctrl_soft:       'Sanfter Fall',
      ctrl_soft_desc:  'Fall beschleunigen, Bonuspunkte sammeln',
      ctrl_hard:       'Harter Fall',
      ctrl_hard_desc:  'Teil sofort fallen lassen',
      ctrl_pause:      'Pause',
      ctrl_pause_desc: 'Eine kurze Pause einlegen',
      sec_lb_label:    '03 — Rangliste',
      sec_lb_h:        'Beste<br><em>Spieler.</em>',
      lb_copy:         'Erstelle ein Konto, um deine Punkte zu speichern und die globale Rangliste zu erkunden. Der erste Platz wartet.',
      lb_join:         'In die Rangliste',
      lb_rank:         'Rang',
      lb_player:       'Spieler',
      lb_score:        'Punkte',
      lb_you:          'Du?',
      sec_about_label: '04 — Über uns',
      sec_about_h:     'Gebaut von<br><em>Davide.</em>',
      about_p1:        'Hallo — ich bin <strong>Davide</strong>, Student und KI-Enthusiast. Ich habe BLOKFALL komplett von Grund auf, kostenlos, als persönliches Projekt gebaut.',
      about_p2:        'Kein Team. Kein Budget. Nur Neugier, Code und viele späte Nächte.',
      about_p3:        'Jeder Teil davon — die SRS-Rotation, das synthetisierte Audio, die Partikeleffekte, die UI — wurde mit Hilfe von KI-Tools handgefertigt.',
      about_p4:        'Kostenlos für immer. Viel Spaß.',
      footer_controls: 'Steuerung',
      footer_rankings: 'Rangliste',
      footer_play:     'Spielen',
      footer_copy:     '© 2025 — Mit Leidenschaft gebaut',
      modal_tab_login:  'Anmelden',
      modal_tab_signup: 'Registrieren',
      modal_lbl_user_login:  'Benutzername oder E-Mail',
      modal_lbl_user_signup: 'Benutzername',
      modal_lbl_email:  'E-Mail',
      modal_lbl_pass:   'Passwort',
      modal_ph_user_login:  'benutzername oder e-mail',
      modal_ph_user_signup: 'dein_benutzername',
      modal_ph_email:   'du@beispiel.de',
      modal_submit_login:  'Anmelden',
      modal_submit_signup: 'Konto erstellen',
      modal_alt_login:  'Kein Konto? ',
      modal_alt_signup: 'Bereits ein Konto? ',
      modal_switch_login:  'Kostenlos registrieren',
      modal_switch_signup: 'Stattdessen anmelden',
      game_score:    'PUNKTE',
      game_best:     'REKORD',
      game_level:    'LEVEL',
      game_lines:    'REIHEN',
      game_next:     'NÄCHSTES',
      game_controls: 'STEUERUNG',
      game_move:     'Bewegen',
      game_rotate:   'Drehen',
      game_softdrop: 'Sanfter Fall',
      game_harddrop: 'Harter Fall',
      game_pause:    'Pause',
      game_restart:  'Neustart',
      btn_restart:   'NEUSTART',
      btn_pause:     'PAUSE',
      btn_resume:    'WEITER',
      btn_sound_on:  'TON',
      btn_sound_off: 'TON',
      btn_logout:    'ABMELDEN',
      btn_start:     'SPIEL STARTEN',
      ov_eyebrow:    'NEON EDITION',
      ov_any_key:    'ODER TASTE DRÜCKEN',
      ov_retry:      'TASTE DRÜCKEN UM NEU ZU STARTEN',
      ov_play_again: 'NOCHMAL SPIELEN',
      ov_final:      'ENDERGEBNIS',
      ov_paused_sub: 'SPIEL PAUSIERT',
    }
  };

  function getLang() {
    return localStorage.getItem('blokfall_lang') || 'en';
  }

  function setLang(lang) {
    if (!LANGS.includes(lang)) return;
    localStorage.setItem('blokfall_lang', lang);
    applyLang(lang);
    updateSwitcher(lang);
  }

  function applyLang(lang) {
    const t = T[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (!(key in t)) return;
      const val = t[key];
      if (el.tagName === 'INPUT') {
        el.placeholder = val;
      } else if (el.dataset.i18nHtml) {
        el.innerHTML = val;
      } else {
        el.textContent = val;
      }
    });
    // html lang attribute
    document.documentElement.lang = lang;
  }

  function updateSwitcher(lang) {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  }

  function initSwitchers() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => setLang(btn.dataset.lang));
    });
    const lang = getLang();
    applyLang(lang);
    updateSwitcher(lang);
  }

  // Expose
  window.i18n = { getLang, setLang, t: key => T[getLang()][key] || key };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSwitchers);
  } else {
    initSwitchers();
  }
})();
