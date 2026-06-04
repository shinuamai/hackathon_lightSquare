function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
          Prompt Arena
        </h1>
        <p className="text-xl mb-8 text-gray-300">
          Combate Táctico Multijugador con IA
        </p>
        <p className="text-lg mb-12 max-w-2xl mx-auto text-gray-400">
          Crea armas y hechizos con palabras. Dos jugadores se enfrentan en una arena en línea.
          Escribe el prompt de tu invocación y deja que la IA interprete tu creación.
        </p>
        <div className="flex gap-4 justify-center">
          <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg">
            Jugar Ahora
          </button>
          <button className="px-8 py-4 bg-white/10 backdrop-blur-sm rounded-lg font-semibold text-lg hover:bg-white/20 transition-all border border-white/20">
            Cómo Jugar
          </button>
        </div>
      </div>
    </div>
  )
}

export default Home
