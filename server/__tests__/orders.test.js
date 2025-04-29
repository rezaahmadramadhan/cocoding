const request = require('supertest');
const app = require('../app');
const { User, Course, Category, Order, OrderDetail } = require('../models');
const { hashPassword } = require('../helpers/bcrypt');
const { signToken } = require('../helpers/jwt');

let access_token;
let userId;
let testCourseId;
let courseStartEnrollment;

beforeAll(async () => {
  // Clean up existing data
  await OrderDetail.destroy({ truncate: true, cascade: true, restartIdentity: true });
  await Order.destroy({ truncate: true, cascade: true, restartIdentity: true });
  await Course.destroy({ truncate: true, cascade: true, restartIdentity: true });
  await Category.destroy({ truncate: true, cascade: true, restartIdentity: true });
  await User.destroy({ truncate: true, cascade: true, restartIdentity: true });
  
  // Create test user
  const testUser = await User.create({
    fullName: 'Order Test User',
    email: 'ordertest@example.com',
    password: hashPassword('password123'),
    role: 'customer'
  });
  
  userId = testUser.id;
  access_token = signToken({ id: userId });
  
  // Create test category
  const testCategory = await Category.create({
    catName: 'Test Category',
    progLang: 'JavaScript'
  });
  
  // Create test course
  const testCourse = await Course.create({
    title: 'Test Course for Order',
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
  courseStartEnrollment = testCourse.totalEnrollment;
});

afterAll(async () => {
  await OrderDetail.destroy({ truncate: true, cascade: true, restartIdentity: true });
  await Order.destroy({ truncate: true, cascade: true, restartIdentity: true });
  await Course.destroy({ truncate: true, cascade: true, restartIdentity: true });
  await Category.destroy({ truncate: true, cascade: true, restartIdentity: true });
  await User.destroy({ truncate: true, cascade: true, restartIdentity: true });
});

describe('Orders API', () => {
  describe('POST /orders/checkout', () => {
    it('should create a new order when authenticated', async () => {
      const orderData = {
        courseId: testCourseId,
        paymentMethod: 'Credit Card'
      };
      
      const response = await request(app)
        .post('/orders/checkout')
        .set('Authorization', `Bearer ${access_token}`)
        .send(orderData);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Checkout successful');
      expect(response.body).toHaveProperty('order');
      expect(response.body.order).toHaveProperty('id');
      expect(response.body.order).toHaveProperty('paymentMethod', 'Credit Card');
      expect(response.body.order).toHaveProperty('paymentStatus', 'pending');
      
      // Check if course enrollment increased
      const updatedCourse = await Course.findByPk(testCourseId);
      expect(updatedCourse.totalEnrollment).toBe(courseStartEnrollment + 1);
      
      // Check if order details were created
      const orderDetail = await OrderDetail.findOne({
        where: { CourseId: testCourseId }
      });
      expect(orderDetail).not.toBeNull();
      expect(orderDetail.price).toBe(1000000);
    });
    
    it('should fail if not authenticated', async () => {
      const orderData = {
        courseId: testCourseId,
        paymentMethod: 'Credit Card'
      };
      
      const response = await request(app)
        .post('/orders/checkout')
        .send(orderData);
      
      expect(response.status).toBe(401);
    });
    
    it('should fail if course ID is missing', async () => {
      const orderData = {
        paymentMethod: 'Credit Card'
      };
      
      const response = await request(app)
        .post('/orders/checkout')
        .set('Authorization', `Bearer ${access_token}`)
        .send(orderData);
      
      expect(response.status).toBe(400);
    });
    
    it('should fail if course does not exist', async () => {
      const orderData = {
        courseId: 9999, // Non-existent course
        paymentMethod: 'Credit Card'
      };
      
      const response = await request(app)
        .post('/orders/checkout')
        .set('Authorization', `Bearer ${access_token}`)
        .send(orderData);
      
      expect(response.status).toBe(404);
    });
    
    it('should use default payment method if not provided', async () => {
      const orderData = {
        courseId: testCourseId
      };
      
      const response = await request(app)
        .post('/orders/checkout')
        .set('Authorization', `Bearer ${access_token}`)
        .send(orderData);
      
      expect(response.status).toBe(201);
      expect(response.body.order).toHaveProperty('paymentMethod', 'Credit Card');
    });
  });
});