import { useEffect, useRef } from 'react'
import type { ElementType } from '../types'

// ── Palettes ──────────────────────────────────────────────────────────────────
interface Palette { p1: string; p2: string; p3: string }

const PALETTES: Record<ElementType, Palette> = {
  fire:      { p1: '#ff2200', p2: '#ff7700', p3: '#ffdd00' },
  ice:       { p1: '#00aaff', p2: '#88ddff', p3: '#ffffff' },
  lightning: { p1: '#eecc00', p2: '#ffff44', p3: '#ffffff' },
  earth:     { p1: '#7a3b00', p2: '#a0622a', p3: '#d4a853' },
  water:     { p1: '#0044cc', p2: '#0099cc', p3: '#44ddff' },
  air:       { p1: '#7799bb', p2: '#aabbcc', p3: '#ddeeff' },
}
const UNKNOWN_PAL: Palette = { p1: '#333355', p2: '#5555aa', p3: '#8888cc' }

// ── Props ─────────────────────────────────────────────────────────────────────
export interface CreatureCanvasProps {
  element: ElementType
  damage: number
  defense: number
  seed: number
  size?: number
  flip?: boolean
  defeated?: boolean
  unknown?: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function hexAlpha(hex: string, a: number): string {
  return hex + Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, '0')
}

