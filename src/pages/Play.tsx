import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { interpretPrompt } from '../utils/aiInterpreter'
import { CreatureCanvas } from '../components/CreatureCanvas'
import { audio } from '../utils/audioManager'
import type { ElementType } from '../types'

// ── Constants ─────────────────────────────────────────────────────────────────
const TOTAL_ROUNDS   = 5
const ROUND_DURATION = 30   // seconds per round
const MAX_HP         = 100

const P1_KEYS   = ['q','w','e','r','t']
const P2_KEYS   = ['u','i','o','p','y']
const P1_LABELS = ['Q','W','E','R','T']
const P2_LABELS = ['U','I','O','P','Y']

const ELEMENT_ICONS: Record<ElementType, string> = {
  fire:'🔥', ice:'❄️', lightning:'⚡', earth:'🌍', water:'💧', air:'🌬️',
}
const ELEMENT_BEATS: Partial<Record<ElementType, ElementType>> = {
  fire:'ice', ice:'lightning', lightning:'earth', earth:'water', water:'air', air:'fire',
}
function elMult(a: ElementType, d: ElementType) {
  return ELEMENT_BEATS[a] === d ? 1.3 : ELEMENT_BEATS[d] === a ? 0.7 : 1.0
}

// ── Preset powers (mejorados) ─────────────────────────────────────────────────
interface Power {
  id: string; name: string; description: string
  stats: { damage: number; defense: number; element: ElementType }
  cooldown: number
}
const PRESET_POWERS: Power[] = [
  { id:'kraken', name:'Kraken Abismal',      cooldown:2,
    description:'Tentáculos colosales que emergen del abismo y aplastan con presión devastadora',
    stats:{ damage:78, defense:22, element:'water' } },
  { id:'lich',   name:'Rey Liche Eterno',    cooldown:2,
    description:'Drenaje vital absoluto que convierte la vida robada en escudos de hueso',
    stats:{ damage:52, defense:50, element:'air' } },
  { id:'demon',  name:'Archidemon del Viento', cooldown:2,
    description:'Cuchillas invisibles supersónicas que perforan toda armadura sin piedad',
    stats:{ damage:90, defense:10, element:'air' } },
  { id:'golem',  name:'Titán de Roca',       cooldown:2,
    description:'Coloso granítico que convierte cada golpe en un terremoto continental',
    stats:{ damage:64, defense:58, element:'earth' } },
]

// ── Types ─────────────────────────────────────────────────────────────────────
type GamePhase   = 'nameInput' | 'fighting' | 'roundEnd' | 'gameover'
type RoundResult = 'p1' | 'p2' | 'tie'
interface FloatDmg { id: number; value: number; side: 'p1'|'p2' }

// ── Sub-components ────────────────────────────────────────────────────────────

