function Play() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Arena de Combate</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Player 1 Section */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-semibold mb-4 text-purple-400">Jugador 1</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Tu Invocación
                </label>
                <input
                  type="text"
                  placeholder="Ej: Un escudo de cristal que refleja el fuego"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-500"
                />
              </div>
              <div className="text-sm text-gray-400">
                Tiempo restante: <span className="text-purple-400 font-semibold">15s</span>
              </div>
            </div>
          </div>

          {/* Player 2 Section */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-semibold mb-4 text-pink-400">Jugador 2</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Tu Invocación
                </label>
                <input
                  type="text"
                  placeholder="Ej: Un fénix de rayo que ataca a distancia"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-white placeholder-gray-500"
                />
              </div>
              <div className="text-sm text-gray-400">
                Tiempo restante: <span className="text-pink-400 font-semibold">15s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Battle Area */}
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-8 border border-white/10 min-h-[400px] flex items-center justify-center">
          <p className="text-gray-400 text-lg">El área de combate 3D se cargará aquí...</p>
        </div>
      </div>
    </div>
  )
}

export default Play
