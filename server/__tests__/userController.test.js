const { describe, it, expect, beforeEach } = require('@jest/globals');
const UserController = require('../controllers/UserController');
const { User } = require('../models');
const { comparePassword } = require('../helpers/bcrypt');
const { signToken } = require('../helpers/jwt');
const { verifyGoogleToken } = require('../helpers/googleAuth');

// Mock dependencies
jest.mock('../models', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    fullName: 'Test User',
    password: 'hashedPassword',
    role: 'customer',
    toJSON: jest.fn().mockReturnValue({
      id: 1,
      email: 'test@example.com',
      fullName: 'Test User',
      password: 'hashedPassword'
    })
  };

  return {
    User: {
      create: jest.fn().mockResolvedValue(mockUser),
      findOne: jest.fn().mockImplementation((query) => {
        if (query.where.email === 'test@example.com') {
          return Promise.resolve(mockUser);
        }
        if (query.where.email === 'google@example.com') {
          return Promise.resolve(null);
        }
        return Promise.resolve(null);
      }),
      findByPk: jest.fn().mockImplementation((id, options) => {
        if (id === 1) {
          if (options && options.attributes && options.attributes.exclude) {
            const user = { ...mockUser };
            delete user.password;
            return Promise.resolve(user);
          }
          return Promise.resolve(mockUser);
        }
        return Promise.resolve(null);
      }),
      update: jest.fn().mockResolvedValue([1]),
      destroy: jest.fn().mockResolvedValue(1)
    }
  };
});

jest.mock('../helpers/bcrypt', () => ({
  comparePassword: jest.fn()
}));

jest.mock('../helpers/jwt', () => ({
  signToken: jest.fn().mockReturnValue('mock-token')
}));

jest.mock('../helpers/googleAuth', () => ({
  verifyGoogleToken: jest.fn()
}));

