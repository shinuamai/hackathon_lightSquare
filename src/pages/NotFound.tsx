import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 text-white">
      <div className="text-center px-4">
        <h1 className="text-8xl font-bold mb-4 text-red-500">404</h1>
        <h2 className="text-3xl font-semibold mb-4">Página No Encontrada</h2>
        <p className="text-lg mb-8 text-gray-400">
          La página que buscas no existe o ha sido movida.
        </p>
        <Link
          to="/"
          className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg font-semibold text-lg hover:from-red-700 hover:to-orange-700 transition-all transform hover:scale-105 shadow-lg inline-block"
        >
          Volver al Inicio
        </Link>
      </div>
    </div>
  )
}

export default NotFound
