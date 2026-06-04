import { useNavigate } from 'react-router-dom'

function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
          Prompt Arena
        </h1>
        <p className="text-xl mb-8 text-gray-300">
          Combate Táctico con IA
        </p>
        <p className="text-lg mb-12 max-w-2xl mx-auto text-gray-400">
          Crea armas y hechizos con palabras. Escribe el prompt de tu invocación
          y deja que la IA interprete tu creación para enfrentar enemigos aleatorios.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/play')}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg"
          >
            Jugar Ahora
          </button>
          <button
            onClick={() => {
              document.getElementById('how-to-play')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="px-8 py-4 bg-white/10 backdrop-blur-sm rounded-lg font-semibold text-lg hover:bg-white/20 transition-all border border-white/20"
          >
            Cómo Jugar
          </button>
        </div>

        <div id="how-to-play" className="mt-24 max-w-2xl mx-auto text-left space-y-4">
          <h2 className="text-2xl font-bold text-center text-purple-300 mb-6">Cómo Jugar</h2>
          {[
            { step: '1', text: 'Tienes 15 segundos para escribir la descripción de tu arma o hechizo.' },
            { step: '2', text: 'La IA (Gemini) interpreta tu texto y le asigna estadísticas de combate.' },
            { step: '3', text: 'Tu invocación se enfrenta a la del enemigo. El de mayor poder gana.' },
            { step: '4', text: 'Los elementos tienen ventajas: Fuego > Hielo > Rayo > Tierra > Agua > Aire > Fuego.' },
          ].map(({ step, text }) => (
            <div key={step} className="flex gap-4 items-start bg-white/5 rounded-lg p-4">
              <span className="text-purple-400 font-bold text-xl">{step}.</span>
              <p className="text-gray-300">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Home
