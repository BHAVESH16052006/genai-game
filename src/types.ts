export interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  coverColor: string;
  duration: number;
}

export interface GameState {
  score: number;
  highScore: number;
  isGameOver: boolean;
  isStarted: boolean;
}

export type Point = {
  x: number;
  y: number;
};

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
