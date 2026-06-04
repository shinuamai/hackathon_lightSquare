import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Particles, { ParticlesProvider, useParticlesProvider } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'

// ── GlitchText ────────────────────────────────────────────────────────────────
function GlitchText({ text }: { text: string }) {
  const [glitching, setGlitching] = useState(false)

  useEffect(() => {
    const trigger = () => {
      setGlitching(true)
      setTimeout(() => setGlitching(false), 400)
    }
    trigger()
    const id = setInterval(trigger, 3500 + Math.random() * 2000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="relative inline-block select-none">
      <span className="relative z-10 block font-black uppercase tracking-[0.15em] text-white"
        style={{ fontFamily: "'Courier New', monospace" }}>
        {text}
      </span>
      {glitching && (
        <>
          <span className="absolute inset-0 font-black uppercase tracking-[0.15em] text-cyan-400 z-20"
            style={{ fontFamily: "'Courier New', monospace", clipPath: 'inset(20% 0 60% 0)', transform: 'translateX(-4px)', mixBlendMode: 'screen' }}>
            {text}
          </span>
          <span className="absolute inset-0 font-black uppercase tracking-[0.15em] text-pink-500 z-20"
            style={{ fontFamily: "'Courier New', monospace", clipPath: 'inset(55% 0 10% 0)', transform: 'translateX(4px)', mixBlendMode: 'screen' }}>
            {text}
          </span>
          <span className="absolute inset-0 font-black uppercase tracking-[0.15em] text-yellow-300 z-20"
            style={{ fontFamily: "'Courier New', monospace", clipPath: 'inset(40% 0 30% 0)', transform: 'translateX(-2px) translateY(2px)', mixBlendMode: 'screen', opacity: 0.7 }}>
            {text}
          </span>
        </>
      )}
    </div>
  )
}

// ── ScanLines ─────────────────────────────────────────────────────────────────
function ScanLines() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)',
        }}
      />
      <motion.div
        className="absolute left-0 right-0 h-32"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(6,182,212,0.04), transparent)' }}
        animate={{ y: ['-10%', '110%'] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  )
}

// ── TypewriterText ────────────────────────────────────────────────────────────
function TypewriterText({ text, delay = 0, className = '' }: { text: string; delay?: number; className?: string }) {
  const [displayed, setDisplayed] = useState('')
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const startTimer = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(startTimer)
  }, [delay])

  useEffect(() => {
    if (!started) return
    if (displayed.length >= text.length) return
    const t = setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), 35)
    return () => clearTimeout(t)
  }, [started, displayed, text])

  return (
    <span className={className}>
      {displayed}
      {displayed.length < text.length && (
        <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.6, repeat: Infinity }}>▌</motion.span>
      )}
    </span>
  )
}

// ── NeonButton ────────────────────────────────────────────────────────────────
function NeonButton({ children, onClick, primary }: { children: React.ReactNode; onClick: () => void; primary?: boolean }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      className={`relative px-8 py-4 font-bold text-base uppercase tracking-widest overflow-hidden rounded-lg transition-all
        ${primary
          ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-[0_0_30px_rgba(6,182,212,0.4)]'
          : 'bg-transparent border border-cyan-500/50 text-cyan-400 hover:border-cyan-400'
        }`}
      style={{ fontFamily: "'Courier New', monospace" }}
    >
      {primary && (
        <motion.span
          className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-purple-500/20"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </motion.button>
  )
}

// ── StatBadge ─────────────────────────────────────────────────────────────────
function StatBadge({ label, value, delay }: { label: string; value: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="flex flex-col items-center px-5 py-3 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm"
    >
      <span className="text-2xl font-black text-cyan-400" style={{ fontFamily: "'Courier New', monospace" }}>{value}</span>
      <span className="text-xs text-gray-500 uppercase tracking-widest mt-0.5">{label}</span>
    </motion.div>
  )
}

// ── HowToPlay card ────────────────────────────────────────────────────────────
function HowToCard({ step, icon, title, text, delay }: { step: string; icon: string; title: string; text: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ borderColor: 'rgba(6,182,212,0.5)', boxShadow: '0 0 20px rgba(6,182,212,0.1)' }}
      className="flex gap-4 items-start bg-white/5 border border-white/10 rounded-xl p-5 transition-all cursor-default"
    >
      <div className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-xl">
        {icon}
      </div>
      <div>
        <p className="text-xs text-cyan-500 uppercase tracking-widest font-bold mb-1" style={{ fontFamily: "'Courier New', monospace" }}>
          PASO_{step}
        </p>
        <p className="text-white font-semibold mb-1">{title}</p>
        <p className="text-gray-400 text-sm">{text}</p>
      </div>
    </motion.div>
  )
}

// ── ParticlesBackground ───────────────────────────────────────────────────────
function ParticlesBackground() {
  const { loaded } = useParticlesProvider()
  if (!loaded) return null
  return (
    <Particles
      id="tsparticles"
      options={{
        fullScreen: false,
        background: { color: { value: '#030712' } },
        fpsLimit: 60,
        interactivity: {
          events: { onHover: { enable: true, mode: 'repulse' }, resize: true },
          modes: { repulse: { distance: 80, duration: 0.4 } },
        },
        particles: {
          color: { value: ['#06b6d4', '#a855f7', '#ec4899'] },
          links: { color: '#06b6d4', distance: 130, enable: true, opacity: 0.2, width: 1 },
          move: { enable: true, speed: 0.6, direction: 'none', outModes: 'bounce' },
          number: { density: { enable: true }, value: 70 },
          opacity: { value: { min: 0.2, max: 0.6 } },
          shape: { type: 'circle' },
          size: { value: { min: 1, max: 2.5 } },
        },
        detectRetina: true,
      }}
      className="absolute inset-0 w-full h-full"
    />
  )
}

