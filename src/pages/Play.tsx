import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { interpretPrompt } from '../utils/aiInterpreter'
import { CreatureCanvas } from '../components/CreatureCanvas'
import type { ElementType } from '../types'

// ── Constants ─────────────────────────────────────────────────────────────────
const TOTAL_ROUNDS = 5

const ENEMY_INVOCATIONS = [
  'Un dragón de fuego ancestral que escupe llamaradas eternas',
  'Una araña de sombras que teje veneno corrosivo',
  'Un golem de roca que aplasta todo con fuerza bruta',
  'Un espectro de hielo que congela el alma',
  'Un torbellino de rayos que electrocuta en cadena',
  'Una hidra de agua que regenera sus cabezas',
  'Un fénix de cenizas que renace entre llamas',
  'Un demonio del viento que corta con filos invisibles',
  'Un lich de hueso que drena la vida a su alrededor',
  'Un basilisco de tierra que petrifica con la mirada',
  'Un kraken del mar profundo que destruye barcos enteros',
  'Una valquiria de rayos que desciende desde los cielos',
]

const ELEMENT_COLORS: Record<ElementType, string> = {
  fire: 'text-orange-400', ice: 'text-blue-300',
  lightning: 'text-yellow-300', earth: 'text-amber-500',
  water: 'text-cyan-400', air: 'text-gray-300',
}
const ELEMENT_LABELS: Record<ElementType, string> = {
  fire: '🔥 Fuego', ice: '❄️ Hielo', lightning: '⚡ Rayo',
  earth: '🌍 Tierra', water: '💧 Agua', air: '🌬️ Aire',
}
const ELEMENT_BEATS: Partial<Record<ElementType, ElementType>> = {
  fire: 'ice', ice: 'lightning', lightning: 'earth',
  earth: 'water', water: 'air', air: 'fire',
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function hashSeed(text: string): number {
  let h = 0
  for (let i = 0; i < text.length; i++) { h = ((h << 5) - h) + text.charCodeAt(i); h = h & h }
  return Math.abs(h)
}

function elMult(a: ElementType, d: ElementType): number {
  return ELEMENT_BEATS[a] === d ? 1.3 : ELEMENT_BEATS[d] === a ? 0.7 : 1.0
}

function calcScore(winner: 'player' | 'enemy' | 'tie', pScore: number, eScore: number, round: number): number {
  if (winner === 'tie')   return 60
  if (winner === 'enemy') return 0
  const margin  = Math.max(0, pScore - eScore)
  const base    = 120
  const marginB = Math.min(60, margin)
  const roundB  = (round - 1) * 15          // harder rounds worth more
  return base + marginB + roundB
}

function starRating(wins: number): number {
  if (wins >= 5) return 5
  if (wins >= 4) return 4
  if (wins >= 3) return 3
  if (wins >= 2) return 2
  return 1
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface SlotData {
  description: string
  invocationText: string
  stats: { damage: number; defense: number; element: ElementType }
  seed: number
}
type RoundResult = 'win' | 'loss' | 'tie'
type Phase = 'prompting' | 'resolving' | 'battling' | 'result' | 'gameover'

// ── Sub-components ────────────────────────────────────────────────────────────
function StatBar({ label, value, red }: { label: string; value: number; red?: boolean }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-gray-400">{label}</span>
        <span className={`font-bold ${red ? 'text-red-400' : 'text-blue-400'}`}>{value}</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${red ? 'bg-red-400' : 'bg-blue-400'}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

function RoundDots({ results, total }: { results: RoundResult[]; total: number }) {
  return (
    <div className="flex gap-1.5 items-center">
      {Array.from({ length: total }, (_, i) => {
        const r = results[i]
        return (
          <div key={i} className={`w-3 h-3 rounded-full border transition-all ${
            !r          ? 'border-white/20 bg-white/5' :
            r === 'win' ? 'border-green-400 bg-green-400 shadow-[0_0_6px_#4ade80]' :
            r === 'loss'? 'border-red-400   bg-red-400   shadow-[0_0_6px_#f87171]' :
                          'border-yellow-400 bg-yellow-400 shadow-[0_0_6px_#facc15]'
          }`} />
        )
      })}
    </div>
  )
}

// ── PauseMenu ─────────────────────────────────────────────────────────────────
function PauseMenu({ onResume, onRestart, onHome }: {
  onResume: () => void; onRestart: () => void; onHome: () => void
}) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="bg-gray-900 border border-purple-500/40 rounded-2xl p-8 flex flex-col gap-4 min-w-[280px] shadow-2xl shadow-purple-950">
        <h2 className="text-2xl font-black text-center text-purple-300 mb-2">⏸ PAUSA</h2>
        <button onClick={onResume}
          className="py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-lg hover:from-purple-500 hover:to-pink-500 transition-all active:scale-95">
          ▶ Continuar
        </button>
        <button onClick={onRestart}
          className="py-3 px-6 bg-white/10 border border-white/20 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all active:scale-95">
          🔄 Reiniciar partida
        </button>
        <button onClick={onHome}
          className="py-3 px-6 bg-red-900/40 border border-red-500/30 rounded-xl font-semibold text-lg hover:bg-red-900/60 transition-all active:scale-95 text-red-300">
          🚪 Salir al inicio
        </button>
      </div>
    </div>
  )
}

// ── GameOver screen ───────────────────────────────────────────────────────────
function GameOverScreen({ score, results, onRestart, onHome }: {
  score: number; results: RoundResult[]; onRestart: () => void; onHome: () => void
}) {
  const [displayScore, setDisplayScore] = useState(0)
  const wins   = results.filter(r => r === 'win').length
  const losses = results.filter(r => r === 'loss').length
  const ties   = results.filter(r => r === 'tie').length
  const stars  = starRating(wins)
  const victory = wins > losses

  // Animated score counter
  useEffect(() => {
    let current = 0
    const step = Math.ceil(score / 60)
    const t = setInterval(() => {
      current = Math.min(current + step, score)
      setDisplayScore(current)
      if (current >= score) clearInterval(t)
    }, 16)
    return () => clearInterval(t)
  }, [score])

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className={`absolute inset-0 ${victory
        ? 'bg-gradient-to-b from-yellow-950 via-purple-950 to-gray-950'
        : 'bg-gradient-to-b from-red-950 via-gray-950 to-gray-950'}`} />

      {/* Particle dots CSS animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i}
            className={`absolute rounded-full ${victory ? 'bg-yellow-400' : 'bg-red-400'}`}
            style={{
              width: `${4 + (i % 5) * 3}px`,
              height: `${4 + (i % 5) * 3}px`,
              left: `${(i * 37 + 10) % 90}%`,
              top: `${(i * 53 + 5) % 80}%`,
              opacity: 0.15 + (i % 4) * 0.08,
              animation: `float ${3 + (i % 4)}s ease-in-out ${i * 0.3}s infinite alternate`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center gap-5 px-8 max-w-md w-full">
        {/* Trophy / Skull */}
        <div className="text-8xl" style={{ filter: `drop-shadow(0 0 30px ${victory ? '#fbbf24' : '#ef4444'})`,
          animation: 'bounce-in 0.6s cubic-bezier(.36,.07,.19,.97) both' }}>
          {victory ? '🏆' : '💀'}
        </div>

        {/* Title */}
        <h1 className={`text-4xl font-black tracking-wide ${victory ? 'text-yellow-300' : 'text-red-300'}`}
          style={{ textShadow: `0 0 30px ${victory ? '#fbbf24' : '#ef4444'}` }}>
          {victory ? '¡VICTORIA!' : 'DERROTA'}
        </h1>

        {/* Stars */}
        <div className="flex gap-1 text-3xl">
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} style={{
              filter: i < stars ? 'drop-shadow(0 0 8px #fbbf24)' : undefined,
              opacity: i < stars ? 1 : 0.2,
              animation: i < stars ? `star-pop 0.3s ${0.5 + i * 0.1}s both` : undefined,
            }}>⭐</span>
          ))}
        </div>

        {/* Score */}
        <div className="bg-black/40 border border-white/10 rounded-2xl px-8 py-4 text-center backdrop-blur-sm">
          <p className="text-sm text-gray-400 uppercase tracking-widest mb-1">Puntuación Final</p>
          <p className="text-5xl font-black text-white tabular-nums"
            style={{ textShadow: '0 0 20px rgba(168,85,247,0.8)' }}>
            {displayScore.toLocaleString()}
          </p>
        </div>

        {/* Round breakdown */}
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <p className="text-2xl font-black text-green-400">{wins}</p>
            <p className="text-gray-500">Victorias</p>
          </div>
          <div className="w-px bg-white/10" />
          <div className="text-center">
            <p className="text-2xl font-black text-red-400">{losses}</p>
            <p className="text-gray-500">Derrotas</p>
          </div>
          <div className="w-px bg-white/10" />
          <div className="text-center">
            <p className="text-2xl font-black text-yellow-400">{ties}</p>
            <p className="text-gray-500">Empates</p>
          </div>
        </div>

        {/* Round dots recap */}
        <RoundDots results={results} total={TOTAL_ROUNDS} />

        {/* Buttons */}
        <div className="flex gap-3 w-full mt-2">
          <button onClick={onRestart}
            className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-lg hover:from-purple-500 hover:to-pink-500 transition-all active:scale-95">
            🔄 Jugar de nuevo
          </button>
          <button onClick={onHome}
            className="px-5 py-3 bg-white/10 border border-white/20 rounded-xl font-semibold hover:bg-white/20 transition-all active:scale-95">
            🏠 Inicio
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce-in {
          0%   { transform: scale(0) rotate(-10deg); opacity: 0 }
          60%  { transform: scale(1.2) rotate(3deg) }
          100% { transform: scale(1) rotate(0deg); opacity: 1 }
        }
        @keyframes star-pop {
          0%   { transform: scale(0); opacity: 0 }
          60%  { transform: scale(1.4) }
          100% { transform: scale(1); opacity: 1 }
        }
        @keyframes float {
          from { transform: translateY(0px) rotate(0deg) }
          to   { transform: translateY(-20px) rotate(180deg) }
        }
      `}</style>
    </div>
  )
}

// ── Main Play component ───────────────────────────────────────────────────────
export default function Play() {
  const navigate = useNavigate()

  // ── State ──
  const [phase,        setPhase]        = useState<Phase>('prompting')
  const [playerInput,  setPlayerInput]  = useState('')
  const [displaySeed,  setDisplaySeed]  = useState(0)
  const [timeLeft,     setTimeLeft]     = useState(15)
  const [player,       setPlayer]       = useState<SlotData | null>(null)
  const [enemy,        setEnemy]        = useState<SlotData | null>(null)
  const [roundWinner,  setRoundWinner]  = useState<'player' | 'enemy' | 'tie' | null>(null)
  const [roundScore,   setRoundScore]   = useState<{ p: number; e: number } | null>(null)
  const [round,        setRound]        = useState(1)
  const [totalScore,   setTotalScore]   = useState(0)
  const [results,      setResults]      = useState<RoundResult[]>([])
  const [attackAnim,   setAttackAnim]   = useState<'idle' | 'advance' | 'impact' | 'retreat'>('idle')
  const [showFlash,    setShowFlash]    = useState(false)
  const [isPaused,     setIsPaused]     = useState(false)
  const [earnedScore,  setEarnedScore]  = useState(0)

  const inputRef      = useRef(playerInput)
  inputRef.current    = playerInput

  // Debounce live creature seed
  useEffect(() => {
    const t = setTimeout(() => setDisplaySeed(hashSeed(playerInput)), 280)
    return () => clearTimeout(t)
  }, [playerInput])

  // ── handleInvoke ──
  const handleInvoke = useCallback(async () => {
    setPhase('resolving')
    const enemyText  = ENEMY_INVOCATIONS[Math.floor(Math.random() * ENEMY_INVOCATIONS.length)]
    const finalInput = inputRef.current.trim() || 'un guerrero sin armas'

    const [pRes, eRes] = await Promise.all([
      interpretPrompt(finalInput),
      interpretPrompt(enemyText),
    ])

    const pMult  = elMult(pRes.stats.element, eRes.stats.element)
    const eMult  = elMult(eRes.stats.element, pRes.stats.element)
    const pScore = Math.round(pRes.stats.damage * pMult - eRes.stats.defense * 0.4)
    const eScore = Math.round(eRes.stats.damage * eMult - pRes.stats.defense * 0.4)

    const winner: 'player' | 'enemy' | 'tie' =
      pScore > eScore ? 'player' : pScore < eScore ? 'enemy' : 'tie'

    const earned = calcScore(winner, pScore, eScore, round)
    setEarnedScore(earned)

    setPlayer({ description: pRes.description, invocationText: finalInput, stats: pRes.stats, seed: hashSeed(finalInput) })
    setEnemy({ description: eRes.description, invocationText: enemyText, stats: eRes.stats, seed: hashSeed(enemyText) })
    setRoundWinner(winner)
    setRoundScore({ p: pScore, e: eScore })
    setPhase('battling')
  }, [round])

  // ── Timer ──
  useEffect(() => {
    if (phase !== 'prompting' || isPaused) return
    if (timeLeft === 0) { handleInvoke(); return }
    const t = setTimeout(() => setTimeLeft(l => l - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, phase, isPaused, handleInvoke])

  // ── Battle sequence ──
  useEffect(() => {
    if (phase !== 'battling') return
    const timers = [
      setTimeout(() => setAttackAnim('advance'),               450),
      setTimeout(() => { setAttackAnim('impact'); setShowFlash(true) },  980),
      setTimeout(() => { setAttackAnim('retreat'); setShowFlash(false) }, 1300),
      setTimeout(() => { setAttackAnim('idle'); setPhase('result') },      2100),
    ]
    return () => timers.forEach(clearTimeout)
  }, [phase])

  // ── Move to next round / game over ──
  const handleNext = useCallback(() => {
    if (!roundWinner) return
    const rResult: RoundResult = roundWinner === 'player' ? 'win' : roundWinner === 'enemy' ? 'loss' : 'tie'
    const newResults = [...results, rResult]
    const newScore   = totalScore + earnedScore
    setResults(newResults)
    setTotalScore(newScore)

    if (round >= TOTAL_ROUNDS) {
      setPhase('gameover')
    } else {
      setRound(r => r + 1)
      setPlayerInput('')
      setDisplaySeed(0)
      setTimeLeft(15)
      setPlayer(null)
      setEnemy(null)
      setRoundWinner(null)
      setRoundScore(null)
      setAttackAnim('idle')
      setPhase('prompting')
    }
  }, [roundWinner, results, totalScore, earnedScore, round])

  const handleRestart = useCallback(() => {
    setPhase('prompting')
    setPlayerInput('')
    setDisplaySeed(0)
    setTimeLeft(15)
    setPlayer(null)
    setEnemy(null)
    setRoundWinner(null)
    setRoundScore(null)
    setResults([])
    setTotalScore(0)
    setEarnedScore(0)
    setRound(1)
    setAttackAnim('idle')
    setIsPaused(false)
  }, [])

  // ── Derived display ──
  const playerEl:  ElementType = player?.stats.element  ?? 'fire'
  const playerDmg: number      = player?.stats.damage   ?? 50
  const playerDef: number      = player?.stats.defense  ?? 50
  const playerSeed: number     = player ? player.seed   : displaySeed
  const enemyEl:   ElementType = enemy?.stats.element   ?? 'fire'
  const enemyDmg:  number      = enemy?.stats.damage    ?? 50
  const enemyDef:  number      = enemy?.stats.defense   ?? 50
  const enemySeed: number      = enemy ? enemy.seed     : 9999

  const playerDefeated = phase === 'result' && roundWinner === 'enemy'
  const enemyDefeated  = phase === 'result' && roundWinner === 'player'

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden relative flex flex-col">

      {/* Arena background */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-purple-950 to-gray-950 pointer-events-none" />
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(#ffffff15 1px,transparent 1px),linear-gradient(90deg,#ffffff15 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
      <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 100%,#7c3aed33 0%,transparent 70%)' }} />

      {/* Impact flash */}
      {showFlash && <div className="absolute inset-0 bg-white/30 z-20 pointer-events-none" />}

      {/* ── Overlays ── */}
      {isPaused && (
        <PauseMenu
          onResume  ={() => setIsPaused(false)}
          onRestart ={handleRestart}
          onHome    ={() => navigate('/')}
        />
      )}
      {phase === 'gameover' && (
        <GameOverScreen
          score     ={totalScore + earnedScore}
          results   ={results}
          onRestart ={handleRestart}
          onHome    ={() => navigate('/')}
        />
      )}

      {/* ── Main layout ── */}
      <div className="relative z-10 flex flex-col flex-1 max-w-4xl mx-auto w-full px-5 py-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white transition-colors text-sm">
            ← Inicio
          </button>
          <div className="flex flex-col items-center gap-1">
            <span className="text-purple-300 font-black tracking-widest text-base">PROMPT ARENA</span>
            <RoundDots results={results} total={TOTAL_ROUNDS} />
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs text-gray-500">Puntos</p>
              <p className="text-sm font-bold text-purple-300">{totalScore.toLocaleString()}</p>
            </div>
            <button
              onClick={() => setIsPaused(true)}
              className="w-9 h-9 flex items-center justify-center bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-all text-lg"
            >
              ⏸
            </button>
          </div>
        </div>

        {/* Round label */}
        <div className="text-center mb-1">
          <span className="text-xs text-gray-500 uppercase tracking-widest">Ronda {round} de {TOTAL_ROUNDS}</span>
        </div>

        {/* ── Battle field ── */}
        <div className="flex-1 flex items-center justify-around gap-2 py-2">

          {/* Player side */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <span className="text-xs font-bold tracking-widest text-purple-300 uppercase">Tú</span>
            <div style={{
              transform: attackAnim === 'advance' ? 'translateX(85px) scale(1.1)' :
                         attackAnim === 'impact'  ? 'translateX(55px) scale(0.93)' : 'translateX(0) scale(1)',
              transition: 'transform 0.42s cubic-bezier(.4,0,.2,1)',
              filter: playerDefeated ? 'brightness(0.35) saturate(0.2)' : undefined,
            }}>
              <CreatureCanvas element={playerEl} damage={playerDmg} defense={playerDef}
                seed={playerSeed} size={185} />
            </div>
            {player ? (
              <div className="w-full max-w-[190px] bg-black/40 backdrop-blur-sm rounded-xl p-3 border border-purple-500/30">
                <p className="text-xs text-purple-200 italic mb-2 line-clamp-2">"{player.description}"</p>
                <div className="space-y-1.5">
                  <StatBar label="⚔ Daño"    value={player.stats.damage}  red />
                  <StatBar label="🛡 Defensa" value={player.stats.defense} />
                </div>
                <span className={`text-xs font-semibold mt-2 block ${ELEMENT_COLORS[player.stats.element]}`}>
                  {ELEMENT_LABELS[player.stats.element]}
                </span>
              </div>
            ) : (
              <div className="w-full max-w-[190px] h-20 bg-black/20 rounded-xl border border-white/5
                flex items-center justify-center text-gray-600 text-xs">
                Escribe tu invocación...
              </div>
            )}
          </div>

          {/* Center VS */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <span className="text-3xl font-black text-white/10">VS</span>
            {phase === 'battling' && (
              <span className="text-3xl font-black text-yellow-400 animate-bounce drop-shadow-lg">⚔️</span>
            )}
            {phase === 'result' && roundWinner && (
              <span className="text-3xl">
                {roundWinner === 'player' ? '🏆' : roundWinner === 'enemy' ? '💀' : '🤝'}
              </span>
            )}
          </div>

          {/* Enemy side */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <span className="text-xs font-bold tracking-widest text-red-300 uppercase">Enemigo</span>
            <div style={{
              transform: attackAnim === 'advance' ? 'translateX(-85px) scale(1.1)' :
                         attackAnim === 'impact'  ? 'translateX(-55px) scale(0.93)' : 'translateX(0) scale(1)',
              transition: 'transform 0.42s cubic-bezier(.4,0,.2,1)',
              filter: enemyDefeated ? 'brightness(0.35) saturate(0.2)' : undefined,
            }}>
              <CreatureCanvas element={enemyEl} damage={enemyDmg} defense={enemyDef}
                seed={enemySeed} size={185} flip
                unknown={phase === 'prompting' || phase === 'resolving'} />
            </div>
            {enemy ? (
              <div className="w-full max-w-[190px] bg-black/40 backdrop-blur-sm rounded-xl p-3 border border-red-500/30">
                <p className="text-xs text-red-200 italic mb-2 line-clamp-2">"{enemy.description}"</p>
                <div className="space-y-1.5">
                  <StatBar label="⚔ Daño"    value={enemy.stats.damage}  red />
                  <StatBar label="🛡 Defensa" value={enemy.stats.defense} />
                </div>
                <span className={`text-xs font-semibold mt-2 block ${ELEMENT_COLORS[enemy.stats.element]}`}>
                  {ELEMENT_LABELS[enemy.stats.element]}
                </span>
              </div>
            ) : (
              <div className="w-full max-w-[190px] h-20 bg-black/20 rounded-xl border border-white/5
                flex items-center justify-center text-gray-600 text-xs">
                ???
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom panels ── */}

        {/* PROMPTING */}
        {phase === 'prompting' && (
          <div className="space-y-3 pb-1">
            <div className="flex items-center gap-3">
              <span className={`text-xl font-bold tabular-nums w-10 ${
                timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-purple-300'}`}>
                {timeLeft}s
              </span>
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ${
                  timeLeft <= 5 ? 'bg-red-500' : 'bg-purple-500'}`}
                  style={{ width: `${(timeLeft / 15) * 100}%` }} />
              </div>
            </div>
            <input
              type="text"
              value={playerInput}
              onChange={e => setPlayerInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleInvoke()}
              placeholder="Describe tu arma o hechizo... (ej: Un escudo de cristal que refleja el fuego)"
              autoFocus
              className="w-full px-5 py-4 bg-black/40 border border-purple-500/40 rounded-xl focus:outline-none
                focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-600 text-base backdrop-blur-sm"
            />
            <button onClick={handleInvoke}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-xl
                hover:from-purple-500 hover:to-pink-500 active:scale-95 transition-all shadow-lg shadow-purple-950">
              ⚔️ ¡Invocar y Batallar!
            </button>
          </div>
        )}

        {/* RESOLVING */}
        {phase === 'resolving' && (
          <div className="text-center py-5">
            <p className="text-purple-300 text-lg animate-pulse">✨ Gemini está forjando tu invocación...</p>
          </div>
        )}

        {/* BATTLING */}
        {phase === 'battling' && (
          <div className="text-center py-4">
            <p className="text-5xl font-black text-yellow-400 animate-bounce"
              style={{ textShadow: '0 0 30px #ffd700' }}>¡LUCHA!</p>
          </div>
        )}

        {/* RESULT */}
        {phase === 'result' && roundWinner !== null && (
          <div className="space-y-3 pb-1">
            <div className={`text-center py-4 rounded-xl border relative ${
              roundWinner === 'player' ? 'bg-green-900/40 border-green-500/40' :
              roundWinner === 'enemy'  ? 'bg-red-900/40   border-red-500/40'   :
                                        'bg-yellow-900/40 border-yellow-500/40'}`}>
              <h2 className="text-2xl font-black">
                {roundWinner === 'player' ? '🏆 ¡Victoria!' : roundWinner === 'enemy' ? '💀 Derrota' : '🤝 ¡Empate!'}
              </h2>
              {roundScore && (
                <p className="text-gray-400 text-sm mt-0.5">
                  Tu poder: <span className="text-purple-300 font-bold">{roundScore.p}</span>
                  &nbsp;—&nbsp;
                  Enemigo: <span className="text-red-300 font-bold">{roundScore.e}</span>
                </p>
              )}
              {earnedScore > 0 && (
                <p className="text-yellow-300 text-sm font-bold mt-1">+{earnedScore} puntos</p>
              )}
            </div>

            <button onClick={handleNext}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-lg
                hover:from-purple-500 hover:to-pink-500 active:scale-95 transition-all">
              {round >= TOTAL_ROUNDS ? '🏁 Ver resultado final' : `Ronda ${round + 1} →`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
