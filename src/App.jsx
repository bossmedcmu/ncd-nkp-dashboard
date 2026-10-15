import { useEffect, useReducer } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Overview from './pages/Overview.jsx'
import Drilldown from './pages/Drilldown.jsx'
import Executive from './pages/Executive.jsx'
import { subscribe } from './lib/data.js'

export default function App() {
  // re-render everything when a new CSV is imported
  const [version, bump] = useReducer((x) => x + 1, 0)
  useEffect(() => subscribe(bump), [])

  return (
    <Layout>
      <Routes key={version}>
        <Route path="/" element={<Overview />} />
        <Route path="/drilldown" element={<Drilldown />} />
        <Route path="/executive" element={<Executive />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
