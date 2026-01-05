/**
 * Text Engine v3.20 - Type Definitions
 */

/** Game state */
export interface GameState {
  /** Current scene ID */
  sceneId: string;
  /** Flags (for condition checking) */
  flags: Record<string, boolean>;
  /** Variables (numbers, strings) */
  variables: Record<string, number | string>;
  /** Inventory items */
  inventory: string[];
  /** History (for replay) */
  history: GameHistoryEntry[];
}

/** History entry */
export interface GameHistoryEntry {
  /** Action type */
  type: 'choice' | 'command' | 'scene_change';
  /** Action content */
  content: string;
  /** Timestamp */
  timestamp: number;
  /** Snapshot (optional, for rollback) */
  snapshot?: GameState;
}

/** Choice/Button */
export interface Choice {
  /** Choice ID */
  id: string;
  /** Display text */
  text: string;
  /** Command to execute */
  command?: string;
  /** Target scene */
  to?: string;
  /** Condition (optional) */
  condition?: string;
  /** Effect (optional) */
  effect?: Effect;
}

/** Effect */
export interface Effect {
  /** Set flags */
  setFlags?: Record<string, boolean>;
  /** Set variables */
  setVariables?: Record<string, number | string>;
  /** Add items */
  addItems?: string[];
  /** Remove items */
  removeItems?: string[];
  /** Emit events */
  emitEvents?: string[];
}

/** Scene */
export interface Scene {
  /** Scene ID */
  id: string;
  /** Scene name */
  name?: string;
  /** Text content */
  text: string[];
  /** Choices */
  choices?: Choice[];
  /** Entry condition */
  condition?: string;
  /** Entry effect */
  onEnter?: Effect;
  /** Custom event handlers */
  events?: Record<string, Effect>;
}

/** Story data */
export interface StoryData {
  /** Starting scene ID */
  start: string;
  /** All scenes */
  scenes: Record<string, Scene>;
  /** Metadata */
  meta?: {
    title?: string;
    version?: string;
    author?: string;
    description?: string;
  };
}

/** Engine event */
export interface EngineEvent {
  /** Event type */
  type: 'SCENE_CHANGE' | 'GAIN_ITEM' | 'LOSE_ITEM' | 'SET_FLAG' | 'SET_VARIABLE' | 'GAME_END' | 'CUSTOM';
  /** Event payload */
  payload?: any;
  /** Timestamp */
  timestamp: number;
}

/** Command */
export type Command =
  | string // Text command
  | Choice // Choice/Button
  | { type: 'goto'; to: string } // Scene jump
  | { type: 'take'; item: string } // Take item
  | { type: 'use'; item: string } // Use item
  | { type: 'save' } // Save
  | { type: 'load' } // Load;

/** Engine execution result */
export interface EngineResult {
  /** Output text */
  text: string[];
  /** Available choices */
  choices?: Choice[];
  /** Triggered events */
  events?: EngineEvent[];
  /** Current game state */
  state: GameState;
  /** Is game over */
  isGameOver?: boolean;
}
