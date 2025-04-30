import { BrowserRouter as Router, Routes, Route } from 'react-router'
import { ParallaxProvider } from 'react-scroll-parallax'
import './App.css'
import Home from './pages/Home'
import CourseDetail from './pages/CourseDetail'
import Login from './pages/Login'

function App() {
  return (
    <ParallaxProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/course/:id" element={<CourseDetail />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </Router>
    </ParallaxProvider>
  )
}

export default App