// ── Main Home ─────────────────────────────────────────────────────────────────
function Home() {
  const navigate = useNavigate()

  const steps = [
    { icon: '👥', title: 'Ingresa los nombres', text: 'Dos jugadores en un mismo teclado. P1 usa las teclas Q W E R T, P2 usa U I O P Y.' },
    { icon: '⚔️', title: 'Dispara tus poderes', text: 'Cada tecla lanza un poder predefinido con daño, defensa y elemento únicos. Cooldown real.' },
    { icon: '✨', title: 'Forja poderes personalizados', text: 'Escribe tu invocación en el input y Gemini AI la convierte en un poder exclusivo.' },
    { icon: '🔥', title: 'Ventajas de elemento', text: 'Fuego > Hielo > Rayo > Tierra > Agua > Aire > Fuego. 5 rondas, el que más HP conserva gana.' },
  ]

  return (
    <ParticlesProvider init={loadSlim}>
    <div className="min-h-screen bg-[#030712] text-white overflow-x-hidden">

      {/* ── Particles ── */}
      <div className="fixed inset-0 z-0">
        <ParticlesBackground />
      </div>

      <ScanLines />

      {/* ── Grid overlay ── */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20"
        style={{ backgroundImage: 'linear-gradient(rgba(6,182,212,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(6,182,212,0.07) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* ── HERO ── */}
      <section className="relative z-20 min-h-screen flex flex-col items-center justify-center px-6 py-20 text-center">

        {/* Corner decorations */}
        <div className="absolute top-6 left-6 w-8 h-8 border-l-2 border-t-2 border-cyan-500/50" />
        <div className="absolute top-6 right-6 w-8 h-8 border-r-2 border-t-2 border-cyan-500/50" />
        <div className="absolute bottom-6 left-6 w-8 h-8 border-l-2 border-b-2 border-purple-500/50" />
        <div className="absolute bottom-6 right-6 w-8 h-8 border-r-2 border-b-2 border-purple-500/50" />

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs uppercase tracking-widest"
          style={{ fontFamily: "'Courier New', monospace" }}
        >
          <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>●</motion.span>
          POWERED BY GEMINI AI
        </motion.div>

        {/* Main title */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.7, type: 'spring', stiffness: 100 }}
          className="mb-2"
        >
          <div className="text-5xl sm:text-7xl md:text-8xl leading-none"
            style={{ textShadow: '0 0 60px rgba(6,182,212,0.3), 0 0 120px rgba(168,85,247,0.2)' }}>
            <GlitchText text="LIGHT" />
          </div>
          <div className="text-5xl sm:text-7xl md:text-8xl leading-none"
            style={{ textShadow: '0 0 60px rgba(168,85,247,0.3), 0 0 120px rgba(236,72,153,0.2)' }}>
            <GlitchText text="SQUARE" />
          </div>
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="w-48 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent my-6"
        />

        {/* Subtitle typewriter */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-base sm:text-xl text-gray-400 max-w-xl mb-10 min-h-[3rem]"
          style={{ fontFamily: "'Courier New', monospace" }}
        >
          <TypewriterText text="Forja tu arma con palabras. Derrota con inteligencia." delay={1400} />
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.4, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 mb-14"
        >
          <NeonButton primary onClick={() => navigate('/play')}>
            ⚔ INICIAR COMBATE
          </NeonButton>
          <NeonButton onClick={() => document.getElementById('how-to-play')?.scrollIntoView({ behavior: 'smooth' })}>
            {'>'} CÓMO JUGAR
          </NeonButton>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.7 }}
          className="flex gap-4 flex-wrap justify-center"
        >
          <StatBadge label="Elementos" value="6" delay={2.8} />
          <StatBadge label="Rondas" value="5" delay={2.9} />
          <StatBadge label="Jugadores" value="2" delay={3.0} />
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.2 }}
          className="absolute bottom-10 flex flex-col items-center gap-2 text-gray-600 text-xs uppercase tracking-widest"
          style={{ fontFamily: "'Courier New', monospace" }}
        >
          <span>SCROLL</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            ↓
          </motion.div>
        </motion.div>
      </section>

      {/* ── HOW TO PLAY ── */}
      <section id="how-to-play" className="relative z-20 max-w-2xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-xs text-cyan-500 uppercase tracking-widest mb-3" style={{ fontFamily: "'Courier New', monospace" }}>
            // MANUAL_DE_COMBATE
          </p>
          <h2 className="text-3xl font-black uppercase tracking-wider">Cómo Jugar</h2>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent mx-auto mt-4" />
        </motion.div>

        <div className="space-y-4">
          {steps.map((s, i) => (
            <HowToCard key={i} step={String(i + 1)} icon={s.icon} title={s.title} text={s.text} delay={i * 0.1} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <NeonButton primary onClick={() => navigate('/play')}>
            ⚔ ENTRAR AL ARENA
          </NeonButton>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="relative z-20 text-center py-8 text-gray-700 text-xs border-t border-white/5"
        style={{ fontFamily: "'Courier New', monospace" }}
      >
        LIGHTSQUARE_v1.0 // POWERED BY GEMINI AI // {new Date().getFullYear()}
      </motion.footer>
    </div>
    </ParticlesProvider>
  )
}

export default Home
