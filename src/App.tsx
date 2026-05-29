import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components'
import { Dashboard, Titulacion, Practicas, Vinculacion, Investigacion } from './pages'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/titulacion" element={<Titulacion />} />
          <Route path="/practicas" element={<Practicas />} />
          <Route path="/vinculacion" element={<Vinculacion />} />
          <Route path="/investigacion" element={<Investigacion />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
