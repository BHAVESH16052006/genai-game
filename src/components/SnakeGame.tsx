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
  const [goldCoin, setGoldCoin] = useState<Point | null>(null);
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [isPaused, setIsPaused] = useState(true);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [blink, setBlink] = useState(true);
  const [isBeat, setIsBeat] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [energy, setEnergy] = useState(100);
  const [isFocusing, setIsFocusing] = useState(false);
  const [renderTime, setRenderTime] = useState(0);
  
  // Use a ref to track direction changes within a single tick
  const nextDirectionRef = useRef<Direction>('RIGHT');
  const lastProcessedDirectionRef = useRef<Direction>('RIGHT');

  // Animation loop for smooth visual effects
  useEffect(() => {
    let frameId: number;
    const animate = (time: number) => {
      setRenderTime(time);
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Beat effect loop
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setIsBeat(b => !b);
    }, 500); // 120 BPM simulation
    return () => clearInterval(interval);
  }, [isPaused]);

  // Focus energy watch
  useEffect(() => {
    if (energy <= 0 && isFocusing) {
      setIsFocusing(false);
    }
  }, [energy, isFocusing]);

  // Focus consumption loop
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      if (isFocusing) {
        setEnergy(e => Math.max(0, e - 2));
      } else {
        setEnergy(e => Math.min(100, e + 0.5));
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isPaused, isFocusing]);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 200);
  };

  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      if (!currentSnake.some(segment => segment.x === newFood?.x && segment.y === newFood?.y)) {
        break;
      }
    }
    setFood(newFood);

    // Rare gold coin chance (15%)
    if (Math.random() < 0.15 && !goldCoin) {
      let newGold: Point;
      while (true) {
        newGold = {
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE),
        };
        const onSnake = currentSnake.some(s => s.x === newGold.x && s.y === newGold.y);
        const onFood = newFood.x === newGold.x && newFood.y === newGold.y;
        if (!onSnake && !onFood) break;
      }
      setGoldCoin(newGold);
    }
  }, [goldCoin]);

  const resetGame = useCallback(() => {
    setSnake([{ x: 10, y: 10 }]);
    setDirection('RIGHT');
    nextDirectionRef.current = 'RIGHT';
    lastProcessedDirectionRef.current = 'RIGHT';
    setScore(0);
    onScoreUpdate(0);
    setSpeed(INITIAL_SPEED);
    setIsPaused(true);
    setGoldCoin(null);
    setEnergy(100);
    setIsFocusing(false);
    generateFood([{ x: 10, y: 10 }]);
  }, [generateFood, onScoreUpdate]);

  const moveSnake = useCallback(() => {
    const head = snake[0];
    const newHead = { ...head };
    
    const currentDir = nextDirectionRef.current;
    lastProcessedDirectionRef.current = currentDir;
    setDirection(currentDir);

    switch (currentDir) {
      case 'UP': newHead.y = (newHead.y - 1 + GRID_SIZE) % GRID_SIZE; break;
      case 'DOWN': newHead.y = (newHead.y + 1) % GRID_SIZE; break;
      case 'LEFT': newHead.x = (newHead.x - 1 + GRID_SIZE) % GRID_SIZE; break;
      case 'RIGHT': newHead.x = (newHead.x + 1) % GRID_SIZE; break;
    }

    // Check collision with self
    if (snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
      onGameOver(score);
      resetGame();
      return;
    }

    const newSnake = [newHead, ...snake];

    // Check if food eaten
    if (newHead.x === food.x && newHead.y === food.y) {
      const newScore = score + 10;
      setScore(newScore);
      onScoreUpdate(newScore);
      setSpeed(prev => Math.max(MIN_SPEED, prev - SPEED_INCREMENT));
      generateFood(newSnake);
      triggerShake();
    } else if (goldCoin && newHead.x === goldCoin.x && newHead.y === goldCoin.y) {
      const newScore = score + 50;
      setScore(newScore);
      onScoreUpdate(newScore);
      setGoldCoin(null);
      triggerShake();
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
  }, [snake, food, goldCoin, score, speed, onGameOver, onScoreUpdate, generateFood, resetGame]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const queuedDir = nextDirectionRef.current;
      
      if (e.key === 'Shift') {
        setIsFocusing(true);
      }

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

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsFocusing(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(moveSnake, isFocusing ? speed * 2 : speed);
    return () => clearInterval(interval);
  }, [isPaused, moveSnake, speed, isFocusing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = canvas.width / GRID_SIZE;

    // Draw background
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw beat pulse glow (Change 3)
    if (isBeat) {
      const beatGradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width / 1.5
      );
      beatGradient.addColorStop(0, 'rgba(6, 182, 212, 0.05)');
      beatGradient.addColorStop(1, 'rgba(2, 6, 23, 0)');
      ctx.fillStyle = beatGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw grid lines
    ctx.strokeStyle = isBeat ? 'rgba(34, 211, 238, 0.1)' : 'rgba(34, 211, 238, 0.05)';
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
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 1. Draw Body Path (Changes for realism)
    if (snake.length > 1) {
      ctx.beginPath();
      const headX = snake[0].x * cellSize + cellSize / 2;
      const headY = snake[0].y * cellSize + cellSize / 2;
      ctx.moveTo(headX, headY);

      for (let i = 1; i < snake.length; i++) {
        const segment = snake[i];
        const prevSegment = snake[i - 1];
        
        // Handle wrap-around for smooth drawing
        const dx = segment.x - prevSegment.x;
        const dy = segment.y - prevSegment.y;
        
        let targetX = segment.x * cellSize + cellSize / 2;
        let targetY = segment.y * cellSize + cellSize / 2;

        // Visual wiggle effect
        const wiggleAmount = (isFocusing ? 1 : 2) * Math.min(1, i / 3);
        const wiggleFreq = 0.01;
        const wiggle = Math.sin(renderTime * wiggleFreq + i * 0.8) * wiggleAmount;
        
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
          // Break path for wrap-around
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(targetX, targetY);
        } else {
          // Add wiggle perpendicular to movement direction
          if (dx !== 0) targetY += wiggle;
          if (dy !== 0) targetX += wiggle;
          
          ctx.lineTo(targetX, targetY);
        }
      }
      
      const bodyGradient = ctx.createLinearGradient(
        snake[0].x * cellSize, snake[0].y * cellSize,
        snake[snake.length-1].x * cellSize, snake[snake.length-1].y * cellSize
      );
      bodyGradient.addColorStop(0, '#22d3ee');
      bodyGradient.addColorStop(1, 'rgba(8, 145, 178, 0.2)');
      
      ctx.strokeStyle = bodyGradient;
      ctx.lineWidth = cellSize * 0.8;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#22d3ee';
      ctx.stroke();
    }

    // 2. Draw Segments/Scales for detail
    snake.forEach((segment, index) => {
      const isHead = index === 0;
      const baseBlue = '#22d3ee';
      
      const centerX = segment.x * cellSize + cellSize / 2;
      const centerY = segment.y * cellSize + cellSize / 2;
      
      const taperFactor = 1 - (index / snake.length) * 0.4;
      const radius = (cellSize / 2) * taperFactor;
      
      // Calculate wiggle for segments too
      let animatedX = centerX;
      let animatedY = centerY;
      if (index > 0) {
        const prev = snake[index-1];
        const dx = segment.x - prev.x;
        const dy = segment.y - prev.y;
        const wiggle = Math.sin(renderTime * 0.01 + index * 0.8) * (isFocusing ? 1 : 2) * Math.min(1, index / 3);
        if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
          if (dx !== 0) animatedY += wiggle;
          if (dy !== 0) animatedX += wiggle;
        }
      }

      const gradient = ctx.createRadialGradient(
        animatedX - radius/3, animatedY - radius/3, radius/4,
        animatedX, animatedY, radius
      );
      
      if (isHead) {
        gradient.addColorStop(0, '#a5f3fc');
        gradient.addColorStop(0.4, '#22d3ee');
        gradient.addColorStop(1, '#0891b2');
        ctx.shadowBlur = 40;
        ctx.shadowColor = '#00f2ff';
      } else {
        const opacity = Math.max(0.2, 1 - (index / snake.length));
        gradient.addColorStop(0, `rgba(34, 211, 238, ${opacity})`);
        gradient.addColorStop(1, `rgba(8, 145, 178, ${opacity})`);
        ctx.shadowColor = baseBlue;
        ctx.shadowBlur = 10;
      }
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(animatedX, animatedY, radius, 0, Math.PI * 2);
      ctx.fill();

      if (isHead) {
        // Flickering tongue
        const tongueFlicker = Math.sin(renderTime * 0.02) > 0.7;
        if (tongueFlicker && !isPaused) {
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 2;
          ctx.beginPath();
          let tx = animatedX, ty = animatedY;
          const tLen = cellSize * 0.6;
          
          switch(direction) {
            case 'UP': ty -= radius; ctx.moveTo(tx, ty); ctx.lineTo(tx-2, ty-tLen); ctx.moveTo(tx, ty); ctx.lineTo(tx+2, ty-tLen); break;
            case 'DOWN': ty += radius; ctx.moveTo(tx, ty); ctx.lineTo(tx-2, ty+tLen); ctx.moveTo(tx, ty); ctx.lineTo(tx+2, ty+tLen); break;
            case 'LEFT': tx -= radius; ctx.moveTo(tx, ty); ctx.lineTo(tx-tLen, ty-2); ctx.moveTo(tx, ty); ctx.lineTo(tx-tLen, ty+2); break;
            case 'RIGHT': tx += radius; ctx.moveTo(tx, ty); ctx.lineTo(tx+tLen, ty-2); ctx.moveTo(tx, ty); ctx.lineTo(tx+tLen, ty+2); break;
          }
          ctx.stroke();
        }

        // Eyes
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#fff';
        ctx.fillStyle = 'white';
        const eyeOffset = radius * 0.4;
        const eyeSize = radius * 0.2;
        let eyeX1, eyeY1, eyeX2, eyeY2;
        
        switch(direction) {
          case 'UP': eyeX1 = animatedX - eyeOffset; eyeY1 = animatedY - eyeOffset; eyeX2 = animatedX + eyeOffset; eyeY2 = animatedY - eyeOffset; break;
          case 'DOWN': eyeX1 = animatedX - eyeOffset; eyeY1 = animatedY + eyeOffset; eyeX2 = animatedX + eyeOffset; eyeY2 = animatedY + eyeOffset; break;
          case 'LEFT': eyeX1 = animatedX - eyeOffset; eyeY1 = animatedY - eyeOffset; eyeX2 = animatedX - eyeOffset; eyeY2 = animatedY + eyeOffset; break;
          case 'RIGHT': eyeX1 = animatedX + eyeOffset; eyeY1 = animatedY - eyeOffset; eyeX2 = animatedX + eyeOffset; eyeY2 = animatedY + eyeOffset; break;
          default: eyeX1 = animatedX + eyeOffset; eyeY1 = animatedY - eyeOffset; eyeX2 = animatedX + eyeOffset; eyeY2 = animatedY + eyeOffset;
        }
        ctx.beginPath();
        ctx.arc(eyeX1, eyeY1, eyeSize, 0, Math.PI * 2);
        ctx.arc(eyeX2, eyeY2, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#00f2ff';
        ctx.beginPath();
        ctx.arc(eyeX1, eyeY1, eyeSize/2, 0, Math.PI * 2);
        ctx.arc(eyeX2, eyeY2, eyeSize/2, 0, Math.PI * 2);
        ctx.fill();
      }
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
    
    // Draw gold coin
    if (goldCoin) {
      ctx.fillStyle = '#fbbf24';
      ctx.shadowBlur = isBeat ? 40 : 25;
      ctx.shadowColor = '#fbbf24';
      ctx.beginPath();
      const goldX = goldCoin.x * cellSize + cellSize / 2;
      const goldY = goldCoin.y * cellSize + cellSize / 2;
      const goldRadius = cellSize / 2 - 2;
      
      // Outer glow ring
      ctx.strokeStyle = '#fff7ed';
      ctx.lineWidth = 3;
      ctx.arc(goldX, goldY, goldRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();
      
      // Coin "Sparkle"
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(goldX - 2, goldY - 2, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Reset shadow for next frame
    ctx.shadowBlur = 0;
  }, [snake, food, goldCoin, blink, isBeat, renderTime, isPaused, direction, isFocusing]);

  return (
    <div className="relative group">
      <div className="absolute -inset-4 bg-cyan-500/10 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
      
      {/* Energy Bar (Change 10) */}
      <div className="absolute -top-12 left-0 right-0 h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
        <motion.div 
          className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
          initial={{ width: '100%' }}
          animate={{ width: `${energy}%` }}
          transition={{ type: 'spring', damping: 20 }}
        />
        {isFocusing && (
          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
        )}
      </div>

      <motion.div 
        className="relative p-[2px] rounded-[3rem] overflow-hidden"
        animate={isShaking ? {
          x: [0, -10, 10, -10, 10, 0],
          y: [0, 5, -5, 5, -5, 0]
        } : { x: 0, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Continuous Flowing Neon Border */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-cyan-400 animate-gradient-x w-[200%] h-full opacity-60 shadow-[0_0_20px_rgba(6,182,212,0.3)]"></div>
        
        <div className="relative bg-[#0a0a20]/95 rounded-[2.9rem] p-8 backdrop-blur-xl overflow-hidden min-w-[540px] flex flex-col items-center">
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
              <div className="relative p-[2px] rounded-[3rem] overflow-hidden group">
                {/* Flowing Neon Border Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-cyan-400 animate-gradient-x w-[200%] h-full opacity-80 shadow-[0_0_30px_rgba(34,211,238,0.4)]"></div>
                
                <div className="relative text-center p-12 bg-slate-950 rounded-[2.9rem] flex flex-col items-center">
                  <motion.div 
                    initial={{ scale: 0.8, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="w-24 h-24 bg-gradient-to-br from-cyan-400 to-fuchsia-500 rounded-3xl flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(34,211,238,0.3)]"
                  >
                    <Play className="w-12 h-12 text-white fill-current ml-2" />
                  </motion.div>
                  <h3 className="text-white font-black text-5xl mb-3 tracking-tighter uppercase italic drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]">
                    NEON BEATS
                  </h3>
                  <p className="text-slate-400 text-[10px] font-mono uppercase tracking-[0.6em] mb-12">
                    Initializing audio-visual link...
                  </p>
                  <button 
                    onClick={() => setIsPaused(false)}
                    className="group relative px-12 py-4 overflow-hidden rounded-full font-black text-slate-950 uppercase text-sm tracking-widest transition-all"
                  >
                    <div className="absolute inset-0 bg-white group-hover:bg-cyan-400 transition-colors"></div>
                    <span className="relative">Establish Connection</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  </div>
  );
};

export default SnakeGame;
