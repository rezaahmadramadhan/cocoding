import { useState } from 'react'
import { ParallaxProvider } from 'react-scroll-parallax'
import ParallaxHero from '../components/ParallaxHero'
import Courses from '../components/Courses'
import ChatQuiz from '../components/ChatQuiz'
import '../styles/ChatQuiz.css'

function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <ParallaxProvider>
      <div className="app-container">
        <ParallaxHero />
        <Courses />
        
        {/* Chat Button */}
        <button className="chat-button" onClick={toggleChat}>
          <span className="chat-icon">💬</span>
        </button>
        
        {/* Chat Quiz Component */}
        <ChatQuiz isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      </div>
    </ParallaxProvider>
  )
}

export default Home