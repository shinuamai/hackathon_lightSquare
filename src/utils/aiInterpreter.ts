import type { InvocationResult, ElementType } from '../types'

// Simulación de interpretación de IA local
// En una implementación real, esto usaría WebAssembly para ejecutar un modelo de IA
export async function interpretPrompt(prompt: string): Promise<InvocationResult> {
  // Simulación de procesamiento
  await new Promise((resolve) => setTimeout(resolve, 500))

  const keywords = prompt.toLowerCase()
  
  // Análisis simple de palabras clave para asignar estadísticas
  let damage = 50
  let defense = 50
  let element: ElementType = 'fire'

  if (keywords.includes('escudo') || keywords.includes('defensa')) {
    defense += 30
    damage -= 20
  }
  
  if (keywords.includes('espada') || keywords.includes('ataca') || keywords.includes('fénix')) {
    damage += 30
    defense -= 10
  }

  if (keywords.includes('fuego') || keywords.includes('llama') || keywords.includes('fénix')) {
    element = 'fire'
    damage += 10
  } else if (keywords.includes('hielo') || keywords.includes('frío') || keywords.includes('cristal')) {
    element = 'ice'
    defense += 10
  } else if (keywords.includes('rayo') || keywords.includes('eléctrico')) {
    element = 'lightning'
    damage += 15
  } else if (keywords.includes('tierra') || keywords.includes('roca') || keywords.includes('piedra')) {
    element = 'earth'
    defense += 20
  } else if (keywords.includes('agua') || keywords.includes('mar') || keywords.includes('ola')) {
    element = 'water'
    defense += 5
  } else if (keywords.includes('aire') || keywords.includes('viento') || keywords.includes('tornado')) {
    element = 'air'
    damage += 5
  }

  // Limitar valores entre 0 y 100
  damage = Math.max(0, Math.min(100, damage))
  defense = Math.max(0, Math.min(100, defense))

  return {
    description: prompt,
    stats: {
      damage,
      defense,
      element,
    },
    model3D: generateModelHash(prompt),
  }
}

function generateModelHash(prompt: string): string {
  // Generar un hash simple para identificar el modelo 3D
  let hash = 0
  for (let i = 0; i < prompt.length; i++) {
    const char = prompt.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return `model_${Math.abs(hash)}`
}