function HPBar({ hp, flip, name }: { hp: number; flip?: boolean; name: string }) {
  const pct   = (hp / MAX_HP) * 100
  const color = pct > 55 ? 'bg-green-500' : pct > 25 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className={`flex flex-col gap-0.5 ${flip ? 'items-end' : ''}`}>
      <div className={`flex items-center gap-2 ${flip ? 'flex-row-reverse' : ''}`}>
        <span className={`text-xs font-black tracking-wide uppercase`}
          style={{ fontFamily:"'Courier New',monospace", color: flip ? '#f87171' : '#22d3ee' }}>{name}</span>
        <span className={`text-sm font-black tabular-nums ${pct < 25 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
          {hp}/{MAX_HP}
        </span>
      </div>
      <div className="flex-1 w-full h-3 bg-white/10 rounded-full overflow-hidden border border-white/10">
        <div className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width:`${pct}%`, marginLeft: flip ? 'auto' : undefined }} />
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
          <div key={i} className={`w-2.5 h-2.5 rounded-full border transition-all ${
            !r        ? 'border-white/20 bg-white/5' :
            r==='p1'  ? 'border-purple-400 bg-purple-400 shadow-[0_0_6px_#a78bfa]' :
            r==='p2'  ? 'border-red-400    bg-red-400    shadow-[0_0_6px_#f87171]' :
                        'border-yellow-400 bg-yellow-400 shadow-[0_0_6px_#facc15]'
          }`} />
        )
      })}
    </div>
  )
}

function PowerCard({
  power, keyLabel, cooldownExpiry, now, onFire, flip, lit,
}: {
  power: Power; keyLabel: string; cooldownExpiry: number
  now: number; onFire: () => void; flip?: boolean; lit: boolean
}) {
  const cdMs  = Math.max(0, cooldownExpiry - now)
  const ready = cdMs <= 0
  const pct   = ready ? 100 : 100 - (cdMs / (power.cooldown * 1000)) * 100
  return (
    <button onClick={() => { audio.click(); onFire() }} disabled={!ready}
      className={`w-full p-2 rounded-lg border text-left transition-all select-none
        ${lit   ? 'border-yellow-400 bg-yellow-900/50 shadow-[0_0_14px_#fbbf24] scale-95'
        : ready ? 'border-white/15 bg-white/5 hover:bg-white/10 active:scale-95'
                : 'border-white/5 bg-black/20 opacity-45 cursor-not-allowed'}`}>
      <div className={`flex items-center gap-1.5 ${flip ? 'flex-row-reverse' : ''}`}>
        <span className="shrink-0 text-xs font-black px-1.5 py-0.5 rounded bg-white/20 text-white/80 leading-none">{keyLabel}</span>
        <span className="text-sm leading-none">{ELEMENT_ICONS[power.stats.element]}</span>
        <span className={`text-sm font-bold truncate flex-1 ${flip ? 'text-right' : ''}`}>{power.name}</span>
        <span className="shrink-0 text-xs text-red-400 font-bold">⚔{power.stats.damage}</span>
      </div>
      <p className={`text-xs text-gray-500 mt-0.5 line-clamp-1 ${flip ? 'text-right' : ''}`}>{power.description}</p>
      <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-100 ${ready ? 'bg-green-500' : 'bg-purple-400'}`}
          style={{ width:`${pct}%` }} />
      </div>
      {!ready && <p className={`text-xs text-purple-400 mt-0.5 ${flip ? 'text-right' : ''}`}>{(cdMs/1000).toFixed(1)}s</p>}
    </button>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Play() {
  const navigate = useNavigate()

  // ── Names ──
  const [p1Name, setP1Name]     = useState('Jugador 1')
  const [p2Name, setP2Name]     = useState('Jugador 2')

  // ── Round system ──
  const [round,         setRound]         = useState(1)
  const [roundTimer,    setRoundTimer]    = useState(ROUND_DURATION)
  const [roundResults,  setRoundResults]  = useState<RoundResult[]>([])
  const [roundWinner,   setRoundWinner]   = useState<RoundResult | null>(null)
  const [p1Score,       setP1Score]       = useState(0)
  const [p2Score,       setP2Score]       = useState(0)

  // ── Battle ──
  const [p1HP,    setP1HP]    = useState(MAX_HP)
  const [p2HP,    setP2HP]    = useState(MAX_HP)
  const [p1Powers, setP1Powers] = useState<Power[]>(PRESET_POWERS)
  const [p2Powers, setP2Powers] = useState<Power[]>(PRESET_POWERS)
  const [p1CDs,   setP1CDs]   = useState<number[]>([0,0,0,0])
  const [p2CDs,   setP2CDs]   = useState<number[]>([0,0,0,0])
  const [p1El,    setP1El]    = useState<ElementType>('fire')
  const [p2El,    setP2El]    = useState<ElementType>('earth')
  const [log,     setLog]     = useState<{ text:string; color:string }[]>([])
  const [floats,  setFloats]  = useState<FloatDmg[]>([])
  const [litKeys, setLitKeys] = useState<Set<string>>(new Set())
  const [hitSide, setHitSide] = useState<'p1'|'p2'|null>(null)

  // ── Game phase ──
  const [phase,    setPhase]    = useState<GamePhase>('nameInput')
  const [isPaused, setIsPaused] = useState(false)

  // ── Audio control ──
  const [muted,  setMuted]  = useState(false)
  const [volume, setVolume] = useState(0.55)

  // ── 100ms tick for cooldown display ──
  const [tick, setTick] = useState(0)
  useEffect(() => { const t = setInterval(() => setTick(n=>n+1), 100); return ()=>clearInterval(t) }, [])
  const now = useMemo(() => Date.now(), [tick])

  // ── Refs for stable callbacks (avoid stale closures) ──
  const phaseRef       = useRef(phase);       phaseRef.current       = phase
  const isPausedRef    = useRef(isPaused);    isPausedRef.current    = isPaused
  const p1HPRef        = useRef(p1HP);        p1HPRef.current        = p1HP
  const p2HPRef        = useRef(p2HP);        p2HPRef.current        = p2HP
  const p1CDsRef       = useRef(p1CDs);       p1CDsRef.current       = p1CDs
  const p2CDsRef       = useRef(p2CDs);       p2CDsRef.current       = p2CDs
  const p1PowersRef    = useRef(p1Powers);    p1PowersRef.current    = p1Powers
  const p2PowersRef    = useRef(p2Powers);    p2PowersRef.current    = p2Powers
  const p1ElRef        = useRef(p1El);        p1ElRef.current        = p1El
  const p2ElRef        = useRef(p2El);        p2ElRef.current        = p2El
  const roundRef       = useRef(round);       roundRef.current       = round
  const roundResultsRef= useRef(roundResults);roundResultsRef.current= roundResults
  const roundEndedRef  = useRef(false)        // prevent double-fire
  const floatIdRef     = useRef(0)
  // anyTypingRef eliminado — se usa e.target directamente en el handler

  // ── Audio sync ──
  useEffect(() => { audio.setMuted(muted) },  [muted])
  useEffect(() => { audio.setVolume(volume) }, [volume])

  // ── Cleanup on unmount ──
  useEffect(() => { return () => { audio.stopBgMusic() } }, [])

  // ── Helpers ──
  const addLog = useCallback((text: string, color: string) => {
    setLog(prev => [{ text, color }, ...prev].slice(0, 8))
  }, [])

  const lightKey = useCallback((k: string) => {
    setLitKeys(prev => new Set([...prev, k]))
    setTimeout(() => setLitKeys(prev => { const s=new Set(prev); s.delete(k); return s }), 280)
  }, [])

  const showFloat = useCallback((v: number, side: 'p1'|'p2') => {
    const id = ++floatIdRef.current
    setFloats(prev => [...prev, { id, value:v, side }])
    setTimeout(() => setFloats(prev => prev.filter(f=>f.id!==id)), 900)
  }, [])

  const flashHit = useCallback((side: 'p1'|'p2') => {
    setHitSide(side)
    setTimeout(() => setHitSide(null), 320)
  }, [])

  // ── End round (stable, reads from refs) ──────────────────────────────────
  const endRound = useCallback((forced?: RoundResult) => {
    if (roundEndedRef.current) return
    roundEndedRef.current = true

    const p1hp = p1HPRef.current
    const p2hp = p2HPRef.current
    const rNum = roundRef.current
    const prev = roundResultsRef.current

    const winner: RoundResult = forced
      ?? (p1hp <= 0 ? 'p2' : p2hp <= 0 ? 'p1' : p1hp > p2hp ? 'p1' : p1hp < p2hp ? 'p2' : 'tie')

    const newResults = [...prev, winner]
    setRoundResults(newResults)
    setRoundWinner(winner)
    setPhase('roundEnd')

    // Score
    const winnerHp = winner === 'p1' ? p1hp : winner === 'p2' ? p2hp : 0
    const roundScore = winner === 'tie'
      ? { p1: 60, p2: 60 }
      : { p1: winner==='p1' ? 120 + Math.round(winnerHp*0.5) + rNum*10 : 0,
          p2: winner==='p2' ? 120 + Math.round(winnerHp*0.5) + rNum*10 : 0 }
    setP1Score(s => s + roundScore.p1)
    setP2Score(s => s + roundScore.p2)

    // Sound
    if (winner === 'p1')  audio.roundWin()
    else if (winner === 'p2') audio.roundLose()
    else audio.roundTie()

    // Auto-advance after 3s
    const isLast = rNum >= TOTAL_ROUNDS
    setTimeout(() => {
      if (isLast) {
        audio.stopBgMusic()
        const p1W = newResults.filter(r=>r==='p1').length
        const p2W = newResults.filter(r=>r==='p2').length
        if (p1W > p2W)      audio.victory()
        else if (p2W > p1W) audio.defeat()
        else                audio.finalTie()
        setPhase('gameover')
      } else {
        setRound(r => r + 1)
        setP1HP(MAX_HP); setP2HP(MAX_HP)
        setP1CDs(new Array(p1PowersRef.current.length).fill(0))
        setP2CDs(new Array(p2PowersRef.current.length).fill(0))
        setP1El('fire'); setP2El('earth')
        setRoundTimer(ROUND_DURATION)
        setRoundWinner(null)
        setLog([])
        roundEndedRef.current = false
        setPhase('fighting')
      }
    }, 3200)
  }, [])

  // ── Round timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'fighting' || isPaused) return
    if (roundTimer <= 0) { endRound(); return }
    const t = setTimeout(() => setRoundTimer(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [roundTimer, phase, isPaused, endRound])

  // ── HP zero check ────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'fighting') return
    if (p1HP <= 0 || p2HP <= 0) endRound()
  }, [p1HP, p2HP, phase, endRound])

  // ── Fire powers (stable via refs) ───────────────────────────────────────
  const fireP1 = useCallback((idx: number) => {
    if (phaseRef.current !== 'fighting' || isPausedRef.current) return
    if (idx >= p1PowersRef.current.length) return
    const n = Date.now()
    if (n < p1CDsRef.current[idx]) return
    const pw  = p1PowersRef.current[idx]
    const dmg = Math.max(5, Math.round(pw.stats.damage * elMult(pw.stats.element, p2ElRef.current) * 0.65))
    setP2HP(h => Math.max(0, h - dmg))
    setP1CDs(c => { const a=[...c]; a[idx]=n+pw.cooldown*1000; return a })
    setP1El(pw.stats.element)
    lightKey(P1_LABELS[idx])
    flashHit('p2')
    showFloat(dmg, 'p2')
    addLog(`${pw.name} → -${dmg}💥`, '#a78bfa')
    audio.hit()
  }, [lightKey, flashHit, showFloat, addLog])

  const fireP2 = useCallback((idx: number) => {
    if (phaseRef.current !== 'fighting' || isPausedRef.current) return
    if (idx >= p2PowersRef.current.length) return
    const n = Date.now()
    if (n < p2CDsRef.current[idx]) return
    const pw  = p2PowersRef.current[idx]
    const dmg = Math.max(5, Math.round(pw.stats.damage * elMult(pw.stats.element, p1ElRef.current) * 0.65))
    setP1HP(h => Math.max(0, h - dmg))
    setP2CDs(c => { const a=[...c]; a[idx]=n+pw.cooldown*1000; return a })
    setP2El(pw.stats.element)
    lightKey(P2_LABELS[idx])
    flashHit('p1')
    showFloat(dmg, 'p1')
    addLog(`${pw.name} → -${dmg}💥`, '#f87171')
    audio.hit()
  }, [lightKey, flashHit, showFloat, addLog])

  // ── Keyboard (stable: uses refs, fires once) ─────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Bloquear poderes si el foco está en cualquier input de texto
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (phaseRef.current !== 'fighting' || isPausedRef.current) return
      const k  = e.key.toLowerCase()
      const i1 = P1_KEYS.indexOf(k)
      const i2 = P2_KEYS.indexOf(k)
      if (i1 >= 0) { e.preventDefault(); fireP1(i1) }
      if (i2 >= 0) { e.preventDefault(); fireP2(i2) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fireP1, fireP2])   // stable — won't re-run

  // ── Add custom powers ────────────────────────────────────────────────────
  const [p1Input, setP1Input] = useState('')
  const [p2Input, setP2Input] = useState('')
  const [p1Loading, setP1Loading] = useState(false)
  const [p2Loading, setP2Loading] = useState(false)

  async function addP1Power() {
    if (!p1Input.trim() || p1Loading) return
    setP1Loading(true)
    try {
      const r = await interpretPrompt(p1Input)
      const pw: Power = {
        id: `p1_${Date.now()}`, name: r.description.split(' ').slice(0,4).join(' '),
        description: r.description,
        stats: { damage: Math.min(95,Math.round(r.stats.damage*1.35)),
                 defense: Math.min(80,Math.round(r.stats.defense*1.2)), element: r.stats.element },
        cooldown: 6,
      }
      setP1Powers(prev => { const a=[...prev]; a.length<5 ? a.push(pw) : (a[4]=pw); return a })
      setP1CDs(prev => { const a=[...prev]; if(a.length<5) a.push(0); return a })
      setP1Input('')
      addLog(`✨ ${p1Name} creó "${pw.name}"`, '#fbbf24')
      audio.summon()
    } finally { setP1Loading(false) }
  }

  async function addP2Power() {
    if (!p2Input.trim() || p2Loading) return
    setP2Loading(true)
    try {
      const r = await interpretPrompt(p2Input)
      const pw: Power = {
        id: `p2_${Date.now()}`, name: r.description.split(' ').slice(0,4).join(' '),
        description: r.description,
        stats: { damage: Math.min(95,Math.round(r.stats.damage*1.35)),
                 defense: Math.min(80,Math.round(r.stats.defense*1.2)), element: r.stats.element },
        cooldown: 6,
      }
      setP2Powers(prev => { const a=[...prev]; a.length<5 ? a.push(pw) : (a[4]=pw); return a })
      setP2CDs(prev => { const a=[...prev]; if(a.length<5) a.push(0); return a })
      setP2Input('')
      addLog(`✨ ${p2Name} creó "${pw.name}"`, '#fbbf24')
      audio.summon()
    } finally { setP2Loading(false) }
  }

  // ── Restart ──────────────────────────────────────────────────────────────
  const restart = useCallback(() => {
    audio.stopBgMusic()
    audio.startBgMusic()
    setP1HP(MAX_HP); setP2HP(MAX_HP)
    setP1Powers(PRESET_POWERS); setP2Powers(PRESET_POWERS)
    setP1CDs([0,0,0,0]); setP2CDs([0,0,0,0])
    setP1El('fire'); setP2El('earth')
    setRound(1); setRoundTimer(ROUND_DURATION)
    setRoundResults([]); setRoundWinner(null)
    setP1Score(0); setP2Score(0)
    setLog([]); setFloats([])
    setP1Input(''); setP2Input('')
    setIsPaused(false)
    roundEndedRef.current = false
    setPhase('fighting')
  }, [])

  // ── Start game (from nameInput) ───────────────────────────────────────────
  const startGame = () => {
    audio.click()
    audio.startBgMusic()
    roundEndedRef.current = false
    setPhase('fighting')
  }

  // ── Gameover derived values ───────────────────────────────────────────────
  const p1Wins = roundResults.filter(r=>r==='p1').length
  const p2Wins = roundResults.filter(r=>r==='p2').length
  const overallWinner = p1Wins > p2Wins ? 'p1' : p2Wins > p1Wins ? 'p2' : 'tie'
  const p1Pct = p1HP / MAX_HP
  const p2Pct = p2HP / MAX_HP

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen text-white overflow-hidden flex flex-col relative" style={{ background: '#030712' }}>

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(6,182,212,0.08) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 80% 100%, rgba(168,85,247,0.08) 0%, transparent 70%)' }} />
      <div className="absolute inset-0 opacity-100 pointer-events-none"
        style={{ backgroundImage:'linear-gradient(rgba(6,182,212,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(6,182,212,0.05) 1px,transparent 1px)', backgroundSize:'60px 60px' }} />

      {/* Hit flashes */}
      {hitSide==='p1' && <div className="absolute left-0 inset-y-0 w-1/2 bg-red-500/25 z-20 pointer-events-none" />}
      {hitSide==='p2' && <div className="absolute right-0 inset-y-0 w-1/2 bg-red-500/25 z-20 pointer-events-none" />}

      {/* Floating damage numbers */}
      {floats.map(f => (
        <div key={f.id}
          className={`absolute z-30 font-black text-2xl pointer-events-none text-red-400
            ${f.side==='p1' ? 'left-[22%]' : 'left-[72%]'}`}
          style={{ top:'32%', transform:'translateX(-50%)',
            animation:'float-up 0.9s ease-out forwards', textShadow:'0 0 12px #ef4444' }}>
          -{f.value}
        </div>
      ))}

      {/* ═══════════════ NAME INPUT MODAL ═══════════════ */}
      {phase === 'nameInput' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: '#030712' }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage:'linear-gradient(rgba(6,182,212,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(6,182,212,0.05) 1px,transparent 1px)', backgroundSize:'60px 60px' }} />
          <div className="relative bg-white/5 border border-cyan-500/30 rounded-2xl p-8 flex flex-col gap-5 w-full max-w-md backdrop-blur-sm shadow-2xl">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs uppercase tracking-widest mb-3"
                style={{ fontFamily:"'Courier New',monospace" }}>
                ● PROMPT ARENA
              </div>
              <h1 className="text-4xl font-black text-white mb-1 uppercase tracking-wider"
                style={{ fontFamily:"'Courier New',monospace", textShadow:'0 0 30px rgba(6,182,212,0.4)' }}>
                ⚔ COMBAT
              </h1>
              <p className="text-gray-500 text-sm" style={{ fontFamily:"'Courier New',monospace" }}>
                2 JUGADORES · {TOTAL_ROUNDS} RONDAS · TIEMPO REAL
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-cyan-400 text-xs font-bold block mb-1.5 uppercase tracking-widest"
                  style={{ fontFamily:"'Courier New',monospace" }}>
                  P1_NAME <span className="text-gray-600 font-normal ml-1">[ Q W E R T ]</span>
                </label>
                <input type="text" value={p1Name}
                  onChange={e => setP1Name(e.target.value || 'Jugador 1')}
                  placeholder="Jugador 1" maxLength={20}
                  className="w-full px-4 py-3 bg-black/40 border border-cyan-500/30 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white text-lg font-bold" />
              </div>
              <div>
                <label className="text-pink-400 text-xs font-bold block mb-1.5 uppercase tracking-widest"
                  style={{ fontFamily:"'Courier New',monospace" }}>
                  P2_NAME <span className="text-gray-600 font-normal ml-1">[ U I O P Y ]</span>
                </label>
                <input type="text" value={p2Name}
                  onChange={e => setP2Name(e.target.value || 'Jugador 2')}
                  placeholder="Jugador 2" maxLength={20}
                  className="w-full px-4 py-3 bg-black/40 border border-pink-500/30 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-pink-500 text-white text-lg font-bold" />
              </div>
            </div>

            <button onClick={startGame}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-black text-xl
                hover:from-cyan-400 hover:to-purple-500 active:scale-95 transition-all uppercase tracking-widest"
              style={{ fontFamily:"'Courier New',monospace", boxShadow:'0 0 30px rgba(6,182,212,0.3)' }}>
              ⚔ INICIAR COMBATE
            </button>

            <div className="text-xs text-gray-600 text-center space-y-1" style={{ fontFamily:"'Courier New',monospace" }}>
              <p>// Cada jugador controla su mitad del teclado</p>
              <p>// Al escribir en el input, las teclas no disparan poderes</p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ PAUSE OVERLAY ═══════════════ */}
      {isPaused && phase !== 'nameInput' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="bg-white/5 border border-cyan-500/30 rounded-2xl p-8 flex flex-col gap-4 min-w-[270px]">
            <h2 className="text-2xl font-black text-center text-cyan-400 uppercase tracking-widest"
              style={{ fontFamily:"'Courier New',monospace" }}>⏸ PAUSA</h2>
            <button onClick={() => { audio.click(); setIsPaused(false) }}
              className="py-3 px-6 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-bold text-lg active:scale-95 transition-all uppercase tracking-widest"
              style={{ fontFamily:"'Courier New',monospace" }}>
              ▶ Continuar
            </button>
            <button onClick={() => { audio.click(); restart() }}
              className="py-3 px-6 bg-white/10 border border-white/20 rounded-xl font-semibold active:scale-95 transition-all">
              🔄 Reiniciar
            </button>
            <button onClick={() => { audio.click(); navigate('/') }}
              className="py-3 px-6 bg-red-900/40 border border-red-500/30 rounded-xl font-semibold text-red-300 active:scale-95 transition-all">
              🚪 Salir al inicio
            </button>
            {/* Volume */}
            <div className="flex items-center gap-3 mt-2">
              <button onClick={() => { setMuted(!muted); audio.click() }}
                className="text-lg shrink-0">{muted ? '🔇' : '🔊'}</button>
              <input type="range" min={0} max={1} step={0.05} value={volume}
                onChange={e => setVolume(Number(e.target.value))}
                className="flex-1 accent-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ ROUND END OVERLAY ═══════════════ */}
      {phase === 'roundEnd' && roundWinner !== null && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-none">
          <div className={`text-center py-6 px-10 rounded-2xl border ${
            roundWinner==='p1' ? 'bg-purple-900/70 border-purple-400/60' :
            roundWinner==='p2' ? 'bg-red-900/70 border-red-400/60' :
                                 'bg-yellow-900/70 border-yellow-400/60'}`}
            style={{ animation: 'bounce-in 0.4s both' }}>
            <p className="text-5xl mb-2">
              {roundWinner==='p1'? '🏆' : roundWinner==='p2'? '💀' : '🤝'}
            </p>
            <h2 className="text-3xl font-black mb-1">
              {roundWinner==='p1' ? `¡${p1Name} gana la ronda!` :
               roundWinner==='p2' ? `¡${p2Name} gana la ronda!` : '¡Empate!'}
            </h2>
            <p className="text-gray-300 text-sm">
              {p1Name}: {roundResults.filter(r=>r==='p1').length} rondas &nbsp;·&nbsp;
              {p2Name}: {roundResults.filter(r=>r==='p2').length} rondas
            </p>
            {round < TOTAL_ROUNDS &&
              <p className="text-purple-300 text-xs mt-2 animate-pulse">Siguiente ronda en 3s...</p>}
          </div>
        </div>
      )}

      {/* ═══════════════ GAME OVER ═══════════════ */}
      {phase === 'gameover' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden">
          <div className={`absolute inset-0 ${overallWinner==='p1'
            ? 'bg-gradient-to-b from-purple-950 via-indigo-950 to-gray-950'
            : overallWinner==='p2'
            ? 'bg-gradient-to-b from-red-950 via-gray-950 to-gray-950'
            : 'bg-gradient-to-b from-yellow-950 via-gray-950 to-gray-950'}`} />

          {/* Floating dots */}
          {Array.from({length:18},(_,i)=>(
            <div key={i} className={`absolute rounded-full pointer-events-none ${
              overallWinner==='p1'?'bg-purple-400': overallWinner==='p2'?'bg-red-400':'bg-yellow-400'}`}
              style={{ width:`${4+(i%5)*3}px`, height:`${4+(i%5)*3}px`,
                left:`${(i*37+10)%90}%`, top:`${(i*53+5)%80}%`,
                opacity: 0.1+(i%4)*0.06,
                animation:`float-dot ${3+(i%4)}s ease-in-out ${i*0.3}s infinite alternate` }} />
          ))}

          <div className="relative z-10 flex flex-col items-center gap-4 px-8 max-w-lg w-full">
            <div className="text-8xl" style={{ animation:'bounce-in 0.6s both' }}>
              {overallWinner==='p1'?'🏆': overallWinner==='p2'?'🏆':'🤝'}
            </div>
            <h1 className={`text-4xl font-black ${
              overallWinner==='p1'?'text-purple-300':overallWinner==='p2'?'text-red-300':'text-yellow-300'}`}
              style={{ textShadow:'0 0 30px currentColor' }}>
              {overallWinner==='p1' ? `¡${p1Name} GANA!` :
               overallWinner==='p2' ? `¡${p2Name} GANA!` : '¡EMPATE!'}
            </h1>

            {/* Scores */}
            <div className="grid grid-cols-3 gap-4 w-full">
              <div className="bg-purple-900/40 border border-purple-400/30 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-400 mb-1">{p1Name}</p>
                <p className="text-3xl font-black text-purple-300">{p1Wins}</p>
                <p className="text-xs text-gray-500">rondas</p>
                <p className="text-lg font-bold text-purple-400 mt-1">{p1Score.toLocaleString()} pts</p>
              </div>
              <div className="flex flex-col items-center justify-center gap-2">
                <RoundDots results={roundResults} total={TOTAL_ROUNDS} />
                <p className="text-xs text-gray-500">resultado</p>
              </div>
              <div className="bg-red-900/40 border border-red-400/30 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-400 mb-1">{p2Name}</p>
                <p className="text-3xl font-black text-red-300">{p2Wins}</p>
                <p className="text-xs text-gray-500">rondas</p>
                <p className="text-lg font-bold text-red-400 mt-1">{p2Score.toLocaleString()} pts</p>
              </div>
            </div>

            <div className="flex gap-4 w-full">
              <button onClick={() => { audio.click(); restart() }}
                className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-bold text-lg
                  hover:from-cyan-400 hover:to-purple-500 active:scale-95 transition-all uppercase tracking-widest"
                style={{ fontFamily:"'Courier New',monospace", boxShadow:'0 0 20px rgba(6,182,212,0.25)' }}>
                🔄 Revancha
              </button>
              <button onClick={() => { audio.click(); setPhase('nameInput'); setP1Name('Jugador 1'); setP2Name('Jugador 2') }}
                className="px-6 py-4 bg-white/10 border border-white/20 rounded-xl font-semibold hover:bg-white/20 transition-all active:scale-95">
                👥 Cambiar nombres
              </button>
              <button onClick={() => { audio.click(); navigate('/') }}
                className="px-6 py-4 bg-white/10 border border-white/20 rounded-xl font-semibold hover:bg-white/20 transition-all active:scale-95">
                🏠
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ BATTLE UI ═══════════════ */}
      {(phase === 'fighting' || phase === 'roundEnd') && (
        <div className="relative z-10 flex flex-col h-full max-w-7xl mx-auto w-full px-4 py-3">

          {/* Header */}
          <div className="flex items-center justify-between mb-2 shrink-0">
            <button onClick={() => { audio.click(); navigate('/') }}
              className="text-cyan-600 hover:text-cyan-400 text-sm transition-colors"
              style={{ fontFamily:"'Courier New',monospace" }}>← INICIO</button>

            <div className="flex flex-col items-center gap-1">
              <span className="text-cyan-400 font-black tracking-widest text-sm"
              style={{ fontFamily:"'Courier New',monospace" }}>PROMPT ARENA</span>
              <div className="flex items-center gap-3">
                <RoundDots results={roundResults} total={TOTAL_ROUNDS} />
                <span className="text-xs text-gray-500">Ronda {round}/{TOTAL_ROUNDS}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Timer */}
              <div className={`text-lg font-black tabular-nums px-2 py-0.5 rounded-lg ${
                roundTimer <= 10 ? 'text-red-400 bg-red-900/30 animate-pulse' : 'text-purple-300 bg-white/5'}`}>
                {roundTimer}s
              </div>
              <button onClick={() => { audio.click(); setIsPaused(true) }}
                className="w-9 h-9 flex items-center justify-center bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-all">
                ⏸
              </button>
            </div>
          </div>

          {/* HP bars */}
          <div className="grid grid-cols-2 gap-6 mb-3 shrink-0">
            <HPBar hp={p1HP} name={p1Name} />
            <HPBar hp={p2HP} name={p2Name} flip />
          </div>

          {/* 3-column battle area */}
          <div className="flex gap-3 flex-1 min-h-0">

            {/* P1 column */}
            <div className="flex flex-col gap-2 w-[290px] shrink-0">
              <div className="flex justify-center relative">
                <CreatureCanvas element={p1El} damage={75} defense={40}
                  seed={11111 + p1Powers.length} size={145} />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${
                    p1Pct>0.55?'bg-green-500':p1Pct>0.25?'bg-yellow-500':'bg-red-500'}`}
                    style={{ width:`${p1Pct*100}%` }} />
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto">
                {p1Powers.map((pw,i) => (
                  <PowerCard key={pw.id} power={pw} keyLabel={P1_LABELS[i]}
                    cooldownExpiry={p1CDs[i]??0} now={now}
                    onFire={() => fireP1(i)} lit={litKeys.has(P1_LABELS[i])} />
                ))}
              </div>
              {/* Custom power input */}
              <div className="flex gap-1 shrink-0">
                <input type="text" value={p1Input}
                  onChange={e => setP1Input(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && addP1Power()}
                  placeholder={p1Loading ? '⚙ Forjando...' : `✦ Poder de ${p1Name} [T]`}
                  disabled={p1Loading}
                  className="flex-1 px-2 py-2 bg-black/40 border border-purple-500/30 rounded-lg text-xs
                    focus:outline-none focus:ring-1 focus:ring-purple-500 text-white placeholder-gray-600" />
                <button onClick={addP1Power} disabled={p1Loading || !p1Input.trim()}
                  className="px-3 py-2 bg-purple-600/50 rounded-lg text-xs font-bold hover:bg-purple-600 transition-all disabled:opacity-40 active:scale-95">
                  ⚡
                </button>
              </div>
            </div>

            {/* Center */}
            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              <div className="text-4xl font-black text-white/8 mt-4">VS</div>
              {/* Element advantage */}
              <div className="text-xs text-gray-600 text-center">
                {ELEMENT_ICONS[p1El]} vs {ELEMENT_ICONS[p2El]}
                {ELEMENT_BEATS[p1El]===p2El && <span className="text-green-400 ml-1">↑ {p1Name}</span>}
                {ELEMENT_BEATS[p2El]===p1El && <span className="text-red-400   ml-1">↑ {p2Name}</span>}
              </div>
              {/* Combat log */}
              <div className="flex-1 w-full flex flex-col gap-1 justify-end overflow-hidden">
                {[...log].reverse().map((e,i) => (
                  <div key={i} className="text-xs px-2 py-1 bg-black/40 border border-white/5 rounded-lg text-center"
                    style={{ color:e.color, opacity:0.4+(i/log.length)*0.6 }}>
                    {e.text}
                  </div>
                ))}
              </div>
              {/* Scores display */}
              <div className="flex justify-between w-full text-xs text-gray-500 border-t border-white/5 pt-1">
                <span className="text-purple-400 font-bold">{p1Score.toLocaleString()} pts</span>
                <span className="text-red-400 font-bold">{p2Score.toLocaleString()} pts</span>
              </div>
            </div>

            {/* P2 column */}
            <div className="flex flex-col gap-2 w-[290px] shrink-0">
              <div className="flex justify-center relative">
                <CreatureCanvas element={p2El} damage={70} defense={50}
                  seed={22222 + p2Powers.length} size={145} flip />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${
                    p2Pct>0.55?'bg-green-500':p2Pct>0.25?'bg-yellow-500':'bg-red-500'}`}
                    style={{ width:`${p2Pct*100}%` }} />
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto">
                {p2Powers.map((pw,i) => (
                  <PowerCard key={pw.id} power={pw} keyLabel={P2_LABELS[i]}
                    cooldownExpiry={p2CDs[i]??0} now={now}
                    onFire={() => fireP2(i)} flip lit={litKeys.has(P2_LABELS[i])} />
                ))}
              </div>
              <div className="flex gap-1 shrink-0 flex-row-reverse">
                <input type="text" value={p2Input}
                  onChange={e => setP2Input(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && addP2Power()}
                  placeholder={p2Loading ? '⚙ Forjando...' : `✦ Poder de ${p2Name} [Y]`}
                  disabled={p2Loading}
                  className="flex-1 px-2 py-2 bg-black/40 border border-red-500/30 rounded-lg text-xs text-right
                    focus:outline-none focus:ring-1 focus:ring-red-500 text-white placeholder-gray-600" />
                <button onClick={addP2Power} disabled={p2Loading || !p2Input.trim()}
                  className="px-3 py-2 bg-red-600/50 rounded-lg text-xs font-bold hover:bg-red-600 transition-all disabled:opacity-40 active:scale-95">
                  ⚡
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce-in {
          0%   { transform: scale(0) rotate(-8deg); opacity: 0 }
          60%  { transform: scale(1.15) rotate(2deg) }
          100% { transform: scale(1) rotate(0deg); opacity: 1 }
        }
        @keyframes float-up {
          0%   { transform: translateX(-50%) translateY(0);    opacity: 1 }
          100% { transform: translateX(-50%) translateY(-80px); opacity: 0 }
        }
        @keyframes float-dot {
          from { transform: translateY(0)   rotate(0deg) }
          to   { transform: translateY(-18px) rotate(180deg) }
        }
      `}</style>
    </div>
  )
}
