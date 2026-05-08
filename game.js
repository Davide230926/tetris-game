// ─── Polyfill roundRect ───────────────────────────────────────────────────────
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x,y,w,h,r) {
    if (Array.isArray(r)) r=r[0];
    this.beginPath();
    this.moveTo(x+r,y); this.lineTo(x+w-r,y); this.quadraticCurveTo(x+w,y,x+w,y+r);
    this.lineTo(x+w,y+h-r); this.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    this.lineTo(x+r,y+h); this.quadraticCurveTo(x,y+h,x,y+h-r);
    this.lineTo(x,y+r); this.quadraticCurveTo(x,y,x+r,y);
  };
}

// ─── DOM ──────────────────────────────────────────────────────────────────────
const canvas     = document.getElementById('canvas');
const ctx        = canvas.getContext('2d');
const bgCanvas   = document.getElementById('bg');
const bgCtx      = bgCanvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx    = nextCanvas.getContext('2d');
// hold removed from UI — stub canvas so hold logic doesn't crash
const holdCanvas = document.createElement('canvas');
const holdCtx    = holdCanvas.getContext('2d');
const scoreEl    = document.getElementById('score');
const highEl     = document.getElementById('highscore');
const levelEl    = document.getElementById('level');
const linesEl    = document.getElementById('lines');
const overlay    = document.getElementById('overlay');
const ovTitle    = document.getElementById('overlay-title');
const ovEyebrow  = document.getElementById('overlay-eyebrow');
const ovSub      = document.getElementById('overlay-sub');
const ovMsg      = document.getElementById('overlay-msg');
const holdBox    = { classList: { add:()=>{}, remove:()=>{} } }; // stub
const btnStart   = document.getElementById('btn-start');
const btnRestart = document.getElementById('btn-restart');
const btnPause   = document.getElementById('btn-pause');
const btnPauseLbl= document.getElementById('btn-pause-label');
const btnPauseIc = document.getElementById('btn-pause-icon');
const btnMute    = document.getElementById('btn-mute');
const btnMuteLbl = document.getElementById('btn-mute-label');
const btnMuteIc  = document.getElementById('btn-mute-icon');

const flash = document.createElement('div');
flash.id = 'flash';
document.body.appendChild(flash);

const toast = document.createElement('div');
toast.id = 'toast';
document.body.appendChild(toast);

// ─── Constants ────────────────────────────────────────────────────────────────
const COLS = 10, ROWS = 20, CELL = 36;
const LOCK_DELAY = 500;
const LINE_SCORES = [0, 100, 300, 500, 800];

// ─── Tetrominoes ──────────────────────────────────────────────────────────────
const PIECES = {
  I: { color:'#00cfff', shape:[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]] },
  O: { color:'#ffe600', shape:[[1,1],[1,1]] },
  T: { color:'#b44fff', shape:[[0,1,0],[1,1,1],[0,0,0]] },
  S: { color:'#00ff88', shape:[[0,1,1],[1,1,0],[0,0,0]] },
  Z: { color:'#ff2d78', shape:[[1,1,0],[0,1,1],[0,0,0]] },
  J: { color:'#2d6bff', shape:[[1,0,0],[1,1,1],[0,0,0]] },
  L: { color:'#ff8c00', shape:[[0,0,1],[1,1,1],[0,0,0]] },
};
const PIECE_KEYS = Object.keys(PIECES);

