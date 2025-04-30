import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { fetchCourses } from '../store/coursesSlice';
import { useParallax } from 'react-scroll-parallax';
import '../styles/Courses.css';

const Courses = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { courses, status, error } = useSelector((state) => state.courses);
  
  const titleParallax = useParallax({
    translateY: [-20, 20],
    opacity: [0.8, 1],
    scale: [0.8, 1],
    easing: 'easeInQuad',
    startScroll: 100,
    endScroll: 400,
  });
  
  console.log('Courses state:', { courses, status, error }); // Debug log

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchCourses());
    }
  }, [status, dispatch]);

  if (status === 'loading') {
    return <div className="loading">Loading courses...</div>;
  }

  if (status === 'failed') {
    return <div className="error">Error: {error}</div>;
  }

  // Tambahkan pemeriksaan courses sebelum mapping
  if (!courses || !Array.isArray(courses)) {
    return <div className="error">No courses available or invalid data format</div>;
  }
  
  const formatRupiah = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(price);
  };

  // Create a function for horizontal card animation offset
  const getHorizontalOffset = (index) => {
    // Create an alternating pattern across rows
    const rowIndex = Math.floor(index / 3); // Assuming roughly 3 cards per row
    const colIndex = index % 3;
    
    // Different offset for each row to create a wave-like pattern
    return rowIndex % 2 === 0 ? 
      Math.sin(colIndex * 0.8) * 15 : 
      Math.cos(colIndex * 0.8) * 15;
  };

  const handleDetailClick = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  return (
    <div className="courses-container" id="courses-section">
      <h2 ref={titleParallax.ref}>Available Courses</h2>
      <div className="courses-grid">
        {courses.map((course, index) => (
          <div 
            className="course-card" 
            key={course.id || index}
            style={{
              transform: `translateY(${getHorizontalOffset(index)}px)`,
              transition: 'transform 0.5s ease-in-out, box-shadow 0.3s ease',
              animationDelay: `${index * 0.1}s`
            }}
          >
            <div className="card-content">
              <div className="card-header">
                <h3>{course.title || 'No Title'}</h3>
                <div className="course-price">{formatRupiah(course.price || 0)}</div>
              </div>
              <div className="card-body">
                <p>{course.description || course.desc || 'No Description'}</p>
              </div>
              <div className="card-footer">
                <button 
                  className="detail-button"
                  onClick={() => handleDetailClick(course.id)}
                >
                  Detail
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Courses;