// ── Main component ────────────────────────────────────────────────────────────
export function CreatureCanvas({
  element, damage, defense, seed,
  size = 200, flip = false, defeated = false, unknown = false,
}: CreatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef(0)
  const frameRef  = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width  = size
    canvas.height = size

    const pal = unknown ? UNKNOWN_PAL : PALETTES[element]
    const cx  = size / 2
    const cy  = size / 2

    // Creature archetype (0-3)
    const archetype  = seed % 4
    // Size of core body – bigger creatures for high stats
    const power      = (damage + defense) / 200   // 0..1
    const coreR      = size * (0.11 + power * 0.06)
    const numSpikes  = unknown ? 0 : Math.max(3, Math.floor(damage / 11))
    const numRings   = unknown ? 0 : Math.min(4, Math.floor(defense / 20))
    const hasWings   = (seed % 3 === 0) && !unknown
    const hasCrown   = damage > 65 && !unknown
    const hasTail    = (seed % 5 < 2) && !unknown

    // ─────────────────────────────────────────────────────────────────────────
    function drawAura(t: number) {
      const r1 = size * 0.38 + Math.sin(t * 0.035) * size * 0.03
      const r2 = size * 0.48 + Math.sin(t * 0.025 + 1) * size * 0.02
      // outer soft halo
      const g2 = ctx!.createRadialGradient(cx, cy, r1 * 0.3, cx, cy, r2)
      g2.addColorStop(0, hexAlpha(pal.p1, 0.22))
      g2.addColorStop(1, hexAlpha(pal.p1, 0))
      ctx!.fillStyle = g2
      ctx!.beginPath(); ctx!.arc(cx, cy, r2, 0, Math.PI * 2); ctx!.fill()
      // inner bright core aura
      const g1 = ctx!.createRadialGradient(cx, cy, 0, cx, cy, r1)
      g1.addColorStop(0,   hexAlpha(pal.p2, 0.7))
      g1.addColorStop(0.4, hexAlpha(pal.p1, 0.35))
      g1.addColorStop(1,   hexAlpha(pal.p1, 0))
      ctx!.fillStyle = g1
      ctx!.beginPath(); ctx!.arc(cx, cy, r1, 0, Math.PI * 2); ctx!.fill()
    }

    // ── Element particles ─────────────────────────────────────────────────────
    function drawParticles(t: number) {
      if (unknown) return
      ctx!.save()
      switch (element) {
        case 'fire': {
          for (let i = 0; i < 12; i++) {
            const age = ((t * 0.7 + i * 5) % 55) / 55
            const ang = (i / 12) * Math.PI * 2 + Math.sin(seed * 0.01 + i)
            const spread = coreR * 0.8
            const px = cx + Math.cos(ang) * spread * (0.4 + Math.sin(t*0.04+i)*0.3)
            const py = cy - age * coreR * 3.5
            const ps = (1 - age) * 5
            ctx!.globalAlpha = (1 - age) * 0.85
            ctx!.fillStyle = age < 0.45 ? pal.p1 : pal.p3
            ctx!.beginPath(); ctx!.arc(px, py, ps, 0, Math.PI * 2); ctx!.fill()
          }
          break
        }
        case 'ice': {
          for (let i = 0; i < 8; i++) {
            const age = ((t * 0.5 + i * 7) % 60) / 60
            const ang = (i / 8) * Math.PI * 2 + (seed % 10) * 0.3
            const dist = coreR * 1.8
            const px = cx + Math.cos(ang + age * 0.5) * dist
            const py = cy + Math.sin(ang + age * 0.5) * dist
            const ps = 3 - age * 2
            ctx!.globalAlpha = (1 - age) * 0.8
            ctx!.strokeStyle = pal.p3
            ctx!.lineWidth = 1
            // draw tiny cross for crystal
            ctx!.beginPath()
            ctx!.moveTo(px - ps, py); ctx!.lineTo(px + ps, py)
            ctx!.moveTo(px, py - ps); ctx!.lineTo(px, py + ps)
            ctx!.moveTo(px - ps*.7, py - ps*.7); ctx!.lineTo(px + ps*.7, py + ps*.7)
            ctx!.moveTo(px - ps*.7, py + ps*.7); ctx!.lineTo(px + ps*.7, py - ps*.7)
            ctx!.stroke()
          }
          break
        }
        case 'lightning': {
          for (let i = 0; i < 5; i++) {
            if ((t + i * 7) % 20 < 3) {
              const ang = (i / 5) * Math.PI * 2 + t * 0.3
              const x1 = cx + Math.cos(ang) * coreR * 1.1
              const y1 = cy + Math.sin(ang) * coreR * 1.1
              const x2 = cx + Math.cos(ang) * coreR * 2.8 + (Math.random() - 0.5) * 20
              const y2 = cy + Math.sin(ang) * coreR * 2.8 + (Math.random() - 0.5) * 20
              ctx!.globalAlpha = 0.9
              ctx!.strokeStyle = pal.p3
              ctx!.lineWidth = 1.5
              ctx!.shadowColor = pal.p2; ctx!.shadowBlur = 6
              ctx!.beginPath(); ctx!.moveTo(x1, y1)
              ctx!.lineTo((x1+x2)/2 + (Math.random()-0.5)*15, (y1+y2)/2 + (Math.random()-0.5)*15)
              ctx!.lineTo(x2, y2); ctx!.stroke()
              ctx!.shadowBlur = 0
            }
          }
          break
        }
        case 'earth': {
          for (let i = 0; i < 6; i++) {
            const ang = (i / 6) * Math.PI * 2 + t * 0.008 + (seed % 20) * 0.1
            const dist = coreR * 2 + Math.sin(t * 0.04 + i) * coreR * 0.3
            const px = cx + Math.cos(ang) * dist
            const py = cy + Math.sin(ang) * dist
            const ps = 5 + (i % 3) * 2
            ctx!.globalAlpha = 0.7
            ctx!.fillStyle = pal.p1
            ctx!.beginPath()
            // irregular rock shape
            ctx!.arc(px, py, ps, 0, Math.PI * 2)
            ctx!.fill()
            ctx!.strokeStyle = pal.p3; ctx!.lineWidth = 1
            ctx!.stroke()
          }
          break
        }
        case 'water': {
          for (let i = 0; i < 4; i++) {
            const age = ((t * 0.4 + i * 15) % 60) / 60
            const r = coreR * (0.8 + age * 1.8)
            ctx!.globalAlpha = (1 - age) * 0.35
            ctx!.strokeStyle = pal.p2
            ctx!.lineWidth = 1.5
            ctx!.beginPath(); ctx!.arc(cx, cy, r, 0, Math.PI * 2); ctx!.stroke()
          }
          break
        }
        case 'air': {
          for (let i = 0; i < 6; i++) {
            const ang = t * 0.03 + (i / 6) * Math.PI * 2
            const r1 = coreR * 1.4, r2 = coreR * 2.6
            ctx!.globalAlpha = 0.25 + Math.sin(t * 0.05 + i) * 0.1
            ctx!.strokeStyle = pal.p3
            ctx!.lineWidth = 1.5
            ctx!.beginPath()
            ctx!.arc(cx + Math.cos(ang) * (r1-r2)/2, cy + Math.sin(ang) * (r1-r2)/2,
              (r1+r2)/2, ang, ang + Math.PI * 1.1)
            ctx!.stroke()
          }
          break
        }
      }
      ctx!.globalAlpha = 1
      ctx!.restore()
    }

    // ── Body drawing by archetype ──────────────────────────────────────────────
    function drawBody(t: number) {
      if (!ctx) return
      const pulse = Math.sin(t * 0.05) * coreR * 0.06
      const r = coreR + pulse

      ctx.shadowColor = pal.p1
      ctx.shadowBlur  = 30

      switch (archetype) {
        case 0: { // Sphere / Mage
          const g = ctx.createRadialGradient(cx - r*.3, cy - r*.4, 0, cx, cy, r)
          g.addColorStop(0,   '#ffffff')
          g.addColorStop(0.3, pal.p3)
          g.addColorStop(0.7, pal.p2)
          g.addColorStop(1,   pal.p1)
          ctx.fillStyle = g
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()
          break
        }
        case 1: { // Beast – oval body + head
          // torso
          const g = ctx.createRadialGradient(cx, cy + r*.2, 0, cx, cy, r * 1.5)
          g.addColorStop(0, pal.p2); g.addColorStop(1, pal.p1)
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.ellipse(cx, cy + r * .35, r * 1.1, r * 0.9, 0, 0, Math.PI * 2)
          ctx.fill()
          // head
          const g2 = ctx.createRadialGradient(cx - r*.2, cy - r*.8, 0, cx, cy - r*.8, r*.75)
          g2.addColorStop(0, pal.p3); g2.addColorStop(1, pal.p1)
          ctx.fillStyle = g2
          ctx.beginPath(); ctx.arc(cx, cy - r * .75, r * .75, 0, Math.PI * 2); ctx.fill()
          // fangs
          if (damage > 40) {
            ctx.fillStyle = '#ffffee'
            ctx.shadowBlur = 5
            ;[-1, 1].forEach(s => {
              ctx.beginPath()
              ctx.moveTo(cx + s * r * .35, cy - r * .15)
              ctx.lineTo(cx + s * r * .25, cy + r * .25)
              ctx.lineTo(cx + s * r * .5,  cy - r * .15)
              ctx.closePath(); ctx.fill()
            })
          }
          break
        }
        case 2: { // Crystal / Golem
          const sides = 6 + (seed % 3)
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 1.1)
          g.addColorStop(0, pal.p3); g.addColorStop(0.5, pal.p2); g.addColorStop(1, pal.p1)
          ctx.fillStyle = g
          ctx.beginPath()
          for (let i = 0; i < sides; i++) {
            const a = (i / sides) * Math.PI * 2 - Math.PI / 2
            const jitter = 1 + (((seed * (i + 1)) % 7) - 3) * 0.08
            const x = cx + Math.cos(a) * r * 1.1 * jitter
            const y = cy + Math.sin(a) * r * 1.1 * jitter
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
          }
          ctx.closePath(); ctx.fill()
          // inner crystal reflection
          ctx.globalAlpha = 0.4
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.moveTo(cx - r*.05, cy - r*.7)
          ctx.lineTo(cx - r*.35, cy + r*.1)
          ctx.lineTo(cx + r*.05, cy - r*.2)
          ctx.closePath(); ctx.fill()
          ctx.globalAlpha = 1
          break
        }
        case 3: { // Spirit / Ghost
          // layered translucent teardrops
          for (let layer = 3; layer >= 0; layer--) {
            const lr = r * (1 + layer * 0.18)
            const lAlpha = 0.6 - layer * 0.12
            const g = ctx.createRadialGradient(cx, cy - lr*.2, 0, cx, cy, lr)
            g.addColorStop(0, hexAlpha(pal.p3, lAlpha + 0.2))
            g.addColorStop(0.6, hexAlpha(pal.p2, lAlpha))
            g.addColorStop(1,   hexAlpha(pal.p1, 0))
            ctx.fillStyle = g
            ctx.beginPath()
            ctx.arc(cx, cy - r * .05, lr, 0, Math.PI * 2)
            ctx.fill()
          }
          // wavy bottom tail
          ctx.strokeStyle = hexAlpha(pal.p2, 0.6)
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.moveTo(cx - r * .5, cy + r * .7)
          for (let w = 0; w <= 20; w++) {
            const wx = cx - r * .5 + (r) * (w / 20)
            const wy = cy + r * .7 + Math.sin(w * 0.9 + t * 0.06) * r * .25
            ctx.lineTo(wx, wy)
          }
          ctx.stroke()
          break
        }
      }
      ctx.shadowBlur = 0
    }

    // ── Spikes (damage) ───────────────────────────────────────────────────────
    function drawSpikes(t: number) {
      if (!ctx || unknown) return
      ctx.shadowColor = pal.p1; ctx.shadowBlur = 12
      for (let i = 0; i < numSpikes; i++) {
        const baseAngle = (i / numSpikes) * Math.PI * 2 + t * 0.015
        const inner  = coreR * (archetype === 1 ? 1.3 : 1.1)
        const outer  = coreR * 2.2 + (damage / 100) * coreR * 1.2
        const half   = 0.18 - (damage / 100) * 0.06   // thinner at high damage = sharper
        const tx = cx + Math.cos(baseAngle) * outer
        const ty = cy + Math.sin(baseAngle) * outer
        const lx = cx + Math.cos(baseAngle - half) * inner
        const ly = cy + Math.sin(baseAngle - half) * inner
        const rx = cx + Math.cos(baseAngle + half) * inner
        const ry = cy + Math.sin(baseAngle + half) * inner

        const g = ctx.createLinearGradient(cx, cy, tx, ty)
        g.addColorStop(0, pal.p3); g.addColorStop(1, pal.p1)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.moveTo(tx, ty)
        ctx.lineTo(lx, ly)
        ctx.lineTo(rx, ry)
        ctx.closePath(); ctx.fill()
      }
      ctx.shadowBlur = 0
    }

    // ── Defense rings (shield aura) ───────────────────────────────────────────
    function drawRings(t: number) {
      if (!ctx || unknown) return
      for (let i = 0; i < numRings; i++) {
        const ringR = coreR * 1.8 + i * (coreR * 0.55)
        const speed = 0.008 * (i % 2 === 0 ? 1 : -1)
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(t * speed)
        const alpha = 0.3 + Math.sin(t * 0.04 + i) * 0.12
        ctx.strokeStyle = hexAlpha(pal.p3, alpha)
        ctx.lineWidth = 2
        ctx.setLineDash([8, 8])
        ctx.shadowColor = pal.p3; ctx.shadowBlur = 8
        ctx.beginPath(); ctx.arc(0, 0, ringR, 0, Math.PI * 2); ctx.stroke()
        ctx.shadowBlur = 0
        ctx.setLineDash([])
        ctx.restore()
      }
    }

    // ── Crown (high damage) ───────────────────────────────────────────────────
    function drawCrown() {
      if (!ctx || !hasCrown) return
      const topY = cy - coreR * (archetype === 1 ? 2.2 : 1.7)
      const points = 5
      ctx.shadowColor = pal.p3; ctx.shadowBlur = 15
      ctx.fillStyle = pal.p3
      ctx.beginPath()
      ctx.moveTo(cx - coreR * .7, topY + coreR * .4)
      for (let i = 0; i <= points; i++) {
        const x = cx - coreR * .7 + (i / points) * coreR * 1.4
        const y = topY + (i % 2 === 0 ? 0 : coreR * .4)
        ctx.lineTo(x, y)
      }
      ctx.closePath(); ctx.fill()
      ctx.shadowBlur = 0
    }

    // ── Wings ────────────────────────────────────────────────────────────────
    function drawWings(t: number) {
      if (!ctx || !hasWings) return
      const flapAngle = Math.sin(t * 0.06) * 0.18
      ;[-1, 1].forEach((side) => {
        ctx!.save()
        ctx!.translate(cx, cy)
        ctx!.scale(side, 1)
        ctx!.rotate(flapAngle * side)
        const wg = ctx!.createLinearGradient(0, 0, coreR * 2.8, -coreR * .5)
        wg.addColorStop(0, hexAlpha(pal.p1, 0.6))
        wg.addColorStop(1, hexAlpha(pal.p2, 0))
        ctx!.fillStyle = wg
        ctx!.beginPath()
        ctx!.moveTo(coreR * .9, -coreR * .1)
        ctx!.quadraticCurveTo(coreR * 2.2, -coreR * 1.2, coreR * 2.8, -coreR * .5)
        ctx!.quadraticCurveTo(coreR * 2.0, coreR * .5,  coreR * .9,  coreR * .3)
        ctx!.closePath(); ctx!.fill()
        ctx!.restore()
      })
    }

    // ── Tail ────────────────────────────────────────────────────────────────
    function drawTail(t: number) {
      if (!ctx || !hasTail) return
      ctx.strokeStyle = hexAlpha(pal.p2, 0.55)
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(cx, cy + coreR * (archetype === 1 ? 1.5 : 1.1))
      for (let s = 1; s <= 8; s++) {
        const px = cx + Math.sin(s * 0.7 + t * 0.04) * coreR * (s * .18)
        const py = cy + coreR * (archetype === 1 ? 1.5 : 1.1) + s * (coreR * .28)
        ctx.lineTo(px, py)
      }
      ctx.stroke()
    }

    // ── Eyes ─────────────────────────────────────────────────────────────────
    function drawEyes(t: number) {
      if (!ctx) return
      if (unknown) {
        ctx.fillStyle = hexAlpha(pal.p2, 0.6 + Math.sin(t * 0.04) * 0.2)
        ctx.font = `bold ${Math.round(coreR * 1.3)}px sans-serif`
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText('?', cx, cy)
        return
      }
      const headY = archetype === 1 ? cy - coreR * 0.75 : cy
      const eyeSpread = coreR * (archetype === 2 ? 0.5 : 0.42)
      const eyeY      = headY - coreR * 0.08
      const er = coreR * (archetype === 2 ? 0.2 : 0.17)
      ;[-1, 1].forEach((side) => {
        // white sclera
        ctx!.fillStyle = '#ffffff'
        ctx!.shadowColor = '#ffffff'; ctx!.shadowBlur = 4
        ctx!.beginPath(); ctx!.arc(cx + side * eyeSpread, eyeY, er, 0, Math.PI * 2); ctx!.fill()
        // pupil (tiny blink every so often)
        const blink = (t % 120 < 5) ? 0.1 : 0.6
        ctx!.shadowBlur = 0
        ctx!.fillStyle = '#111111'
        ctx!.beginPath(); ctx!.arc(cx + side * eyeSpread + 1, eyeY + 1, er * blink, 0, Math.PI * 2); ctx!.fill()
        // eye shine
        ctx!.fillStyle = '#ffffff'
        ctx!.beginPath(); ctx!.arc(cx + side * eyeSpread - er*.25, eyeY - er*.25, er*.22, 0, Math.PI * 2); ctx!.fill()
      })
      ctx!.shadowBlur = 0
    }

    // ── Floating orbs ─────────────────────────────────────────────────────────
    function drawOrbs(t: number) {
      if (!ctx || unknown) return
      const orbCount = 3 + (seed % 4)
      for (let i = 0; i < orbCount; i++) {
        const angle = (i / orbCount) * Math.PI * 2 + t * 0.022 + (seed % 50) * 0.06
        const dist  = coreR * 2.4 + Math.sin(t * 0.05 + i * 1.7) * coreR * .35
        const ox = cx + Math.cos(angle) * dist
        const oy = cy + Math.sin(angle) * dist
        const or = 2.5 + Math.sin(t * 0.07 + i) * 1.3
        ctx.globalAlpha = 0.5 + Math.sin(t * 0.08 + i) * 0.25
        ctx.fillStyle   = i % 2 === 0 ? pal.p1 : pal.p3
        ctx.shadowColor = pal.p2; ctx.shadowBlur = 8
        ctx.beginPath(); ctx.arc(ox, oy, or, 0, Math.PI * 2); ctx.fill()
        ctx.shadowBlur = 0
      }
      ctx.globalAlpha = 1
    }

    // ── Main render loop ──────────────────────────────────────────────────────
    function draw() {
      if (!ctx) return
      const t = frameRef.current
      ctx.clearRect(0, 0, size, size)

      ctx.save()
      if (flip)     { ctx.translate(size, 0); ctx.scale(-1, 1) }
      if (defeated) { ctx.translate(size * .08, size * .15); ctx.rotate(0.5); ctx.globalAlpha = 0.35 }

      drawAura(t)
      drawParticles(t)
      drawWings(t)
      drawTail(t)
      drawRings(t)
      drawSpikes(t)
      drawBody(t)
      drawCrown()
      drawEyes(t)
      drawOrbs(t)

      ctx.restore()
      frameRef.current++
      rafRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [element, damage, defense, seed, size, flip, defeated, unknown])

  return <canvas ref={canvasRef} width={size} height={size} style={{ imageRendering: 'pixelated' }} />
}
