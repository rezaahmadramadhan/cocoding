import { useParallax } from 'react-scroll-parallax';
import '../styles/ParallaxHero.css';

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
      
      <div className="hero-content" ref={textParallax.ref}>
        <h1>CoCoding</h1>
        <p>Unlock Your Coding Potential</p>
        <button className="cta-button" onClick={scrollToCourses}>Explore Courses</button>
      </div>
    </div>
  );
};

export default ParallaxHero;