import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

const PacManGame = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const audioContextRef = useRef(null);

  // Play intro music
  const playIntroMusic = () => {
    if (!musicEnabled) return;
    
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const now = ctx.currentTime;

      // Classic Pac-Man intro melody (simplified)
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
    setTimeout(() => {
      setGameStarted(true);
    }, 3200);
  };

  // Focus container when game starts for keyboard input
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

    // --- Configuration ---
    const TILE_SIZE = 20; // Smaller tiles for better control
    const COLS = 28;
    const SPEED = 2; // Must evenly divide TILE_SIZE

    // 1 = Wall, 0 = Dot, 2 = Power Pellet, 3 = Empty, 4 = Ghost House
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
    
    const ACTIVE_ROWS = mapLayout.length;
    canvas.width = COLS * TILE_SIZE;
    canvas.height = ACTIVE_ROWS * TILE_SIZE;

    // --- Game State ---
    let pacman = {
        x: 14 * TILE_SIZE + TILE_SIZE / 2,
        y: 23 * TILE_SIZE + TILE_SIZE / 2, 
        dir: { x: 0, y: 0 },
        nextDir: { x: 0, y: 0 },
        radius: TILE_SIZE * 0.4,
        mouth: 0.2,
        mouthOp: 1
    };

    const ghosts = [
        { x: 13.5 * TILE_SIZE + TILE_SIZE / 2, y: 11 * TILE_SIZE + TILE_SIZE / 2, color: 'red', dir: { x: 1, y: 0 }, speed: SPEED * 0.8 },
        { x: 13.5 * TILE_SIZE + TILE_SIZE / 2, y: 13 * TILE_SIZE + TILE_SIZE / 2, color: 'pink', dir: { x: 0, y: -1 }, speed: SPEED * 0.7 },
        { x: 12.5 * TILE_SIZE + TILE_SIZE / 2, y: 13 * TILE_SIZE + TILE_SIZE / 2, color: 'cyan', dir: { x: 0, y: -1 }, speed: SPEED * 0.7 },
        { x: 14.5 * TILE_SIZE + TILE_SIZE / 2, y: 13 * TILE_SIZE + TILE_SIZE / 2, color: 'orange', dir: { x: 0, y: -1 }, speed: SPEED * 0.7 }
    ];

    const handleKeyDown = (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
        }
        if (e.key === 'ArrowUp') pacman.nextDir = { x: 0, y: -1 };
        if (e.key === 'ArrowDown') pacman.nextDir = { x: 0, y: 1 };
        if (e.key === 'ArrowLeft') pacman.nextDir = { x: -1, y: 0 };
        if (e.key === 'ArrowRight') pacman.nextDir = { x: 1, y: 0 };
    };

    // Use container for keyboard events
    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
    }

    const isSolid = (c, r) => {
        if (r < 0 || r >= ACTIVE_ROWS) return true;
        if (c < 0 || c >= COLS) return false; // Tunnel wrapping
        const tile = mapLayout[r][c];
        return tile === 1;
    };

    const getGridPos = (pixelX, pixelY) => {
        return {
            x: Math.floor(pixelX / TILE_SIZE),
            y: Math.floor(pixelY / TILE_SIZE)
        };
    };

    const getCenterOfTile = (gridX, gridY) => {
        return {
            x: gridX * TILE_SIZE + TILE_SIZE / 2,
            y: gridY * TILE_SIZE + TILE_SIZE / 2
        };
    };

    const canMove = (gridX, gridY, dirX, dirY) => {
        return !isSolid(gridX + dirX, gridY + dirY);
    };

    const moveCharacter = (char) => {
        const grid = getGridPos(char.x, char.y);
        const center = getCenterOfTile(grid.x, grid.y);
        
        const distToCenter = Math.abs(char.x - center.x) + Math.abs(char.y - center.y);
        const atCenter = distToCenter < (char.speed || SPEED);

        if (char === pacman) {
            if (atCenter) {
                // Snap to center
                char.x = center.x;
                char.y = center.y;
                
                // Try new direction first
                if (char.nextDir.x !== 0 || char.nextDir.y !== 0) {
                    if (canMove(grid.x, grid.y, char.nextDir.x, char.nextDir.y)) {
                        char.dir = { ...char.nextDir };
                        char.nextDir = { x: 0, y: 0 };
                    }
                }
                
                // Check if current direction is blocked
                if (!canMove(grid.x, grid.y, char.dir.x, char.dir.y)) {
                    char.dir = { x: 0, y: 0 };
                }
            }
        } else {
            // Ghost AI
            if (atCenter) {
                char.x = center.x;
                char.y = center.y;
                
                const reverseDir = { x: -char.dir.x, y: -char.dir.y };
                const possibleDirs = [];
                
                [[0,-1], [0,1], [-1,0], [1,0]].forEach(([dx, dy]) => {
                    if (dx === reverseDir.x && dy === reverseDir.y) return;
                    if (canMove(grid.x, grid.y, dx, dy)) {
                        possibleDirs.push({ x: dx, y: dy });
                    }
                });
                
                if (possibleDirs.length > 0) {
                    const keep = possibleDirs.find(d => d.x === char.dir.x && d.y === char.dir.y);
                    if (!keep || Math.random() < 0.3) {
                        char.dir = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
                    }
                } else {
                    // Dead end, reverse
                    char.dir = reverseDir;
                }
            }
        }

        // Move
        char.x += char.dir.x * (char.speed || SPEED);
        char.y += char.dir.y * (char.speed || SPEED);

        // Tunnel wrap
        if (char.x < 0) char.x = canvas.width;
        if (char.x > canvas.width) char.x = 0;
    };


    const update = () => {
        moveCharacter(pacman);
        
        const pGrid = getGridPos(pacman.x, pacman.y);
        
        if (pGrid.y >= 0 && pGrid.y < ACTIVE_ROWS && pGrid.x >= 0 && pGrid.x < COLS) {
            if (mapLayout[pGrid.y][pGrid.x] === 0 || mapLayout[pGrid.y][pGrid.x] === 2) {
                mapLayout[pGrid.y][pGrid.x] = 3;
            }
        }

        ghosts.forEach(moveCharacter);

        // Draw background
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw map
        for (let r = 0; r < ACTIVE_ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const tile = mapLayout[r][c];
                const x = c * TILE_SIZE;
                const y = r * TILE_SIZE;

                if (tile === 1) {
                    ctx.fillStyle = '#1e3a8a';
                    ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                    ctx.strokeStyle = '#3b82f6';
                    ctx.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                } else if (tile === 0) {
                    ctx.fillStyle = '#fca5a5';
                    ctx.beginPath();
                    ctx.arc(x + TILE_SIZE/2, y + TILE_SIZE/2, 2, 0, Math.PI * 2);
                    ctx.fill();
                } else if (tile === 2) {
                    ctx.fillStyle = '#fca5a5';
                    ctx.beginPath();
                    ctx.arc(x + TILE_SIZE/2, y + TILE_SIZE/2, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // Draw Mr. Pac-Man (no bow, masculine)
        ctx.save();
        ctx.translate(pacman.x, pacman.y);
        let angle = 0;
        if (pacman.dir.x === 1) angle = 0;
        if (pacman.dir.x === -1) angle = Math.PI;
        if (pacman.dir.y === 1) angle = Math.PI / 2;
        if (pacman.dir.y === -1) angle = -Math.PI / 2;
        
        ctx.rotate(angle);
        
        if (pacman.mouth >= 0.25) pacman.mouthOp = -1;
        if (pacman.mouth <= 0.02) pacman.mouthOp = 1;
        pacman.mouth += 0.03 * pacman.mouthOp;

        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(0, 0, pacman.radius, pacman.mouth * Math.PI, (2 - pacman.mouth) * Math.PI);
        ctx.lineTo(0, 0);
        ctx.fill();

        ctx.restore();

        // Draw Ghosts
        ghosts.forEach(g => {
            ctx.fillStyle = g.color;
            ctx.beginPath();
            ctx.arc(g.x, g.y, TILE_SIZE * 0.4, Math.PI, 0);
            ctx.lineTo(g.x + TILE_SIZE * 0.4, g.y + TILE_SIZE * 0.35);
            ctx.lineTo(g.x - TILE_SIZE * 0.4, g.y + TILE_SIZE * 0.35);
            ctx.fill();
            
            // Eyes
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(g.x - 3, g.y - 2, 3, 0, Math.PI * 2);
            ctx.arc(g.x + 3, g.y - 2, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Pupils
            ctx.fillStyle = 'blue';
            ctx.beginPath();
            ctx.arc(g.x - 3 + g.dir.x * 1.5, g.y - 2 + g.dir.y * 1.5, 1.5, 0, Math.PI * 2);
            ctx.arc(g.x + 3 + g.dir.x * 1.5, g.y - 2 + g.dir.y * 1.5, 1.5, 0, Math.PI * 2);
            ctx.fill();
        });

        animationFrameId = requestAnimationFrame(update);
    };

    update();

    return () => {
        if (container) {
          container.removeEventListener('keydown', handleKeyDown);
        }
        cancelAnimationFrame(animationFrameId);
    };
  }, [gameStarted]);

  // Ghost component for intro screen
  const GhostPreview = ({ color, name }) => (
    <div className="text-center">
      <svg width="40" height="44" viewBox="0 0 40 44" className="mx-auto mb-2">
        {/* Body */}
        <path d={`M5 22 Q5 5, 20 5 Q35 5, 35 22 L35 40 L30 35 L25 40 L20 35 L15 40 L10 35 L5 40 Z`} fill={color} />
        {/* Eyes */}
        <circle cx="14" cy="18" r="5" fill="white" />
        <circle cx="26" cy="18" r="5" fill="white" />
        {/* Pupils */}
        <circle cx="15" cy="19" r="2.5" fill="blue" />
        <circle cx="27" cy="19" r="2.5" fill="blue" />
        {/* Mouth (subtle line) */}
        <path d="M12 28 Q20 32, 28 28" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" fill="none" />
      </svg>
      <span className="text-sm" style={{ color }}>{name}</span>
    </div>
  );

  // Intro Screen
  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center mb-6 w-full">
        <div className="relative rounded-xl overflow-hidden shadow-2xl border-4 border-slate-700 bg-black p-8"
             style={{ width: '840px', height: '520px' }}>
          
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-yellow-400 mb-2"
                style={{ fontFamily: 'monospace', textShadow: '3px 3px 0 #0369a1' }}>
              MR. PAC-MAN
            </h1>
            <p className="text-blue-400 text-lg">© DR. JIRA DICTATE</p>
          </div>

          {/* Character Preview */}
          <div className="flex justify-center items-center space-x-10 mb-10">
            {/* Mr. Pac-Man */}
            <div className="text-center">
              <div className="w-14 h-14 bg-yellow-400 rounded-full mx-auto mb-2 relative overflow-hidden">
                {/* Mouth cutout */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[14px] border-b-[14px] border-l-[20px] border-t-transparent border-b-transparent border-l-black"></div>
              </div>
              <span className="text-yellow-400 text-sm font-bold">MR. PAC-MAN</span>
            </div>
            
            {/* Ghosts with faces */}
            <GhostPreview color="#ef4444" name="BLINKY" />
            <GhostPreview color="#f472b6" name="PINKY" />
            <GhostPreview color="#22d3d3" name="INKY" />
            <GhostPreview color="#fb923c" name="CLYDE" />
          </div>

          {/* Start Button */}
          <div className="text-center">
            <button
              onClick={handleStartGame}
              className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold text-xl rounded-lg hover:from-yellow-300 hover:to-yellow-400 transition-all transform hover:scale-105 shadow-lg"
            >
              🎮 START GAME
            </button>
          </div>

          {/* Music Toggle */}
          <div className="absolute bottom-4 right-4">
            <button
              onClick={() => setMusicEnabled(!musicEnabled)}
              className={`p-2 rounded-full transition-colors ${musicEnabled ? 'bg-green-600 hover:bg-green-500' : 'bg-slate-600 hover:bg-slate-500'}`}
              title={musicEnabled ? 'Music On' : 'Music Off'}
            >
              {musicEnabled ? (
                <Volume2 className="w-5 h-5 text-white" />
              ) : (
                <VolumeX className="w-5 h-5 text-white" />
              )}
            </button>
          </div>

          {/* Instructions */}
          <div className="absolute bottom-4 left-4 text-slate-500 text-xs">
            Use Arrow Keys to Move
          </div>
        </div>
      </div>
    );
  }

  // Game Screen
  return (
    <div 
      ref={containerRef}
      tabIndex={0}
      className="flex flex-col items-center justify-center mb-6 w-full outline-none"
    >
      <div className="relative rounded-xl overflow-hidden shadow-2xl border-4 border-slate-700 bg-black">
        <canvas 
            ref={canvasRef} 
            className="block"
        />
        <div className="absolute top-2 left-2 text-white/50 font-bold text-xs pointer-events-none">1UP 00</div>
        <div className="absolute top-2 right-2 text-white/50 font-bold text-xs pointer-events-none">HIGH SCORE</div>
      </div>
      <div className="text-slate-400 text-xs mt-2 font-mono">
        Arrow Keys to Move (click game area first)
      </div>
    </div>
  );
};

export default PacManGame;
