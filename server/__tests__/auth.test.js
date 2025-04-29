const request = require('supertest');
const app = require('../app');
const { User } = require('../models');
const { hashPassword } = require('../helpers/bcrypt');
const { signToken } = require('../helpers/jwt');

let access_token;
let userId;
const testPassword = 'password123';

beforeAll(async () => {
  await User.destroy({ truncate: true, cascade: true, restartIdentity: true });
  
  // Create test user for login tests
  const testUser = await User.create({
    fullName: 'Test User',
    email: 'test@example.com',
    password: testPassword, // Use plain password - model hook will hash it
    role: 'customer'
  });
  
  userId = testUser.id;
  access_token = signToken({ id: userId });
});

afterAll(async () => {
  await User.destroy({ truncate: true, cascade: true, restartIdentity: true });
});

describe('Auth API', () => {
  describe('GET /', () => {
    it('should return welcome message', async () => {
      const response = await request(app).get('/');
      
      expect(response.status).toBe(200);
      expect(response.body).toBe('Welcome to the home page!');
    });
  });
  
  describe('POST /register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        fullName: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        role: 'customer'
      };
      
      const response = await request(app)
        .post('/register')
        .send(userData);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', userData.email);
      expect(response.body).toHaveProperty('fullName', userData.fullName);
      expect(response.body).not.toHaveProperty('password');
    });
    
    it('should fail if email is already registered', async () => {
      const userData = {
        fullName: 'Test User',
        email: 'test@example.com', // Already exists
        password: 'password123',
        role: 'customer'
      };
      
      const response = await request(app)
        .post('/register')
        .send(userData);
      
      expect(response.status).toBe(400);
    });
    
    it('should fail if required fields are missing', async () => {
      const userData = {
        fullName: 'Incomplete User',
        // email missing
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/register')
        .send(userData);
      
      expect(response.status).toBe(400);
    });
  });
  
  describe('POST /login', () => {
    it('should login successfully with correct credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: testPassword
      };
      
      const response = await request(app)
        .post('/login')
        .send(loginData);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('access_token');
    });
    
    it('should fail with incorrect password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };
      
      const response = await request(app)
        .post('/login')
        .send(loginData);
      
      expect(response.status).toBe(401);
    });
    
    it('should fail with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/login')
        .send(loginData);
      
      expect(response.status).toBe(401);
    });
    
    it('should fail if email is missing', async () => {
      const loginData = {
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/login')
        .send(loginData);
      
      expect(response.status).toBe(400);
    });
    
    it('should fail if password is missing', async () => {
      const loginData = {
        email: 'test@example.com'
      };
      
      const response = await request(app)
        .post('/login')
        .send(loginData);
      
      expect(response.status).toBe(400);
    });
  });
  
  describe('DELETE /delete-account', () => {
    it('should delete user account when authenticated', async () => {
      const response = await request(app)
        .delete('/delete-account')
        .set('Authorization', `Bearer ${access_token}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Your account has been successfully deleted');
      
      // Verify user no longer exists
      const user = await User.findByPk(userId);
      expect(user).toBeNull();
    });
    
    it('should fail if not authenticated', async () => {
      const response = await request(app)
        .delete('/delete-account');
      
      expect(response.status).toBe(401);
    });
    
    it('should fail with invalid token', async () => {
      const response = await request(app)
        .delete('/delete-account')
        .set('Authorization', 'Bearer invalid_token');
      
      expect(response.status).toBe(401);
    });
  });
});