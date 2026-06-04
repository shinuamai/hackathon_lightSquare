// Game Types
export interface Player {
  id: string
  name: string
  invocation: string
  stats: {
    damage: number
    defense: number
    element: ElementType
  }
}

export type ElementType = 'fire' | 'ice' | 'lightning' | 'earth' | 'water' | 'air'

export interface GameState {
  status: 'waiting' | 'prompting' | 'battling' | 'finished'
  round: number
  timeRemaining: number
  players: Player[]
  winner: Player | null
}

export interface InvocationResult {
  description: string
  stats: {
    damage: number
    defense: number
    element: ElementType
  }
  model3D: string
}
