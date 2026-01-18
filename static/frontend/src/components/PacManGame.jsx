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
    // CONFIGURATION - Classic Pac-Man Style
    // ============================================
    const TILE_SIZE = 16;  // Pixels per tile (must be divisible by SPEED)
    const SPEED = 2;       // Pixels per frame (TILE_SIZE % SPEED must === 0)
    const COLS = 28;

    // Map: 1=Wall, 0=Dot, 2=PowerPellet, 3=Empty, 4=GhostHouse
    const mapLayout = [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
      [1,2,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,2,1],
      [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
      [1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
      [1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,0,1,1,1,1,1,3,1,1,3,1,1,1,1,1,0,1,1,1,1,1,1],
      [3,3,3,3,3,1,0,1,1,1,1,1,3,1,1,3,1,1,1,1,1,0,1,3,3,3,3,3],
      [3,3,3,3,3,1,0,1,1,3,3,3,3,3,3,3,3,3,3,1,1,0,1,3,3,3,3,3],
      [1,1,1,1,1,1,0,1,1,3,1,1,4,4,4,4,1,1,3,1,1,0,1,1,1,1,1,1],
      [3,3,3,3,3,3,0,3,3,3,1,4,4,4,4,4,4,1,3,3,3,0,3,3,3,3,3,3],
      [1,1,1,1,1,1,0,1,1,3,1,1,1,1,1,1,1,1,3,1,1,0,1,1,1,1,1,1],
      [3,3,3,3,3,1,0,1,1,3,3,3,3,3,3,3,3,3,3,1,1,0,1,3,3,3,3,3],
      [3,3,3,3,3,1,0,1,1,3,1,1,1,1,1,1,1,1,3,1,1,0,1,3,3,3,3,3],
      [1,1,1,1,1,1,0,1,1,3,1,1,1,1,1,1,1,1,3,1,1,0,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
      [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
      [1,2,0,0,1,1,0,0,0,0,0,0,0,3,3,0,0,0,0,0,0,0,1,1,0,0,2,1],
      [1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
      [1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
      [1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
      [1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
      [1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];

    const ROWS = mapLayout.length;
    canvas.width = COLS * TILE_SIZE;
    canvas.height = ROWS * TILE_SIZE;

    // ============================================
    // HELPER FUNCTIONS
    // ============================================
    
    // Check if a tile is a wall
    const isWall = (tileX, tileY) => {
      // Handle tunnel (out of bounds horizontally is NOT a wall)
      if (tileY < 0 || tileY >= ROWS) return true;
      if (tileX < 0 || tileX >= COLS) return false;
      return mapLayout[tileY][tileX] === 1;
    };

    // Convert pixel position to tile position
    // Uses Math.round for center-based calculation
    const pixelToTile = (px, py) => ({
      x: Math.floor(px / TILE_SIZE),
      y: Math.floor(py / TILE_SIZE)
    });

    // Get pixel center of a tile
    const tileCenterPx = (tx, ty) => ({
      x: tx * TILE_SIZE + TILE_SIZE / 2,
      y: ty * TILE_SIZE + TILE_SIZE / 2
    });

    // Check if character is exactly at tile center
    const isAtTileCenter = (char) => {
      const tile = pixelToTile(char.px, char.py);
      const center = tileCenterPx(tile.x, tile.y);
      return char.px === center.x && char.py === center.y;
    };

    // Snap character to nearest tile center
    const snapToTileCenter = (char) => {
      const tile = pixelToTile(char.px, char.py);
      const center = tileCenterPx(tile.x, tile.y);
      char.px = center.x;
      char.py = center.y;
    };

    // Check if can move in direction from current tile
    const canMoveInDir = (tileX, tileY, dx, dy) => {
      return !isWall(tileX + dx, tileY + dy);
    };

    // ============================================
    // GAME STATE - Grid-locked positions
    // ============================================
    
    // Characters store their position as PIXEL coordinates
    // but are always aligned to tile centers
    const pacman = {
      px: 14 * TILE_SIZE + TILE_SIZE / 2,  // Pixel X (centered on tile 14)
      py: 23 * TILE_SIZE + TILE_SIZE / 2,  // Pixel Y (centered on tile 23)
      dx: 0,   // Current direction X (-1, 0, 1)
      dy: 0,   // Current direction Y (-1, 0, 1)
      nextDx: 0,  // Buffered next direction
      nextDy: 0,
      speed: SPEED,
      mouth: 0.2,
      mouthDir: 1
    };

    const ghosts = [
      { px: 14 * TILE_SIZE + TILE_SIZE / 2, py: 11 * TILE_SIZE + TILE_SIZE / 2, dx: 1, dy: 0, speed: SPEED * 0.85, color: '#ef4444' },
      { px: 13 * TILE_SIZE + TILE_SIZE / 2, py: 13 * TILE_SIZE + TILE_SIZE / 2, dx: 0, dy: -1, speed: SPEED * 0.8, color: '#f472b6' },
      { px: 14 * TILE_SIZE + TILE_SIZE / 2, py: 13 * TILE_SIZE + TILE_SIZE / 2, dx: 0, dy: -1, speed: SPEED * 0.8, color: '#22d3d3' },
      { px: 15 * TILE_SIZE + TILE_SIZE / 2, py: 13 * TILE_SIZE + TILE_SIZE / 2, dx: 0, dy: 1, speed: SPEED * 0.8, color: '#fb923c' }
    ];

    // ============================================
    // INPUT HANDLING
    // ============================================
    const handleKeyDown = (e) => {
      e.preventDefault();
      switch(e.key) {
        case 'ArrowUp':    pacman.nextDx = 0;  pacman.nextDy = -1; break;
        case 'ArrowDown':  pacman.nextDx = 0;  pacman.nextDy = 1;  break;
        case 'ArrowLeft':  pacman.nextDx = -1; pacman.nextDy = 0;  break;
        case 'ArrowRight': pacman.nextDx = 1;  pacman.nextDy = 0;  break;
      }
    };

    const container = containerRef.current;
    if (container) container.addEventListener('keydown', handleKeyDown);

    // ============================================
    // MOVEMENT LOGIC - The Core Fix
    // ============================================
    
    const moveCharacter = (char, isPacman = false) => {
      const currentTile = pixelToTile(char.px, char.py);
      const center = tileCenterPx(currentTile.x, currentTile.y);
      
      // Calculate distance to tile center
      const distX = char.px - center.x;
      const distY = char.py - center.y;
      
      // Are we at (or will overshoot) the tile center this frame?
      const movingTowardsCenterX = (char.dx > 0 && distX < 0) || (char.dx < 0 && distX > 0);
      const movingTowardsCenterY = (char.dy > 0 && distY < 0) || (char.dy < 0 && distY > 0);
      const willCrossCenter = 
        (movingTowardsCenterX && Math.abs(distX) <= char.speed) ||
        (movingTowardsCenterY && Math.abs(distY) <= char.speed) ||
        (distX === 0 && distY === 0);

      if (willCrossCenter || (distX === 0 && distY === 0)) {
        // SNAP to center first - this is critical
        char.px = center.x;
        char.py = center.y;

        if (isPacman) {
          // Try buffered direction first
          if (char.nextDx !== 0 || char.nextDy !== 0) {
            if (canMoveInDir(currentTile.x, currentTile.y, char.nextDx, char.nextDy)) {
              char.dx = char.nextDx;
              char.dy = char.nextDy;
              char.nextDx = 0;
              char.nextDy = 0;
            }
          }
          
          // Check if current direction is blocked
          if (!canMoveInDir(currentTile.x, currentTile.y, char.dx, char.dy)) {
            char.dx = 0;
            char.dy = 0;
          }
        } else {
          // Ghost AI: Choose direction at intersections
          const reverse = { x: -char.dx, y: -char.dy };
          const options = [];
          
          [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([dx, dy]) => {
            // Don't reverse unless no other option
            if (dx === reverse.x && dy === reverse.y) return;
            if (canMoveInDir(currentTile.x, currentTile.y, dx, dy)) {
              options.push({ dx, dy });
            }
          });

          if (options.length > 0) {
            // Prefer current direction, otherwise pick randomly
            const keepGoing = options.find(o => o.dx === char.dx && o.dy === char.dy);
            if (keepGoing && Math.random() > 0.25) {
              // Continue straight
            } else {
              const choice = options[Math.floor(Math.random() * options.length)];
              char.dx = choice.dx;
              char.dy = choice.dy;
            }
          } else {
            // Dead end - must reverse
            char.dx = reverse.x;
            char.dy = reverse.y;
          }
        }
      }

      // MOVE - only if direction is set and path is clear
      if (char.dx !== 0 || char.dy !== 0) {
        const nextTile = pixelToTile(
          char.px + char.dx * char.speed,
          char.py + char.dy * char.speed
        );
        
        // Double-check we're not entering a wall
        if (!isWall(nextTile.x, nextTile.y)) {
          char.px += char.dx * char.speed;
          char.py += char.dy * char.speed;
        } else {
          // Hit a wall - snap to center and stop
          snapToTileCenter(char);
          if (isPacman) {
            char.dx = 0;
            char.dy = 0;
          }
        }
      }

      // Tunnel wrapping
      if (char.px < 0) char.px = canvas.width - TILE_SIZE / 2;
      if (char.px >= canvas.width) char.px = TILE_SIZE / 2;
    };

    // ============================================
    // GAME LOOP
    // ============================================
    const update = () => {
      // Move characters
      moveCharacter(pacman, true);
      ghosts.forEach(g => moveCharacter(g, false));

      // Eat dots
      const pTile = pixelToTile(pacman.px, pacman.py);
      if (pTile.y >= 0 && pTile.y < ROWS && pTile.x >= 0 && pTile.x < COLS) {
        const tile = mapLayout[pTile.y][pTile.x];
        if (tile === 0 || tile === 2) {
          mapLayout[pTile.y][pTile.x] = 3;
        }
      }

      // ========== RENDERING ==========
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw maze
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const tile = mapLayout[r][c];
          const x = c * TILE_SIZE;
          const y = r * TILE_SIZE;

          if (tile === 1) {
            ctx.fillStyle = '#1e3a8a';
            ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
          } else if (tile === 0) {
            ctx.fillStyle = '#fca5a5';
            ctx.beginPath();
            ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 2, 0, Math.PI * 2);
            ctx.fill();
          } else if (tile === 2) {
            ctx.fillStyle = '#fca5a5';
            ctx.beginPath();
            ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Draw Pac-Man
      ctx.save();
      ctx.translate(pacman.px, pacman.py);
      
      let angle = 0;
      if (pacman.dx === 1) angle = 0;
      else if (pacman.dx === -1) angle = Math.PI;
      else if (pacman.dy === 1) angle = Math.PI / 2;
      else if (pacman.dy === -1) angle = -Math.PI / 2;
      ctx.rotate(angle);

      // Mouth animation
      pacman.mouth += 0.04 * pacman.mouthDir;
      if (pacman.mouth >= 0.3) pacman.mouthDir = -1;
      if (pacman.mouth <= 0.05) pacman.mouthDir = 1;

      ctx.fillStyle = 'yellow';
      ctx.beginPath();
      ctx.arc(0, 0, TILE_SIZE * 0.4, pacman.mouth * Math.PI, (2 - pacman.mouth) * Math.PI);
      ctx.lineTo(0, 0);
      ctx.fill();
      ctx.restore();

      // Draw Ghosts
      ghosts.forEach(g => {
        const size = TILE_SIZE * 0.4;
        ctx.fillStyle = g.color;
        ctx.beginPath();
        ctx.arc(g.px, g.py, size, Math.PI, 0);
        ctx.lineTo(g.px + size, g.py + size * 0.8);
        ctx.lineTo(g.px - size, g.py + size * 0.8);
        ctx.closePath();
        ctx.fill();

        // Eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(g.px - 3, g.py - 1, 2.5, 0, Math.PI * 2);
        ctx.arc(g.px + 3, g.py - 1, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Pupils (look in movement direction)
        ctx.fillStyle = '#1e3a8a';
        ctx.beginPath();
        ctx.arc(g.px - 3 + g.dx * 1.2, g.py - 1 + g.dy * 1.2, 1.2, 0, Math.PI * 2);
        ctx.arc(g.px + 3 + g.dx * 1.2, g.py - 1 + g.dy * 1.2, 1.2, 0, Math.PI * 2);
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

  // Ghost preview component for intro
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
              title={musicEnabled ? 'Music On' : 'Music Off'}
            >
              {musicEnabled ? <Volume2 className="w-5 h-5 text-white" /> : <VolumeX className="w-5 h-5 text-white" />}
            </button>
          </div>

          <div className="absolute bottom-4 left-4 text-slate-500 text-xs">
            Use Arrow Keys to Move
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
