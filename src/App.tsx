import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from '@pages/Home'
import Play from '@pages/Play'
import Settings from '@pages/Settings'
import NotFound from '@pages/NotFound'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/play" element={<Play />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
