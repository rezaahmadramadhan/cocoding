const { describe, it, expect, beforeEach } = require('@jest/globals');
const authentication = require('../middlewares/authentication');
const errorHandler = require('../middlewares/errorHandler');
const { verifyToken } = require('../helpers/jwt');
const { signToken } = require('../helpers/jwt');

// Mock the dependencies
jest.mock('../helpers/jwt', () => ({
  verifyToken: jest.fn(),
  signToken: jest.fn().mockImplementation((payload) => `mock_token_${payload.id}`)
}));

jest.mock('../models', () => {
  return {
    User: {
      findByPk: jest.fn()
    }
  };
});

describe('Authentication Middleware', () => {
  let req;
  let res;
  let next;
  const mockUser = { id: 1, email: 'test@example.com' };
  
  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {};
    next = jest.fn();
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Default mock implementations
    verifyToken.mockReturnValue({ id: mockUser.id });
    require('../models').User.findByPk.mockResolvedValue(mockUser);
  });
  
  it('should authenticate valid token and set user on request', async () => {
    // Arrange
    req.headers.authorization = 'Bearer valid_token';
    
    // Act
    await authentication(req, res, next);
    
    // Assert
    expect(verifyToken).toHaveBeenCalledWith('valid_token');
    expect(require('../models').User.findByPk).toHaveBeenCalledWith(mockUser.id);
    expect(req.user).toEqual({ id: mockUser.id });
    expect(next).toHaveBeenCalledWith();
  });
  
  it('should throw error if authorization header is missing', async () => {
    // Arrange - no authorization header
    
    // Act
    await authentication(req, res, next);
    
    // Assert
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Unauthorized',
      message: 'Invalid Token'
    }));
  });
  
  it('should throw error if token type is not Bearer', async () => {
    // Arrange
    req.headers.authorization = 'Basic valid_token';
    
    // Act
    await authentication(req, res, next);
    
    // Assert
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Unauthorized',
      message: 'Unauthorized Error'
    }));
  });
  
  it('should throw error if token value is missing', async () => {
    // Arrange
    req.headers.authorization = 'Bearer ';
    
    // Act
    await authentication(req, res, next);
    
    // Assert
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Unauthorized',
      message: 'Unauthorized Error'
    }));
  });
  
  it('should throw error if user does not exist', async () => {
    // Arrange
    req.headers.authorization = 'Bearer valid_token';
    require('../models').User.findByPk.mockResolvedValue(null);
    
    // Act
    await authentication(req, res, next);
    
    // Assert
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Unauthorized',
      message: 'Unauthorized Error'
    }));
  });
  
  it('should pass JWT verification errors to next middleware', async () => {
    // Arrange
    req.headers.authorization = 'Bearer invalid_token';
    const error = new Error('Token verification failed');
    verifyToken.mockImplementation(() => {
      throw error;
    });
    
    // Act
    await authentication(req, res, next);
    
    // Assert
    expect(next).toHaveBeenCalledWith(error);
  });
});

describe('Error Handler Middleware', () => {
  let req;
  let res;
  let next;
  let jsonSpy;
  let statusSpy;
  
  beforeEach(() => {
    jsonSpy = jest.fn().mockReturnThis();
    statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });
    
    req = {};
    res = {
      status: statusSpy,
      json: jsonSpy
    };
    next = jest.fn();
  });
  
  it('should handle SequelizeValidationError with 400 status', () => {
    // Arrange
    const error = {
      name: 'SequelizeValidationError',
      errors: [{ message: 'Validation error message' }]
    };
    
    // Act
    errorHandler(error, req, res, next);
    
    // Assert
    expect(statusSpy).toHaveBeenCalledWith(400);
    expect(jsonSpy).toHaveBeenCalledWith({ message: 'Validation error message' });
  });
  
  it('should handle SequelizeUniqueConstraintError with 400 status', () => {
    // Arrange
    const error = {
      name: 'SequelizeUniqueConstraintError',
      errors: [{ message: 'Unique constraint error message' }]
    };
    
    // Act
    errorHandler(error, req, res, next);
    
    // Assert
    expect(statusSpy).toHaveBeenCalledWith(400);
    expect(jsonSpy).toHaveBeenCalledWith({ message: 'Unique constraint error message' });
  });
  
  it('should handle BadRequest error with 400 status', () => {
    // Arrange
    const error = {
      name: 'BadRequest',
      message: 'Bad request error message'
    };
    
    // Act
    errorHandler(error, req, res, next);
    
    // Assert
    expect(statusSpy).toHaveBeenCalledWith(400);
    expect(jsonSpy).toHaveBeenCalledWith({ message: 'Bad request error message' });
  });
  
  it('should handle JsonWebTokenError with 401 status', () => {
    // Arrange
    const error = {
      name: 'JsonWebTokenError',
      message: 'JWT error message'
    };
    
    // Act
    errorHandler(error, req, res, next);
    
    // Assert
    expect(statusSpy).toHaveBeenCalledWith(401);
    expect(jsonSpy).toHaveBeenCalledWith({ message: 'Invalid Token' });
  });
  
  it('should handle Unauthorized error with 401 status', () => {
    // Arrange
    const error = {
      name: 'Unauthorized',
      message: 'Unauthorized error message'
    };
    
    // Act
    errorHandler(error, req, res, next);
    
    // Assert
    expect(statusSpy).toHaveBeenCalledWith(401);
    expect(jsonSpy).toHaveBeenCalledWith({ message: 'Unauthorized error message' });
  });
  
  it('should handle Forbidden error with 403 status', () => {
    // Arrange
    const error = {
      name: 'Forbidden',
      message: 'Forbidden error message'
    };
    
    // Act
    errorHandler(error, req, res, next);
    
    // Assert
    expect(statusSpy).toHaveBeenCalledWith(403);
    expect(jsonSpy).toHaveBeenCalledWith({ message: 'Forbidden error message' });
  });
  
  it('should handle NotFound error with 404 status', () => {
    // Arrange
    const error = {
      name: 'NotFound',
      message: 'Not found error message'
    };
    
    // Act
    errorHandler(error, req, res, next);
    
    // Assert
    expect(statusSpy).toHaveBeenCalledWith(404);
    expect(jsonSpy).toHaveBeenCalledWith({ message: 'Not found error message' });
  });
  
  it('should handle unknown errors with 500 status', () => {
    // Arrange
    const error = {
      name: 'Unknown',
      message: 'Some unexpected error'
    };
    
    // Act
    errorHandler(error, req, res, next);
    
    // Assert
    expect(statusSpy).toHaveBeenCalledWith(500);
    expect(jsonSpy).toHaveBeenCalledWith({ message: 'Internal Server Error' });
  });
});