# ⚡ lightSquare — Prompt Arena

> **Combate táctico 2 jugadores potenciado por Gemini AI**

Dos jugadores en un mismo teclado. Dispara poderes, forja invocaciones con IA y destruye al rival en 5 rondas de combate en tiempo real.

---

## 📋 Índice

- [Cómo se juega](#-cómo-se-juega)
- [Controles](#-controles)
- [Poderes y combate](#-poderes-y-combate)
- [Elementos y ventajas](#-elementos-y-ventajas)
- [Sistema de puntuación](#-sistema-de-puntuación)
- [Stack tecnológico](#-stack-tecnológico)
- [Instalación](#-instalación)
- [Variables de entorno](#-variables-de-entorno)

---

## 🎮 Cómo se juega

1. **Ingresa los nombres** — Escribe los nombres de P1 y P2 y pulsa "INICIAR COMBATE".
2. **Dispara poderes** — Cada jugador tiene 4 poderes predefinidos asignados a sus teclas. Úsalos estratégicamente respetando los cooldowns.
3. **Forja poderes personalizados** — Escribe una descripción en el input inferior y Gemini AI la convierte en un 5.° poder único con estadísticas propias.
4. **30 segundos por ronda** — Si el tiempo se agota, gana quien tenga más HP. Si empatan, es empate de ronda.
5. **5 rondas** — Gana el jugador con más rondas ganadas al final. Se muestra puntuación, historial de rondas y pantalla de victoria/derrota épica.

---

## 🕹️ Controles

| Acción | Jugador 1 | Jugador 2 |
|---|---|---|
| Poder 1 | `Q` | `U` |
| Poder 2 | `W` | `I` |
| Poder 3 | `E` | `O` |
| Poder 4 | `R` | `P` |
| Poder 5 (IA) | `T` | `Y` |
| Forjar poder IA | Input inferior izquierdo | Input inferior derecho |

> **Nota:** Mientras escribas en el input de invocación, las teclas de poder quedan bloqueadas automáticamente.

---

## ⚔️ Poderes y combate

### Poderes predefinidos

| Poder | Elemento | Daño | Defensa | Cooldown |
|---|---|---|---|---|
| Kraken Abismal | 💧 Agua | 78 | 22 | 6s |
| Rey Liche Eterno | 🌬️ Aire | 52 | 50 | 8s |
| Archidemon del Viento | 🌬️ Aire | 90 | 10 | 5s |
| Titán de Roca | 🌍 Tierra | 64 | 58 | 7s |

### Fórmula de daño

```
daño_efectivo = daño_poder × multiplicador_elemento × 0.65
```

El daño se resta directamente del HP del rival (máx 100 HP). Llegar a 0 HP termina la ronda.

### Poderes personalizados (IA)

Al escribir una invocación en el input, Gemini AI la interpreta y genera:
- **Daño**: 0–95 (boosted ×1.35 sobre lo que devuelve la IA)
- **Defensa**: 0–80 (boosted ×1.2)
- **Elemento**: detectado por palabras clave del texto
- **Cooldown**: 6s fijo

---

## 🔥 Elementos y ventajas

```
🔥 Fuego   →  vence a  ❄️ Hielo
❄️ Hielo   →  vence a  ⚡ Rayo
⚡ Rayo    →  vence a  🌍 Tierra
🌍 Tierra  →  vence a  💧 Agua
💧 Agua    →  vence a  🌬️ Aire
🌬️ Aire    →  vence a  🔥 Fuego
```

| Resultado | Multiplicador de daño |
|---|---|
| Elemento fuerte vs débil | × 1.3 |
| Elemento neutro | × 1.0 |
| Elemento débil vs fuerte | × 0.7 |

### Palabras clave por elemento

| Elemento | Ejemplos |
|---|---|
| 🔥 Fuego | fuego, llama, lava, dragón, volcán, incendio |
| ❄️ Hielo | hielo, congelar, glacial, nieve, inmovilizar |
| ⚡ Rayo | rayo, eléctrico, trueno, relámpago, tormenta |
| 🌍 Tierra | roca, golem, terremoto, piedra, montaña |
| 💧 Agua | agua, veneno, corrosivo, mar, ácido |
| 🌬️ Aire | viento, tornado, sigilo, niebla, sombra |

---

## 🏆 Sistema de puntuación

```
Victoria de ronda = 120 (base) + HP_ganador × 0.5 + ronda × 10
Empate de ronda   = 60 pts cada jugador
Derrota de ronda  = 0 pts
```

- **HP restante** aporta hasta +50 puntos extra.
- **Bonus por ronda tardía**: la ronda 5 vale +50 más que la ronda 1.
- La pantalla de Game Over muestra: rondas ganadas, puntuación total y resultado de cada ronda.

---

## 🛠️ Stack tecnológico

| Tecnología | Uso |
|---|---|
| **React 18** | Framework UI |
| **TypeScript** | Tipado estático |
| **Vite** | Bundler y dev server |
| **TailwindCSS** | Estilos utilitarios |
| **Framer Motion** | Animaciones en la intro (Home) |
| **tsParticles** | Fondo de partículas tipo red neuronal (Home) |
| **Gemini AI (gemini-2.0-flash)** | Interpretación de invocaciones personalizadas |
| **Canvas API** | Renderizado procedural de criaturas por elemento |
| **Web Audio API** | Efectos de sonido y música de batalla sintetizada |
| **React Router v6** | Navegación entre páginas |

---

## 🚀 Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/lightsquare.git
cd lightsquare

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Edita .env y pega tu API key de Gemini

# 4. Iniciar el servidor de desarrollo
npm run dev
```

### Scripts disponibles

```bash
npm run dev      # Servidor de desarrollo en localhost:5173
npm run build    # Build de producción
npm run preview  # Preview del build de producción
npm run lint     # Linter ESLint
```

---

## 🔑 Variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_GEMINI_API_KEY=tu_api_key_aqui
```

Obtén tu API key gratuita en [Google AI Studio](https://aistudio.google.com/apikey).

> ⚠️ Nunca subas tu `.env` al repositorio. Ya está incluido en `.gitignore`.

---

## 📁 Estructura del proyecto

```
lightsquare/
├── src/
│   ├── components/
│   │   └── CreatureCanvas.tsx    # Criaturas procedurales por elemento y stats
│   ├── pages/
│   │   ├── Home.tsx              # Intro animada (GlitchText, Particles, ScanLines)
│   │   └── Play.tsx              # Arena de combate 2 jugadores
│   ├── utils/
│   │   ├── aiInterpreter.ts      # Integración con Gemini AI
│   │   └── audioManager.ts       # Motor de sonido Web Audio API (efectos + música)
│   ├── types/
│   │   └── index.ts              # Tipos TypeScript globales
│   ├── App.tsx
│   └── main.tsx
├── .env                          # Variables de entorno (no subir)
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🎨 Criaturas procedurales

Las criaturas se generan en tiempo real con la **Canvas API**. No hay assets externos — cada criatura es única, determinada por el elemento activo del jugador. A mayor daño, la criatura se ve más agresiva; a mayor defensa, más robusta. Cambian visualmente conforme el jugador usa diferentes poderes.

---

## 🎵 Audio sintetizado

Todo el audio del juego está generado en tiempo real con la **Web Audio API** — sin archivos de sonido. Incluye:
- Efectos por acción: clic, impacto de poder, invocación de magia
- Resultados: victoria de ronda, derrota, empate
- Game over: fanfarria épica de victoria o caída cromática de derrota
- **Música de batalla ambiental**: drone grave + arpegio pentatónico en loop durante el combate

---

MIT © lightSquare — Junio 2026
