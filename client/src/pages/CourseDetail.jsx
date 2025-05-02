import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link, useNavigate } from 'react-router';
import { useParallax } from 'react-scroll-parallax';
import { motion } from 'framer-motion';
import { fetchCourseDetail } from '../store/courseDetailSlice';
import '../styles/CourseDetail.css';

const CourseDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { courseDetail, status, error } = useSelector((state) => state.courseDetail);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isNavbarOpen, setIsNavbarOpen] = useState(false);

  // Parallax effects
  const bgParallax = useParallax({
    speed: -5,
    shouldAlwaysCompleteAnimation: true,
    translateY: [0, 0],
    rootMargin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  const headerParallax = useParallax({
    translateY: [0, -15],
    opacity: [0.7, 1],
    shouldAlwaysCompleteAnimation: true,
    easing: 'easeOutQuad',
  });

  const contentParallax = useParallax({
    scale: [0.95, 1],
    opacity: [0.8, 1],
    easing: "easeInQuad",
    shouldAlwaysCompleteAnimation: true,
    translateX: [0, 0],
  });

  useEffect(() => {
    if (id) {
      dispatch(fetchCourseDetail(id));
    }
  }, [id, dispatch]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsAuthenticated(!!token);
  }, []);

  const formatRupiah = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(price);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
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

  const handleEnrollNow = async () => {
    try {
      setIsLoading(true);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login', { 
          state: { 
            returnUrl: `/course/${id}`, 
            message: 'You must login first to enroll in this course' 
          } 
        });
        return;
      }
      
      navigate('/payment', { state: { CourseId: id } });
    } catch (error) {
      alert(error.message || 'An error occurred during checkout');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="course-detail-loading-container">
        <div className="loading">Loading course details...</div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="course-detail-error-container">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  if (!courseDetail) {
    return (
      <div className="course-detail-error-container">
        <div className="error">Course not found</div>
      </div>
    );
  }

  return (
    <div className="course-detail-page">
      <div className="course-detail-bg" ref={bgParallax.ref}></div>
      
      {isAuthenticated && (
        <div className="user-navbar">
          <div className="user-icon" onClick={toggleNavbar}>
            <i className="fas fa-user"></i>
            {isNavbarOpen && (
              <div className="user-dropdown">
                <button onClick={() => navigateTo('/edit-profile')}>
                  <i className="fas fa-user-edit"></i> Edit Account
                </button>
                <button onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt"></i> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="course-detail-container">
        <div className="course-detail-header" ref={headerParallax.ref}>
          <Link to="/" className="back-button">
            <i className="fas fa-arrow-left"></i> Back to Courses
          </Link>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {courseDetail.title}
          </motion.h1>
          {courseDetail.Category && (
            <motion.div 
              className="course-category"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <span className="category-name">{courseDetail.Category.catName}</span>
              <span className="prog-lang">{courseDetail.Category.progLang}</span>
            </motion.div>
          )}
        </div>
        
        <div className="course-detail-content" ref={contentParallax.ref}>
          <div className="course-detail-card">
            {courseDetail.courseImg && (
              <motion.div 
                className="course-image"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
              >
                <img src={courseDetail.courseImg} alt={courseDetail.title} />
              </motion.div>
            )}
            
            <div className="course-detail-main">
              <div className="course-detail-info">
                <motion.div 
                  className="course-price-detail"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {formatRupiah(courseDetail.price || 0)}
                </motion.div>
                
                <motion.div 
                  className="course-stats"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <div className="stat-item">
                    <span className="stat-label">Rating</span>
                    <span className="stat-value">{courseDetail.rating} ★</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Enrolled</span>
                    <span className="stat-value">{courseDetail.totalEnrollment} students</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Duration</span>
                    <span className="stat-value">{courseDetail.durationHours} hours</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Start Date</span>
                    <span className="stat-value">{formatDate(courseDetail.startDate)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Course Code</span>
                    <span className="stat-value">{courseDetail.code}</span>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="course-description"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <h3>Description</h3>
                  <p>{courseDetail.description || courseDetail.desc || 'No description available'}</p>
                </motion.div>
                
                <motion.div 
                  className="course-meta"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <p className="meta-item">
                    <span className="meta-label">Created:</span> {formatDate(courseDetail.createdAt)}
                  </p>
                  <p className="meta-item">
                    <span className="meta-label">Last Updated:</span> {formatDate(courseDetail.updatedAt)}
                  </p>
                </motion.div>
              </div>
              
              <motion.div 
                className="course-actions"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <button 
                  className="enroll-button" 
                  onClick={handleEnrollNow}
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Enroll Now'}
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>cocoding</h3>
            <p>Unlock your coding potential with our expert-led courses and supportive community.</p>
          </div>
          
          <div className="footer-section">
            <h4>Explore</h4>
            <ul>
              <li><a href="/">All Courses</a></li>
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
    </div>
  );
};

export default CourseDetail;