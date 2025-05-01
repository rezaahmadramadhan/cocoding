import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/Payment.css';

const Payment = () => {
  const [paymentStatus, setPaymentStatus] = useState('processing');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Extract payment data from location state
    const paymentData = location.state?.paymentData;
    
    if (!paymentData) {
      // If no payment data is found, redirect to courses
      navigate('/courses');
      return;
    }
    
    setPaymentDetails(paymentData);
    
    // Load Midtrans Snap library
    const snapScript = document.createElement('script');
    snapScript.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    snapScript.setAttribute('data-client-key', process.env.REACT_APP_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-YOUR_CLIENT_KEY_HERE');
    document.body.appendChild(snapScript);
    
    // When Snap library is loaded, open the payment modal
    snapScript.onload = () => {
      if (window.snap && paymentData.payment && paymentData.payment.token) {
        window.snap.pay(paymentData.payment.token, {
          onSuccess: function(result) {
            setPaymentStatus('success');
            console.log("Payment success:", result);
            setTimeout(() => {
              navigate('/dashboard');
            }, 3000);
          },
          onPending: function(result) {
            setPaymentStatus('pending');
            console.log("Payment pending:", result);
          },
          onError: function(result) {
            setPaymentStatus('error');
            console.log("Payment error:", result);
          },
          onClose: function() {
            setPaymentStatus('closed');
            console.log("Customer closed the payment window");
          }
        });
      } else {
        setPaymentStatus('error');
        console.error("Failed to initialize Snap payment");
      }
    };
    
    return () => {
      // Clean up script tag
      if (document.body.contains(snapScript)) {
        document.body.removeChild(snapScript);
      }
    };
  }, [location, navigate]);
  
  const getStatusMessage = () => {
    switch(paymentStatus) {
      case 'processing':
        return 'Processing payment, please wait...';
      case 'success':
        return 'Payment successful! Redirecting to your dashboard...';
      case 'pending':
        return 'Your payment is pending. We will notify you once it is confirmed.';
      case 'error':
        return 'There was an error processing your payment. Please try again.';
      case 'closed':
        return 'Payment window was closed. Click below to try again.';
      default:
        return 'Processing payment...';
    }
  };
  
  const handleRetry = () => {
    if (paymentDetails?.payment?.redirectUrl) {
      window.location.href = paymentDetails.payment.redirectUrl;
    } else {
      navigate('/courses');
    }
  };
  
  return (
    <div className="payment-container">
      <div className="payment-card">
        <div className="payment-status">
          <div className={`status-icon ${paymentStatus}`}></div>
          <h2>Payment {paymentStatus}</h2>
          <p>{getStatusMessage()}</p>
        </div>
        
        {paymentDetails && (
          <div className="payment-details">
            <h3>Order Details</h3>
            <div className="detail-item">
              <span>Course:</span>
              <span>{paymentDetails.order.courseName}</span>
            </div>
            <div className="detail-item">
              <span>Amount:</span>
              <span>Rp. {paymentDetails.order.totalPrice.toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <span>Order ID:</span>
              <span>{paymentDetails.order.id}</span>
            </div>
            <div className="detail-item">
              <span>Payment Method:</span>
              <span>{paymentDetails.order.paymentMethod}</span>
            </div>
          </div>
        )}
        
        {(paymentStatus === 'error' || paymentStatus === 'closed') && (
          <button className="retry-button" onClick={handleRetry}>
            Try Again
          </button>
        )}
        
        <button className="back-button" onClick={() => navigate('/courses')}>
          Back to Courses
        </button>
      </div>
    </div>
  );
};

export default Payment;