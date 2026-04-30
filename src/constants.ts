import { Track } from './types';

export const TRACKS: Track[] = [
  {
    id: '1',
    title: 'Neon Pulse',
    artist: 'Cyber Synth',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    coverColor: 'from-pink-500 to-purple-600',
    duration: 372
  },
  {
    id: '2',
    title: 'Electric Dream',
    artist: 'Vapor Wave',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    coverColor: 'from-cyan-400 to-blue-600',
    duration: 425
  },
  {
    id: '3',
    title: 'Digital Horizon',
    artist: 'Future Beat',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    coverColor: 'from-green-400 to-emerald-600',
    duration: 512
  }
];

export const GRID_SIZE = 20;
export const INITIAL_SPEED = 150;
export const SPEED_INCREMENT = 2;
export const MIN_SPEED = 60;
