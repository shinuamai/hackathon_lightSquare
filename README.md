# ⚡ lightSquare

> **Combate táctico de invocaciones potenciado por Gemini AI**

Escribe la descripción de tu arma o hechizo, la IA lo interpreta, le asigna estadísticas de combate y tu criatura se enfrenta a un enemigo en una batalla por elementos. 5 rondas. Un ganador.

---

## 📋 Índice

- [Demo](#-demo)
- [Cómo se juega](#-cómo-se-juega)
- [Sistema de combate](#-sistema-de-combate)
- [Elementos y ventajas](#-elementos-y-ventajas)
- [Sistema de puntuación](#-sistema-de-puntuación)
- [Stack tecnológico](#-stack-tecnológico)
- [Instalación](#-instalación)
- [Variables de entorno](#-variables-de-entorno)
- [Estructura del proyecto](#-estructura-del-proyecto)

---

## 🎮 Cómo se juega

1. **Entra al arena** — Presiona "INICIAR COMBATE" en la pantalla principal.
2. **Invoca** — Tienes **15 segundos** para escribir la descripción de tu arma, criatura o hechizo en cualquier idioma.
3. **La IA actúa** — Gemini AI interpreta tu texto y genera estadísticas de `daño`, `defensa` y `elemento`.
4. **Batalla** — Tu invocación se enfrenta a la de un enemigo aleatorio. El mayor poder neto gana.
5. **5 rondas** — Se juegan 5 rondas seguidas. Al final se muestra tu puntuación total y estrellas obtenidas.

> Si el tiempo se agota sin que escribas nada, el juego invoca automáticamente **"un guerrero sin armas"**.

---

## ⚔️ Sistema de combate

### Cálculo de poder neto

```
Poder jugador = daño_jugador × multiplicador_elemento - defensa_enemigo × 0.4
Poder enemigo = daño_enemigo × multiplicador_elemento - defensa_jugador × 0.4
```

- Si `poder_jugador > poder_enemigo` → **Victoria**
- Si `poder_jugador < poder_enemigo` → **Derrota**
- Si son iguales → **Empate**

### Estadísticas de invocación

| Tipo de invocación | Daño | Defensa |
|---|---|---|
| Arma / ataque puro | 65–90 | 10–35 |
| Escudo / armadura | 10–35 | 65–90 |
| Híbrido | 40–65 | 40–65 |

Todos los valores se normalizan entre **0 y 100**.

---

## 🔥 Elementos y ventajas

El elemento de tu invocación se determina automáticamente por las palabras clave que uses.

```
🔥 Fuego  →  vence a  ❄️ Hielo
❄️ Hielo  →  vence a  ⚡ Rayo
⚡ Rayo   →  vence a  🌍 Tierra
🌍 Tierra →  vence a  💧 Agua
💧 Agua   →  vence a  🌬️ Aire
🌬️ Aire   →  vence a  🔥 Fuego
```

| Resultado | Multiplicador de daño |
|---|---|
| Elemento fuerte vs débil | × 1.3 |
| Elemento neutro | × 1.0 |
| Elemento débil vs fuerte | × 0.7 |

### Palabras clave por elemento

| Elemento | Ejemplos de palabras |
|---|---|
| 🔥 Fuego | fuego, llama, lava, dragón, volcán, incendio |
| ❄️ Hielo | hielo, congelar, glacial, nieve, inmovilizar |
| ⚡ Rayo | rayo, eléctrico, trueno, relámpago, tormenta |
| 🌍 Tierra | roca, golem, terremoto, piedra, montaña |
| 💧 Agua | agua, veneno, corrosivo, mar, ácido |
| 🌬️ Aire | viento, tornado, sigilo, niebla, sombra |

---

## 🏆 Sistema de puntuación

### Puntos por ronda

```
Victoria = 120 (base) + hasta 60 (margen) + (ronda - 1) × 15 (bonificación por ronda)
Empate   = 60 puntos
Derrota  = 0 puntos
```

- **Margen**: diferencia de poder entre jugador y enemigo, máximo +60 puntos.
- **Bonificación por ronda**: las rondas tardías valen más. Ronda 5 da +60 extra.
- **Máximo teórico por ronda**: 240 puntos (ronda 5, victoria con margen máximo).

### Estrellas finales

| Victorias | Estrellas |
|---|---|
| 5 | ⭐⭐⭐⭐⭐ |
| 4 | ⭐⭐⭐⭐ |
| 3 | ⭐⭐⭐ |
| 2 | ⭐⭐ |
| 0–1 | ⭐ |

---

## 🛠️ Stack tecnológico

| Tecnología | Uso |
|---|---|
| **React 18** | Framework UI |
| **TypeScript** | Tipado estático |
| **Vite** | Bundler y dev server |
| **TailwindCSS** | Estilos utilitarios |
| **Framer Motion** | Animaciones e intro cinematográfica |
| **tsParticles** | Fondo de partículas tipo red neuronal |
| **Gemini AI (gemini-2.0-flash)** | Interpretación de invocaciones |
| **Canvas API** | Renderizado procedural de criaturas |
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
# Edita .env con tu API key de Gemini

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
│   │   └── CreatureCanvas.tsx    # Renderizado procedural de criaturas con Canvas
│   ├── hooks/
│   │   └── useGameState.ts       # Estado global del juego
│   ├── pages/
│   │   ├── Home.tsx              # Intro animada (GlitchText, Particles, ScanLines)
│   │   ├── Play.tsx              # Arena de combate principal
│   │   ├── Settings.tsx          # Configuración
│   │   └── NotFound.tsx          # Página 404
│   ├── types/
│   │   └── index.ts              # Interfaces TypeScript (Player, GameState, etc.)
│   ├── utils/
│   │   └── aiInterpreter.ts      # Integración con Gemini AI
│   ├── App.tsx                   # Router principal
│   └── main.tsx                  # Entry point
├── .env                          # Variables de entorno (no subir)
├── .env.example                  # Plantilla de variables
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🎨 Criaturas procedurales

Las criaturas se generan visualmente en tiempo real usando la **Canvas API**. No hay assets externos — cada criatura es única, determinada por un hash del texto de invocación más el elemento y las estadísticas. A mayor daño, la criatura se ve más agresiva; a mayor defensa, más robusta.

---

## 📄 Licencia

MIT © lightSquare — Junio 2026
