import React, { useState, useRef, useEffect } from 'react';
import { Track } from '../types';
import { TRACKS } from '../constants';
import { Play, Pause, SkipForward, SkipBack, Volume2, Music, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface MusicPlayerProps {
  onTrackChange?: (track: Track) => void;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ onTrackChange }) => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.7);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentTrack = TRACKS[currentTrackIndex];

  useEffect(() => {
    setIsLoading(true);
  }, [currentTrackIndex]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.log('Playback blocked', e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  useEffect(() => {
    if (onTrackChange) onTrackChange(currentTrack);
  }, [currentTrackIndex, onTrackChange]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setProgress(0);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setProgress(0);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      if (duration) {
        setProgress((current / duration) * 100);
      }
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseFloat(e.target.value);
    setProgress(newProgress);
    if (audioRef.current) {
      const duration = audioRef.current.duration;
      audioRef.current.currentTime = (newProgress / 100) * duration;
    }
  };

  return (
    <footer className="h-28 bg-slate-900 border-t border-white/5 px-8 flex items-center gap-10 sticky bottom-0 z-50 backdrop-blur-xl">
      <audio
        ref={audioRef}
        src={currentTrack.url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={nextTrack}
        onCanPlay={() => setIsLoading(false)}
      />
      
      {/* Track Info */}
      <div className="flex items-center gap-4 w-64 flex-shrink-0">
        <motion.div 
          key={currentTrack.id}
          initial={{ rotate: -5, scale: 0.9 }}
          animate={{ rotate: 0, scale: 1 }}
          className={`w-16 h-16 bg-gradient-to-tr ${currentTrack.coverColor} rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden`}
        >
          {isLoading ? (
            <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
          ) : (
            <Music className="w-8 h-8 text-white/50" />
          )}
          <div className="absolute inset-0 bg-white/10"></div>
        </motion.div>
        <div className="overflow-hidden">
          <p className="font-black text-lg truncate leading-tight text-white">{currentTrack.title}</p>
          <p className="text-xs text-cyan-400 uppercase tracking-widest font-bold">{currentTrack.artist}</p>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex-1 flex flex-col gap-3 items-center">
        <div className="flex items-center gap-8">
          <button onClick={prevTrack} className="text-slate-500 hover:text-white transition-colors cursor-pointer">
            <SkipBack className="w-6 h-6 fill-current" />
          </button>
          
          <button 
            onClick={togglePlay}
            className="w-14 h-14 bg-white text-slate-950 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          >
            {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
          </button>

          <button onClick={nextTrack} className="text-slate-500 hover:text-white transition-colors cursor-pointer">
            <SkipForward className="w-6 h-6 fill-current" />
          </button>
        </div>

        <div className="w-full max-w-xl flex items-center gap-3 text-[10px] font-mono text-slate-500">
          <p>0:00</p>
          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden relative group cursor-pointer">
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleProgressChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div 
              style={{ width: `${progress}%` }}
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all duration-100"
            />
          </div>
          <p>{Math.floor(currentTrack.duration / 60)}:{String(currentTrack.duration % 60).padStart(2, '0')}</p>
        </div>
      </div>

      {/* Volume & Extras */}
      <div className="w-64 flex items-center justify-end gap-3 text-slate-500 hover:text-cyan-400 cursor-pointer transition-colors group">
        <Volume2 className="w-5 h-5" />
        <div className="w-24 h-1.5 bg-slate-800 rounded-full relative overflow-hidden">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div 
            style={{ width: `${volume * 100}%` }}
            className="h-full bg-slate-400 rounded-full group-hover:bg-cyan-400 transition-colors"
          />
        </div>
      </div>
    </footer>
  );
};

export default MusicPlayer;
