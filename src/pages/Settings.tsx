function Settings() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Configuración</h1>
        
        <div className="space-y-6">
          {/* Graphics Settings */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold mb-4 text-blue-400">Gráficos</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-gray-300">Calidad de Renderizado</label>
                <select className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white">
                  <option value="low">Baja</option>
                  <option value="medium" selected>Media</option>
                  <option value="high">Alta</option>
                  <option value="ultra">Ultra</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-gray-300">Sombreado</label>
                <select className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white">
                  <option value="off">Desactivado</option>
                  <option value="low">Bajo</option>
                  <option value="high" selected>Alto</option>
                </select>
              </div>
            </div>
          </div>

          {/* Audio Settings */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold mb-4 text-green-400">Audio</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-gray-300">Volumen Principal</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="80"
                  className="w-48"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-gray-300">Efectos de Sonido</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="100"
                  className="w-48"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-gray-300">Música</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="60"
                  className="w-48"
                />
              </div>
            </div>
          </div>

          {/* Game Settings */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold mb-4 text-purple-400">Juego</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-gray-300">Tiempo por Ronda</label>
                <select className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white">
                  <option value="10">10 segundos</option>
                  <option value="15" selected>15 segundos</option>
                  <option value="20">20 segundos</option>
                  <option value="30">30 segundos</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-gray-300">Dificultad de la IA</label>
                <select className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white">
                  <option value="easy">Fácil</option>
                  <option value="medium" selected>Media</option>
                  <option value="hard">Difícil</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-end">
            <button className="px-6 py-3 bg-white/10 backdrop-blur-sm rounded-lg font-semibold hover:bg-white/20 transition-all border border-white/20">
              Restablecer
            </button>
            <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all">
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
