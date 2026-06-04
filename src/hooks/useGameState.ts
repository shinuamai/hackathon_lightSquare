import { useState, useCallback } from 'react'
import type { GameState, Player } from '../types'

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>({
    status: 'waiting',
    round: 1,
    timeRemaining: 15,
    players: [
      { id: '1', name: 'Jugador 1', invocation: '', stats: { damage: 0, defense: 0, element: 'fire' } },
      { id: '2', name: 'Jugador 2', invocation: '', stats: { damage: 0, defense: 0, element: 'fire' } },
    ],
    winner: null,
  })

  const startGame = useCallback(() => {
    setGameState((prev) => ({ ...prev, status: 'prompting', timeRemaining: 15 }))
  }, [])

  const updateInvocation = useCallback((playerId: string, invocation: string) => {
    setGameState((prev) => ({
      ...prev,
      players: prev.players.map((p) =>
        p.id === playerId ? { ...p, invocation } : p
      ),
    }))
  }, [])

  const startBattle = useCallback(() => {
    setGameState((prev) => ({ ...prev, status: 'battling' }))
  }, [])

  const endGame = useCallback((winner: Player) => {
    setGameState((prev) => ({ ...prev, status: 'finished', winner }))
  }, [])

  const resetGame = useCallback(() => {
    setGameState({
      status: 'waiting',
      round: 1,
      timeRemaining: 15,
      players: [
        { id: '1', name: 'Jugador 1', invocation: '', stats: { damage: 0, defense: 0, element: 'fire' } },
        { id: '2', name: 'Jugador 2', invocation: '', stats: { damage: 0, defense: 0, element: 'fire' } },
      ],
      winner: null,
    })
  }, [])

  return {
    gameState,
    startGame,
    updateInvocation,
    startBattle,
    endGame,
    resetGame,
  }
}
