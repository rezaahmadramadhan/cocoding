const { describe, it, expect, beforeEach } = require('@jest/globals');
const CourseController = require('../controllers/CourseController');
const { Course, Category } = require("../models");
const { Op } = require("sequelize");

// Mock the dependencies
jest.mock('../models', () => {
  const mockCourses = [
    {
      id: 1,
      title: 'JavaScript Basics',
      price: 1000000,
      rating: 4.5,
      totalEnrollment: 100,
      CategoryId: 1,
      Category: { id: 1, catName: 'Programming', progLang: 'JavaScript' }
    },
    {
      id: 2,
      title: 'Advanced Python',
      price: 1500000,
      rating: 4.8,
      totalEnrollment: 80,
      CategoryId: 2,
      Category: { id: 2, catName: 'Programming', progLang: 'Python' }
    }
  ];

  return {
    Course: {
      findAndCountAll: jest.fn().mockResolvedValue({
        count: mockCourses.length,
        rows: mockCourses
      }),
      findByPk: jest.fn().mockImplementation((id) => {
        const course = mockCourses.find(c => c.id === +id);
        return Promise.resolve(course);
      })
    },
    Category: {}
  };
});

describe('CourseController', () => {
  let req;
  let res;
  let next;
  
  beforeEach(() => {
    req = {
      query: {},
      params: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
    
    // Reset mock implementation
    jest.clearAllMocks();
  });
  
  describe('getAllCourses', () => {
    it('should return all courses with default pagination', async () => {
      // Act
      await CourseController.getAllCourses(req, res, next);
      
      // Assert
      expect(Course.findAndCountAll).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        page: 1,
        totalData: 2,
        data: expect.any(Array)
      }));
    });
    
    it('should handle search parameter', async () => {
      // Arrange
      req.query.search = 'JavaScript';
      
      // Act
      await CourseController.getAllCourses(req, res, next);
      
      // Assert
      expect(Course.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            title: expect.anything() // Check for the iLike operation with search term
          })
        })
      );
    });
    
    it('should handle sort parameter (ascending)', async () => {
      // Arrange
      req.query.sort = 'price';
      
      // Act
      await CourseController.getAllCourses(req, res, next);
      
      // Assert
      expect(Course.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [['price', 'ASC']]
        })
      );
    });
    
    it('should handle sort parameter (descending)', async () => {
      // Arrange
      req.query.sort = '-price';
      
      // Act
      await CourseController.getAllCourses(req, res, next);
      
      // Assert
      expect(Course.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [['price', 'DESC']]
        })
      );
    });
    
    it('should handle filter parameter', async () => {
      // Arrange
      req.query.filter = '1'; // Category ID
      
      // Act
      await CourseController.getAllCourses(req, res, next);
      
      // Assert
      expect(Course.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            CategoryId: '1'
          })
        })
      );
    });
    
    it('should handle pagination parameters', async () => {
      // Arrange
      req.query.page = '2';
      req.query.limit = '5';
      
      // Act
      await CourseController.getAllCourses(req, res, next);
      
      // Assert
      expect(Course.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 5,
          offset: 5 // (page-1) * limit = (2-1) * 5 = 5
        })
      );
    });
    
    it('should handle error and pass to next middleware', async () => {
      // Arrange
      const error = new Error('Database error');
      Course.findAndCountAll.mockRejectedValueOnce(error);
      
      // Act
      await CourseController.getAllCourses(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
    });
  });
  
  describe('getCourseById', () => {
    it('should return a course when found', async () => {
      // Arrange
      req.params.id = '1';
      
      // Act
      await CourseController.getCourseById(req, res, next);
      
      // Assert
      expect(Course.findByPk).toHaveBeenCalledWith('1', expect.anything());
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        id: 1,
        title: 'JavaScript Basics'
      }));
    });
    
    it('should throw NotFound error when course does not exist', async () => {
      // Arrange
      req.params.id = '999'; // Non-existent ID
      Course.findByPk.mockResolvedValueOnce(null);
      
      // Act
      await CourseController.getCourseById(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        name: 'NotFound',
        message: 'Course not found'
      }));
    });
    
    it('should handle error and pass to next middleware', async () => {
      // Arrange
      req.params.id = '1';
      const error = new Error('Database error');
      Course.findByPk.mockRejectedValueOnce(error);
      
      // Act
      await CourseController.getCourseById(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});