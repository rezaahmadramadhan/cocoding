import { useState, useEffect } from 'react'
import { ParallaxProvider } from 'react-scroll-parallax'
import { motion, AnimatePresence } from 'framer-motion'
import ParallaxHero from '../components/ParallaxHero'
import Courses from '../components/Courses'
import ChatQuiz from '../components/ChatQuiz'
import '../styles/ChatQuiz.css'
import '../styles/Home.css'
import { useNavigate } from 'react-router'

function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNavbarOpen, setIsNavbarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const [visibleSections, setVisibleSections] = useState({
    featured: false,
    courses: false,
    testimonials: false
  });

  // Check authentication status
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsAuthenticated(!!token);
  }, []);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const toggleNavbar = () => {
    setIsNavbarOpen(!isNavbarOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    setIsAuthenticated(false);
    setIsNavbarOpen(false);
    navigate('/');
  };

  const navigateTo = (path) => {
    setIsNavbarOpen(false);
    navigate(path);
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch('https://ip.dhronz.space/delete-account', {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.ok) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('userId');
          localStorage.removeItem('userEmail');
          setIsAuthenticated(false);
          alert('Your account has been successfully deleted');
          navigate('/');
        } else {
          const errorData = await response.json();
          alert(errorData.message || 'Failed to delete account');
        }
      } catch (error) {
        console.error('Error deleting account:', error);
        alert('An error occurred while deleting your account');
      }
    }
  };

  // Observe sections for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => ({
              ...prev,
              [entry.target.id.split('-')[0]]: true
            }));
          }
        });
      },
      { threshold: 0.2 }
    );

    const sections = document.querySelectorAll('.scroll-section');
    sections.forEach(section => observer.observe(section));

    return () => {
      sections.forEach(section => observer.unobserve(section));
    };
  }, []);

  // Testimonials data
  const testimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Front-end Developer",
      content: "Cocoding transformed my career. The courses are well-structured and the mentors are incredibly helpful.",
      avatar: "https://randomuser.me/api/portraits/women/32.jpg"
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Full Stack Developer",
      content: "I've tried many online platforms, but Cocoding offers the most hands-on experience with real-world projects.",
      avatar: "https://randomuser.me/api/portraits/men/46.jpg"
    },
    {
      id: 3,
      name: "Aisha Patel",
      role: "Data Scientist",
      content: "The AI and machine learning courses are comprehensive and kept up-to-date with the latest technologies.",
      avatar: "https://randomuser.me/api/portraits/women/65.jpg"
    }
  ];

  return (
    <ParallaxProvider>
      <div className="app-container">
        {/* User Navbar */}
        {isAuthenticated && (
          <div className="user-navbar">
            <div className="user-icon" onClick={toggleNavbar}>
              <i className="fas fa-user"></i>
              {isNavbarOpen && (
                <div className="user-dropdown">
                  <button onClick={() => navigateTo('/edit-profile')}>
                    <i className="fas fa-user-edit"></i> Edit Account
                  </button>
                  <button onClick={handleDeleteAccount} className="danger-button">
                    <i className="fas fa-user-slash"></i> Delete Account
                  </button>
                  <button onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt"></i> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Hero Section */}
        <ParallaxHero />
        
        {/* Courses Section */}
        <section id="courses-section" className="scroll-section">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={visibleSections.courses ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <Courses />
          </motion.div>
        </section>
        
        {/* Testimonials Section */}
        <section id="testimonials-section" className="scroll-section testimonials-section">
          <motion.div
            initial={{ opacity: 0 }}
            animate={visibleSections.testimonials ? { opacity: 1 } : {}}
            transition={{ duration: 0.8 }}
            className="section-content"
          >
            <h2 className="section-title">What Our Students Say</h2>
            <p className="section-subtitle">Success stories from the Cocoding community</p>
            
            <div className="testimonials-container">
              {testimonials.map((testimonial, index) => (
                <motion.div 
                  key={testimonial.id}
                  className="testimonial-card"
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  animate={visibleSections.testimonials ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                >
                  <div className="testimonial-content">
                    <p>"{testimonial.content}"</p>
                  </div>
                  <div className="testimonial-author">
                    <img src={testimonial.avatar} alt={testimonial.name} className="avatar" />
                    <div>
                      <h4>{testimonial.name}</h4>
                      <p>{testimonial.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
        
        {/* Footer */}
        <footer className="footer">
          <div className="footer-content">
            <div className="footer-section">
              <h3>cocoding</h3>
              <p>Unlock your coding potential with our expert-led courses and supportive community.</p>
            </div>
            
            <div className="footer-section">
              <h4>Explore</h4>
              <ul>
                <li><a href="#courses-section">All Courses</a></li>
                <li><a href="#testimonials-section">Testimonials</a></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h4>Follow Us</h4>
              <div className="social-links">
                <a href="#" aria-label="Facebook"><i className="fab fa-facebook"></i></a>
                <a href="#" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
                <a href="#" aria-label="LinkedIn"><i className="fab fa-linkedin"></i></a>
                <a href="#" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} Cocoding. All rights reserved.</p>
          </div>
        </footer>
        
        {/* Chat Button */}
        <button 
          className="chat-button" 
          onClick={toggleChat}
          aria-label="Open chat"
        >
          <span className="chat-icon">💬</span>
        </button>
        
        {/* Chat Quiz Component */}
        <ChatQuiz isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      </div>
    </ParallaxProvider>
  )
}

export default Home