
import { LEVELS, DIFFICULTIES } from './config.js';
import { makePiecePath, createPieceSVG } from './jigsaw.js';
import { launchConfetti } from './confetti.js';

const $ = s=>document.querySelector(s);

let state = {
  levelIdx: 0,
  diffKey: 'medium',
  boardW: 800,
  boardH: 528,
  pieces: [], // {id,r,c,tabs,placed}
  drag: null,
};

const boardWrap = $('#boardWrap');
const board = $('#board');
const tray = $('#tray');
const trayCount = $('#trayCount');
const timeEl = $('#time');
const progressEl = $('#progress');
const previewOverlay = $('#previewOverlay');
const previewImg = $('#previewImg');
const winModal = $('#winModal');
const winStats = $('#winStats');
const confettiCanvas = $('#confetti');

let timer = null;
let seconds = 0;

function formatTime(s){
  const m = Math.floor(s/60).toString().padStart(2,'0');
  const sec = (s%60).toString().padStart(2,'0');
  return `${m}:${sec}`;
}

function measureBoard(){
  const maxW = Math.min(boardWrap.clientWidth - 24, 900);
  state.boardW = maxW;
  // relación 3:2 aproximada, se adapta luego a imagen real si quieres
  state.boardH = Math.round(maxW * 0.66);
  board.style.width = state.boardW + 'px';
  board.style.height = state.boardH + 'px';
}

function generateTabs(rows,cols){
  const hTabs = Array.from({length: rows+1},()=>Array(cols).fill(0));
  const vTabs = Array.from({length: rows},()=>Array(cols+1).fill(0));
  for(let r=1;r<rows;r++){
    for(let c=0;c<cols;c++){
      hTabs[r][c] = Math.random()>0.5?1:-1;
    }
  }
  for(let r=0;r<rows;r++){
    for(let c=1;c<cols;c++){
      vTabs[r][c] = Math.random()>0.5?1:-1;
    }
  }
  return {hTabs,vTabs};
}

function buildLevel(){
  clearInterval(timer);
  seconds=0;
  timeEl.textContent = formatTime(0);
  const level = LEVELS[state.levelIdx];
  const diff = DIFFICULTIES[state.diffKey];
  const rows = diff.rows, cols = diff.cols;

  measureBoard();
  const {hTabs,vTabs} = generateTabs(rows,cols);

  state.pieces = [];
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const tabs = {
        top: hTabs[r][c],
        bottom: hTabs[r+1][c],
        left: vTabs[r][c],
        right: vTabs[r][c+1],
      };
      // bordes planos
      if(r===0) tabs.top=0;
      if(r===rows-1) tabs.bottom=0;
      if(c===0) tabs.left=0;
      if(c===cols-1) tabs.right=0;
      // el vecino debe ser opuesto: ya lo es porque hTabs/vTabs compartido pero signo igual,
      // necesitamos invertir: si top de esta es X, bottom de arriba es -X. Como generamos random igual, invertimos ahora:
      // Corrección simple: para cada interior, el tab de abajo de la pieza de arriba debe ser - tab de arriba de esta.
      // Lo hacemos reasignando: tabs.top = -hTabs[r][c] si r>0? Mejor generamos ya con oposición.
      state.pieces.push({id:`${r}-${c}`, r,c,tabs,placed:false});
    }
  }
  // corregir oposición real
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const idx = r*cols+c;
      if(r>0){
        const up = state.pieces[(r-1)*cols+c];
        state.pieces[idx].tabs.top = -up.tabs.bottom;
      }
      if(c>0){
        const left = state.pieces[r*cols+(c-1)];
        state.pieces[idx].tabs.left = -left.tabs.right;
      }
    }
  }

  // shuffle para bandeja
  state.pieces.sort(()=>Math.random()-0.5);

  render();
  startTimer();
  previewImg.src = level.img;
  $('#levelTitle').textContent = level.title;
  $('#diffLabel').textContent = `${diff.label} · ${diff.count} piezas`;
}

