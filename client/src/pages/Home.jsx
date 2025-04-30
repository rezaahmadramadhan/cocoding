import { ParallaxProvider } from 'react-scroll-parallax'
import ParallaxHero from '../components/ParallaxHero'
import Courses from '../components/Courses'

function Home() {
  return (
    <ParallaxProvider>
      <div className="app-container">
        <ParallaxHero />
        <Courses />
      </div>
    </ParallaxProvider>
  )
}

export default Home