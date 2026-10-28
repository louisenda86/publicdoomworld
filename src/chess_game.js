// Playable Chess Game for the PUBLIC DOOM Chess Room
// Visitor vs Jax, Topeng, Ayesha, or Athena (Beginner Skill Level)

export const CHESS_OPPONENTS = {
  JAX: {
    id: 'JAX',
    name: 'JAX',
    elo: '680 // BEGINNER',
    accent: '#ff3b30',
    style: 'IMPULSIVE CAFFEINE GAMBITS',
    openQuote: '"I learned chess at 3 AM during a Homer\'s fryer shift. Go easy on my pawns!"',
    moveQuotes: [
      '"Wait, knights jump over things? Right, Mars rules."',
      '"Pushing a pawn for content. Let\'s see where this goes."',
      '"Hold on, I\'m narrating a 9-minute video essay while playing this move."',
      '"Bold strategy. Almost as bold as dropping out of MIT."',
    ],
    captureQuotes: [
      '"Hey! I needed that piece for my thumbnail!"',
      '"Okay, fair trade, I wasn\'t using that bishop anyway."',
    ],
    winQuote: '"Wait—checkmate?! Put that on the Public Doom main channel!"',
    loseQuote: '"GG! You outplayed my sleep-deprived 680 ELO brain."',
  },
  TOPENG: {
    id: 'TOPENG',
    name: 'TOPENG',
    elo: '720 // BEGINNER',
    accent: '#ff7eb6',
    style: 'CHAOTIC BUNKER DEFENSE',
    openQuote: '"TIDAK MAU to standard openings. Let\'s play street chess."',
    moveQuotes: [
      '"For research purposes only, I am moving this piece here."',
      '"My balaclava blocks 15% of my peripheral vision on the queenside."',
      '"Ex-OpenAI, Ex-Anthropic, and still blundering my rook. Classic."',
      '"Every square on this board is a low-poly polygon."',
    ],
    captureQuotes: [
      '"Unacceptable. I am filing a report in the bunker."',
      '"Sacrificed for the greater aesthetic."',
    ],
    winQuote: '"TIDAK MAU! Victory for Topeng Labs!"',
    loseQuote: '"Checkmate verified. Your tactical entropy exceeded mine."',
  },
  AYESHA: {
    id: 'AYESHA',
    name: 'AYESHA',
    elo: '750 // BEGINNER',
    accent: '#9b6bff',
    style: 'SYMMETRICAL AESTHETIC PLAY',
    openQuote: '"I only make moves that look visually balanced on the 64 squares."',
    moveQuotes: [
      '"The color contrast on these diagonals is 99% aesthetic."',
      '"At Reed High School in Mars Austin, we played blitz during art class."',
      '"I\'m positioning my pieces for the camera framing, not theory."',
      '"Don\'t ruin my pawn structure, it looks like a 1998 PS1 cover."',
    ],
    captureQuotes: [
      '"Rude! That piece tied the whole composition together!"',
      '"Fine, take it. Minimalist board anyway."',
    ],
    winQuote: '"Checkmate—and the board geometry looks immaculate."',
    loseQuote: '"GG! You broke my symmetry, well played."',
  },
  ATHENA: {
    id: 'ATHENA',
    name: 'ATHENA',
    elo: '690 // BEGINNER',
    accent: '#ffd43b',
    style: 'TROJAN HORSE ENTHUSIAST',
    openQuote: '"I love the knights because they\'re literally tiny Trojan Horses! Let\'s play!"',
    moveQuotes: [
      '"Forward, my little Odyssey warriors!"',
      '"Wait, can the queen teleport? No? Okay, sliding here!"',
      '"I composed a 48kHz FM-bell chord for this exact move!"',
      '"Even Odysseus took ten years to reach the back rank!"',
    ],
    captureQuotes: [
      '"Oh no! My poor little low-poly soldier!"',
      '"A heroic sacrifice worthy of Homer\'s Iliad!"',
    ],
    winQuote: '"Yay!! Victory fanfare in C-major!"',
    loseQuote: '"GG!! That was so fun—rematch anytime in the Chess Room!"',
  },
};

const PIECE_GLYPHS = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
};

const PIECE_VAL = { P: 10, N: 30, B: 30, R: 50, Q: 90, K: 900 };

export class ChessController {
  constructor(sound) {
    this.sound = sound;
    this.opponentId = 'JAX';
    this.board = [];
    this.turn = 'w'; // 'w' = Visitor, 'b' = Crew Character
    this.selected = null;
    this.legalMoves = [];
    this.capturedW = [];
    this.capturedB = [];
    this.gameOver = false;
    this.statusText = 'YOUR TURN (WHITE)';
    this.lastMove = null;
    this.aiTimer = null;
    this.resetBoard();
  }

