import React, { useEffect, useRef } from 'react';

const PacManGame = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // --- Configuration ---
    const TILE_SIZE = 30;
    const ROWS = 31;
    const COLS = 28;
    const SPEED = 1.5; // Pixels per frame. Slower for smoother, more classic gameplay.

    // 1 = Wall, 0 = Dot, 2 = Power Pellet, 3 = Empty, 4 = Ghost House, 5 = Tunnel
    // Classic(-ish) Layout
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
        [5,3,3,3,3,3,0,3,3,3,1,4,4,4,4,4,4,1,3,3,3,0,3,3,3,3,3,5], // Tunnel Row
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
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] // 29 rows provided, padding bottom slightly in render if needed or reducing ROWS count.
        // Adjusted: This is 29 rows. Set ROWS to 29.
    ];
    // Re-adjust config
    const ACTIVE_ROWS = mapLayout.length;
    canvas.width = COLS * TILE_SIZE;
    canvas.height = ACTIVE_ROWS * TILE_SIZE;

    // --- Game State ---
    let pacman = {
        x: 14 * TILE_SIZE, // Start Centered
        y: 23 * TILE_SIZE, 
        dir: { x: -1, y: 0 }, // Moving Left initially
        nextDir: { x: -1, y: 0 },
        radius: TILE_SIZE * 0.4,
        mouth: 0.2,
        mouthOp: 1
    };

    // Parse map for ghosts
    const ghosts = [
        { x: 13.5 * TILE_SIZE, y: 11 * TILE_SIZE, color: 'red', dir: { x: 1, y: 0 }, speed: SPEED * 0.9 }, // Blinkyish
        { x: 13.5 * TILE_SIZE, y: 13 * TILE_SIZE, color: 'pink', dir: { x: 0, y: -1 }, speed: SPEED * 0.8 }, // Pinkyish
        { x: 12.5 * TILE_SIZE, y: 13 * TILE_SIZE, color: 'cyan', dir: { x: 0, y: -1 }, speed: SPEED * 0.8 }, // Inkyish
        { x: 14.5 * TILE_SIZE, y: 13 * TILE_SIZE, color: 'orange', dir: { x: 0, y: -1 }, speed: SPEED * 0.8 } // Clydeish
    ];

    // Input Handling
    const keys = {
        ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false
    };

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

    // --- Logic helper ---
    const isSolid = (c, r) => {
        if (r < 0 || r >= ACTIVE_ROWS || c < 0 || c >= COLS) return false; // Out of bounds usually tunnel
        const tile = mapLayout[r][c];
        return tile === 1; // Only 1 is wall
    };

    const moveCharacter = (char) => {
        // Current Grid Position
        const gridX = Math.round((char.x - TILE_SIZE/2) / TILE_SIZE);
        const gridY = Math.round((char.y - TILE_SIZE/2) / TILE_SIZE);
        
        // Exact pixel center of current tile
        const centerX = gridX * TILE_SIZE + TILE_SIZE / 2;
        const centerY = gridY * TILE_SIZE + TILE_SIZE / 2;
        
        // Check if roughly centered (to allow turning)
        const dist = Math.abs(char.x - centerX) + Math.abs(char.y - centerY);
        const isCentered = dist < SPEED; // Close enough to snap

        if (char === pacman) {
            if (isCentered) {
                // Try changing direction if queued
                if (pacman.nextDir.x !== 0 || pacman.nextDir.y !== 0) {
                   if (!isSolid(gridX + pacman.nextDir.x, gridY + pacman.nextDir.y)) {
                       pacman.dir = pacman.nextDir;
                       pacman.nextDir = { x: 0, y: 0 }; // Consume the buffer
                       // Snap to center to turn cleanly
                       pacman.x = centerX;
                       pacman.y = centerY;
                   }
                }
                
                // Check if current path is blocked
                if (isSolid(gridX + pacman.dir.x, gridY + pacman.dir.y)) {
                    pacman.dir = { x: 0, y: 0 }; // Stop
                    pacman.x = centerX;
                    pacman.y = centerY;
                }
            }
        } else {
             // Ghost Logic: Never reverse direction unless dead-ended (classic Pac-Man rule)
             if (isCentered) {
                 const reverseDir = { x: -char.dir.x, y: -char.dir.y };
                 const possibleDirs = [];
                 [[0,-1], [0,1], [-1,0], [1,0]].forEach(([dx, dy]) => {
                     // Don't include reverse direction
                     if (dx === reverseDir.x && dy === reverseDir.y) return;
                     if (!isSolid(gridX + dx, gridY + dy)) {
                         possibleDirs.push({ x: dx, y: dy });
                     }
                 });
                 if (possibleDirs.length > 0) {
                    // Prioritize continuing straight if possible
                    const keep = possibleDirs.find(d => d.x === char.dir.x && d.y === char.dir.y);
                    if (keep && Math.random() > 0.3) {
                        // keep going straight
                    } else {
                        // Pick a random available direction (but not reverse)
                        char.dir = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
                    }
                    char.x = centerX;
                    char.y = centerY;
                 } else {
                     // Dead end, only then reverse
                     char.dir.x *= -1;
                     char.dir.y *= -1;
                 }
             }
        }

        char.x += char.dir.x * (char.speed || SPEED);
        char.y += char.dir.y * (char.speed || SPEED);

        // Tunnel Wrap
        if (char.x < -TILE_SIZE/2) char.x = canvas.width + TILE_SIZE/2;
        if (char.x > canvas.width + TILE_SIZE/2) char.x = -TILE_SIZE/2;
    };


    const update = () => {
        // Update PacMan
        moveCharacter(pacman);
        
        // Eat Dots
        const pGridX = Math.round((pacman.x - TILE_SIZE/2) / TILE_SIZE);
        const pGridY = Math.round((pacman.y - TILE_SIZE/2) / TILE_SIZE);
        
        if (pGridY >= 0 && pGridY < ACTIVE_ROWS && pGridX >= 0 && pGridX < COLS) {
            if (mapLayout[pGridY][pGridX] === 0 || mapLayout[pGridY][pGridX] === 2) {
                mapLayout[pGridY][pGridX] = 3; // Eat
                // Score could go here
            }
        }

        // Update Ghosts
        ghosts.forEach(moveCharacter);

        // Draw
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Map
        for (let r = 0; r < ACTIVE_ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const tile = mapLayout[r][c];
                const x = c * TILE_SIZE;
                const y = r * TILE_SIZE;

                if (tile === 1) {
                    ctx.fillStyle = '#1e3a8a'; // Blue wall
                    // Simple wall drawing - can be improved with connectivity checks for "smooth" walls
                    // Drawing slightly smaller rect for dual line look
                    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                    ctx.fillStyle = 'black';
                    ctx.fillRect(x + 5, y + 5, TILE_SIZE - 10, TILE_SIZE - 10);
                    ctx.strokeStyle = '#3b82f6';
                    ctx.strokeRect(x+4, y+4, TILE_SIZE-8, TILE_SIZE-8);
                } else if (tile === 0) {
                    ctx.fillStyle = '#fca5a5'; // Salmon dots
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

        // Draw PacMan
        ctx.save();
        ctx.translate(pacman.x, pacman.y);
        // Calculate rotation angle from direction
        let angle = 0;
        if (pacman.dir.x === 1) angle = 0;
        if (pacman.dir.x === -1) angle = Math.PI;
        if (pacman.dir.y === 1) angle = Math.PI / 2;
        if (pacman.dir.y === -1) angle = -Math.PI / 2;
        
        ctx.rotate(angle);
        
        // Mouth animation
        if (pacman.mouth >= 0.25) pacman.mouthOp = -1;
        if (pacman.mouth <= 0.02) pacman.mouthOp = 1;
        pacman.mouth += 0.02 * pacman.mouthOp;

        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(0, 0, pacman.radius, pacman.mouth * Math.PI, (2 - pacman.mouth) * Math.PI);
        ctx.lineTo(0,0);
        ctx.fill();

        // Bow
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(-5, -9, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Draw Ghosts
        ghosts.forEach(g => {
            ctx.fillStyle = g.color;
            ctx.beginPath();
            ctx.arc(g.x, g.y, TILE_SIZE * 0.4, Math.PI, 0);
            ctx.lineTo(g.x + TILE_SIZE*0.4, g.y + TILE_SIZE*0.4);
            ctx.lineTo(g.x - TILE_SIZE*0.4, g.y + TILE_SIZE*0.4);
            ctx.fill();
             // Eyes
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

        // Loop
        animationFrameId = requestAnimationFrame(update);
    };

    update();

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        cancelAnimationFrame(animationFrameId);
    };
  }, []);

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
            Arrow Keys to Start & Move
        </div>
    </div>
  );
};

export default PacManGame;
