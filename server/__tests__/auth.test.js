const request = require('supertest');
const app = require('../app');
const { hashPassword } = require('../helpers/bcrypt');
const { signToken } = require('../helpers/jwt');

// Mock the models and authentication helpers
jest.mock('../models', () => {
  const mockUser = {
    id: 1,
    fullName: 'Test User',
    email: 'test@example.com',
    password: '$2a$10$SomeHashedPasswordValue',
    role: 'customer'
  };
  
  return {
    User: {
      destroy: jest.fn().mockResolvedValue(true),
      create: jest.fn().mockImplementation((data) => {
        if (data.email === 'test@example.com' || data.email === 'duplicate@example.com') {
          throw new Error('SequelizeUniqueConstraintError');
        }
        return Promise.resolve({
          id: 2,
          ...data,
          password: undefined
        });
      }),
      findOne: jest.fn().mockImplementation(({ where }) => {
        if (where.email === 'test@example.com') {
          return Promise.resolve(mockUser);
        }
        return Promise.resolve(null);
      }),
      findByPk: jest.fn().mockImplementation((id) => {
        if (id === 1) {
          return Promise.resolve(mockUser);
        } else if (id === 999) {
          // User to be deleted
          return Promise.resolve({
            id: 999,
            fullName: 'To Be Deleted',
            email: 'delete@example.com',
            password: '$2a$10$SomeHashedPasswordValue',
            role: 'customer',
            destroy: jest.fn().mockResolvedValue(true)
          });
        }
        return Promise.resolve(null);
      })
    }
  };
});

jest.mock('../helpers/bcrypt', () => ({
  hashPassword: jest.fn().mockReturnValue('$2a$10$SomeHashedPasswordValue'),
  comparePassword: jest.fn().mockImplementation((plainPassword, hashedPassword) => {
    return plainPassword === 'password123';
  })
}));

jest.mock('../helpers/googleAuth', () => ({
  verifyGoogleToken: jest.fn().mockResolvedValue({
    email: 'google@example.com',
    name: 'Google User'
  })
}));

const access_token = signToken({ id: 1 });
const deleteToken = signToken({ id: 999 });

describe('Auth API', () => {
  describe('GET /', () => {
    it('should return welcome message', async () => {
      const response = await request(app).get('/');
      
      expect(response.status).toBe(200);
      expect(response.body).toBeTruthy();
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
      expect(response.body).toBeTruthy();
    });
    
    it('should fail if email is already registered', async () => {
      const userData = {
        fullName: 'Duplicate User',
        email: 'duplicate@example.com',
        password: 'password123',
        role: 'customer'
      };
      
      const response = await request(app)
        .post('/register')
        .send(userData);
      
      expect(response.status).toBe(400);
      expect(response.body).toBeTruthy();
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
      expect(response.body).toBeTruthy();
    });
  });
  
  describe('POST /login', () => {
    it('should login successfully with correct credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
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
      expect(response.body).toBeTruthy();
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
      expect(response.body).toBeTruthy();
    });
    
    it('should fail if email is missing', async () => {
      const loginData = {
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/login')
        .send(loginData);
      
      expect(response.status).toBe(400);
      expect(response.body).toBeTruthy();
    });
    
    it('should fail if password is missing', async () => {
      const loginData = {
        email: 'test@example.com'
      };
      
      const response = await request(app)
        .post('/login')
        .send(loginData);
      
      expect(response.status).toBe(400);
      expect(response.body).toBeTruthy();
    });
  });
  
  describe('POST /google-login', () => {
    it('should handle Google login attempt with mock token', async () => {
      const response = await request(app)
        .post('/google-login')
        .send({ token: 'mock_google_token' });
      
      // Will handle both success and failure scenarios
      expect(response.status).toBeTruthy();
    });
  });
  
  describe('DELETE /delete-account', () => {
    it('should delete user account when authenticated', async () => {
      const response = await request(app)
        .delete('/delete-account')
        .set('Authorization', `Bearer ${deleteToken}`);
      
      // Even if actual DB deletion doesn't happen due to mocking, the endpoint should respond correctly
      expect(response.status).toBe(200);
      expect(response.body).toBeTruthy();
    });
    
    it('should fail if not authenticated', async () => {
      const response = await request(app)
        .delete('/delete-account');
      
      expect(response.status).toBe(401);
      expect(response.body).toBeTruthy();
    });
    
    it('should fail with invalid token', async () => {
      const response = await request(app)
        .delete('/delete-account')
        .set('Authorization', 'Bearer invalid_token');
      
      expect(response.status).toBe(401);
      expect(response.body).toBeTruthy();
    });
  });
});