function startTimer(){
  timer = setInterval(()=>{ seconds++; timeEl.textContent = formatTime(seconds); },1000);
}

function render(){
  const level = LEVELS[state.levelIdx];
  const diff = DIFFICULTIES[state.diffKey];
  const pw = state.boardW / diff.cols;
  const ph = state.boardH / diff.rows;
  const tabSize = Math.min(pw,ph)*0.32;

  board.innerHTML='';
  tray.innerHTML='';

  // slots de referencia (opcional visual)
  // for debugging puedes dibujar rejilla

  // piezas colocadas en tablero
  for(const p of state.pieces){
    if(!p.placed) continue;
    const wrapper = document.createElement('div');
    wrapper.className='piece placed';
    wrapper.style.position='absolute';
    wrapper.style.left = (p.c*pw - tabSize) + 'px';
    wrapper.style.top = (p.r*ph - tabSize) + 'px';
    wrapper.style.width = (pw + tabSize*2) + 'px';
    wrapper.style.height = (ph + tabSize*2) + 'px';
    const {svg} = createPieceSVG({
      id:p.id, r:p.r, c:p.c, tabs:p.tabs,
      w:pw, h:ph, tabSize, boardW:state.boardW, boardH:state.boardH,
      imgSrc: level.img, scale:1, isTray:false
    });
    wrapper.appendChild(svg);
    board.appendChild(wrapper);
  }

  // piezas en bandeja
  const trayPieces = state.pieces.filter(p=>!p.placed);
  trayCount.textContent = `${trayPieces.length} piezas`;
  const scaleTray = 0.72;

  for(const p of trayPieces){
    const wrapper = document.createElement('div');
    wrapper.className='piece';
    wrapper.dataset.id = p.id;
    wrapper.style.width = (pw*scaleTray + tabSize*2*scaleTray) + 'px';
    wrapper.style.height = (ph*scaleTray + tabSize*2*scaleTray) + 'px';

    const {svg} = createPieceSVG({
      id:p.id, r:p.r, c:p.c, tabs:p.tabs,
      w:pw, h:ph, tabSize, boardW:state.boardW, boardH:state.boardH,
      imgSrc: level.img, scale:scaleTray, isTray:true
    });
    wrapper.appendChild(svg);

    // drag handlers
    wrapper.addEventListener('pointerdown', (e)=>onPointerDown(e,p));

    tray.appendChild(wrapper);
  }

  const placed = state.pieces.filter(p=>p.placed).length;
  const total = state.pieces.length;
  const prog = total? Math.round(placed/total*100):0;
  progressEl.textContent = `${prog}%`;
  $('#placedCount').textContent = `${placed}/${total}`;

  if(total>0 && placed===total){
    onWin();
  }
}

let dragGhost = null;

