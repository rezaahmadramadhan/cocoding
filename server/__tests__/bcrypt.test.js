const { describe, it, expect } = require('@jest/globals');
const bcrypt = require('bcryptjs');
const { hashPassword, comparePassword } = require('../helpers/bcrypt');

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  genSaltSync: jest.fn().mockReturnValue('mockSalt'),
  hashSync: jest.fn().mockReturnValue('hashedPassword'),
  compareSync: jest.fn().mockImplementation((password, hashedPassword) => {
    // Simple mock implementation that returns true if the password is 'correctPassword'
    return password === 'correctPassword';
  })
}));

describe('Bcrypt Helper', () => {
  describe('hashPassword', () => {
    it('should generate a salt and hash the password', () => {
      // Act
      const result = hashPassword('testPassword');
      
      // Assert
      expect(bcrypt.genSaltSync).toHaveBeenCalledWith(10);
      expect(bcrypt.hashSync).toHaveBeenCalledWith('testPassword', 'mockSalt');
      expect(result).toBe('hashedPassword');
    });
    
    it('should work with empty string', () => {
      // Act
      const result = hashPassword('');
      
      // Assert
      expect(bcrypt.genSaltSync).toHaveBeenCalledWith(10);
      expect(bcrypt.hashSync).toHaveBeenCalledWith('', 'mockSalt');
      expect(result).toBe('hashedPassword');
    });
  });
  
  describe('comparePassword', () => {
    it('should return true for matching password', () => {
      // Act
      const result = comparePassword('correctPassword', 'hashedPassword');
      
      // Assert
      expect(bcrypt.compareSync).toHaveBeenCalledWith('correctPassword', 'hashedPassword');
      expect(result).toBe(true);
    });
    
    it('should return false for non-matching password', () => {
      // Act
      const result = comparePassword('wrongPassword', 'hashedPassword');
      
      // Assert
      expect(bcrypt.compareSync).toHaveBeenCalledWith('wrongPassword', 'hashedPassword');
      expect(result).toBe(false);
    });
  });
});