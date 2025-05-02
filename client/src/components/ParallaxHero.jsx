import { useParallax } from 'react-scroll-parallax';
import '../styles/ParallaxHero.css';
import { useState, useEffect, useRef } from 'react';

const ParallaxHero = () => {
  // Canvas reference for animated coding background
  const canvasRef = useRef(null);
  
  // Enhanced parallax effect for background
  const bgParallax = useParallax({
    speed: -10,
    scale: [1.05, 1],
    opacity: [0.9, 1],
    shouldAlwaysCompleteAnimation: true,
    translateY: [0, 0],
    rootMargin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  
  // Enhanced card parallax effect
  const formParallax = useParallax({
    scale: [0.95, 1],
    opacity: [0.8, 1],
    easing: 'easeInQuad',
    shouldAlwaysCompleteAnimation: true,
    translateY: [15, 0],
    rootMargin: { top: 100, bottom: 100 },
  });
  
  // Title parallax effect with more movement
  const titleParallax = useParallax({
    translateY: [10, -15],
    opacity: [0.7, 1],
    shouldAlwaysCompleteAnimation: true,
    easing: 'easeOutQuad',
  });

  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Slight delay for better animation effect
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // Code rain animation effect
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions to match window
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Characters for the matrix effect
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>[]{}()=+-*/%&|?!;:.,~`'.split('');
    
    // Setup columns
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    
    // Array to track y position of each column
    const drops = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100; // Start position above screen
    }
    
    // Drawing function
    const draw = () => {
      // Semi-transparent black background to create fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#61dafb'; // React blue color
      ctx.font = fontSize + 'px monospace';
      
      // Loop through drops
      for (let i = 0; i < drops.length; i++) {
        // Random character to print
        const char = chars[Math.floor(Math.random() * chars.length)];
        
        // x coordinate of drop
        const x = i * fontSize;
        // y coordinate of drop
        const y = drops[i] * fontSize;
        
        // Draw the character
        ctx.fillText(char, x, y);
        
        // Send drop back to top randomly after it's below screen
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        
        // Move drop down
        drops[i]++;
      }
    };
    
    // Animation loop
    const interval = setInterval(draw, 50);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);
  
  const scrollToCourses = () => {
    const coursesSection = document.getElementById('courses-section');
    if (coursesSection) {
      coursesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="hero-container">
      {/* Canvas for animated code background */}
      <canvas ref={canvasRef} className="code-rain-canvas"></canvas>
      <div className="hero-bg-overlay" ref={bgParallax.ref}></div>
      
      <div className="hero-content-wrapper">
        <div className="hero-header" ref={titleParallax.ref}>
          <h1>Cocoding</h1>
          <p>Your journey to coding excellence starts here</p>
        </div>

        <div className={`hero-card ${isVisible ? 'visible' : ''}`} ref={formParallax.ref}>
          <div className="card-badge">Premium Courses</div>
          <h2>Unlock Your Coding Potential</h2>
          
          <div className="hero-features">
            <div className="feature"><span className="feature-icon">✓</span> Expert Instructors</div>
            <div className="feature"><span className="feature-icon">✓</span> Hands-on Projects</div>
            <div className="feature"><span className="feature-icon">✓</span> Community Support</div>
          </div>
          
          <button className="cta-button" onClick={scrollToCourses}>
            Explore Courses
            <span className="button-arrow">→</span>
          </button>
        </div>
      </div>
      
      <div className="scroll-indicator">
        <div className="mouse">
          <div className="wheel"></div>
        </div>
        <div className="scroll-text">Scroll</div>
      </div>
    </div>
  );
};

export default ParallaxHero;