describe('UserController', () => {
  let req;
  let res;
  let next;
  
  beforeEach(() => {
    req = {
      body: {},
      user: { id: 1 }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
    
    // Reset all mocks
    jest.clearAllMocks();
  });
  
  describe('home', () => {
    it('should return welcome message', () => {
      // Act
      UserController.home(req, res);
      
      // Assert
      expect(res.json).toHaveBeenCalledWith('Welcome to the home page!');
    });
  });
  
  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      req.body = {
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };
      
      // Act
      await UserController.register(req, res, next);
      
      // Assert
      expect(User.create).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      // Password should not be included in the response
      expect(res.json.mock.calls[0][0].password).toBeUndefined();
    });
    
    it('should handle errors during registration', async () => {
      // Arrange
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const error = new Error('Registration failed');
      User.create.mockRejectedValueOnce(error);
      
      // Act
      await UserController.register(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
    });
  });
  
  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      // Arrange
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      comparePassword.mockReturnValueOnce(true);
      
      // Act
      await UserController.login(req, res, next);
      
      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(comparePassword).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(signToken).toHaveBeenCalledWith({ id: 1 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ access_token: 'mock-token' });
    });
    
    it('should throw BadRequest error if email is missing', async () => {
      // Arrange
      req.body = {
        password: 'password123'
      };
      
      // Act
      await UserController.login(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        name: 'BadRequest',
        message: 'Email is required'
      }));
    });
    
    it('should throw BadRequest error if password is missing', async () => {
      // Arrange
      req.body = {
        email: 'test@example.com'
      };
      
      // Act
      await UserController.login(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        name: 'BadRequest',
        message: 'Password is required'
      }));
    });
    
    it('should throw Unauthorized error if user is not found', async () => {
      // Arrange
      req.body = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };
      
      User.findOne.mockResolvedValueOnce(null);
      
      // Act
      await UserController.login(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Unauthorized',
        message: 'Invalid email/password'
      }));
    });
    
    it('should throw Unauthorized error if password is incorrect', async () => {
      // Arrange
      req.body = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };
      
      comparePassword.mockReturnValueOnce(false);
      
      // Act
      await UserController.login(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Unauthorized',
        message: 'Invalid email/password'
      }));
    });
  });
  
  describe('googleLogin', () => {
    it('should login successfully with valid Google token for existing user', async () => {
      // Arrange
      req.body = {
        token: 'valid-google-token'
      };
      
      verifyGoogleToken.mockResolvedValueOnce({
        name: 'Test User',
        email: 'test@example.com',
        picture: 'https://example.com/picture.jpg'
      });
      
      // Act
      await UserController.googleLogin(req, res, next);
      
      // Assert
      expect(verifyGoogleToken).toHaveBeenCalledWith('valid-google-token');
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(signToken).toHaveBeenCalledWith({ id: 1 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        access_token: 'mock-token'
      }));
    });
    
    it('should create a new user when logging in with Google for the first time', async () => {
      // Arrange
      req.body = {
        token: 'valid-google-token'
      };
      
      verifyGoogleToken.mockResolvedValueOnce({
        name: 'Google User',
        email: 'google@example.com',
        picture: 'https://example.com/picture.jpg'
      });
      
      // Mock for findOne to return null (user not found)
      User.findOne.mockResolvedValueOnce(null);
      
      // Mock for create to return a new user
      const newUser = {
        id: 2,
        email: 'google@example.com',
        fullName: 'Google User',
        role: 'customer'
      };
      User.create.mockResolvedValueOnce(newUser);
      
      // Act
      await UserController.googleLogin(req, res, next);
      
      // Assert
      expect(verifyGoogleToken).toHaveBeenCalledWith('valid-google-token');
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'google@example.com' } });
      expect(User.create).toHaveBeenCalled();
      expect(signToken).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
    
    it('should throw BadRequest error if token is missing', async () => {
      // Arrange
      req.body = {};
      
      // Act
      await UserController.googleLogin(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        name: 'BadRequest',
        message: 'Google token is required'
      }));
    });
    
    it('should handle errors during Google token verification', async () => {
      // Arrange
      req.body = {
        token: 'invalid-google-token'
      };
      
      const error = new Error('Verification failed');
      verifyGoogleToken.mockRejectedValueOnce(error);
      
      // Act
      await UserController.googleLogin(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
    });
  });
  
  describe('deleteAccount', () => {
    it('should delete user account successfully', async () => {
      // Act
      await UserController.deleteAccount(req, res, next);
      
      // Assert
      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(User.destroy).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Your account has been successfully deleted' 
      });
    });
    
    it('should throw NotFound error if user does not exist', async () => {
      // Arrange
      req.user = { id: 999 };
      User.findByPk.mockResolvedValueOnce(null);
      
      // Act
      await UserController.deleteAccount(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        name: 'NotFound',
        message: 'User not found'
      }));
    });
  });
  
  describe('getProfile', () => {
    it('should return user profile successfully', async () => {
      // Act
      await UserController.getProfile(req, res, next);
      
      // Assert
      expect(User.findByPk).toHaveBeenCalledWith(1, expect.objectContaining({
        attributes: { exclude: ['password'] }
      }));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
    
    it('should throw NotFound error if user does not exist', async () => {
      // Arrange
      req.user = { id: 999 };
      User.findByPk.mockResolvedValueOnce(null);
      
      // Act
      await UserController.getProfile(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        name: 'NotFound',
        message: 'User not found'
      }));
    });
  });
  
  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      // Arrange
      req.body = {
        fullName: 'Updated Name',
        age: '30',
        address: 'Updated Address',
        phone: '123456789',
        about: 'Updated bio'
      };
      
      // Act
      await UserController.updateProfile(req, res, next);
      
      // Assert
      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(User.update).toHaveBeenCalledWith(
        {
          fullName: 'Updated Name',
          age: 30,
          address: 'Updated Address',
          phone: '123456789',
          about: 'Updated bio'
        },
        { where: { id: 1 } }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
    
    it('should throw NotFound error if user does not exist', async () => {
      // Arrange
      req.user = { id: 999 };
      User.findByPk.mockResolvedValueOnce(null);
      
      // Act
      await UserController.updateProfile(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        name: 'NotFound',
        message: 'User not found'
      }));
    });
  });
});