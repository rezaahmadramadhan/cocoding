const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const { OAuth2Client } = require('google-auth-library');

// Store original environment variables
const originalEnv = { ...process.env };

// Mock google-auth-library
jest.mock('google-auth-library', () => {
  return {
    OAuth2Client: jest.fn().mockImplementation(() => ({
      verifyIdToken: jest.fn().mockImplementation(({ idToken }) => {
        if (idToken === 'valid-token') {
          return Promise.resolve({
            getPayload: () => ({
              name: 'Test User',
              email: 'test@example.com',
              picture: 'https://example.com/profile.jpg'
            })
          });
        } else {
          return Promise.reject(new Error('Invalid token'));
        }
      })
    }))
  };
});

describe('Google Auth Helper', () => {
  beforeEach(() => {
    // Set up environment variables for testing
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    
    // Clear module cache to reload with new environment variables
    jest.resetModules();
    
    // Spy on console.error to prevent actual logging
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    // Restore environment variables
    process.env = { ...originalEnv };
    
    // Restore console.error
    console.error.mockRestore();
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  describe('verifyGoogleToken', () => {
    it('should verify a valid Google token successfully', async () => {
      // Import the module after setting environment variables
      const { verifyGoogleToken } = require('../helpers/googleAuth');
      
      // Act
      const result = await verifyGoogleToken('valid-token');
      
      // Assert
      expect(OAuth2Client).toHaveBeenCalledWith('test-client-id');
      
      const oauth2Client = OAuth2Client.mock.results[0].value;
      expect(oauth2Client.verifyIdToken).toHaveBeenCalledWith({
        idToken: 'valid-token',
        audience: 'test-client-id'
      });
      
      expect(result).toEqual({
        name: 'Test User',
        email: 'test@example.com',
        picture: 'https://example.com/profile.jpg'
      });
    });
    
    it('should throw Unauthorized error for invalid token', async () => {
      // Import the module after setting environment variables
      const { verifyGoogleToken } = require('../helpers/googleAuth');
      
      // Act & Assert
      await expect(verifyGoogleToken('invalid-token')).rejects.toEqual({
        name: 'Unauthorized',
        message: 'Invalid Google token'
      });
      
      expect(console.error).toHaveBeenCalled();
    });
    
    it('should throw Unauthorized error when no token is provided', async () => {
      // Import the module after setting environment variables
      const { verifyGoogleToken } = require('../helpers/googleAuth');
      
      // Act & Assert
      await expect(verifyGoogleToken()).rejects.toEqual({
        name: 'Unauthorized',
        message: 'Invalid Google token'
      });
      
      expect(console.error).toHaveBeenCalled();
    });
  });
});