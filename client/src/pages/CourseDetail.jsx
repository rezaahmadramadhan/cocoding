import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link, useNavigate } from 'react-router';
import { fetchCourseDetail } from '../store/courseDetailSlice';
import '../styles/CourseDetail.css';

const CourseDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { courseDetail, status, error } = useSelector((state) => state.courseDetail);

  useEffect(() => {
    if (id) {
      dispatch(fetchCourseDetail(id));
    }
  }, [id, dispatch]);

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
    return <div className="loading">Loading course details...</div>;
  }

  if (status === 'failed') {
    return <div className="error">Error: {error}</div>;
  }

  if (!courseDetail) {
    return <div className="error">Course not found</div>;
  }

  return (
    <div className="course-detail-container">
      <div className="course-detail-header">
        <Link to="/" className="back-button">Back to Courses</Link>
        <h1>{courseDetail.title}</h1>
        {courseDetail.Category && (
          <div className="course-category">
            <span className="category-name">{courseDetail.Category.catName}</span>
            <span className="prog-lang">{courseDetail.Category.progLang}</span>
          </div>
        )}
      </div>
      
      <div className="course-detail-content">
        {courseDetail.courseImg && (
          <div className="course-image">
            <img src={courseDetail.courseImg} alt={courseDetail.title} />
          </div>
        )}
        
        <div className="course-detail-main">
          <div className="course-detail-info">
            <div className="course-price-detail">{formatRupiah(courseDetail.price || 0)}</div>
            
            <div className="course-stats">
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
            </div>
            
            <div className="course-description">
              <h3>Description</h3>
              <p>{courseDetail.description || courseDetail.desc || 'No description available'}</p>
            </div>
            
            <div className="course-meta">
              <p className="meta-item">
                <span className="meta-label">Created:</span> {formatDate(courseDetail.createdAt)}
              </p>
              <p className="meta-item">
                <span className="meta-label">Last Updated:</span> {formatDate(courseDetail.updatedAt)}
              </p>
            </div>
          </div>
          
          <div className="course-actions">
            <button 
              className="enroll-button" 
              onClick={handleEnrollNow}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Enroll Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;