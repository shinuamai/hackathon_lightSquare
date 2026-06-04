// ── Web Audio API Synthesized Sound Engine ────────────────────────────────────

class AudioManager {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private _volume = 0.55
  private _muted = false

  // ── Init (lazy, requires user gesture) ───────────────────────────────────
  private init() {
    if (!this.ctx) {
      this.ctx = new AudioContext()
      this.master = this.ctx.createGain()
      this.master.gain.setValueAtTime(this._muted ? 0 : this._volume, this.ctx.currentTime)
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
  }

  // ── Public controls ───────────────────────────────────────────────────────
  get muted()  { return this._muted }
  get volume() { return this._volume }

  setMuted(v: boolean) {
    this._muted = v
    if (this.master && this.ctx) {
      this.master.gain.setValueAtTime(v ? 0 : this._volume, this.ctx.currentTime)
    }
  }

  setVolume(v: number) {
    this._volume = Math.max(0, Math.min(1, v))
    if (this.master && this.ctx && !this._muted) {
      this.master.gain.setValueAtTime(this._volume, this.ctx.currentTime)
    }
  }

  // ── Primitive builders ───────────────────────────────────────────────────
  private osc(
    freq: number,
    type: OscillatorType,
    startAt: number,
    duration: number,
    peak = 0.3,
    freqEnd?: number,
  ) {
    if (!this.ctx || !this.master) return
    const t0  = this.ctx.currentTime + startAt
    const osc  = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t0)
    if (freqEnd !== undefined)
      osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 0.01), t0 + duration)
    gain.gain.setValueAtTime(0, t0)
    gain.gain.linearRampToValueAtTime(peak, t0 + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
    osc.connect(gain)
    gain.connect(this.master)
    osc.start(t0)
    osc.stop(t0 + duration + 0.02)
  }

  private noise(startAt: number, duration: number, cutoff = 700, peak = 0.25) {
    if (!this.ctx || !this.master) return
    const t0      = this.ctx.currentTime + startAt
    const samples = Math.ceil(this.ctx.sampleRate * duration)
    const buf     = this.ctx.createBuffer(1, samples, this.ctx.sampleRate)
    const data    = buf.getChannelData(0)
    for (let i = 0; i < samples; i++) data[i] = Math.random() * 2 - 1
    const src  = this.ctx.createBufferSource()
    src.buffer = buf
    const filt = this.ctx.createBiquadFilter()
    filt.type  = 'lowpass'
    filt.frequency.setValueAtTime(cutoff, t0)
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(peak, t0)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
    src.connect(filt)
    filt.connect(gain)
    gain.connect(this.master)
    src.start(t0)
    src.stop(t0 + duration + 0.02)
  }

  // ── Sounds ────────────────────────────────────────────────────────────────

  /** Botón: clic suave y corto */
  click() {
    this.init()
    this.osc(900, 'sine', 0, 0.045, 0.12)
  }

  /** Impacto: golpe al disparar un poder */
  hit() {
    this.init()
    this.noise(0, 0.14, 550, 0.28)                     // burst de ruido
    this.osc(90,  'sine', 0, 0.13, 0.45, 35)            // thump grave
    this.osc(210, 'sine', 0, 0.06, 0.18)                // snap agudo
  }

  /** Invocación: magia al crear un poder personalizado */
  summon() {
    this.init()
    // Arpegio ascendente brillante
    const notes = [440, 554, 659, 880, 1109, 1318]
    notes.forEach((f, i) => this.osc(f, 'sine', i * 0.075, 0.28, 0.16))
    // Shimmer de fondo
    this.osc(1760, 'sine', 0.1, 0.5, 0.06)
  }

  /** Victoria de ronda */
  roundWin() {
    this.init()
    ;[330, 415, 494, 659].forEach((f, i) => this.osc(f, 'sine', i * 0.09, 0.28, 0.22))
  }

  /** Derrota de ronda */
  roundLose() {
    this.init()
    ;[392, 330, 262].forEach((f, i) => this.osc(f, 'sawtooth', i * 0.16, 0.22, 0.14))
  }

  /** Empate de ronda */
  roundTie() {
    this.init()
    this.osc(330, 'sine', 0,    0.28, 0.18)
    this.osc(392, 'sine', 0.22, 0.28, 0.18)
  }

  /** Victoria final épica */
  victory() {
    this.init()
    // Acorde mayor ascendente
    const melody = [261.63, 329.63, 392, 523.25, 659.25]
    melody.forEach((f, i) => this.osc(f, 'sine', i * 0.13, 0.4,  0.3))
    // Nota final sostenida
    this.osc(523.25, 'sine',   0.65, 1.0, 0.25)
    this.osc(659.25, 'sine',   0.65, 1.0, 0.18)
    // Brillo final
    this.osc(1046.5, 'sine',   0.9,  0.6, 0.12)
  }

  /** Derrota final dramática */
  defeat() {
    this.init()
    // Caída cromática triste
    const fall = [440, 415, 392, 370, 330, 294, 261]
    fall.forEach((f, i) => this.osc(f, 'sawtooth', i * 0.14, 0.22, 0.14))
    // Ruido final apagado
    this.noise(fall.length * 0.14, 0.3, 300, 0.1)
  }

  /** Empate final */
  finalTie() {
    this.init()
    ;[330, 392, 330].forEach((f, i) => this.osc(f, 'sine', i * 0.2, 0.32, 0.18))
  }
}

export const audio = new AudioManager()
