import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components'
import { Dashboard, Titulacion, Practicas, Vinculacion, Investigacion } from './pages'
import { Report } from './pages/Report'

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
          <Route path="/report" element={<Report />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
