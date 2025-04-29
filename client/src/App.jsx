import { ParallaxProvider } from 'react-scroll-parallax'
import ParallaxHero from './components/ParallaxHero'
import './App.css'

function App() {
  return (
    <ParallaxProvider>
      <div className="app-container">
        <ParallaxHero />
        <div className="content-section">
          <h2>Welcome to CoCoding</h2>
          <p>
            We provide high-quality programming courses to help you master the skills needed
            for today's tech industry. Browse our courses and start your coding journey today!
          </p>
          <div className="features">
            <div className="feature">
              <h3>Expert Instructors</h3>
              <p>Learn from industry professionals with years of experience.</p>
            </div>
            <div className="feature">
              <h3>Hands-on Projects</h3>
              <p>Apply your knowledge with real-world coding projects.</p>
            </div>
            <div className="feature">
              <h3>AI-Powered Learning</h3>
              <p>Get personalized assistance with our Gemini AI integration.</p>
            </div>
          </div>
        </div>
      </div>
    </ParallaxProvider>
  )
}

export default App
