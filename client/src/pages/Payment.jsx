import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router';
import '../styles/Payment.css';

const Payment = () => {
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [orderDetails, setOrderDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [diagnosticInfo, setDiagnosticInfo] = useState(null);
  const checkoutStarted = useRef(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  const queryParams = new URLSearchParams(location.search);
  const midtransStatus = queryParams.get('status');
  const midtransOrderId = queryParams.get('orderId');
  
  const orderId = location.state?.orderId || midtransOrderId;
  const CourseId = location.state?.CourseId;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return date.toLocaleDateString('en-EN', options);
  };

  const getOrderDate = (orderDetails) => {
    if (!orderDetails) return null;
    
    return orderDetails.orderAt || orderDetails.createdAt || orderDetails.updatedAt || null;
  };

  const fetchOrderStatus = useCallback(async () => {
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
      
      if (data.status === 'paid' || data.status === 'completed') {
        setPaymentStatus('success');
        setAutoRefresh(false);
      } else if (data.status === 'failed') {
        setPaymentStatus('failed');
        setAutoRefresh(false);
      } else {
        setPaymentStatus('pending');
      }

      setError(null);
      setDiagnosticInfo(null);
    } catch (err) {
      setError(err.message || 'An error occurred while fetching order details');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    let intervalId = null;
    
    if (autoRefresh && orderId) {
      intervalId = setInterval(() => {
        fetchOrderStatus();
      }, 10000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, orderId, fetchOrderStatus]);

  useEffect(() => {
    if (orderId) {
      fetchOrderStatus();
      setAutoRefresh(true);
    } 
    else if (CourseId && !checkoutStarted.current) {
      checkoutStarted.current = true;
      createCheckout();
    }
    else if (!CourseId && !orderId) {
      setError('No order ID or course ID provided');
      setIsLoading(false);
      const redirectTimer = setTimeout(() => {
        navigate('/');
      }, 10000);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [orderId, CourseId, fetchOrderStatus, navigate]);

  const createCheckout = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login', { 
          state: { 
            returnUrl: `/course/${CourseId}`, 
            message: 'Anda harus login terlebih dahulu untuk mendaftar kursus ini' 
          } 
        });
        return;
      }

      setIsLoading(true);
      
      const checkoutPayload = { CourseId: CourseId };
      
      const response = await fetch(`https://ip.dhronz.space/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(checkoutPayload)
      });
      
      let data;
      let responseText;
      
      try {
        responseText = await response.text();
        
        try {
          data = JSON.parse(responseText);
        } catch (jsonError) {
          throw new Error(`Server returned invalid JSON: ${responseText.substring(0, 100)}...`);
        }
      } catch (parseError) {
        const diagnosticData = {
          statusCode: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries([...response.headers.entries()]),
          error: parseError.toString()
        };
        setDiagnosticInfo(diagnosticData);
        
        throw new Error(`Server error (${response.status}): Unable to process your request at this time`);
      }
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('access_token');
          navigate('/login', { 
            state: { 
              returnUrl: `/course/${CourseId}`, 
              message: 'Sesi Anda telah berakhir. Silakan login kembali.' 
            } 
          });
          return;
        }
        
        setDiagnosticInfo({
          statusCode: response.status,
          statusText: response.statusText,
          errorDetails: data?.error || data?.message || responseText,
          timestamp: new Date().toISOString()
        });
        
        if (response.status === 500) {
          throw new Error(`Server error: ${data?.message || 'The payment system is experiencing issues. Please try again later or contact support.'}`);
        }
        
        throw new Error(data?.message || `Failed to process checkout (Error ${response.status})`);
      }
      
      if (data.payment && data.order) {
        const orderInfo = {
          ...data.order,
          paymentUrl: data.payment.redirectUrl,
          midtransToken: data.payment.token
        };
        
        setOrderDetails(orderInfo);
        setPaymentStatus('pending');
        setAutoRefresh(true);
      } else {
        throw new Error('Invalid response format: Missing payment or order information');
      }
    } catch (err) {
      console.error('Error creating checkout:', err);
      setError(err.message || 'An error occurred during checkout');
      setPaymentStatus('failed');
      checkoutStarted.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
    setDiagnosticInfo(null);
    
    if (CourseId) {
      checkoutStarted.current = false;
      createCheckout();
    } else if (orderId) {
      fetchOrderStatus();
    }
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(prev => !prev);
  };

  if (isLoading) {
    return <div className="payment-loading">Loading payment details...</div>;
  }

  if (error) {
    return (
      <div className="payment-error">
        <h2>Payment Information Not Found</h2>
        <p>{error}</p>
        {error.includes('No order ID or course ID') && (
          <>
            <p>You've accessed the payment page without the necessary information.</p>
            <p>Redirecting to home page in a few seconds...</p>
          </>
        )}
        
        {retryCount < 3 && !error.includes('No order ID or course ID') && (
          <button onClick={handleRetry} className="retry-button">
            Retry {retryCount > 0 ? `(${retryCount}/3)` : ''}
          </button>
        )}
        
        {diagnosticInfo && (
          <div className="diagnostic-info">
            <details>
              <summary>Technical Details (for Support)</summary>
              <pre>{JSON.stringify(diagnosticInfo, null, 2)}</pre>
            </details>
          </div>
        )}
        
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
            
            {paymentStatus === 'pending' && (
              <div className="auto-refresh-toggle">
                <label>
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={toggleAutoRefresh}
                  />
                  Auto-refresh status
                </label>
                {autoRefresh && <span className="refreshing-indicator">Refreshing...</span>}
              </div>
            )}
          </div>
        )}
        
        <div className="payment-actions">
          {paymentStatus === 'pending' && (
            <>
              <a href={orderDetails?.paymentUrl} className="complete-payment-button">
                Complete Payment
              </a>
              <button onClick={fetchOrderStatus} className="refresh-button">
                Refresh Status
              </button>
            </>
          )}
          {paymentStatus === 'failed' && retryCount < 3 && (
            <button onClick={handleRetry} className="retry-button">
              Retry Payment
            </button>
          )}
          <Link to="/" className="back-home-button">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default Payment;