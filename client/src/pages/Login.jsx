import { useState, useEffect } from "react";
import { useParallax } from "react-scroll-parallax";
import { useNavigate, useLocation } from "react-router";
import { GoogleLogin, useGoogleLogin } from "@react-oauth/google";
import "../styles/Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientId, setClientId] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get return URL and message from navigation state if available
  const returnUrl = location.state?.returnUrl || "/";
  const message = location.state?.message || null;

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      // User is already logged in, redirect to home page
      navigate("/");
    }
  }, [navigate]);

  // Get client ID for debugging purposes
  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    setClientId(googleClientId || "Not found");
    
    // Log configuration details for debugging
    console.log("Google OAuth environment check:", {
      clientIdAvailable: !!googleClientId,
      clientIdLength: googleClientId?.length || 0,
      origin: window.location.origin
    });
    
    // Set error message from navigation state if available
    if (message) {
      setError(message);
    }
  }, [message]);

  // Parallax effects for different elements
  const bgParallax = useParallax({
    speed: -10,
  });

  const formParallax = useParallax({
    scale: [0.9, 1],
    opacity: [0.8, 1],
    easing: "easeInQuad",
  });

  const titleParallax = useParallax({
    translateY: [0, -15],
    opacity: [0.7, 1],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("https://ip.dhronz.space/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const data = await response.json();

      // Store token with consistent naming
      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("userId", data.id);
        localStorage.setItem("userEmail", data.email);
      }

      // Redirect to return URL (course page) or default to home page
      navigate(returnUrl);
    } catch (err) {
      setError(err.message || "An error occurred during login");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Google login success response:", credentialResponse);
      
      // Send Google token to server for verification
      const response = await fetch("https://ip.dhronz.space/google-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Google login failed");
      }

      const data = await response.json();

      // Store user information with consistent naming
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("userId", data.id);
      localStorage.setItem("userEmail", data.email);

      // Redirect to return URL or home page
      navigate(returnUrl);
    } catch (err) {
      setError(err.message || "An error occurred during Google login");
      console.error("Google login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginError = (errorResponse) => {
    console.error("Google Sign-In error:", errorResponse);
    setError("Google login failed. Please try again or use email login.");
  };

  // Alternative Google login using hook approach
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log("Google login token response:", tokenResponse);
      try {
        setLoading(true);
        
        // Here you would typically exchange the access_token for user info
        // For now, just redirect to home page for testing
        navigate("/");
      } catch (err) {
        console.error("Google login hook error:", err);
        setError("Failed to complete Google login");
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      console.error("Google login hook error:", error);
      setError("Google login failed");
    }
  });

  const goToHome = () => {
    navigate("/");
  };
  
  const goToRegister = () => {
    navigate("/register");
  };

  return (
    <div className="login-container">
      <div className="login-bg" ref={bgParallax.ref}></div>

      <div className="login-content">
        <div className="login-header" ref={titleParallax.ref}>
          <h1>Cocoding</h1>
          <p>Welcome back, let's continue learning!</p>
        </div>

        <div className="login-form-container" ref={formParallax.ref}>
          {message && <div className="login-message">{message}</div>}
          <form className="login-form" onSubmit={handleSubmit}>
            <h2>Login</h2>

            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>

            <div className="google-login-container">
              <p className="or-divider">OR</p>
              
              {/* Option 1: GoogleLogin component */}
              <GoogleLogin
                onSuccess={handleGoogleLoginSuccess}
                onError={handleGoogleLoginError}
                useOneTap={false}
                theme="filled_blue"
                text="continue_with"
                shape="rectangular"
                size="large"
                width="100%"
                locale="en"
              />
              
              {/* Option 2: Alternative login button if the component fails */}
              {/* <button 
                type="button" 
                onClick={() => googleLogin()} 
                className="alternate-google-login-button"
                style={{ marginTop: '10px' }}
              >
                Alternative Google Sign-In
              </button> */}
              
              {/* Debug info - remove in production */}
              {/* {import.meta.env.DEV && (
                <div className="debug-info">
                  <p>Client ID: {clientId ? `${clientId.substring(0, 10)}...` : 'Not set'}</p>
                </div>
              )} */}
            </div>

            <div className="form-footer">
              <p>
                Don't have an account?{" "}
                <span className="signup-link" onClick={goToRegister}>Sign up</span>
              </p>
              <p className="back-link" onClick={goToHome}>
                Back to Home
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
