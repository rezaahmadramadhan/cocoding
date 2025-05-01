import { useParallax } from 'react-scroll-parallax';
import '../styles/ParallaxHero.css';
import { useState, useEffect } from 'react';

const ParallaxHero = () => {
  const parallax1 = useParallax({
    speed: -10,
  });
  
  const parallax2 = useParallax({
    speed: -20,
  });
  
  const parallax3 = useParallax({
    speed: 5,
  });
  
  const textParallax = useParallax({
    scale: [0.8, 1.2],
    opacity: [0.5, 1],
    easing: 'easeInQuad',
  });

  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);
  
  const scrollToCourses = () => {
    const coursesSection = document.getElementById('courses-section');
    if (coursesSection) {
      coursesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="hero-container">
      <div className="parallax-bg bg1" ref={parallax1.ref}></div>
      <div className="parallax-bg bg2" ref={parallax2.ref}></div>
      <div className="parallax-bg bg3" ref={parallax3.ref}></div>
      
      <div className={`hero-content ${isVisible ? 'visible' : ''}`} ref={textParallax.ref}>
        <div className="animated-badge">Premium Courses</div>
        <h1>Cocoding</h1>
        <p>Unlock Your Coding Potential</p>
        <div className="hero-features">
          <div className="feature"><span className="feature-icon">✓</span> Expert Instructors</div>
          <div className="feature"><span className="feature-icon">✓</span> Hands-on Projects</div>
          <div className="feature"><span className="feature-icon">✓</span> Community Support</div>
        </div>
        <button className="cta-button pulse" onClick={scrollToCourses}>
          Explore Courses
          <span className="button-arrow">→</span>
        </button>
      </div>
      
      <div className="scroll-indicator">
        <div className="mouse">
          <div className="wheel"></div>
        </div>
        <div className="scroll-text">Scroll Down</div>
      </div>
    </div>
  );
};

export default ParallaxHero;