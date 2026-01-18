import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

const PacManGame = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const audioContextRef = useRef(null);

  const playIntroMusic = () => {
    if (!musicEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const now = ctx.currentTime;
      const melody = [
        { freq: 523.25, start: 0, duration: 0.15 },
        { freq: 659.25, start: 0.15, duration: 0.15 },
        { freq: 783.99, start: 0.3, duration: 0.15 },
        { freq: 1046.50, start: 0.45, duration: 0.3 },
        { freq: 783.99, start: 0.8, duration: 0.15 },
        { freq: 659.25, start: 0.95, duration: 0.15 },
        { freq: 523.25, start: 1.1, duration: 0.15 },
        { freq: 392.00, start: 1.3, duration: 0.15 },
        { freq: 440.00, start: 1.45, duration: 0.15 },
        { freq: 493.88, start: 1.6, duration: 0.15 },
        { freq: 523.25, start: 1.75, duration: 0.4 },
        { freq: 659.25, start: 2.2, duration: 0.15 },
        { freq: 783.99, start: 2.35, duration: 0.15 },
        { freq: 1046.50, start: 2.5, duration: 0.5 },
      ];
      melody.forEach(note => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = note.freq;
        osc.type = 'square';
        osc.connect(gain);
        gain.connect(ctx.destination);
        const startTime = now + note.start;
        osc.start(startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.08, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.duration);
        osc.stop(startTime + note.duration);
      });
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  const handleStartGame = () => {
    playIntroMusic();
    setTimeout(() => setGameStarted(true), 3200);
  };

  useEffect(() => {
    if (gameStarted && containerRef.current) {
      containerRef.current.focus();
    }
  }, [gameStarted]);

  useEffect(() => {
    if (!gameStarted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // ============================================
    // CONFIGURATION
    // ============================================
    const TILE_SIZE = 16;
    const COLS = 28;
    const MOVE_FRAMES = 8;

    // Map: 1=Wall, 0=Dot, 2=PowerPellet, 3=Empty, 4=GhostHouse
    const mapLayout = [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 0
      [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1], // 1
      [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1], // 2
      [1,2,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,2,1], // 3
      [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1], // 4
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 5
      [1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1], // 6
      [1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1], // 7
      [1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1], // 8
      [1,1,1,1,1,1,0,1,1,1,1,1,3,1,1,3,1,1,1,1,1,0,1,1,1,1,1,1], // 9
      [3,3,3,3,3,1,0,1,1,1,1,1,3,1,1,3,1,1,1,1,1,0,1,3,3,3,3,3], // 10
      [3,3,3,3,3,1,0,1,1,3,3,3,3,3,3,3,3,3,3,1,1,0,1,3,3,3,3,3], // 11
      [1,1,1,1,1,1,0,1,1,3,1,1,4,4,4,4,1,1,3,1,1,0,1,1,1,1,1,1], // 12
      [3,3,3,3,3,3,0,3,3,3,1,4,4,4,4,4,4,1,3,3,3,0,3,3,3,3,3,3], // 13 (tunnel row)
      [1,1,1,1,1,1,0,1,1,3,1,1,1,1,1,1,1,1,3,1,1,0,1,1,1,1,1,1], // 14
      [3,3,3,3,3,1,0,1,1,3,3,3,3,3,3,3,3,3,3,1,1,0,1,3,3,3,3,3], // 15
      [3,3,3,3,3,1,0,1,1,3,1,1,1,1,1,1,1,1,3,1,1,0,1,3,3,3,3,3], // 16
      [1,1,1,1,1,1,0,1,1,3,1,1,1,1,1,1,1,1,3,1,1,0,1,1,1,1,1,1], // 17
      [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1], // 18
      [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1], // 19
      [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1], // 20
      [1,2,0,0,1,1,0,0,0,0,0,0,0,3,3,0,0,0,0,0,0,0,1,1,0,0,2,1], // 21 (pac-man spawn row)
      [1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1], // 22
      [1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1], // 23
      [1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1], // 24
      [1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1], // 25
      [1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1], // 26
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 27
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]  // 28
    ];

    const ROWS = mapLayout.length;
    canvas.width = COLS * TILE_SIZE;
    canvas.height = ROWS * TILE_SIZE;

    // ============================================
    // TILE VALIDATION FUNCTIONS
    // ============================================

    const isWall = (tx, ty) => {
      if (ty < 0 || ty >= ROWS) return true;
      if (tx < 0 || tx >= COLS) return false; // Tunnel
      return mapLayout[ty][tx] === 1;
    };

    const canEnter = (tx, ty) => !isWall(tx, ty);

    // Find nearest valid tile using BFS (for spawn recovery)
    const findNearestValidTile = (startX, startY) => {
      if (canEnter(startX, startY)) return { x: startX, y: startY };
      
      const visited = new Set();
      const queue = [[startX, startY, 0]];
      
      while (queue.length > 0) {
        const [x, y, dist] = queue.shift();
        const key = `${x},${y}`;
        
        if (visited.has(key)) continue;
        visited.add(key);
        
        if (canEnter(x, y)) return { x, y };
        
        // Check neighbors
        [[0,-1], [0,1], [-1,0], [1,0]].forEach(([dx, dy]) => {
          const nx = x + dx;
          const ny = y + dy;
          if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS) {
            queue.push([nx, ny, dist + 1]);
          }
        });
      }
      
      // Fallback: return center of map (should never happen)
      return { x: 14, y: 14 };
    };

    // Validate and correct spawn position
    const getValidSpawn = (preferredX, preferredY) => {
      if (canEnter(preferredX, preferredY)) {
        return { x: preferredX, y: preferredY };
      }
      console.warn(`Spawn (${preferredX}, ${preferredY}) is inside wall! Finding valid position...`);
      return findNearestValidTile(preferredX, preferredY);
    };

    // ============================================
    // GAME STATE WITH VALIDATED SPAWN
    // Pac-Man spawns at row 21 (the open corridor below the maze)
    // ============================================

    const pacmanSpawn = getValidSpawn(14, 21); // Row 21 has 3,3 at positions 13-14
    
    const pacman = {
      tileX: pacmanSpawn.x,
      tileY: pacmanSpawn.y,
      dx: 0,
      dy: 0,
      nextDx: 0,
      nextDy: 0,
      progress: 0,
      moveFrames: MOVE_FRAMES,
      mouth: 0.2,
      mouthDir: 1
    };

    // Ghosts spawn in/near ghost house (validated)
    const ghostSpawns = [
      getValidSpawn(14, 11),
      getValidSpawn(13, 13),
      getValidSpawn(14, 13),
      getValidSpawn(15, 13)
    ];

    const ghosts = [
      { tileX: ghostSpawns[0].x, tileY: ghostSpawns[0].y, dx: 1, dy: 0, progress: 0, moveFrames: Math.floor(MOVE_FRAMES * 1.2), color: '#ef4444' },
      { tileX: ghostSpawns[1].x, tileY: ghostSpawns[1].y, dx: 0, dy: -1, progress: 0, moveFrames: Math.floor(MOVE_FRAMES * 1.3), color: '#f472b6' },
      { tileX: ghostSpawns[2].x, tileY: ghostSpawns[2].y, dx: 0, dy: -1, progress: 0, moveFrames: Math.floor(MOVE_FRAMES * 1.3), color: '#22d3d3' },
      { tileX: ghostSpawns[3].x, tileY: ghostSpawns[3].y, dx: 0, dy: 1, progress: 0, moveFrames: Math.floor(MOVE_FRAMES * 1.3), color: '#fb923c' }
    ];

    // Input handling
    const handleKeyDown = (e) => {
      e.preventDefault();
      switch(e.key) {
        case 'ArrowUp':    pacman.nextDx = 0;  pacman.nextDy = -1; break;
        case 'ArrowDown':  pacman.nextDx = 0;  pacman.nextDy = 1;  break;
        case 'ArrowLeft':  pacman.nextDx = -1; pacman.nextDy = 0;  break;
        case 'ArrowRight': pacman.nextDx = 1;  pacman.nextDy = 0;  break;
        default: break;
      }
    };

    const container = containerRef.current;
    if (container) container.addEventListener('keydown', handleKeyDown);

    // ============================================
    // MOVEMENT LOGIC WITH WALL RECOVERY
    // ============================================

    const updatePacman = () => {
      // SAFETY CHECK: If somehow inside a wall, eject immediately
      if (isWall(pacman.tileX, pacman.tileY)) {
        console.error(`Pac-Man stuck in wall at (${pacman.tileX}, ${pacman.tileY})! Ejecting...`);
        const safePos = findNearestValidTile(pacman.tileX, pacman.tileY);
        pacman.tileX = safePos.x;
        pacman.tileY = safePos.y;
        pacman.dx = 0;
        pacman.dy = 0;
        pacman.progress = 0;
        return;
      }

      if (pacman.progress > 0) {
        pacman.progress--;
        return;
      }

      // AT TILE CENTER - make discrete decision
      if (pacman.nextDx !== 0 || pacman.nextDy !== 0) {
        const nextTileX = pacman.tileX + pacman.nextDx;
        const nextTileY = pacman.tileY + pacman.nextDy;
        if (canEnter(nextTileX, nextTileY)) {
          pacman.dx = pacman.nextDx;
          pacman.dy = pacman.nextDy;
          pacman.nextDx = 0;
          pacman.nextDy = 0;
        }
      }

      if (pacman.dx !== 0 || pacman.dy !== 0) {
        const nextTileX = pacman.tileX + pacman.dx;
        const nextTileY = pacman.tileY + pacman.dy;
        if (canEnter(nextTileX, nextTileY)) {
          pacman.tileX = nextTileX;
          pacman.tileY = nextTileY;
          pacman.progress = pacman.moveFrames;

          // Tunnel wrap
          if (pacman.tileX < 0) pacman.tileX = COLS - 1;
          if (pacman.tileX >= COLS) pacman.tileX = 0;
        } else {
          pacman.dx = 0;
          pacman.dy = 0;
        }
      }
    };

    const updateGhost = (ghost) => {
      // SAFETY CHECK: Eject from walls
      if (isWall(ghost.tileX, ghost.tileY)) {
        const safePos = findNearestValidTile(ghost.tileX, ghost.tileY);
        ghost.tileX = safePos.x;
        ghost.tileY = safePos.y;
        ghost.dx = 0;
        ghost.dy = 0;
        ghost.progress = 0;
        return;
      }

      if (ghost.progress > 0) {
        ghost.progress--;
        return;
      }

      const reverse = { dx: -ghost.dx, dy: -ghost.dy };
      const options = [];

      [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([dx, dy]) => {
        if (dx === reverse.dx && dy === reverse.dy) return;
        if (canEnter(ghost.tileX + dx, ghost.tileY + dy)) {
          options.push({ dx, dy });
        }
      });

      if (options.length > 0) {
        const straight = options.find(o => o.dx === ghost.dx && o.dy === ghost.dy);
        if (straight && Math.random() > 0.3) {
          // Continue straight
        } else {
          const choice = options[Math.floor(Math.random() * options.length)];
          ghost.dx = choice.dx;
          ghost.dy = choice.dy;
        }
      } else {
        ghost.dx = reverse.dx;
        ghost.dy = reverse.dy;
      }

      const nextX = ghost.tileX + ghost.dx;
      const nextY = ghost.tileY + ghost.dy;
      if (canEnter(nextX, nextY)) {
        ghost.tileX = nextX;
        ghost.tileY = nextY;
        ghost.progress = ghost.moveFrames;

        if (ghost.tileX < 0) ghost.tileX = COLS - 1;
        if (ghost.tileX >= COLS) ghost.tileX = 0;
      }
    };

    // ============================================
    // RENDERING
    // ============================================

    const getRenderPos = (char) => {
      const t = 1 - (char.progress / char.moveFrames);
      const prevTileX = char.tileX - char.dx;
      const prevTileY = char.tileY - char.dy;

      const fromX = prevTileX * TILE_SIZE + TILE_SIZE / 2;
      const fromY = prevTileY * TILE_SIZE + TILE_SIZE / 2;
      const toX = char.tileX * TILE_SIZE + TILE_SIZE / 2;
      const toY = char.tileY * TILE_SIZE + TILE_SIZE / 2;

      let x = fromX + (toX - fromX) * t;
      let y = fromY + (toY - fromY) * t;

      if (Math.abs(toX - fromX) > TILE_SIZE * 2) {
        x = toX;
      }

      return { x, y };
    };

    // ============================================
    // GAME LOOP
    // ============================================

    const update = () => {
      updatePacman();
      ghosts.forEach(updateGhost);

      // Eat dots
      const tile = mapLayout[pacman.tileY]?.[pacman.tileX];
      if (tile === 0 || tile === 2) {
        mapLayout[pacman.tileY][pacman.tileX] = 3;
      }

      // Draw
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const t = mapLayout[r][c];
          const x = c * TILE_SIZE;
          const y = r * TILE_SIZE;

          if (t === 1) {
            ctx.fillStyle = '#1e3a8a';
            ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
          } else if (t === 0) {
            ctx.fillStyle = '#fca5a5';
            ctx.beginPath();
            ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 2, 0, Math.PI * 2);
            ctx.fill();
          } else if (t === 2) {
            ctx.fillStyle = '#fca5a5';
            ctx.beginPath();
            ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Draw Pac-Man
      const pacPos = getRenderPos(pacman);
      ctx.save();
      ctx.translate(pacPos.x, pacPos.y);

      let angle = 0;
      if (pacman.dx === 1) angle = 0;
      else if (pacman.dx === -1) angle = Math.PI;
      else if (pacman.dy === 1) angle = Math.PI / 2;
      else if (pacman.dy === -1) angle = -Math.PI / 2;
      ctx.rotate(angle);

      pacman.mouth += 0.05 * pacman.mouthDir;
      if (pacman.mouth >= 0.35) pacman.mouthDir = -1;
      if (pacman.mouth <= 0.05) pacman.mouthDir = 1;

      ctx.fillStyle = 'yellow';
      ctx.beginPath();
      ctx.arc(0, 0, TILE_SIZE * 0.4, pacman.mouth * Math.PI, (2 - pacman.mouth) * Math.PI);
      ctx.lineTo(0, 0);
      ctx.fill();
      ctx.restore();

      // Draw Ghosts
      ghosts.forEach(g => {
        const pos = getRenderPos(g);
        const size = TILE_SIZE * 0.4;

        ctx.fillStyle = g.color;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size, Math.PI, 0);
        ctx.lineTo(pos.x + size, pos.y + size * 0.8);
        ctx.lineTo(pos.x - size, pos.y + size * 0.8);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(pos.x - 3, pos.y - 1, 2.5, 0, Math.PI * 2);
        ctx.arc(pos.x + 3, pos.y - 1, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1e3a8a';
        ctx.beginPath();
        ctx.arc(pos.x - 3 + g.dx * 1, pos.y - 1 + g.dy * 1, 1.2, 0, Math.PI * 2);
        ctx.arc(pos.x + 3 + g.dx * 1, pos.y - 1 + g.dy * 1, 1.2, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(update);
    };

    update();

    return () => {
      if (container) container.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameStarted]);

  // Ghost preview for intro
  const GhostPreview = ({ color, name }) => (
    <div className="text-center">
      <svg width="40" height="44" viewBox="0 0 40 44" className="mx-auto mb-2">
        <path d="M5 22 Q5 5, 20 5 Q35 5, 35 22 L35 40 L30 35 L25 40 L20 35 L15 40 L10 35 L5 40 Z" fill={color} />
        <circle cx="14" cy="18" r="5" fill="white" />
        <circle cx="26" cy="18" r="5" fill="white" />
        <circle cx="15" cy="19" r="2.5" fill="#1e3a8a" />
        <circle cx="27" cy="19" r="2.5" fill="#1e3a8a" />
      </svg>
      <span className="text-sm" style={{ color }}>{name}</span>
    </div>
  );

  // Intro Screen
  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center mb-6 w-full">
        <div className="relative rounded-xl overflow-hidden shadow-2xl border-4 border-slate-700 bg-black p-8"
             style={{ width: '600px', height: '480px' }}>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-yellow-400 mb-2"
                style={{ fontFamily: 'monospace', textShadow: '3px 3px 0 #0369a1' }}>
              DR. JIRA PAC-MAN
            </h1>
            <p className="text-blue-400 text-lg">© DR. JIRA DICTATE</p>
          </div>

          <div className="flex justify-center items-center space-x-8 mb-10">
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-400 rounded-full mx-auto mb-2 relative overflow-hidden">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[12px] border-b-[12px] border-l-[16px] border-t-transparent border-b-transparent border-l-black"></div>
              </div>
              <span className="text-yellow-400 text-sm font-bold">DR. JIRA</span>
            </div>
            <GhostPreview color="#ef4444" name="NADIA" />
            <GhostPreview color="#f472b6" name="MARWA" />
            <GhostPreview color="#22d3d3" name="AMARA" />
            <GhostPreview color="#fb923c" name="REYHAN" />
          </div>

          <div className="text-center">
            <button
              onClick={handleStartGame}
              className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold text-xl rounded-lg hover:from-yellow-300 hover:to-yellow-400 transition-all transform hover:scale-105 shadow-lg"
            >
              🎮 START GAME
            </button>
          </div>

          <div className="absolute bottom-4 right-4">
            <button
              onClick={() => setMusicEnabled(!musicEnabled)}
              className={`p-2 rounded-full transition-colors ${musicEnabled ? 'bg-green-600 hover:bg-green-500' : 'bg-slate-600 hover:bg-slate-500'}`}
            >
              {musicEnabled ? <Volume2 className="w-5 h-5 text-white" /> : <VolumeX className="w-5 h-5 text-white" />}
            </button>
          </div>

          <div className="absolute bottom-4 left-4 text-slate-500 text-xs">
            Arrow Keys to Move
          </div>
        </div>
      </div>
    );
  }

  // Game Screen
  return (
    <div ref={containerRef} tabIndex={0} className="flex flex-col items-center justify-center mb-6 w-full outline-none">
      <div className="relative rounded-xl overflow-hidden shadow-2xl border-4 border-slate-700 bg-black">
        <canvas ref={canvasRef} className="block" />
        <div className="absolute top-2 left-2 text-white/50 font-bold text-xs pointer-events-none">1UP 00</div>
        <div className="absolute top-2 right-2 text-white/50 font-bold text-xs pointer-events-none">HIGH SCORE</div>
      </div>
      <div className="text-slate-400 text-xs mt-2 font-mono">
        Click here, then use Arrow Keys
      </div>
    </div>
  );
};

export default PacManGame;
