import { GoogleGenerativeAI } from '@google/generative-ai'
import type { InvocationResult, ElementType } from '../types'

const VALID_ELEMENTS: ElementType[] = ['fire', 'ice', 'lightning', 'earth', 'water', 'air']

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string
const genAI = new GoogleGenerativeAI(apiKey)

const SYSTEM_PROMPT = `Eres un motor de juego de combate táctico. El jugador escribe una descripción de su arma o hechizo en CUALQUIER idioma.
Tu tarea es interpretarla y devolver ÚNICAMENTE un objeto JSON válido, sin markdown, sin bloques de código, sin explicaciones extra.

Formato exacto (sin nada más):
{"description":"texto épico máx 15 palabras","damage":50,"defense":50,"element":"fire"}

Reglas de balance:
- Armas de ataque puro: damage 65-90, defense 10-35
- Escudos/armaduras: defense 65-90, damage 10-35
- Híbridos: ambos entre 40-65
- Inmovilización/parálisis/congelación → element:"ice", defense alto
- Veneno/corrosión → element:"water", damage medio
- Explosión/quemadura/lava → element:"fire", damage alto
- Tormenta/trueno/electricidad → element:"lightning", damage alto
- Roca/golem/terremoto → element:"earth", defense alto
- Viento/tornado/sigilo → element:"air", damage medio
- element DEBE ser exactamente uno de: "fire","ice","lightning","earth","water","air"`

export async function interpretPrompt(prompt: string): Promise<InvocationResult> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent(
      `${SYSTEM_PROMPT}\n\nDescripción: "${prompt}"`
    )

    let text = result.response.text().trim()
    // Strip markdown code blocks if Gemini adds them
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

    const parsed = JSON.parse(text)

    const damage  = Math.max(0, Math.min(100, Number(parsed.damage)  || 50))
    const defense = Math.max(0, Math.min(100, Number(parsed.defense) || 50))
    const element: ElementType = VALID_ELEMENTS.includes(parsed.element)
      ? (parsed.element as ElementType)
      : smartGuessElement(prompt)

    return {
      description: String(parsed.description || prompt).slice(0, 80),
      stats: { damage, defense, element },
      model3D: generateModelHash(prompt),
    }
  } catch (error) {
    console.error('[Gemini] Error, usando fallback:', error)
    return fallbackInterpret(prompt)
  }
}

// ── Smart element detection (fallback + validation) ────────────────────────

const ELEMENT_KEYWORDS: { element: ElementType; keywords: string[] }[] = [
  { element: 'fire',      keywords: ['fuego','llama','fénix','fenix','lava','magma','ardiente','incendio','calor','brasas','inferno','dragon','drago','volcán','chispa de fuego'] },
  { element: 'ice',       keywords: ['hielo','frío','frio','cristal','congelar','nieve','glacial','escarcha','inmovil','inmoviliz','paraliz','paralisis','congel','helado','artico','ártico'] },
  { element: 'lightning', keywords: ['rayo','eléctrico','electrico','tormenta','relámpago','trueno','chispa','electr','voltio','plasma','taser'] },
  { element: 'earth',     keywords: ['tierra','roca','piedra','golem','mineral','terremoto','montaña','barro','arcilla','arena','polvo','metal','hierro','acero'] },
  { element: 'water',     keywords: ['agua','mar','ola','oceano','río','lluvia','hidra','veneno','tóxico','toxin','corrosiv','ácido','acido','sangre','oleada'] },
  { element: 'air',       keywords: ['aire','viento','tornado','ráfaga','nube','tifón','huracán','invisible','sombra','oscuridad','sigilo','niebla','neblina','gas'] },
]

function smartGuessElement(prompt: string): ElementType {
  const kw = prompt.toLowerCase()
  let best: ElementType = 'fire'
  let bestScore = -1
  for (const { element, keywords } of ELEMENT_KEYWORDS) {
    const score = keywords.reduce((acc, k) => acc + (kw.includes(k) ? 1 : 0), 0)
    if (score > bestScore) { bestScore = score; best = element }
  }
  return best
}

function fallbackInterpret(prompt: string): InvocationResult {
  const kw = prompt.toLowerCase()
  let damage = 50
  let defense = 50

  // Offensive keywords
  if (/espada|lanza|hacha|daga|puño|garra|flecha|disparo|atac|destruy|aplast/.test(kw)) { damage += 25; defense -= 10 }
  if (/escudo|armadura|defensa|proteg|barrera|muro|fortaleza|bunker/.test(kw)) { defense += 25; damage -= 10 }
  if (/explosiv|devastad|anuiquilad|masiv|supremo|absolut/.test(kw)) { damage += 15 }
  if (/indestructib|invencib|eterno|titán|titan/.test(kw)) { defense += 15 }

  const element = smartGuessElement(prompt)

  // Element stat bonuses
  const bonuses: Record<ElementType, { d: number; def: number }> = {
    fire:      { d: 15, def:  0 },
    lightning: { d: 20, def: -5 },
    ice:       { d:  0, def: 15 },
    earth:     { d:  5, def: 20 },
    water:     { d:  5, def:  5 },
    air:       { d: 10, def:  0 },
  }
  damage  += bonuses[element].d
  defense += bonuses[element].def

  return {
    description: prompt.slice(0, 60),
    stats: {
      damage:  Math.max(5,  Math.min(100, damage)),
      defense: Math.max(5,  Math.min(100, defense)),
      element,
    },
    model3D: generateModelHash(prompt),
  }
}

function generateModelHash(prompt: string): string {
  let hash = 0
  for (let i = 0; i < prompt.length; i++) {
    hash = ((hash << 5) - hash) + prompt.charCodeAt(i)
    hash = hash & hash
  }
  return `model_${Math.abs(hash)}`
}
