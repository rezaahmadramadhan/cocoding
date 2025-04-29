const request = require('supertest');
const app = require('../app');
const { User, Course, Category } = require('../models');
const { hashPassword } = require('../helpers/bcrypt');
const { signToken } = require('../helpers/jwt');

let testCourseId;

beforeAll(async () => {
  // Setup test data
  await Category.destroy({ truncate: true, cascade: true, restartIdentity: true });
  await Course.destroy({ truncate: true, cascade: true, restartIdentity: true });
  
  // Create test category
  const testCategory = await Category.create({
    catName: 'Test Category',
    progLang: 'JavaScript'
  });
  
  // Create test courses
  const testCourse = await Course.create({
    title: 'Test Course',
    price: 1000000,
    rating: 4.5,
    totalEnrollment: 100,
    startDate: new Date('2025-06-01'),
    desc: 'This is a test course description',
    courseImg: 'https://example.com/test-course.jpg',
    durationHours: 30,
    code: 'test_20250601',
    CategoryId: testCategory.id
  });
  
  testCourseId = testCourse.id;
  
  // Create a second course for listing tests
  await Course.create({
    title: 'Another Test Course',
    price: 1500000,
    rating: 4.8,
    totalEnrollment: 150,
    startDate: new Date('2025-07-01'),
    desc: 'This is another test course description',
    courseImg: 'https://example.com/test-course-2.jpg',
    durationHours: 40,
    code: 'anoth_20250701',
    CategoryId: testCategory.id
  });
});

afterAll(async () => {
  await Course.destroy({ truncate: true, cascade: true, restartIdentity: true });
  await Category.destroy({ truncate: true, cascade: true, restartIdentity: true });
});

describe('Courses API', () => {
  describe('GET /courses', () => {
    it('should return a list of courses', async () => {
      const response = await request(app).get('/courses');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('totalData', 2);
    });
    
    it('should filter courses by search term', async () => {
      const response = await request(app).get('/courses?search=Another');
      
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].title).toBe('Another Test Course');
    });
    
    it('should sort courses by price ascending', async () => {
      const response = await request(app).get('/courses?sort=price');
      
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0].price).toBe(1000000);
      expect(response.body.data[1].price).toBe(1500000);
    });
    
    it('should sort courses by price descending', async () => {
      const response = await request(app).get('/courses?sort=-price');
      
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0].price).toBe(1500000);
      expect(response.body.data[1].price).toBe(1000000);
    });
    
    it('should filter courses by category', async () => {
      const category = await Category.findOne({ where: { catName: 'Test Category' } });
      const response = await request(app).get(`/courses?filter=${category.id}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0].CategoryId).toBe(category.id);
      expect(response.body.data[1].CategoryId).toBe(category.id);
    });
    
    it('should paginate results', async () => {
      const response = await request(app).get('/courses?limit=1&page=1');
      
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('maxPage', 2);
    });
  });
  
  describe('GET /courses/:id', () => {
    it('should return a single course by id', async () => {
      const response = await request(app).get(`/courses/${testCourseId}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testCourseId);
      expect(response.body).toHaveProperty('title', 'Test Course');
      expect(response.body).toHaveProperty('Category');
    });
    
    it('should return 404 for non-existent course id', async () => {
      const response = await request(app).get('/courses/9999');
      
      expect(response.status).toBe(404);
    });
  });
});