function onPointerDown(e,p){
  e.preventDefault();
  const level = LEVELS[state.levelIdx];
  const diff = DIFFICULTIES[state.diffKey];
  const pw = state.boardW / diff.cols;
  const ph = state.boardH / diff.rows;
  const tabSize = Math.min(pw,ph)*0.32;

  const rect = e.currentTarget.getBoundingClientRect();
  const offX = e.clientX - rect.left;
  const offY = e.clientY - rect.top;

  state.drag = {id:p.id, r:p.r, c:p.c, tabs:p.tabs};

  // ghost
  dragGhost = document.createElement('div');
  dragGhost.className='piece';
  dragGhost.style.position='fixed';
  dragGhost.style.left = (e.clientX - offX) + 'px';
  dragGhost.style.top = (e.clientY - offY) + 'px';
  dragGhost.style.width = (pw + tabSize*2) + 'px';
  dragGhost.style.height = (ph + tabSize*2) + 'px';
  dragGhost.style.zIndex = 100;
  dragGhost.style.pointerEvents='none';
  const {svg} = createPieceSVG({
    id:p.id+'-drag', r:p.r, c:p.c, tabs:p.tabs,
    w:pw, h:ph, tabSize, boardW:state.boardW, boardH:state.boardH,
    imgSrc: level.img, scale:1, isTray:false
  });
  svg.style.transform='scale(1.06) rotate(1deg)';
  dragGhost.appendChild(svg);
  document.body.appendChild(dragGhost);

  const move = (ev)=>{
    dragGhost.style.left = (ev.clientX - offX) + 'px';
    dragGhost.style.top = (ev.clientY - offY) + 'px';
  };
  const up = (ev)=>{
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', up);
    // comprobar si está cerca del sitio correcto en el tablero
    const boardRect = board.getBoundingClientRect();
    const targetX = state.boardW/diff.cols * p.c;
    const targetY = state.boardH/diff.rows * p.r;
    // posición del ghost relativa al board
    const ghostLeft = ev.clientX - offX;
    const ghostTop = ev.clientY - offY;
    const relX = ghostLeft - boardRect.left + tabSize;
    const relY = ghostTop - boardRect.top + tabSize;
    const dist = Math.hypot(relX - targetX, relY - targetY);
    if(dist < 34){
      const piece = state.pieces.find(x=>x.id===p.id);
      if(piece) piece.placed = true;
      render();
    }
    dragGhost.remove();
    dragGhost=null;
    state.drag=null;
  };
  document.addEventListener('pointermove', move);
  document.addEventListener('pointerup', up);
}

function onWin(){
  clearInterval(timer);
  launchConfetti(confettiCanvas);
  const level = LEVELS[state.levelIdx];
  const diff = DIFFICULTIES[state.diffKey];
  winStats.innerHTML = `${level.title} • ${diff.label} (${diff.count})<br><span class="pill">TIEMPO ${formatTime(seconds)}</span>`;
  $('#winThumb').src = level.img;
  winModal.classList.remove('hidden');
}

export function init(){
  // eventos UI
  $('#diffSelect').addEventListener('change', e=>{
    state.diffKey = e.target.value;
    localStorage.setItem('carb diff', state.diffKey);
    buildLevel();
  });
  $('#levelSelect').addEventListener('change', e=>{
    state.levelIdx = parseInt(e.target.value);
    localStorage.setItem('carb level', state.levelIdx);
    buildLevel();
  });
  $('#previewBtn').addEventListener('pointerdown', ()=> previewOverlay.classList.add('on'));
  $('#previewBtn').addEventListener('pointerup', ()=> previewOverlay.classList.remove('on'));
  $('#previewBtn').addEventListener('pointerleave', ()=> previewOverlay.classList.remove('on'));

  $('#restartBtn').addEventListener('click', ()=> buildLevel());
  $('#nextBtn').addEventListener('click', ()=>{
    winModal.classList.add('hidden');
    state.levelIdx = (state.levelIdx+1) % LEVELS.length;
    $('#levelSelect').value = state.levelIdx;
    localStorage.setItem('carb level', state.levelIdx);
    buildLevel();
  });
  $('#closeWinBtn').addEventListener('click', ()=> winModal.classList.add('hidden'));

  // cargar selects
  const levelSel = $('#levelSelect');
  LEVELS.forEach((lv,i)=>{
    const opt=document.createElement('option');
    opt.value=i; opt.textContent=lv.title;
    levelSel.appendChild(opt);
  });
  const savedDiff = localStorage.getItem('carb diff');
  const savedLevel = localStorage.getItem('carb level');
  if(savedDiff && DIFFICULTIES[savedDiff]) state.diffKey = savedDiff;
  if(savedLevel) state.levelIdx = parseInt(savedLevel)||0;
  $('#diffSelect').value = state.diffKey;
  levelSel.value = state.levelIdx;

  window.addEventListener('resize', ()=>{
    measureBoard();
    render();
  });

  buildLevel();
  }
