/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import SnakeGame from './components/SnakeGame';
import MusicPlayer from './components/MusicPlayer';
import { GameState } from './types';
import { Trophy, Music, Zap, Keyboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('neon-snake-high-score');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isGameOver, setIsGameOver] = useState(false);

  const handleScoreUpdate = (newScore: number) => {
    setScore(newScore);
    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem('neon-snake-high-score', newScore.toString());
    }
  };

  const handleGameOver = (finalScore: number) => {
    setIsGameOver(true);
    setTimeout(() => setIsGameOver(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col overflow-hidden font-sans selection:bg-cyan-500/30">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 bg-slate-900/50 border-b border-cyan-500/20 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <Music className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 uppercase">
            SynthSnake.AI
          </h1>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">Current Score</p>
            <p className="text-3xl font-mono text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">
              {score.toString().padStart(5, '0')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">High Score</p>
            <p className="text-3xl font-mono text-fuchsia-500">
              {highScore.toString().padStart(5, '0')}
            </p>
          </div>
        </div>
      </header>

      <main className="flex flex-1 p-8 gap-8 overflow-hidden relative">
        {/* Game Container */}
        <section className="flex-1 relative flex items-center justify-center bg-black/40 rounded-[2.5rem] border-4 border-slate-800 shadow-inner">
          <SnakeGame 
            onScoreUpdate={handleScoreUpdate} 
            onGameOver={handleGameOver}
            isPlaying={true} 
          />
          
          <AnimatePresence>
            {isGameOver && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="absolute top-12 px-6 py-2 bg-cyan-600/20 border border-cyan-500/40 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.2)] z-20 backdrop-blur-md"
              >
                <p className="text-cyan-400 font-black text-sm uppercase tracking-[0.2em] animate-pulse">Sync Restored & Re-initializing</p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Sidebar */}
        <aside className="w-85 flex flex-col gap-6">
          <div className="bg-slate-900/60 rounded-3xl p-6 border border-white/5 flex flex-col gap-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Keyboard className="w-4 h-4" /> Interface
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-1">
                <span className="text-[10px] text-slate-500 font-bold tracking-tighter">NAVIGATE</span>
                <span className="text-sm font-black text-cyan-400 uppercase">WASD</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-1">
                <span className="text-[10px] text-slate-500 font-bold tracking-tighter">HALT</span>
                <span className="text-sm font-black text-fuchsia-400 uppercase">SPACE</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 rounded-3xl p-6 border border-white/5 flex-1 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none"></div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Neural Data</h2>
            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect your sensory nodes to the grid. The pulse accelerates as you absorb digital fragments. 2.4ms latency detected.
              </p>
              <div className="pt-4 border-t border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Grid Connectivity</span>
                  <span className="text-[10px] font-mono text-cyan-400">OPTIMAL</span>
                </div>
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    className="h-full bg-cyan-500 shadow-[0_0_10px_#06b6d4]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Mini Visualizer */}
          <div className="bg-gradient-to-br from-fuchsia-600/20 to-purple-600/20 rounded-3xl p-6 border border-fuchsia-500/20 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-tighter text-fuchsia-400">Stream Status</span>
              <div className="flex items-end gap-1 h-3">
                {[20, 40, 30, 60, 50].map((h, i) => (
                  <motion.div 
                    key={i}
                    animate={{ height: ['20%', '100%', '40%'] }}
                    transition={{ repeat: Infinity, duration: 1 + i * 0.2, ease: "easeInOut" }}
                    className="w-1 bg-fuchsia-500 rounded-full"
                  />
                ))}
              </div>
            </div>
            <div className="h-10 bg-black/40 rounded-xl flex items-center justify-center gap-1 overflow-hidden">
              <div className="w-full h-full flex items-center justify-center gap-[2px]">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-[2px] ${i % 7 === 0 ? 'h-6 bg-fuchsia-500 shadow-[0_0_8px_#d946ef]' : 'h-3 bg-cyan-500/50'}`}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </main>

      <MusicPlayer />
    </div>
  );
}

