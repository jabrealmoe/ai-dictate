import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

const PacManGame = () => {
  const canvasRef = useRef(null);
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
        { freq: 523.25, start: 0, duration: 0.15 },    // C5
        { freq: 659.25, start: 0.15, duration: 0.15 }, // E5
        { freq: 783.99, start: 0.3, duration: 0.15 },  // G5
        { freq: 1046.50, start: 0.45, duration: 0.3 }, // C6
        { freq: 783.99, start: 0.8, duration: 0.15 },  // G5
        { freq: 659.25, start: 0.95, duration: 0.15 }, // E5
        { freq: 523.25, start: 1.1, duration: 0.15 },  // C5
        { freq: 392.00, start: 1.3, duration: 0.15 },  // G4
        { freq: 440.00, start: 1.45, duration: 0.15 }, // A4
        { freq: 493.88, start: 1.6, duration: 0.15 },  // B4
        { freq: 523.25, start: 1.75, duration: 0.4 },  // C5
        { freq: 659.25, start: 2.2, duration: 0.15 },  // E5
        { freq: 783.99, start: 2.35, duration: 0.15 }, // G5
        { freq: 1046.50, start: 2.5, duration: 0.5 },  // C6 (long)
      ];

      melody.forEach(note => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.frequency.value = note.freq;
        osc.type = 'square'; // 8-bit sound
        
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
    // Delay game start slightly so intro music plays
    setTimeout(() => {
      setGameStarted(true);
    }, 3200); // Music is about 3 seconds
  };

  useEffect(() => {
    if (!gameStarted) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // --- Configuration ---
    const TILE_SIZE = 30;
    const ROWS = 31;
    const COLS = 28;
    const SPEED = 1.5;

    // 1 = Wall, 0 = Dot, 2 = Power Pellet, 3 = Empty, 4 = Ghost House, 5 = Tunnel
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
        [5,3,3,3,3,3,0,3,3,3,1,4,4,4,4,4,4,1,3,3,3,0,3,3,3,3,3,5],
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
        x: 14 * TILE_SIZE,
        y: 23 * TILE_SIZE, 
        dir: { x: -1, y: 0 },
        nextDir: { x: -1, y: 0 },
        radius: TILE_SIZE * 0.4,
        mouth: 0.2,
        mouthOp: 1
    };

    const ghosts = [
        { x: 13.5 * TILE_SIZE, y: 11 * TILE_SIZE, color: 'red', dir: { x: 1, y: 0 }, speed: SPEED * 0.9 },
        { x: 13.5 * TILE_SIZE, y: 13 * TILE_SIZE, color: 'pink', dir: { x: 0, y: -1 }, speed: SPEED * 0.8 },
        { x: 12.5 * TILE_SIZE, y: 13 * TILE_SIZE, color: 'cyan', dir: { x: 0, y: -1 }, speed: SPEED * 0.8 },
        { x: 14.5 * TILE_SIZE, y: 13 * TILE_SIZE, color: 'orange', dir: { x: 0, y: -1 }, speed: SPEED * 0.8 }
    ];

    const handleKeyDown = (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
            e.preventDefault();
        }
        if (e.code === 'ArrowUp') pacman.nextDir = { x: 0, y: -1 };
        if (e.code === 'ArrowDown') pacman.nextDir = { x: 0, y: 1 };
        if (e.code === 'ArrowLeft') pacman.nextDir = { x: -1, y: 0 };
        if (e.code === 'ArrowRight') pacman.nextDir = { x: 1, y: 0 };
    };

    window.addEventListener('keydown', handleKeyDown);

    const isSolid = (c, r) => {
        if (r < 0 || r >= ACTIVE_ROWS || c < 0 || c >= COLS) return false;
        const tile = mapLayout[r][c];
        return tile === 1;
    };

    const moveCharacter = (char) => {
        const gridX = Math.round((char.x - TILE_SIZE/2) / TILE_SIZE);
        const gridY = Math.round((char.y - TILE_SIZE/2) / TILE_SIZE);
        
        const centerX = gridX * TILE_SIZE + TILE_SIZE / 2;
        const centerY = gridY * TILE_SIZE + TILE_SIZE / 2;
        
        const dist = Math.abs(char.x - centerX) + Math.abs(char.y - centerY);
        const isCentered = dist < SPEED;

        if (char === pacman) {
            if (isCentered) {
                if (pacman.nextDir.x !== 0 || pacman.nextDir.y !== 0) {
                   if (!isSolid(gridX + pacman.nextDir.x, gridY + pacman.nextDir.y)) {
                       pacman.dir = pacman.nextDir;
                       pacman.nextDir = { x: 0, y: 0 };
                       pacman.x = centerX;
                       pacman.y = centerY;
                   }
                }
                
                if (isSolid(gridX + pacman.dir.x, gridY + pacman.dir.y)) {
                    pacman.dir = { x: 0, y: 0 };
                    pacman.x = centerX;
                    pacman.y = centerY;
                }
            }
        } else {
             if (isCentered) {
                 const reverseDir = { x: -char.dir.x, y: -char.dir.y };
                 const possibleDirs = [];
                 [[0,-1], [0,1], [-1,0], [1,0]].forEach(([dx, dy]) => {
                     if (dx === reverseDir.x && dy === reverseDir.y) return;
                     if (!isSolid(gridX + dx, gridY + dy)) {
                         possibleDirs.push({ x: dx, y: dy });
                     }
                 });
                 if (possibleDirs.length > 0) {
                    const keep = possibleDirs.find(d => d.x === char.dir.x && d.y === char.dir.y);
                    if (keep && Math.random() > 0.3) {
                        // keep going
                    } else {
                        char.dir = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
                    }
                    char.x = centerX;
                    char.y = centerY;
                 } else {
                     char.dir.x *= -1;
                     char.dir.y *= -1;
                 }
             }
        }

        char.x += char.dir.x * (char.speed || SPEED);
        char.y += char.dir.y * (char.speed || SPEED);

        if (char.x < -TILE_SIZE/2) char.x = canvas.width + TILE_SIZE/2;
        if (char.x > canvas.width + TILE_SIZE/2) char.x = -TILE_SIZE/2;
    };


    const update = () => {
        moveCharacter(pacman);
        
        const pGridX = Math.round((pacman.x - TILE_SIZE/2) / TILE_SIZE);
        const pGridY = Math.round((pacman.y - TILE_SIZE/2) / TILE_SIZE);
        
        if (pGridY >= 0 && pGridY < ACTIVE_ROWS && pGridX >= 0 && pGridX < COLS) {
            if (mapLayout[pGridY][pGridX] === 0 || mapLayout[pGridY][pGridX] === 2) {
                mapLayout[pGridY][pGridX] = 3;
            }
        }

        ghosts.forEach(moveCharacter);

        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let r = 0; r < ACTIVE_ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const tile = mapLayout[r][c];
                const x = c * TILE_SIZE;
                const y = r * TILE_SIZE;

                if (tile === 1) {
                    ctx.fillStyle = '#1e3a8a';
                    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                    ctx.fillStyle = 'black';
                    ctx.fillRect(x + 5, y + 5, TILE_SIZE - 10, TILE_SIZE - 10);
                    ctx.strokeStyle = '#3b82f6';
                    ctx.strokeRect(x+4, y+4, TILE_SIZE-8, TILE_SIZE-8);
                } else if (tile === 0) {
                    ctx.fillStyle = '#fca5a5';
                    ctx.beginPath();
                    ctx.arc(x + TILE_SIZE/2, y + TILE_SIZE/2, 2, 0, Math.PI * 2);
                    ctx.fill();
                } else if (tile === 2) {
                     ctx.fillStyle = '#fca5a5';
                     ctx.beginPath();
                     ctx.arc(x + TILE_SIZE/2, y + TILE_SIZE/2, 6, 0, Math.PI * 2);
                     ctx.fill();
                }
            }
        }

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
        pacman.mouth += 0.02 * pacman.mouthOp;

        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(0, 0, pacman.radius, pacman.mouth * Math.PI, (2 - pacman.mouth) * Math.PI);
        ctx.lineTo(0,0);
        ctx.fill();

        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(-5, -9, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        ghosts.forEach(g => {
            ctx.fillStyle = g.color;
            ctx.beginPath();
            ctx.arc(g.x, g.y, TILE_SIZE * 0.4, Math.PI, 0);
            ctx.lineTo(g.x + TILE_SIZE*0.4, g.y + TILE_SIZE*0.4);
            ctx.lineTo(g.x - TILE_SIZE*0.4, g.y + TILE_SIZE*0.4);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(g.x - 4, g.y - 4, 3, 0, Math.PI*2);
            ctx.arc(g.x + 4, g.y - 4, 3, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = 'blue';
             ctx.beginPath();
            ctx.arc(g.x - 4 + g.dir.x*2, g.y - 4 + g.dir.y*2, 1.5, 0, Math.PI*2);
            ctx.arc(g.x + 4 + g.dir.x*2, g.y - 4 + g.dir.y*2, 1.5, 0, Math.PI*2);
            ctx.fill();
        });

        animationFrameId = requestAnimationFrame(update);
    };

    update();

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        cancelAnimationFrame(animationFrameId);
    };
  }, [gameStarted]);

  // Intro Screen
  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center mb-6 w-full">
        <div className="relative rounded-xl overflow-hidden shadow-2xl border-4 border-slate-700 bg-black p-8"
             style={{ width: '840px', height: '500px' }}>
          
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-yellow-400 mb-2"
                style={{ fontFamily: 'monospace', textShadow: '3px 3px 0 #c026d3' }}>
              MS. PAC-MAN
            </h1>
            <p className="text-pink-400 text-lg">© DR. JIRA DICTATE</p>
          </div>

          {/* Character Preview */}
          <div className="flex justify-center items-center space-x-8 mb-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-400 rounded-full mx-auto mb-2 relative">
                <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
              <span className="text-yellow-400 text-sm">MS. PAC-MAN</span>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-red-500 rounded-t-full mx-auto mb-2"></div>
              <span className="text-red-400 text-sm">BLINKY</span>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-pink-400 rounded-t-full mx-auto mb-2"></div>
              <span className="text-pink-300 text-sm">PINKY</span>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-cyan-400 rounded-t-full mx-auto mb-2"></div>
              <span className="text-cyan-300 text-sm">INKY</span>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-orange-400 rounded-t-full mx-auto mb-2"></div>
              <span className="text-orange-300 text-sm">CLYDE</span>
            </div>
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
    <div className="flex flex-col items-center justify-center mb-6 w-full">
      <div className="relative rounded-xl overflow-hidden shadow-2xl border-4 border-slate-700 bg-black">
        <canvas 
            ref={canvasRef} 
            className="block"
        />
        <div className="absolute top-2 left-2 text-white/50 font-bold text-xs pointer-events-none">1UP 00</div>
         <div className="absolute top-2 right-2 text-white/50 font-bold text-xs pointer-events-none">HIGH SCORE</div>
      </div>
       <div className="text-slate-400 text-xs mt-2 font-mono">
            Arrow Keys to Move
        </div>
    </div>
  );
};

export default PacManGame;
