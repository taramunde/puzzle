// game.js — Lógica principal del juego de rompecabezas

(function () {
  "use strict";

  // ============================================================
  // ESTADO GLOBAL
  // ============================================================
  const state = {
    currentPuzzle: null,
    pieces: 16,
    showPreview: true,
    rotateMode: false,
    grid: { cols: 0, rows: 0 },
    boardPieces: [],    // piezas colocadas en el tablero
    trayPieces: [],     // piezas aún en la bandeja
    placedCount: 0,
    totalPieces: 0,
    timerInterval: null,
    startTime: null,
    elapsed: 0,
    hintActive: false,
    img: null,
    boardCanvas: null,
    boardCtx: null,
    cellSize: 0,
    boardOffsetX: 0,
    boardOffsetY: 0,
    dragPiece: null,
    dragOffsetX: 0,
    dragOffsetY: 0,
  };

  // ============================================================
  // UTILIDADES
  // ============================================================
  function $(id) { return document.getElementById(id); }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $(id).classList.add('active');
  }

  function formatTime(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  // ============================================================
  // INICIO — Renderizar galería
  // ============================================================
  function renderGallery(filter = 'all') {
    const grid = $('puzzle-grid');
    grid.innerHTML = '';
    const list = filter === 'all' ? PUZZLE_CATALOG : PUZZLE_CATALOG.filter(p => p.category === filter);
    list.forEach((puzzle, i) => {
      const card = document.createElement('div');
      card.className = 'puzzle-card';
      card.style.animationDelay = `${i * 0.04}s`;
      card.innerHTML = `
        <img class="puzzle-card-thumb" src="${puzzle.thumb}" alt="${puzzle.name}" loading="lazy">
        <div class="puzzle-card-info">
          <div class="puzzle-card-name">${puzzle.name}</div>
          <div class="puzzle-card-cat">${puzzle.category}</div>
          ${puzzle.badge ? `<div class="puzzle-card-badge">${puzzle.badge}</div>` : ''}
        </div>
      `;
      card.addEventListener('click', () => openConfig(puzzle));
      grid.appendChild(card);
    });
  }

  // Tabs de categorías
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderGallery(btn.dataset.cat);
    });
  });

  // ============================================================
  // CONFIGURACIÓN
  // ============================================================
  function openConfig(puzzle) {
    state.currentPuzzle = puzzle;
    $('config-preview-img').src = puzzle.url;
    $('config-puzzle-name').textContent = puzzle.name;
    showScreen('screen-config');
  }

  $('back-to-home').addEventListener('click', () => showScreen('screen-home'));
  $('config-backdrop') && $('config-backdrop').addEventListener('click', () => showScreen('screen-home'));

  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.pieces = parseInt(btn.dataset.pieces);
    });
  });

  $('start-game-btn').addEventListener('click', () => {
    state.showPreview = $('opt-preview').checked;
    state.rotateMode = $('opt-rotate').checked;
    startGame();
  });

  // ============================================================
  // INICIO DEL JUEGO
  // ============================================================
  function startGame() {
    showScreen('screen-game');
    state.placedCount = 0;
    state.elapsed = 0;
    state.boardPieces = [];
    state.trayPieces = [];
    state.dragPiece = null;

    // Calcular grid
    const totalPieces = state.pieces;
    const ratio = 4 / 3;
    const cols = Math.round(Math.sqrt(totalPieces * ratio));
    const rows = Math.round(totalPieces / cols);
    state.grid = { cols, rows };
    state.totalPieces = cols * rows;

    // Cargar imagen
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      state.img = img;
      $('ref-img').src = state.currentPuzzle.url;
      $('win-image').src = state.currentPuzzle.url;
      initBoard();
      initPieces();
      startTimer();
      updateHUD();
    };
    img.onerror = () => {
      // Fallback: crear imagen de color sólido con patrón
      const fc = document.createElement('canvas');
      fc.width = 800; fc.height = 600;
      const fctx = fc.getContext('2d');
      const grd = fctx.createLinearGradient(0,0,800,600);
      grd.addColorStop(0, '#7c6ef2');
      grd.addColorStop(1, '#e8b86d');
      fctx.fillStyle = grd;
      fctx.fillRect(0,0,800,600);
      // Patrón de rombos
      fctx.strokeStyle = 'rgba(255,255,255,0.15)';
      fctx.lineWidth = 1;
      for (let x = 0; x < 800; x += 60) {
        for (let y = 0; y < 600; y += 60) {
          fctx.beginPath();
          fctx.moveTo(x+30, y);
          fctx.lineTo(x+60, y+30);
          fctx.lineTo(x+30, y+60);
          fctx.lineTo(x, y+30);
          fctx.closePath();
          fctx.stroke();
        }
      }
      const fallbackImg = new Image();
      fallbackImg.onload = () => {
        state.img = fallbackImg;
        $('ref-img').src = fallbackImg.src;
        $('win-image').src = fallbackImg.src;
        initBoard();
        initPieces();
        startTimer();
        updateHUD();
      };
      fallbackImg.src = fc.toDataURL();
    };
    img.src = state.currentPuzzle.url;
  }

  // ============================================================
  // INICIALIZAR TABLERO (CANVAS)
  // ============================================================
  function initBoard() {
    const boardWrap = document.querySelector('.board-wrap');
    const canvas = $('puzzle-board');
    state.boardCanvas = canvas;
    state.boardCtx = canvas.getContext('2d');

    const wrapW = boardWrap.clientWidth - 32;
    const wrapH = boardWrap.clientHeight - 32;

    const cellW = Math.floor(wrapW / state.grid.cols);
    const cellH = Math.floor(wrapH / state.grid.rows);
    state.cellSize = Math.min(cellW, cellH, 120);

    const boardW = state.cellSize * state.grid.cols;
    const boardH = state.cellSize * state.grid.rows;

    canvas.width = boardW;
    canvas.height = boardH;
    canvas.style.width = boardW + 'px';
    canvas.style.height = boardH + 'px';

    drawBoard();
    setupBoardEvents();
  }

  function drawBoard() {
    const ctx = state.boardCtx;
    const { cols, rows } = state.grid;
    const cs = state.cellSize;
    const W = state.boardCanvas.width;
    const H = state.boardCanvas.height;

    ctx.clearRect(0, 0, W, H);

    // Fondo con imagen fantasma si showPreview
    if (state.showPreview && state.img) {
      ctx.globalAlpha = 0.12;
      ctx.drawImage(state.img, 0, 0, W, H);
      ctx.globalAlpha = 1;
    }

    // Grid de celdas
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cs, 0);
      ctx.lineTo(c * cs, H);
      ctx.stroke();
    }
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * cs);
      ctx.lineTo(W, r * cs);
      ctx.stroke();
    }

    // Dibujar piezas colocadas
    state.boardPieces.forEach(bp => {
      if (bp.placed) drawPieceOnBoard(bp);
    });
  }

  function drawPieceOnBoard(bp) {
    const ctx = state.boardCtx;
    const cs = state.cellSize;
    const sx = bp.col * (state.img.width / state.grid.cols);
    const sy = bp.row * (state.img.height / state.grid.rows);
    const sw = state.img.width / state.grid.cols;
    const sh = state.img.height / state.grid.rows;
    const dx = bp.col * cs;
    const dy = bp.row * cs;

    ctx.save();
    ctx.beginPath();
    ctx.rect(dx, dy, cs, cs);
    ctx.clip();
    ctx.drawImage(state.img, sx, sy, sw, sh, dx, dy, cs, cs);
    ctx.restore();

    // Borde brillante en pieza recién colocada
    if (bp.fresh) {
      ctx.strokeStyle = '#e8b86d';
      ctx.lineWidth = 2;
      ctx.strokeRect(dx + 1, dy + 1, cs - 2, cs - 2);
      bp.fresh = false;
    }
  }

  // ============================================================
  // INICIALIZAR PIEZAS EN BANDEJA
  // ============================================================
  function initPieces() {
    const container = $('pieces-container');
    container.innerHTML = '';
    state.trayPieces = [];

    const { cols, rows } = state.grid;
    const cs = state.cellSize;
    const traySize = Math.min(cs, 80); // tamaño en bandeja

    // Crear lista aleatoria de piezas
    const indices = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        indices.push({ r, c });

    // Mezclar
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    // Registrar estado de tablero
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        state.boardPieces.push({ row: r, col: c, placed: false, fresh: false });
      }
    }

    // Crear canvas de cada pieza
    indices.forEach(({ r, c }) => {
      const pCanvas = document.createElement('canvas');
      pCanvas.width = traySize;
      pCanvas.height = traySize;
      pCanvas.className = 'piece-canvas';
      pCanvas.title = `Pieza (${c},${r})`;

      const pCtx = pCanvas.getContext('2d');
      const sx = c * (state.img.width / cols);
      const sy = r * (state.img.height / rows);
      const sw = state.img.width / cols;
      const sh = state.img.height / rows;

      // Dibujar imagen de la pieza
      pCtx.drawImage(state.img, sx, sy, sw, sh, 0, 0, traySize, traySize);

      // Borde decorativo
      pCtx.strokeStyle = 'rgba(255,255,255,0.3)';
      pCtx.lineWidth = 1.5;
      pCtx.strokeRect(0.75, 0.75, traySize - 1.5, traySize - 1.5);

      const pieceData = { row: r, col: c, traySize, canvas: pCanvas };
      state.trayPieces.push(pieceData);
      container.appendChild(pCanvas);

      setupPieceDrag(pCanvas, pieceData);
    });

    updateHUD();
  }

  // ============================================================
  // DRAG AND DROP DE PIEZAS
  // ============================================================
  function setupPieceDrag(pCanvas, pieceData) {
    let isDragging = false;
    let ghost = null;
    let startX, startY;

    function onStart(ex, ey) {
      isDragging = true;
      pCanvas.classList.add('dragging');

      // Crear ghost flotante
      ghost = document.createElement('canvas');
      ghost.width = pieceData.traySize;
      ghost.height = pieceData.traySize;
      ghost.style.cssText = `
        position: fixed; pointer-events: none; z-index: 9999;
        border-radius: 4px; opacity: 0.9;
        transform: scale(1.1);
        box-shadow: 0 12px 32px rgba(0,0,0,0.7);
      `;
      const gctx = ghost.getContext('2d');
      gctx.drawImage(pCanvas, 0, 0);
      document.body.appendChild(ghost);

      startX = ex; startY = ey;
      moveGhost(ex, ey);
    }

    function moveGhost(ex, ey) {
      if (!ghost) return;
      ghost.style.left = (ex - pieceData.traySize / 2) + 'px';
      ghost.style.top = (ey - pieceData.traySize / 2) + 'px';
    }

    function onEnd(ex, ey) {
      if (!isDragging) return;
      isDragging = false;
      pCanvas.classList.remove('dragging');
      if (ghost) { document.body.removeChild(ghost); ghost = null; }

      // Detectar si cae sobre el tablero
      tryPlacePiece(pieceData, ex, ey, pCanvas);
    }

    // Mouse
    pCanvas.addEventListener('mousedown', e => {
      e.preventDefault();
      onStart(e.clientX, e.clientY);

      const onMove = (e) => { if (isDragging) moveGhost(e.clientX, e.clientY); };
      const onUp = (e) => {
        onEnd(e.clientX, e.clientY);
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    // Touch
    pCanvas.addEventListener('touchstart', e => {
      e.preventDefault();
      const t = e.touches[0];
      onStart(t.clientX, t.clientY);

      const onMove = (e) => {
        const t = e.touches[0];
        if (isDragging) moveGhost(t.clientX, t.clientY);
      };
      const onEnd2 = (e) => {
        const t = e.changedTouches[0];
        onEnd(t.clientX, t.clientY);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd2);
      };
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onEnd2);
    }, { passive: false });
  }

  function tryPlacePiece(pieceData, clientX, clientY, pCanvas) {
    const boardRect = state.boardCanvas.getBoundingClientRect();
    const cs = state.cellSize;

    const relX = clientX - boardRect.left;
    const relY = clientY - boardRect.top;

    if (relX < 0 || relY < 0 || relX > boardRect.width || relY > boardRect.height) return;

    const targetCol = Math.floor(relX / cs);
    const targetRow = Math.floor(relY / cs);

    if (targetCol < 0 || targetRow < 0 || targetCol >= state.grid.cols || targetRow >= state.grid.rows) return;

    // Verificar si la celda está ocupada
    const boardPiece = state.boardPieces.find(bp => bp.row === targetRow && bp.col === targetCol);
    if (!boardPiece || boardPiece.placed) {
      // Celda ocupada, sacudir pieza
      shakePiece(pCanvas);
      return;
    }

    // Comprobar si es la pieza correcta
    if (pieceData.row === targetRow && pieceData.col === targetCol) {
      // ¡Correcto!
      boardPiece.placed = true;
      boardPiece.fresh = true;
      state.placedCount++;

      // Animación de colocación correcta
      animateSnapToBoard(pCanvas, boardRect, targetCol, targetRow, cs, () => {
        removeTrayPiece(pieceData, pCanvas);
        drawBoard();
        updateHUD();
        playSnapSound();
        if (state.placedCount === state.totalPieces) {
          setTimeout(showVictory, 400);
        }
      });
    } else {
      // Incorrecto — efecto de rechazo
      shakePiece(pCanvas);
      // Pequeño resplandor rojo en la celda objetivo
      flashCellError(targetCol, targetRow);
    }
  }

  function animateSnapToBoard(pCanvas, boardRect, col, row, cs, callback) {
    const trayRect = pCanvas.getBoundingClientRect();
    const targetX = boardRect.left + col * (boardRect.width / state.grid.cols);
    const targetY = boardRect.top + row * (boardRect.height / state.grid.rows);

    // Ghost de animación
    const ghost = document.createElement('canvas');
    ghost.width = pCanvas.width; ghost.height = pCanvas.height;
    const gctx = ghost.getContext('2d');
    gctx.drawImage(pCanvas, 0, 0);
    ghost.style.cssText = `
      position: fixed; pointer-events: none; z-index: 9999;
      border-radius: 4px;
      left: ${trayRect.left}px; top: ${trayRect.top}px;
      width: ${pCanvas.width}px; height: ${pCanvas.height}px;
      transition: all 0.18s cubic-bezier(0.34,1.2,0.64,1);
    `;
    document.body.appendChild(ghost);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ghost.style.left = targetX + 'px';
        ghost.style.top = targetY + 'px';
        ghost.style.width = cs + 'px';
        ghost.style.height = cs + 'px';
        ghost.style.opacity = '0.7';
        setTimeout(() => {
          document.body.removeChild(ghost);
          callback();
        }, 200);
      });
    });
  }

  function shakePiece(pCanvas) {
    pCanvas.style.animation = 'none';
    pCanvas.offsetHeight; // reflow
    const shake = [
      { transform: 'translateX(-8px)' },
      { transform: 'translateX(8px)' },
      { transform: 'translateX(-6px)' },
      { transform: 'translateX(6px)' },
      { transform: 'translateX(0)' }
    ];
    pCanvas.animate(shake, { duration: 300, easing: 'ease' });
  }

  function flashCellError(col, row) {
    const ctx = state.boardCtx;
    const cs = state.cellSize;
    const x = col * cs; const y = row * cs;
    let alpha = 0.6;
    const fade = () => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ff4a4a';
      ctx.fillRect(x, y, cs, cs);
      ctx.restore();
      alpha -= 0.08;
      if (alpha > 0) requestAnimationFrame(fade);
      else drawBoard();
    };
    fade();
  }

  function removeTrayPiece(pieceData, pCanvas) {
    pCanvas.remove();
    state.trayPieces = state.trayPieces.filter(p => p !== pieceData);
  }

  // ============================================================
  // EVENTOS DEL TABLERO — doble click para auto-colocar (ayuda)
  // ============================================================
  function setupBoardEvents() {
    const canvas = state.boardCanvas;
    canvas.addEventListener('dblclick', e => {
      if (!state.hintActive) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const col = Math.floor(x / state.cellSize);
      const row = Math.floor(y / state.cellSize);
      const bp = state.boardPieces.find(b => b.row === row && b.col === col && !b.placed);
      if (!bp) return;

      // Buscar en bandeja
      const tp = state.trayPieces.find(p => p.row === row && p.col === col);
      if (!tp) return;
      bp.placed = true;
      bp.fresh = true;
      state.placedCount++;
      removeTrayPiece(tp, tp.canvas);
      drawBoard();
      updateHUD();
      if (state.placedCount === state.totalPieces) setTimeout(showVictory, 400);
    });
  }

  // ============================================================
  // HUD
  // ============================================================
  function updateHUD() {
    $('pieces-display').textContent = `🧩 ${state.placedCount} / ${state.totalPieces}`;
  }

  function startTimer() {
    clearInterval(state.timerInterval);
    state.startTime = Date.now() - (state.elapsed * 1000);
    state.timerInterval = setInterval(() => {
      state.elapsed = Math.floor((Date.now() - state.startTime) / 1000);
      $('timer-display').textContent = `⏱ ${formatTime(state.elapsed)}`;
    }, 1000);
  }

  function stopTimer() {
    clearInterval(state.timerInterval);
  }

  // ============================================================
  // SONIDO SINTETIZADO (sin archivos externos)
  // ============================================================
  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }

  function playSnapSound() {
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch(e) {}
  }

  function playVictorySound() {
    try {
      const ctx = getAudioCtx();
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        const t = ctx.currentTime + i * 0.12;
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.start(t); osc.stop(t + 0.3);
      });
    } catch(e) {}
  }

  // ============================================================
  // BOTONES DE JUEGO
  // ============================================================
  $('btn-back-game').addEventListener('click', () => {
    stopTimer();
    showScreen('screen-home');
  });

  $('btn-ref').addEventListener('click', () => {
    const panel = $('ref-panel');
    panel.classList.toggle('hidden');
  });
  $('close-ref').addEventListener('click', () => $('ref-panel').classList.add('hidden'));

  $('btn-hint').addEventListener('click', () => {
    state.hintActive = !state.hintActive;
    $('btn-hint').style.background = state.hintActive ? 'rgba(232,184,109,0.2)' : '';
    $('btn-hint').style.borderColor = state.hintActive ? 'var(--accent)' : '';
    if (state.hintActive) showHints();
    else drawBoard();
  });

  function showHints() {
    drawBoard();
    const ctx = state.boardCtx;
    const cs = state.cellSize;
    // Resaltar celdas vacías del tablero
    state.boardPieces.forEach(bp => {
      if (!bp.placed) {
        ctx.strokeStyle = 'rgba(232,184,109,0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(bp.col * cs + 2, bp.row * cs + 2, cs - 4, cs - 4);
        ctx.setLineDash([]);
      }
    });
  }

  $('btn-shuffle').addEventListener('click', () => {
    // Reorganizar piezas en bandeja
    const container = $('pieces-container');
    const pieces = Array.from(container.children);
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      container.insertBefore(pieces[j], pieces[i]);
    }
    // Pequeña animación
    pieces.forEach((p, i) => {
      p.style.animation = 'none';
      setTimeout(() => { p.style.animation = 'fadeInUp 0.3s ease both'; }, i * 15);
    });
  });

  // ============================================================
  // VICTORIA
  // ============================================================
  function showVictory() {
    stopTimer();
    playVictorySound();

    const secs = state.elapsed;
    const score = Math.max(1000, 10000 - secs * 2) * state.totalPieces;

    $('win-time').textContent = formatTime(secs);
    $('win-pieces').textContent = state.totalPieces;
    $('win-score').textContent = score.toLocaleString();

    launchConfetti();
    showScreen('screen-win');
  }

  function launchConfetti() {
    const container = $('confetti-container');
    container.innerHTML = '';
    const colors = ['#e8b86d', '#7c6ef2', '#5fd887', '#f06292', '#4dd0e1', '#fff176'];
    for (let i = 0; i < 60; i++) {
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      el.style.cssText = `
        left: ${Math.random() * 100}%;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        width: ${4 + Math.random() * 8}px;
        height: ${4 + Math.random() * 8}px;
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
        animation-duration: ${1.2 + Math.random() * 1.5}s;
        animation-delay: ${Math.random() * 0.8}s;
      `;
      container.appendChild(el);
    }
  }

  $('win-play-again').addEventListener('click', () => {
    showScreen('screen-config');
  });

  $('win-home').addEventListener('click', () => {
    showScreen('screen-home');
  });

  // ============================================================
  // DRAG DIRECTO DESDE BANDEJA AL TABLERO (alternativa táctil mejorada)
  // ============================================================
  // El tablero también acepta soltar piezas directamente
  // (implementado arriba en tryPlacePiece)

  // ============================================================
  // RESIZE
  // ============================================================
  window.addEventListener('resize', () => {
    if (document.querySelector('#screen-game.active') && state.img) {
      initBoard();
      drawBoard();
    }
  });

  // ============================================================
  // INICIALIZAR APP
  // ============================================================
  renderGallery();

})();
