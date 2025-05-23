import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { fetchCourses, setSearchParams, resetSearch } from '../store/coursesSlice';
import { useParallax } from 'react-scroll-parallax';
import '../styles/Courses.css';

const Courses = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { courses, status, error, pagination, searchParams } = useSelector((state) => state.courses);
  const [searchTerm, setSearchTerm] = useState(searchParams.search || '');

  const titleParallax = useParallax({
    translateY: [-20, 20],
    opacity: [0.8, 1],
    scale: [0.8, 1],
    easing: 'easeInQuad',
    startScroll: 100,
    endScroll: 400,
  });
  
  useEffect(() => {
    const params = {
      search: searchParams.search,
      page: searchParams.page || 1,
      sort: searchParams.sort,
      filter: searchParams.filter
    };
    dispatch(fetchCourses(params));
  }, [dispatch, searchParams.search, searchParams.page, searchParams.sort, searchParams.filter]);

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(setSearchParams({ search: searchTerm, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    console.log('Pagination clicked:', { newPage, currentPage: pagination.page, maxPage: pagination.maxPage });
    if (newPage >= 1 && newPage <= pagination.maxPage) {
      dispatch(setSearchParams({ page: newPage }));
    }
  };

  const handleResetSearch = () => {
    setSearchTerm('');
    dispatch(resetSearch());
  };

  if (status === 'loading') {
    return <div className="loading">Loading courses...</div>;
  }

  if (status === 'failed') {
    return <div className="error">Error: {error}</div>;
  }

  if (!courses || !Array.isArray(courses)) {
    return <div className="error">No courses available or invalid data format</div>;
  }
  
  const formatRupiah = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(price);
  };

  const getHorizontalOffset = (index) => {
    const rowIndex = Math.floor(index / 3); 
    const colIndex = index % 3;
    
    return rowIndex % 2 === 0 ? 
      Math.sin(colIndex * 0.8) * 15 : 
      Math.cos(colIndex * 0.8) * 15;
  };

  const handleDetailClick = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const { page, maxPage } = pagination;
    
    buttons.push(
      <button 
        key="prev"
        className={`pagination-button ${page <= 1 ? 'disabled' : ''}`}
        onClick={() => handlePageChange(page - 1)}
        disabled={page <= 1}
      >
        &laquo; Previous
      </button>
    );
    
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(maxPage, page + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button 
          key={i}
          className={`pagination-button ${i === page ? 'active' : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }
    
    buttons.push(
      <button 
        key="next"
        className={`pagination-button ${page >= maxPage ? 'disabled' : ''}`}
        onClick={() => handlePageChange(page + 1)}
        disabled={page >= maxPage}
      >
        Next &raquo;
      </button>
    );
    
    return buttons;
  };

  return (
    <div className="courses-container" id="courses-section">
      <div className="title-container">
        <h2 ref={titleParallax.ref}>Available Courses</h2>
      </div>
      
      <div className="search-container">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">
            Search
          </button>
          {searchTerm && (
            <button 
              type="button" 
              onClick={handleResetSearch} 
              className="reset-button"
            >
              Reset
            </button>
          )}
        </form>
      </div>

      <div className="results-info">
        Found {pagination.totalData} course{pagination.totalData !== 1 ? 's' : ''}
        {searchParams.search ? ` matching "${searchParams.search}"` : ''}
        <span className="page-info">
          (Showing {pagination.pageData || courses.length} items per page)
        </span>
      </div>
      
      <div className="courses-grid">
        {courses.length > 0 ? (
          courses.map((course, index) => (
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
                  <div className="course-image">
                    <img src={course.courseImg || 'https://via.placeholder.com/150'} alt={course.title} />
                  </div>
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
          ))
        ) : (
          <div className="no-courses">
            <p>No courses found. Try adjusting your search criteria.</p>
          </div>
        )}
      </div>
      
      {pagination.maxPage > 1 && (
        <div className="pagination-container">
          {renderPaginationButtons()}
        </div>
      )}
    </div>
  );
};

export default Courses;