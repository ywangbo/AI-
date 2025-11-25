export enum Sender {
  USER = 'USER',
  SYSTEM = 'SYSTEM', // For boot messages, etc.
  AI = 'AI'
}

export interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
  isTyping?: boolean; // For typewriter effect status
}

export interface GameState {
  status: 'BOOTING' | 'RUNNING' | 'ERROR';
  theme: 'green' | 'amber' | 'cyan';
}
