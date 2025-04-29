import { BrowserRouter as Router, Routes, Route } from 'react-router'
import './App.css'
import Home from './pages/Home'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Add more routes here as needed */}
      </Routes>
    </Router>
  )
}

export default App
