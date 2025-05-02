const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const midtransClient = require('midtrans-client');

// Store original environment variables
const originalEnv = { ...process.env };

// Mock midtrans-client
jest.mock('midtrans-client', () => {
  const mockTransaction = {
    token: 'test-token-123',
    redirect_url: 'https://app.sandbox.midtrans.com/snap/v3/redirection/test-token-123'
  };
  
  const mockStatusSuccess = {
    transaction_status: 'settlement',
    fraud_status: 'accept',
    order_id: 'test-order-123',
    payment_type: 'credit_card'
  };
  
  return {
    Snap: jest.fn().mockImplementation(() => ({
      createTransaction: jest.fn().mockResolvedValue(mockTransaction)
    })),
    CoreApi: jest.fn().mockImplementation(() => ({
      transaction: {
        status: jest.fn().mockResolvedValue(mockStatusSuccess),
        notification: jest.fn().mockResolvedValue(mockStatusSuccess)
      }
    }))
  };
});

// Set up test environment
describe('Midtrans Helper', () => {
  beforeEach(() => {
    // Set up environment variables for testing
    process.env.MIDTRANS_SERVER_KEY = 'test-server-key';
    process.env.MIDTRANS_CLIENT_KEY = 'test-client-key';
    process.env.CLIENT_URL = 'http://localhost:5173';
    
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
  
  describe('createSnapTransaction', () => {
    it('should create a Snap transaction successfully', async () => {
      // Import the module after setting environment variables
      const { createSnapTransaction } = require('../helpers/midtrans');
      
      // Test transaction data
      const transaction = {
        orderId: 'test-order-123',
        amount: 100000,
        name: 'Test User',
        email: 'test@example.com',
        items: [
          {
            id: 'course-1',
            name: 'JavaScript Basics',
            price: 100000,
            quantity: 1
          }
        ]
      };
      
      // Act
      const result = await createSnapTransaction(transaction);
      
      // Assert
      expect(midtransClient.Snap).toHaveBeenCalledWith({
        isProduction: false,
        serverKey: 'test-server-key',
        clientKey: 'test-client-key'
      });
      
      const snapInstance = midtransClient.Snap.mock.results[0].value;
      expect(snapInstance.createTransaction).toHaveBeenCalledWith(expect.objectContaining({
        transaction_details: {
          order_id: 'test-order-123',
          gross_amount: 100000
        },
        customer_details: {
          first_name: 'Test User',
          email: 'test@example.com'
        },
        callbacks: expect.objectContaining({
          finish: expect.stringContaining('/payment?status=success')
        })
      }));
      
      expect(result).toEqual({
        token: 'test-token-123',
        redirect_url: expect.stringContaining('test-token-123')
      });
    });
    
    it('should handle errors during transaction creation', async () => {
      // Import the module after setting environment variables
      const { createSnapTransaction } = require('../helpers/midtrans');
      
      // Mock Snap implementation to throw an error
      const mockError = new Error('API Error');
      midtransClient.Snap.mockImplementationOnce(() => ({
        createTransaction: jest.fn().mockRejectedValue(mockError)
      }));
      
      // Test transaction data
      const transaction = {
        orderId: 'test-order-123',
        amount: 100000,
        name: 'Test User',
        email: 'test@example.com',
        items: []
      };
      
      // Act & Assert
      await expect(createSnapTransaction(transaction)).rejects.toThrow('API Error');
      expect(console.error).toHaveBeenCalledWith(
        'Error creating Midtrans transaction:',
        mockError
      );
    });
  });
  
  describe('checkTransactionStatus', () => {
    it('should check transaction status successfully', async () => {
      // Import the module after setting environment variables
      const { checkTransactionStatus } = require('../helpers/midtrans');
      
      // Act
      const result = await checkTransactionStatus('test-order-123');
      
      // Assert
      expect(midtransClient.CoreApi).toHaveBeenCalledWith({
        isProduction: false,
        serverKey: 'test-server-key',
        clientKey: 'test-client-key'
      });
      
      const coreInstance = midtransClient.CoreApi.mock.results[0].value;
      expect(coreInstance.transaction.status).toHaveBeenCalledWith('test-order-123');
      
      expect(result).toEqual({
        transaction_status: 'settlement',
        fraud_status: 'accept',
        order_id: 'test-order-123',
        payment_type: 'credit_card'
      });
    });
    
    it('should handle errors during status check', async () => {
      // Import the module after setting environment variables
      const { checkTransactionStatus } = require('../helpers/midtrans');
      
      // Mock CoreApi implementation to throw an error
      const mockError = new Error('Status API Error');
      midtransClient.CoreApi.mockImplementationOnce(() => ({
        transaction: {
          status: jest.fn().mockRejectedValue(mockError)
        }
      }));
      
      // Act & Assert
      await expect(checkTransactionStatus('test-order-123')).rejects.toThrow('Status API Error');
      expect(console.error).toHaveBeenCalledWith(
        'Error checking transaction status:',
        mockError
      );
    });
  });
  
  describe('verifyNotification', () => {
    it('should verify notification successfully', async () => {
      // Import the module after setting environment variables
      const { verifyNotification } = require('../helpers/midtrans');
      
      // Test notification data
      const notification = {
        transaction_status: 'settlement',
        order_id: 'test-order-123'
      };
      
      // Act
      const result = await verifyNotification(notification);
      
      // Assert
      expect(midtransClient.CoreApi).toHaveBeenCalledWith({
        isProduction: false,
        serverKey: 'test-server-key',
        clientKey: 'test-client-key'
      });
      
      const coreInstance = midtransClient.CoreApi.mock.results[0].value;
      expect(coreInstance.transaction.notification).toHaveBeenCalledWith(notification);
      
      expect(result).toEqual({
        transaction_status: 'settlement',
        fraud_status: 'accept',
        order_id: 'test-order-123',
        payment_type: 'credit_card'
      });
    });
    
    it('should handle errors during notification verification', async () => {
      // Import the module after setting environment variables
      const { verifyNotification } = require('../helpers/midtrans');
      
      // Mock CoreApi implementation to throw an error
      const mockError = new Error('Notification API Error');
      midtransClient.CoreApi.mockImplementationOnce(() => ({
        transaction: {
          notification: jest.fn().mockRejectedValue(mockError)
        }
      }));
      
      // Test notification data
      const notification = {
        transaction_status: 'settlement',
        order_id: 'test-order-123'
      };
      
      // Act & Assert
      await expect(verifyNotification(notification)).rejects.toThrow('Notification API Error');
      expect(console.error).toHaveBeenCalledWith(
        'Error verifying notification:',
        mockError
      );
    });
  });
});