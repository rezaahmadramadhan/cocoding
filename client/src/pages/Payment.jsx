import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router';
import '../styles/Payment.css';

const Payment = () => {
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [orderDetails, setOrderDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const orderId = location.state?.orderId;
  const courseId = location.state?.courseId;

  // Format date function to handle different date formats
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    // Try to parse the date
    const date = new Date(dateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    // Format the date with options
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return date.toLocaleDateString('en-EN', options);
  };

  // Helper function to get a valid date from order details
  const getOrderDate = (orderDetails) => {
    if (!orderDetails) return null;
    
    // Try different date fields that might be available in the order
    return orderDetails.orderAt || orderDetails.createdAt || orderDetails.updatedAt || null;
  };

  useEffect(() => {
    // Jika kita memiliki orderId, kita langsung memeriksa status order
    if (orderId) {
      fetchOrderStatus();
    } 
    // Jika kita memiliki courseId, kita perlu membuat checkout baru
    else if (courseId) {
      createCheckout();
    }
    // Jika tidak ada keduanya, tampilkan error
    else {
      setError('No order ID or course ID provided');
      setIsLoading(false);
    }
  }, [orderId, courseId]);

  // Fungsi untuk memeriksa status order yang sudah ada
  const fetchOrderStatus = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('You need to be logged in to view payment status');
        setIsLoading(false);
        return;
      }

      const response = await fetch(`https://ip.dhronz.space/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }

      const data = await response.json();
      setOrderDetails(data);
      
      // Set status based on order data
      if (data.status === 'paid' || data.status === 'completed') {
        setPaymentStatus('success');
      } else if (data.status === 'failed') {
        setPaymentStatus('failed');
      } else {
        setPaymentStatus('pending');
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError(err.message || 'An error occurred while fetching order details');
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk membuat checkout baru
  const createCheckout = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login', { 
          state: { 
            returnUrl: `/course/${courseId}`, 
            message: 'Anda harus login terlebih dahulu untuk mendaftar kursus ini' 
          } 
        });
        return;
      }

      const response = await fetch(`https://ip.dhronz.space/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId: courseId
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle 401 Unauthorized specifically
        if (response.status === 401) {
          // Token might be expired or invalid
          localStorage.removeItem('access_token');
          navigate('/login', { 
            state: { 
              returnUrl: `/course/${courseId}`, 
              message: 'Sesi Anda telah berakhir. Silakan login kembali.' 
            } 
          });
          return;
        }
        throw new Error(data.message || 'Failed to process checkout');
      }
      
      // Redirect to Midtrans payment page
      if (data.payment && data.payment.redirectUrl) {
        window.location.href = data.payment.redirectUrl;
      } else {
        // Update order details and status
        setOrderDetails(data.order);
        setPaymentStatus('pending');
      }
    } catch (err) {
      console.error('Error creating checkout:', err);
      setError(err.message || 'An error occurred during checkout');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="payment-loading">Loading payment details...</div>;
  }

  if (error) {
    return (
      <div className="payment-error">
        <h2>Error</h2>
        <p>{error}</p>
        <Link to="/" className="back-home-button">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="payment-container">
      <div className="payment-status-card">
        <div className={`payment-status-icon ${paymentStatus}`}>
          {paymentStatus === 'success' && '✓'}
          {paymentStatus === 'pending' && '⏳'}
          {paymentStatus === 'failed' && '✗'}
        </div>
        
        <h2>Payment {paymentStatus === 'success' ? 'Successful' : paymentStatus === 'pending' ? 'Processing' : 'Failed'}</h2>
        
        {orderDetails && (
          <div className="order-details">
            <p><strong>Order ID:</strong> {orderDetails.id}</p>
            {orderDetails.midtransOrderId && (
              <p><strong>Payment Reference:</strong> {orderDetails.midtransOrderId}</p>
            )}
            <p><strong>Amount:</strong> {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
            }).format(orderDetails.totalPrice || 0)}</p>
            <p><strong>Date:</strong> {formatDate(getOrderDate(orderDetails))}</p>
          </div>
        )}
        
        <div className="payment-actions">
          {paymentStatus === 'pending' && (
            <a href={orderDetails?.paymentUrl} className="complete-payment-button">
              Complete Payment
            </a>
          )}
          <Link to="/" className="back-home-button">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default Payment;