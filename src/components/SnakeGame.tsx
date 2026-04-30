import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Point, Direction } from '../types';
import { GRID_SIZE, INITIAL_SPEED, SPEED_INCREMENT, MIN_SPEED } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { Play } from 'lucide-react';

interface SnakeGameProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (score: number) => void;
  isPlaying: boolean;
}

const SnakeGame: React.FC<SnakeGameProps> = ({ onScoreUpdate, onGameOver, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Point>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [isPaused, setIsPaused] = useState(true);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [blink, setBlink] = useState(true);
  
  // Use a ref to track direction changes within a single tick
  const nextDirectionRef = useRef<Direction>('RIGHT');
  const lastProcessedDirectionRef = useRef<Direction>('RIGHT');

  // Blink effect loop
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setBlink(b => !b);
    }, 400);
    return () => clearInterval(interval);
  }, [isPaused]);

  const moveSnake = useCallback(() => {
    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newHead = { ...head };
      
      const currentDir = nextDirectionRef.current;
      lastProcessedDirectionRef.current = currentDir;
      setDirection(currentDir);

      switch (currentDir) {
        case 'UP': newHead.y -= 1; break;
        case 'DOWN': newHead.y += 1; break;
        case 'LEFT': newHead.x -= 1; break;
        case 'RIGHT': newHead.x += 1; break;
      }

      // Check collision with walls
      if (
        newHead.x < 0 || 
        newHead.x >= GRID_SIZE || 
        newHead.y < 0 || 
        newHead.y >= GRID_SIZE
      ) {
        onGameOver(score);
        resetGame();
        return prevSnake;
      }

      // Check collision with self
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        onGameOver(score);
        resetGame();
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check if food eaten
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        onScoreUpdate(score + 10);
        setSpeed(prev => Math.max(MIN_SPEED, prev - SPEED_INCREMENT));
        generateFood(newSnake);
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [food, score, onGameOver, onScoreUpdate]);

  const generateFood = (currentSnake: Point[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // Make sure food doesn't spawn on snake
      if (!currentSnake.some(segment => segment.x === newFood?.x && segment.y === newFood?.y)) {
        break;
      }
    }
    setFood(newFood);
  };

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setDirection('RIGHT');
    nextDirectionRef.current = 'RIGHT';
    lastProcessedDirectionRef.current = 'RIGHT';
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setIsPaused(true);
    generateFood([{ x: 10, y: 10 }]);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const queuedDir = nextDirectionRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (queuedDir !== 'DOWN') nextDirectionRef.current = 'UP';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (queuedDir !== 'UP') nextDirectionRef.current = 'DOWN';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (queuedDir !== 'RIGHT') nextDirectionRef.current = 'LEFT';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (queuedDir !== 'LEFT') nextDirectionRef.current = 'RIGHT';
          break;
        case ' ':
          setIsPaused(p => !p);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(moveSnake, speed);
    return () => clearInterval(interval);
  }, [isPaused, moveSnake, speed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = canvas.width / GRID_SIZE;

    // Draw background
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }

    // Draw snake
    snake.forEach((segment, index) => {
      const gradient = ctx.createLinearGradient(
        segment.x * cellSize, 
        segment.y * cellSize, 
        (segment.x + 1) * cellSize, 
        (segment.y + 1) * cellSize
      );
      
      const isHead = index === 0;
      const baseBlue = '#22d3ee';
      const basePink = '#d946ef';
      
      // Snake uses Neon Blue
      if (isHead) {
        gradient.addColorStop(0, '#00f2ff');
        gradient.addColorStop(1, '#0066ff');
        ctx.shadowBlur = 20;
        ctx.shadowColor = baseBlue;
      } else {
        const opacity = Math.max(0.1, 1 - (index / snake.length));
        // Alternate colors if blinking or just use blue
        if (blink && index % 2 === 0) {
          gradient.addColorStop(0, `rgba(217, 70, 239, ${opacity})`);
          gradient.addColorStop(1, `rgba(162, 28, 175, ${opacity})`);
          ctx.shadowColor = basePink;
        } else {
          gradient.addColorStop(0, `rgba(34, 211, 238, ${opacity})`);
          gradient.addColorStop(1, `rgba(6, 182, 212, ${opacity})`);
          ctx.shadowColor = baseBlue;
        }
        ctx.shadowBlur = blink ? 10 : 5;
      }
      
      ctx.fillStyle = gradient;
      const x = segment.x * cellSize + 1.5;
      const y = segment.y * cellSize + 1.5;
      const size = cellSize - 3;
      
      ctx.beginPath();
      ctx.roundRect(x, y, size, size, isHead ? 4 : 2);
      ctx.fill();
    });

    // Draw food
    ctx.fillStyle = '#d946ef';
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#d946ef';
    ctx.beginPath();
    const centerX = food.x * cellSize + cellSize / 2;
    const centerY = food.y * cellSize + cellSize / 2;
    const radius = cellSize / 2 - 3;
    
    // Draw glowing ring
    ctx.strokeStyle = '#f5d0fe';
    ctx.lineWidth = 2;
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fill();
    
    // Reset shadow for next frame
    ctx.shadowBlur = 0;
  }, [snake, food, blink]);

  return (
    <div className="relative group">
      <div className="absolute -inset-4 bg-cyan-500/10 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
      <div className="relative bg-[#0a0a20]/60 rounded-[3rem] p-8 border-4 border-slate-800/80 shadow-2xl backdrop-blur-xl overflow-hidden min-w-[540px]">
        <canvas
          ref={canvasRef}
          width={500}
          height={500}
          className="max-w-full aspect-square cursor-pointer rounded-2xl shadow-inner border border-white/5"
          onClick={() => setIsPaused(p => !p)}
        />
        
        <AnimatePresence>
          {isPaused && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-[#020617]/90 backdrop-blur-lg"
              onClick={() => setIsPaused(false)}
            >
              <div className="text-center p-12">
                <motion.div 
                  initial={{ scale: 0.8, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="w-24 h-24 bg-gradient-to-br from-cyan-400 to-fuchsia-500 rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-[0_0_40px_rgba(34,211,238,0.3)]"
                >
                  <Play className="w-12 h-12 text-white fill-current ml-2" />
                </motion.div>
                <h3 className="text-white font-black text-4xl mb-3 tracking-tighter uppercase italic">
                  Neural Sync
                </h3>
                <p className="text-slate-400 text-xs font-mono uppercase tracking-[0.6em] mb-12">
                  Waiting for bio-link authorization...
                </p>
                <button 
                  onClick={() => setIsPaused(false)}
                  className="group relative px-12 py-4 overflow-hidden rounded-full font-black text-slate-950 uppercase text-sm tracking-widest transition-all"
                >
                  <div className="absolute inset-0 bg-white group-hover:bg-cyan-400 transition-colors"></div>
                  <span className="relative">Establish Connection</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SnakeGame;