const KICKS_JLSTZ = [
  [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  [[0,0],[1,0],[1,-1],[0,2],[1,2]],
  [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
];
const KICKS_I = [
  [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
  [[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
  [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
  [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
];

// ─── State ────────────────────────────────────────────────────────────────────
let board, current, next, held, holdUsed;
let score, highscore=0, level, lines;
let running=false, paused=false, gameOverState=false;
let dropTimer=0, lockTimer=0, locking=false;
let lastTime=0;
let particles=[];
let clearAnim=null;
let ghostY=0;
let bag=[];
let muted=false;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const rand    = n => Math.floor(Math.random()*n);
const clamp   = (v,lo,hi) => Math.max(lo, Math.min(hi, v));
const lerp    = (a,b,t) => a+(b-a)*t;

function dropInterval() {
  const speeds = [800,717,633,550,467,383,300,217,133,100,83,83,83,67,67,67,50,50,50,33,33];
  return speeds[Math.min(level-1, speeds.length-1)];
}

// ─── Bag ──────────────────────────────────────────────────────────────────────
function refillBag() {
  bag = [...PIECE_KEYS];
  for (let i=bag.length-1; i>0; i--) {
    const j = rand(i+1);
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
}
function nextFromBag() {
  if (!bag.length) refillBag();
  return bag.pop();
}

function makePiece(key) {
  const def = PIECES[key];
  return {
    key, color: def.color,
    shape: def.shape.map(r=>[...r]),
    x: key==='O' ? 4 : 3,
    y: key==='I' ? -1 : 0,
    rot: 0,
  };
}

// ─── Board ────────────────────────────────────────────────────────────────────
function emptyBoard() {
  return Array.from({length:ROWS}, ()=>Array(COLS).fill(null));
}

function collides(shape, ox, oy) {
  for (let r=0; r<shape.length; r++)
    for (let c=0; c<shape[r].length; c++)
      if (shape[r][c]) {
        const nx=ox+c, ny=oy+r;
        if (nx<0||nx>=COLS||ny>=ROWS) return true;
        if (ny>=0 && board[ny][nx])   return true;
      }
  return false;
}

function rotate90(shape) {
  const n=shape.length;
  return shape.map((row,r)=>row.map((_,c)=>shape[n-1-c][r]));
}

function tryRotate(piece, dir) {
  let newShape=piece.shape;
  const steps = dir===1 ? 1 : 3;
  for (let i=0;i<steps;i++) newShape=rotate90(newShape);
  const newRot=(piece.rot+dir+4)%4;
  const kicks = piece.key==='I' ? KICKS_I : KICKS_JLSTZ;
  const table = kicks[piece.rot];
  for (const [kx,ky] of table) {
    const nx=piece.x+kx, ny=piece.y-ky;
    if (!collides(newShape,nx,ny)) {
      return {...piece, shape:newShape, rot:newRot, x:nx, y:ny};
    }
  }
  return null;
}

function calcGhost() {
  let gy=current.y;
  while (!collides(current.shape, current.x, gy+1)) gy++;
  return gy;
}

function lockPiece() {
  current.shape.forEach((row,r)=>row.forEach((v,c)=>{
    if (v) {
      const ny=current.y+r, nx=current.x+c;
      if (ny>=0) board[ny][nx]=current.color;
    }
  }));
  holdUsed=false;
  holdBox.classList.remove('locked');
  checkLines();
  spawnPiece();
}

function checkLines() {
  const full=[];
  for (let r=0;r<ROWS;r++)
    if (board[r].every(c=>c!==null)) full.push(r);
  if (!full.length) return;

  const pts = LINE_SCORES[full.length] * level;
  score += pts;
  lines += full.length;
  const newLevel = Math.floor(lines/10)+1;
  if (newLevel>level) {
    level=newLevel;
    sfxLevelUp();
    showToast(`LEVEL ${level}`);
  }

  updateHUD();
  popScore(scoreEl);
  if (full.length===4) showToast('TETRIS!');
  triggerFlash();
  sfxLineClear(full.length);

  full.forEach(r=>{
    for (let c=0;c<COLS;c++) {
      const px=c*CELL+CELL/2, py=r*CELL+CELL/2;
      spawnParticles(px,py,board[r][c]||'#fff',6);
    }
  });

  clearAnim={ rows:full, timer:0, duration:140 };
}

function removeLines(rows) {
  rows.sort((a,b)=>b-a);
  for (const r of rows) board.splice(r,1);
  while (board.length<ROWS) board.unshift(Array(COLS).fill(null));
}

function spawnPiece() {
  current=makePiece(next.key);
  next=makePiece(nextFromBag());
  drawNextPiece();
  ghostY=calcGhost();
  locking=false; lockTimer=0;
  if (collides(current.shape,current.x,current.y)) doGameOver();
}

// ─── Starfield ────────────────────────────────────────────────────────────────
let stars=[];
function initStars() {
  bgCanvas.width=window.innerWidth;
  bgCanvas.height=window.innerHeight;
  // Gold-tinted stars to match the new design system
  stars=Array.from({length:180},()=>({
    x:Math.random()*bgCanvas.width,
    y:Math.random()*bgCanvas.height,
    r:Math.random()*1.2+0.2,
    spd:Math.random()*0.08+0.01,
    alpha:Math.random()*0.45+0.1,
    ts:Math.random()*0.014+0.003,
    to:Math.random()*Math.PI*2,
    gold:Math.random()<0.2,
  }));
}
function drawStars(t) {
  bgCtx.clearRect(0,0,bgCanvas.width,bgCanvas.height);
  for (const s of stars) {
    const a=s.alpha*(0.55+0.45*Math.sin(t*s.ts+s.to));
    bgCtx.beginPath();
    bgCtx.arc(s.x,s.y,s.r,0,Math.PI*2);
    if (s.gold) bgCtx.fillStyle=`rgba(240,192,64,${a*0.7})`;
    else        bgCtx.fillStyle=`rgba(232,232,240,${a})`;
    bgCtx.fill();
    s.y+=s.spd;
    if (s.y>bgCanvas.height){s.y=0;s.x=Math.random()*bgCanvas.width;}
  }
}
window.addEventListener('resize',initStars);
initStars();

// ─── Particles ────────────────────────────────────────────────────────────────
function spawnParticles(cx,cy,color,count=18) {
  for (let i=0;i<count;i++) {
    const a=Math.random()*Math.PI*2;
    const spd=Math.random()*5+1;
    particles.push({
      x:cx,y:cy,
      vx:Math.cos(a)*spd, vy:Math.sin(a)*spd,
      life:1, decay:Math.random()*0.035+0.015,
      r:Math.random()*3.5+1.5, color,
    });
  }
}
function updateParticles() {
  for (const p of particles){
    p.x+=p.vx; p.y+=p.vy;
    p.vx*=0.91; p.vy*=0.91;
    p.life-=p.decay; p.r*=0.96;
  }
  particles=particles.filter(p=>p.life>0);
}
function drawParticles() {
  for (const p of particles){
    ctx.save();
    ctx.globalAlpha=clamp(p.life,0,1);
    ctx.shadowColor=p.color; ctx.shadowBlur=10;
    ctx.fillStyle=p.color;
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
}

// ─── Cell drawing ─────────────────────────────────────────────────────────────
function drawCell(ctx2d, x, y, color, alpha=1, ghost=false) {
  const px=x*CELL, py=y*CELL;
  ctx2d.save();
  ctx2d.globalAlpha=alpha;
  if (ghost) {
    ctx2d.strokeStyle=color; ctx2d.lineWidth=1.5;
    ctx2d.shadowColor=color; ctx2d.shadowBlur=6;
    ctx2d.strokeRect(px+1,py+1,CELL-2,CELL-2);
    ctx2d.restore();
    return;
  }
  ctx2d.shadowColor=color; ctx2d.shadowBlur=14;
  const g=ctx2d.createLinearGradient(px,py,px+CELL,py+CELL);
  g.addColorStop(0,lighten(color,0.45));
  g.addColorStop(1,color);
  ctx2d.fillStyle=g;
  ctx2d.beginPath();
  ctx2d.roundRect(px+1,py+1,CELL-2,CELL-2,4);
  ctx2d.fill();
  ctx2d.shadowBlur=0;
  ctx2d.fillStyle='rgba(255,255,255,0.2)';
  ctx2d.beginPath();
  ctx2d.roundRect(px+3,py+3,(CELL-4)*0.55,(CELL-4)*0.28,2);
  ctx2d.fill();
  ctx2d.strokeStyle='rgba(255,255,255,0.1)';
  ctx2d.lineWidth=0.5;
  ctx2d.strokeRect(px+1,py+1,CELL-2,CELL-2);
  ctx2d.restore();
}

function lighten(hex,amt) {
  let r,g,b;
  const m=hex.match(/\d+/g);
  if (m&&m.length>=3){[r,g,b]=m.map(Number);}
  else {
    const c=parseInt(hex.slice(1),16);
    r=(c>>16)&255;g=(c>>8)&255;b=c&255;
  }
  return `rgb(${Math.min(255,Math.round(r+255*amt))},${Math.min(255,Math.round(g+255*amt))},${Math.min(255,Math.round(b+255*amt))})`;
}

function drawGrid() {
  ctx.strokeStyle='rgba(0,200,255,0.05)';
  ctx.lineWidth=0.5;
  for (let x=0;x<=COLS;x++){
    ctx.beginPath();ctx.moveTo(x*CELL,0);ctx.lineTo(x*CELL,ROWS*CELL);ctx.stroke();
  }
  for (let y=0;y<=ROWS;y++){
    ctx.beginPath();ctx.moveTo(0,y*CELL);ctx.lineTo(COLS*CELL,y*CELL);ctx.stroke();
  }
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawGrid();
  for (let r=0;r<ROWS;r++) {
    for (let c=0;c<COLS;c++) {
      const color=board[r][c];
      if (!color) continue;
      if (clearAnim && clearAnim.rows.includes(r)) {
        const progress=clearAnim.timer/clearAnim.duration;
        const flashAlpha=Math.abs(Math.sin(progress*Math.PI*4));
        drawCell(ctx,c,r,'#ffffff',0.3+flashAlpha*0.7);
      } else {
        drawCell(ctx,c,r,color);
      }
    }
  }
  if (running && !paused && current) {
    current.shape.forEach((row,r)=>row.forEach((v,c)=>{
      if (v && ghostY+r>=0) drawCell(ctx,current.x+c,ghostY+r,current.color,1,true);
    }));
  }
  if (current) {
    current.shape.forEach((row,r)=>row.forEach((v,c)=>{
      if (v && current.y+r>=0) drawCell(ctx,current.x+c,current.y+r,current.color);
    }));
  }
  drawParticles();
}

function drawNextPiece() {
  nextCtx.clearRect(0,0,nextCanvas.width,nextCanvas.height);
  if (!next) return;
  drawMiniPiece(nextCtx, next, nextCanvas.width, nextCanvas.height);
}

function drawHoldPiece() {
  holdCtx.clearRect(0,0,holdCanvas.width,holdCanvas.height);
  if (!held) return;
  drawMiniPiece(holdCtx, held, holdCanvas.width, holdCanvas.height, holdUsed?0.4:1);
}

function drawMiniPiece(ctx2d, piece, cw, ch, alpha=1) {
  const MINI=24;
  const w=piece.shape[0].length, h=piece.shape.length;
  const ox=Math.floor((cw-w*MINI)/2);
  const oy=Math.floor((ch-h*MINI)/2);
  piece.shape.forEach((row,r)=>row.forEach((v,c)=>{
    if (!v) return;
    const px=ox+c*MINI, py=oy+r*MINI;
    ctx2d.save();
    ctx2d.globalAlpha=alpha;
    ctx2d.shadowColor=piece.color; ctx2d.shadowBlur=10;
    const g=ctx2d.createLinearGradient(px,py,px+MINI,py+MINI);
    g.addColorStop(0,lighten(piece.color,0.4));
    g.addColorStop(1,piece.color);
    ctx2d.fillStyle=g;
    ctx2d.beginPath();
    ctx2d.roundRect(px+1,py+1,MINI-2,MINI-2,3);
    ctx2d.fill();
    ctx2d.shadowBlur=0;
    ctx2d.fillStyle='rgba(255,255,255,0.2)';
    ctx2d.beginPath();
    ctx2d.roundRect(px+2,py+2,(MINI-3)*0.5,(MINI-3)*0.26,2);
    ctx2d.fill();
    ctx2d.restore();
  }));
}

// ─── HUD ──────────────────────────────────────────────────────────────────────
function updateHUD() {
  scoreEl.textContent=score;
  if (score>highscore){ highscore=score; highEl.textContent=highscore; }
  levelEl.textContent=level;
  linesEl.textContent=lines;
}
function popScore(el) {
  el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
  setTimeout(()=>el.classList.remove('pop'),220);
}

function triggerShake() {
  canvas.classList.remove('shake'); void canvas.offsetWidth; canvas.classList.add('shake');
}
function triggerFlash() {
  flash.classList.remove('bang'); void flash.offsetWidth; flash.classList.add('bang');
}

// ─── Toast ────────────────────────────────────────────────────────────────────
let toastTimer=null;
function showToast(text) {
  toast.textContent=text;
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>toast.classList.remove('show'), 1400);
}

// ─── Overlay ──────────────────────────────────────────────────────────────────
function showOverlay(title, sub, msg, cls='', showStartBtn=true) {
  ovTitle.textContent = title;
  if (ovEyebrow) ovEyebrow.textContent = cls === 'gameover' ? 'FINAL SCORE' : cls === 'paused' ? 'GAME PAUSED' : 'NEON EDITION';
  ovSub.textContent = sub;
  ovMsg.textContent = msg;
  overlay.className = 'visible' + (cls ? ' ' + cls : '');
  btnStart.style.display = showStartBtn ? '' : 'none';
}
function hideOverlay() { overlay.className = ''; }

// ─── Audio ────────────────────────────────────────────────────────────────────
let audioCtx=null, masterGain=null, musicGain=null, sfxGain=null;
let musicNodes=[], musicPlaying=false;

function ensureAudio() {
  if (!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
  if (audioCtx.state==='suspended') audioCtx.resume();
  if (!masterGain) {
    masterGain=audioCtx.createGain();
    masterGain.gain.value=muted ? 0 : 0.7;
    masterGain.connect(audioCtx.destination);
    musicGain=audioCtx.createGain();
    musicGain.gain.value=0.22;
    musicGain.connect(masterGain);
    sfxGain=audioCtx.createGain();
    sfxGain.gain.value=0.55;
    sfxGain.connect(masterGain);
  }
}

// Synth voice with optional filter, vibrato, attack/release shaping
function synth(freq, dur, opts={}) {
  if (!audioCtx) return;
  const {
    type='square', vol=0.3, dest=musicGain, t=null,
    attack=0.01, release=null, filter=null, filterQ=1, detune=0,
  } = opts;
  const start=t??audioCtx.currentTime;
  const rel=release??Math.min(0.15, dur*0.3);
  const osc=audioCtx.createOscillator();
  const g=audioCtx.createGain();
  osc.type=type;
  osc.frequency.setValueAtTime(freq,start);
  if (detune) osc.detune.value=detune;
  g.gain.setValueAtTime(0,start);
  g.gain.linearRampToValueAtTime(vol,start+attack);
  g.gain.setValueAtTime(vol,start+dur-rel);
  g.gain.exponentialRampToValueAtTime(0.0001,start+dur);
  if (filter) {
    const f=audioCtx.createBiquadFilter();
    f.type='lowpass'; f.frequency.value=filter; f.Q.value=filterQ;
    osc.connect(f); f.connect(g);
  } else {
    osc.connect(g);
  }
  g.connect(dest);
  osc.start(start); osc.stop(start+dur+0.05);
  musicNodes.push(osc);
}

// Drum synthesis ──────────────────────────────────────────────────────────────
function kick(t) {
  if (!audioCtx) return;
  const o=audioCtx.createOscillator(), g=audioCtx.createGain();
  o.type='sine';
  o.frequency.setValueAtTime(140,t);
  o.frequency.exponentialRampToValueAtTime(40,t+0.12);
  g.gain.setValueAtTime(0.55,t);
  g.gain.exponentialRampToValueAtTime(0.001,t+0.15);
  o.connect(g); g.connect(musicGain);
  o.start(t); o.stop(t+0.18);
  musicNodes.push(o);
}
function snare(t) {
  if (!audioCtx) return;
  // noise burst
  const buf=audioCtx.createBuffer(1, audioCtx.sampleRate*0.12, audioCtx.sampleRate);
  const d=buf.getChannelData(0);
  for (let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*(1-i/d.length);
  const src=audioCtx.createBufferSource(); src.buffer=buf;
  const f=audioCtx.createBiquadFilter(); f.type='highpass'; f.frequency.value=1200;
  const g=audioCtx.createGain();
  g.gain.setValueAtTime(0.32,t);
  g.gain.exponentialRampToValueAtTime(0.001,t+0.13);
  src.connect(f); f.connect(g); g.connect(musicGain);
  src.start(t);
  // tonal pitch
  const o=audioCtx.createOscillator();
  o.type='triangle'; o.frequency.value=190;
  const og=audioCtx.createGain();
  og.gain.setValueAtTime(0.18,t);
  og.gain.exponentialRampToValueAtTime(0.001,t+0.08);
  o.connect(og); og.connect(musicGain);
  o.start(t); o.stop(t+0.1);
  musicNodes.push(src,o);
}
function hat(t, open=false) {
  if (!audioCtx) return;
  const dur=open?0.13:0.04;
  const buf=audioCtx.createBuffer(1, audioCtx.sampleRate*dur, audioCtx.sampleRate);
  const d=buf.getChannelData(0);
  for (let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*(1-i/d.length);
  const src=audioCtx.createBufferSource(); src.buffer=buf;
  const f=audioCtx.createBiquadFilter(); f.type='highpass'; f.frequency.value=7000;
  const g=audioCtx.createGain();
  g.gain.setValueAtTime(open?0.13:0.18,t);
  g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  src.connect(f); f.connect(g); g.connect(musicGain);
  src.start(t);
  musicNodes.push(src);
}

// ─── SFX ──────────────────────────────────────────────────────────────────────
function sfxMove()      { ensureAudio(); synth(180,0.04,{type:'square',vol:0.15,dest:sfxGain}); }
function sfxRotate()    { ensureAudio(); synth(320,0.05,{type:'square',vol:0.18,dest:sfxGain}); }
function sfxDrop()      {
  ensureAudio();
  const t=audioCtx.currentTime;
  synth(160,0.08,{type:'sawtooth',vol:0.3,dest:sfxGain,t});
  synth(80,0.12,{type:'sine',vol:0.35,dest:sfxGain,t});
  kick(t);
}
function sfxLineClear(n){
  ensureAudio();
  const t=audioCtx.currentTime;
  const sets=[
    [330,440,550,660],
    [330,495,660,880],
    [330,440,660,880],
    [262,392,523,784,1047], // tetris! big chord
  ];
  const freqs=sets[Math.min(n,4)-1];
  freqs.forEach((f,i)=>synth(f,0.18+i*0.04,{type:'square',vol:0.32,dest:sfxGain,t:t+i*0.05}));
  if (n===4) {
    [523,659,784,1047,1318].forEach((f,i)=>synth(f,0.3,{type:'triangle',vol:0.25,dest:sfxGain,t:t+0.25+i*0.04}));
  }
}
function sfxGameOver()  {
  ensureAudio();
  const t=audioCtx.currentTime;
  [330,294,261,220,196,165,130].forEach((f,i)=>synth(f,0.22,{type:'sawtooth',vol:0.4,dest:sfxGain,t:t+i*0.08,filter:1500}));
}
function sfxLevelUp()   {
  ensureAudio();
  const t=audioCtx.currentTime;
  [523,659,784,1047,1319].forEach((f,i)=>synth(f,0.14,{type:'square',vol:0.3,dest:sfxGain,t:t+i*0.06}));
}

// ─── Korobeiniki — full multi-track arrangement ───────────────────────────────
const BPM = 144;
const BEAT = 60 / BPM;

// Note lookup
const N = (function(){
  const obj={};
  const names=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  for (let oct=1; oct<=6; oct++) {
    names.forEach((n,i)=>{
      const midi=12*(oct+1)+i;
      const freq=440*Math.pow(2,(midi-69)/12);
      obj[n+oct]=freq;
    });
  }
  obj['_']=0;
  return obj;
})();

// Each entry: [note, beats]
// Full A-section of Korobeiniki
const A_MELODY = [
  ['E5',1],['B4',0.5],['C5',0.5],['D5',1],['C5',0.5],['B4',0.5],
  ['A4',1],['A4',0.5],['C5',0.5],['E5',1],['D5',0.5],['C5',0.5],
  ['B4',1.5],['C5',0.5],['D5',1],['E5',1],
  ['C5',1],['A4',1],['A4',1],['_',1],

  ['_',0.5],['D5',1],['F5',0.5],['A5',1],['G5',0.5],['F5',0.5],
  ['E5',1.5],['C5',0.5],['E5',1],['D5',0.5],['C5',0.5],
  ['B4',1],['B4',0.5],['C5',0.5],['D5',1],['E5',1],
  ['C5',1],['A4',1],['A4',1],['_',1],
];

// B-section (bridge) — descending chordal
const B_MELODY = [
  ['E5',2],['C5',2],
  ['D5',2],['B4',2],
  ['C5',2],['A4',2],
  ['G#4',2],['_',2],
  ['E5',2],['C5',2],
  ['D5',2],['B4',2],
  ['C5',1],['E5',1],['A5',2],
  ['G#5',2],['_',2],
];

const MELODY = [...A_MELODY, ...B_MELODY];

// Harmony — a third/fifth above melody, much quieter
const A_HARMONY = [
  ['G4',1],['G4',0.5],['A4',0.5],['B4',1],['A4',0.5],['G4',0.5],
  ['E4',1],['E4',0.5],['A4',0.5],['G4',1],['F4',0.5],['E4',0.5],
  ['D4',1.5],['E4',0.5],['F4',1],['G4',1],
  ['E4',1],['C4',1],['C4',1],['_',1],

  ['_',0.5],['F4',1],['A4',0.5],['C5',1],['B4',0.5],['A4',0.5],
  ['G4',1.5],['E4',0.5],['G4',1],['F4',0.5],['E4',0.5],
  ['D4',1],['D4',0.5],['E4',0.5],['F4',1],['G4',1],
  ['E4',1],['C4',1],['C4',1],['_',1],
];
const B_HARMONY = [
  ['C5',2],['A4',2],
  ['B4',2],['G4',2],
  ['A4',2],['F4',2],
  ['E4',2],['_',2],
  ['C5',2],['A4',2],
  ['B4',2],['G4',2],
  ['A4',1],['C5',1],['F5',2],
  ['E5',2],['_',2],
];
const HARMONY = [...A_HARMONY, ...B_HARMONY];

// Bass — root/fifth pattern walking
const A_BASS = [
  ['A2',1],['A3',1],['E3',1],['A3',1],
  ['A2',1],['A3',1],['E3',1],['A3',1],
  ['G2',1],['G3',1],['D3',1],['G3',1],
  ['A2',1],['A3',1],['A2',1],['A3',1],

  ['D3',1],['D4',1],['A3',1],['D4',1],
  ['C3',1],['C4',1],['G3',1],['C4',1],
  ['B2',1],['B3',1],['E3',1],['B3',1],
  ['A2',1],['A3',1],['A2',1],['A3',1],
];
const B_BASS = [
  ['A2',2],['E3',2],
  ['G2',2],['D3',2],
  ['F2',2],['C3',2],
  ['E2',2],['E3',2],
  ['A2',2],['E3',2],
  ['F2',2],['C3',2],
  ['F2',2],['F3',2],
  ['E2',2],['E3',2],
];
const BASS = [...A_BASS, ...B_BASS];

// Drum pattern: each entry is an array of drum hits per beat
// 'k'=kick, 's'=snare, 'h'=closed hat, 'H'=open hat
// Pattern length = 8 beats (1 bar of 8/8 or 2 bars of 4/4)
const DRUM_PATTERN = [
  ['k','h'],['h'],['s','h'],['h'],
  ['k','h'],['k','h'],['s','h'],['H'],
];

let musicTimer=null;
let melIdx=0, harmIdx=0, bassIdx=0, drumStep=0;
let melTime=0, harmTime=0, bassTime=0, drumTime=0;

function startMusic() {
  if (musicPlaying) return;
  musicPlaying=true;
  melIdx=harmIdx=bassIdx=drumStep=0;
  ensureAudio();
  const t0=audioCtx.currentTime+0.08;
  melTime=harmTime=bassTime=drumTime=t0;
  scheduleMusicBatch();
}

function scheduleMusicBatch() {
  if (!musicPlaying||!audioCtx) return;
  const AHEAD=1.6;
  const now=audioCtx.currentTime;

  while (melTime<now+AHEAD) {
    const [n,b]=MELODY[melIdx%MELODY.length];
    const dur=b*BEAT;
    const f=N[n];
    if (f) {
      // Lead: square + slight detuned square for thickness
      synth(f, dur*0.92, {type:'square', vol:0.16, t:melTime, attack:0.005, release:dur*0.25, filter:2400, filterQ:1});
      synth(f, dur*0.92, {type:'square', vol:0.06, t:melTime, attack:0.005, release:dur*0.25, detune:8});
    }
    melTime+=dur; melIdx++;
  }

  while (harmTime<now+AHEAD) {
    const [n,b]=HARMONY[harmIdx%HARMONY.length];
    const dur=b*BEAT;
    const f=N[n];
    if (f) synth(f, dur*0.85, {type:'triangle', vol:0.09, t:harmTime, filter:1800});
    harmTime+=dur; harmIdx++;
  }

  while (bassTime<now+AHEAD) {
    const [n,b]=BASS[bassIdx%BASS.length];
    const dur=b*BEAT;
    const f=N[n];
    if (f) {
      // Bass: sub sine + sawtooth for character
      synth(f, dur*0.88, {type:'sawtooth', vol:0.12, t:bassTime, attack:0.008, filter:600, filterQ:2});
      synth(f/2, dur*0.85, {type:'sine', vol:0.18, t:bassTime, attack:0.005});
    }
    bassTime+=dur; bassIdx++;
  }

  // Drums tick at half-beat (8 steps per 4 beats)
  const STEP_DUR = BEAT * 0.5;
  while (drumTime<now+AHEAD) {
    const hits = DRUM_PATTERN[drumStep % DRUM_PATTERN.length];
    for (const h of hits) {
      if      (h==='k') kick(drumTime);
      else if (h==='s') snare(drumTime);
      else if (h==='h') hat(drumTime,false);
      else if (h==='H') hat(drumTime,true);
    }
    drumTime+=STEP_DUR; drumStep++;
  }

  musicTimer=setTimeout(scheduleMusicBatch, 700);
}

function stopMusic() {
  musicPlaying=false;
  if (musicTimer){ clearTimeout(musicTimer); musicTimer=null; }
  musicNodes.forEach(n=>{ try{n.stop();}catch(_){} });
  musicNodes=[];
}

function setMuted(m) {
  muted=m;
  if (masterGain) masterGain.gain.value = muted ? 0 : 0.7;
  btnMute.classList.toggle('muted', muted);
  btnMuteIc.textContent = muted ? '🔇' : '🔊';
  btnMuteLbl.textContent = muted ? 'MUTED' : 'SOUND';
}

// ─── Game loop ────────────────────────────────────────────────────────────────
function gameLoop(timestamp) {
  requestAnimationFrame(gameLoop);
  const dt=Math.min(timestamp-lastTime, 50);
  lastTime=timestamp;
  drawStars(timestamp);

  if (!running||paused) { draw(); return; }

  if (clearAnim) {
    clearAnim.timer+=dt;
    if (clearAnim.timer>=clearAnim.duration) {
      removeLines(clearAnim.rows);
      clearAnim=null;
    }
    updateParticles();
    draw();
    return;
  }

  dropTimer+=dt;
  if (dropTimer>=dropInterval()) {
    dropTimer=0;
    moveDown(false);
  }

  if (locking) {
    lockTimer+=dt;
    if (lockTimer>=LOCK_DELAY) {
      locking=false; lockTimer=0;
      lockPiece();
    }
  }
  updateParticles();
  draw();
}

function moveDown(isSoftDrop) {
  if (collides(current.shape,current.x,current.y+1)) {
    if (!locking) { locking=true; lockTimer=0; }
  } else {
    current.y++;
    if (isSoftDrop) { score+=1; scoreEl.textContent=score; }
    locking=false; lockTimer=0;
    ghostY=calcGhost();
  }
}

function hardDrop() {
  const dist=ghostY-current.y;
  current.y=ghostY;
  score+=dist*2;
  scoreEl.textContent=score;
  sfxDrop();
  spawnParticles(current.x*CELL+CELL/2, current.y*CELL+CELL/2, current.color, 12);
  triggerShake();
  lockPiece();
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
function init() {
  board=emptyBoard();
  particles=[];
  clearAnim=null;
  score=0; level=1; lines=0;
  holdUsed=false; held=null;
  refillBag(); refillBag();
  next=makePiece(nextFromBag());
  spawnPiece();
  updateHUD();
  drawHoldPiece();
  holdBox.classList.remove('locked');
  running=false; paused=false; gameOverState=false;
  setPauseButton(false);
}

function startGame() {
  running=true; paused=false;
  hideOverlay();
  ensureAudio();
  startMusic();
  dropTimer=0; lastTime=performance.now();
  setPauseButton(false);
}

function restartGame() {
  stopMusic();
  init();
  startGame();
  showToast('NEW GAME');
}

function doGameOver() {
  running=false; gameOverState=true;
  stopMusic();
  sfxGameOver();
  triggerShake();
  triggerFlash();
  for(let r=0;r<6;r++)
    for(let c=0;c<COLS;c++)
      if(board[r]&&board[r][c])
        spawnParticles(c*CELL+CELL/2,r*CELL+CELL/2,board[r][c],8);
  setTimeout(()=>{
    showOverlay('GAME OVER', score.toLocaleString(), 'PRESS ANY KEY TO RETRY', 'gameover');
    btnStart.querySelector('span:last-child').textContent = 'PLAY AGAIN';
  }, 450);
}

function togglePause() {
  if (gameOverState||!running) return;
  paused=!paused;
  if (paused) {
    stopMusic();
    showOverlay('PAUSED', 'TAKE A BREATH', 'PRESS P TO RESUME', 'paused', false);
    setPauseButton(true);
  } else {
    hideOverlay();
    ensureAudio();
    startMusic();
    setPauseButton(false);
  }
}

function setPauseButton(isPaused) {
  if (isPaused) {
    btnPauseIc.textContent='▶';
    btnPauseLbl.textContent='RESUME';
  } else {
    btnPauseIc.textContent='❚❚';
    btnPauseLbl.textContent='PAUSE';
  }
}

function doHold() {
  if (holdUsed||!running||paused) return;
  holdUsed=true;
  if (held) {
    const tmp=held;
    held=makePiece(current.key);
    current=makePiece(tmp.key);
  } else {
    held=makePiece(current.key);
    current=makePiece(next.key);
    next=makePiece(nextFromBag());
    drawNextPiece();
  }
  ghostY=calcGhost();
  locking=false; lockTimer=0;
  drawHoldPiece();
  holdBox.classList.add('locked');
}

// ─── Input ────────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e=>{
  // Global keys
  if (e.key==='r' || e.key==='R') { e.preventDefault(); restartGame(); return; }
  if (e.key==='m' || e.key==='M') { e.preventDefault(); ensureAudio(); setMuted(!muted); return; }

  if (!running||paused) {
    if (e.key==='p'||e.key==='P') { if(running) { e.preventDefault(); togglePause(); } return; }
    if (gameOverState||!running) {
      e.preventDefault();
      if (gameOverState) { gameOverState=false; init(); }
      startGame();
      return;
    }
    return;
  }

  switch(e.key) {
    case 'ArrowLeft':
      e.preventDefault();
      if (!collides(current.shape,current.x-1,current.y)){
        current.x--; ghostY=calcGhost();
        if(locking) lockTimer=0;
        sfxMove();
      }
      break;
    case 'ArrowRight':
      e.preventDefault();
      if (!collides(current.shape,current.x+1,current.y)){
        current.x++; ghostY=calcGhost();
        if(locking) lockTimer=0;
        sfxMove();
      }
      break;
    case 'ArrowDown':
      e.preventDefault();
      moveDown(true); dropTimer=0;
      break;
    case 'ArrowUp':
    case 'x': case 'X':
      e.preventDefault();
      { const r=tryRotate(current,1);
        if(r){ current=r; ghostY=calcGhost(); if(locking)lockTimer=0; sfxRotate(); } }
      break;
    case 'z': case 'Z':
      e.preventDefault();
      { const r=tryRotate(current,-1);
        if(r){ current=r; ghostY=calcGhost(); if(locking)lockTimer=0; sfxRotate(); } }
      break;
    case ' ':
      e.preventDefault(); hardDrop(); break;
    case 'c': case 'C':
      e.preventDefault(); doHold(); break;
    case 'p': case 'P':
      e.preventDefault(); togglePause(); break;
  }
});

// ─── Button wiring + ripple effect ────────────────────────────────────────────
function attachRipple(btn) {
  btn.addEventListener('pointerdown', e=>{
    const rect=btn.getBoundingClientRect();
    const x=e.clientX-rect.left, y=e.clientY-rect.top;
    btn.style.setProperty('--rx', `${(x/rect.width)*100}%`);
    btn.style.setProperty('--ry', `${(y/rect.height)*100}%`);
    const rip=document.createElement('span');
    rip.className='ripple';
    const size=Math.max(rect.width,rect.height);
    rip.style.width=rip.style.height=size+'px';
    rip.style.left=(x-size/2)+'px';
    rip.style.top=(y-size/2)+'px';
    btn.appendChild(rip);
    setTimeout(()=>rip.remove(), 600);
  });
}
[btnStart, btnRestart, btnPause, btnMute].forEach(attachRipple);

btnStart.addEventListener('click', ()=>{
  if (gameOverState) { gameOverState=false; init(); }
  startGame();
});
btnRestart.addEventListener('click', ()=>{ restartGame(); });
btnPause.addEventListener('click', ()=>{
  if (!running) {
    if (gameOverState) { gameOverState=false; init(); }
    startGame();
  } else {
    togglePause();
  }
});
btnMute.addEventListener('click', ()=>{
  ensureAudio();
  setMuted(!muted);
});

// Prevent buttons from stealing focus & capturing keystrokes
[btnStart, btnRestart, btnPause, btnMute].forEach(b => {
  b.addEventListener('mousedown', e => e.preventDefault());
});

// ─── Auth check + user display ────────────────────────────────────────────────
(function() {
  const user = localStorage.getItem('blokfall_user');
  const usernameEl = document.getElementById('game-username');
  const logoutBtn  = document.getElementById('btn-logout');

  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  try {
    const parsed = JSON.parse(user);
    if (usernameEl) usernameEl.textContent = parsed.username || user;
  } catch(_) {
    if (usernameEl) usernameEl.textContent = user;
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('blokfall_user');
      window.location.href = 'index.html';
    });
  }
})();

// ─── Boot ─────────────────────────────────────────────────────────────────────
function boot() {
  init();
  showOverlay('BLOKFALL', '', 'OR PRESS ANY KEY');
  requestAnimationFrame(ts=>{ lastTime=ts; gameLoop(ts); });
}
if (document.readyState==='loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