  resetBoard() {
    if (this.aiTimer) clearTimeout(this.aiTimer);
    this.board = [
      ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
      ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
      ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR'],
    ];
    this.turn = 'w';
    this.selected = null;
    this.legalMoves = [];
    this.capturedW = [];
    this.capturedB = [];
    this.gameOver = false;
    this.lastMove = null;
    this.statusText = 'YOUR TURN — CLICK A WHITE PIECE TO MOVE';
    const opp = CHESS_OPPONENTS[this.opponentId];
    this.setDialogue(opp.openQuote);
    this.render();
  }

  setOpponent(charId) {
    if (!CHESS_OPPONENTS[charId]) return;
    this.opponentId = charId;
    this.resetBoard();
  }

  setDialogue(text) {
    const el = document.getElementById('chess-opp-quote');
    if (el) el.textContent = text;
  }

  inBounds(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
  }

  getPseudoMoves(board, r, c) {
    const p = board[r][c];
    if (!p) return [];
    const side = p[0];
    const type = p[1];
    const moves = [];

    const addIf = (nr, nc) => {
      if (!this.inBounds(nr, nc)) return false;
      const tgt = board[nr][nc];
      if (!tgt) {
        moves.push({ fr: r, fc: c, tr: nr, tc: nc });
        return true;
      }
      if (tgt[0] !== side) {
        moves.push({ fr: r, fc: c, tr: nr, tc: nc, capture: tgt });
      }
      return false;
    };

    if (type === 'P') {
      const dir = side === 'w' ? -1 : 1;
      const startRow = side === 'w' ? 6 : 1;
      if (this.inBounds(r + dir, c) && !board[r + dir][c]) {
        moves.push({ fr: r, fc: c, tr: r + dir, tc: c });
        if (r === startRow && !board[r + dir * 2][c]) {
          moves.push({ fr: r, fc: c, tr: r + dir * 2, tc: c });
        }
      }
      for (const dc of [-1, 1]) {
        const nr = r + dir, nc = c + dc;
        if (this.inBounds(nr, nc) && board[nr][nc] && board[nr][nc][0] !== side) {
          moves.push({ fr: r, fc: c, tr: nr, tc: nc, capture: board[nr][nc] });
        }
      }
    } else if (type === 'N') {
      for (const [dr, dc] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]) {
        addIf(r + dr, c + dc);
      }
    } else if (type === 'K') {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr !== 0 || dc !== 0) addIf(r + dr, c + dc);
        }
      }
    } else {
      const dirs = [];
      if (type === 'R' || type === 'Q') dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
      if (type === 'B' || type === 'Q') dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
      for (const [dr, dc] of dirs) {
        let nr = r + dr, nc = c + dc;
        while (addIf(nr, nc)) {
          nr += dr;
          nc += dc;
        }
      }
    }
    return moves;
  }

  cloneBoard(board) {
    return board.map(row => row.slice());
  }

  applyMoveOnBoard(board, m) {
    const next = this.cloneBoard(board);
    let piece = next[m.fr][m.fc];
    next[m.fr][m.fc] = null;
    // Auto-queen pawn on back rank
    if (piece === 'wP' && m.tr === 0) piece = 'wQ';
    if (piece === 'bP' && m.tr === 7) piece = 'bQ';
    next[m.tr][m.tc] = piece;
    return next;
  }

  isKingInCheck(board, side) {
    let kr = -1, kc = -1;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === side + 'K') { kr = r; kc = c; }
      }
    }
    if (kr === -1) return true;
    const enemy = side === 'w' ? 'b' : 'w';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] && board[r][c][0] === enemy) {
          const moves = this.getPseudoMoves(board, r, c);
          if (moves.some(m => m.tr === kr && m.tc === kc)) return true;
        }
      }
    }
    return false;
  }

  getAllLegalMoves(board, side) {
    const all = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] && board[r][c][0] === side) {
          const pseudo = this.getPseudoMoves(board, r, c);
          for (const m of pseudo) {
            const next = this.applyMoveOnBoard(board, m);
            if (!this.isKingInCheck(next, side)) {
              all.push(m);
            }
          }
        }
      }
    }
    return all;
  }

  handleSquareClick(r, c) {
    if (this.gameOver || this.turn !== 'w') return;

    // Check if clicked square is a legal destination for currently selected piece
    const move = this.legalMoves.find(m => m.tr === r && m.tc === c);
    if (move) {
      this.executeMove(move);
      return;
    }

    const p = this.board[r][c];
    if (p && p[0] === 'w') {
      this.selected = { r, c };
      this.legalMoves = this.getAllLegalMoves(this.board, 'w').filter(m => m.fr === r && m.fc === c);
      this.sound?.sfxClick(980);
      this.render();
    } else {
      this.selected = null;
      this.legalMoves = [];
      this.render();
    }
  }

  executeMove(m) {
    const targetPiece = this.board[m.tr][m.tc];
    if (targetPiece) {
      if (targetPiece[0] === 'b') this.capturedB.push(targetPiece);
      else this.capturedW.push(targetPiece);
    }

    this.board = this.applyMoveOnBoard(this.board, m);
    this.lastMove = m;
    this.selected = null;
    this.legalMoves = [];
    this.sound?.sfxClick(m.capture ? 1320 : 860);

    const opp = CHESS_OPPONENTS[this.opponentId];
    if (m.capture && this.turn === 'w') {
      const q = opp.captureQuotes[Math.floor(Math.random() * opp.captureQuotes.length)];
      this.setDialogue(q);
      this.sound?.sfxVoiceBlip(this.opponentId);
    }

    this.turn = this.turn === 'w' ? 'b' : 'w';
    const nextMoves = this.getAllLegalMoves(this.board, this.turn);
    const inCheck = this.isKingInCheck(this.board, this.turn);

    if (nextMoves.length === 0) {
      this.gameOver = true;
      if (inCheck) {
        if (this.turn === 'b') {
          this.statusText = `CHECKMATE! YOU DEFEATED ${opp.name}!`;
          this.setDialogue(opp.loseQuote);
        } else {
          this.statusText = `CHECKMATE! ${opp.name} WINS!`;
          this.setDialogue(opp.winQuote);
        }
      } else {
        this.statusText = 'STALEMATE // DRAW GAME!';
      }
      this.render();
      return;
    }

    if (this.turn === 'b') {
      this.statusText = `${opp.name} IS THINKING...` + (inCheck ? ' (CHECK!)' : '');
      this.render();
      this.aiTimer = setTimeout(() => this.makeBeginnerAIMove(), 480);
    } else {
      this.statusText = 'YOUR TURN (WHITE)' + (inCheck ? ' — YOUR KING IS IN CHECK!' : '');
      this.render();
    }
  }

  // Beginner Skill AI: prefers obvious captures only ~45% of the time, otherwise plays casual developing moves
  makeBeginnerAIMove() {
    if (this.gameOver || this.turn !== 'b') return;
    const moves = this.getAllLegalMoves(this.board, 'b');
    if (!moves.length) return;

    // Score each move with beginner randomness
    const scored = moves.map(m => {
      let score = (Math.random() - 0.5) * 35; // High beginner variance
      if (m.capture) {
        const val = PIECE_VAL[m.capture[1]] || 10;
        // Beginner only spots the capture value some of the time
        score += Math.random() < 0.55 ? val * 0.8 : 5;
      }
      // Slight preference for advancing toward center
      if (m.tr >= 2 && m.tr <= 5 && m.tc >= 2 && m.tc <= 5) score += 4;
      return { m, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const chosen = scored[0].m;
    const opp = CHESS_OPPONENTS[this.opponentId];
    if (!chosen.capture || Math.random() < 0.7) {
      const q = opp.moveQuotes[Math.floor(Math.random() * opp.moveQuotes.length)];
      this.setDialogue(q);
    }
    this.sound?.sfxVoiceBlip(this.opponentId);
    this.executeMove(chosen);
  }

  render() {
    const boardEl = document.getElementById('chess-grid');
    if (!boardEl) return;

    const opp = CHESS_OPPONENTS[this.opponentId];
    const nameEl = document.getElementById('chess-opp-name');
    const eloEl = document.getElementById('chess-opp-elo');
    const styleEl = document.getElementById('chess-opp-style');
    const statusEl = document.getElementById('chess-status-bar');

    if (nameEl) { nameEl.textContent = opp.name; nameEl.style.color = opp.accent; }
    if (eloEl) eloEl.textContent = `SKILL: ${opp.elo}`;
    if (styleEl) styleEl.textContent = opp.style;
    if (statusEl) statusEl.textContent = this.statusText;

    document.querySelectorAll('[data-chess-opp]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-chess-opp') === this.opponentId);
    });

    boardEl.innerHTML = '';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = document.createElement('button');
        const isLight = (r + c) % 2 === 0;
        const isSel = this.selected && this.selected.r === r && this.selected.c === c;
        const isLegal = this.legalMoves.some(m => m.tr === r && m.tc === c);
        const isLast = this.lastMove && ((this.lastMove.fr === r && this.lastMove.fc === c) || (this.lastMove.tr === r && this.lastMove.tc === c));

        sq.className = 'chess-sq ' + (isLight ? 'light' : 'dark') +
          (isSel ? ' selected' : '') +
          (isLegal ? ' legal' : '') +
          (isLast ? ' last-move' : '');

        const p = this.board[r][c];
        if (p) {
          const span = document.createElement('span');
          span.className = 'chess-piece ' + (p[0] === 'w' ? 'white-p' : 'black-p');
          span.textContent = PIECE_GLYPHS[p] || p;
          sq.appendChild(span);
        }
        sq.addEventListener('click', () => this.handleSquareClick(r, c));
        boardEl.appendChild(sq);
      }
    }

    const capWEl = document.getElementById('chess-captured-w');
    const capBEl = document.getElementById('chess-captured-b');
    if (capWEl) capWEl.textContent = this.capturedB.map(p => PIECE_GLYPHS[p]).join(' ') || '—';
    if (capBEl) capBEl.textContent = this.capturedW.map(p => PIECE_GLYPHS[p]).join(' ') || '—';
  }
}
