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
  
  const returnUrl = location.state?.returnUrl || "/";
  const message = location.state?.message || null;

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    setClientId(googleClientId || "Not found");
    
    if (message) {
      setError(message);
    }
  }, [message]);

  const bgParallax = useParallax({
    speed: -5,
    shouldAlwaysCompleteAnimation: true,
    translateY: [0, 0], 
    rootMargin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  const formParallax = useParallax({
    scale: [0.95, 1],
    opacity: [0.8, 1],
    easing: "easeInQuad",
    shouldAlwaysCompleteAnimation: true,
    translateX: [0, 0],
  });

  const titleParallax = useParallax({
    translateY: [0, -15],
    opacity: [0.7, 1],
    shouldAlwaysCompleteAnimation: true,
    translateX: [0, 0],
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

      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("userId", data.id);
        localStorage.setItem("userEmail", data.email);
      }

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

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("userId", data.id);
      localStorage.setItem("userEmail", data.email);

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

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        
        navigate("/");
      } catch (err) {
        setError("Failed to complete Google login");
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
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
          <p>Start your learning journey with our expert-led courses</p>
        </div>

        <div className="login-form-container" ref={formParallax.ref}>
          <form className="login-form" onSubmit={handleSubmit}>
            <h2>Welcome Back</h2>

            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="Enter your email"
                required
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
                placeholder="Enter your password"
                required
              />
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <div className="google-login-container">
              <p className="or-divider">OR</p>
              
              <GoogleLogin
                onSuccess={handleGoogleLoginSuccess}
                onError={handleGoogleLoginError}
                useOneTap={false}
                theme="outline"
                text="signin_with"
                shape="pill"
                size="large"
                width="100%"
                locale="en"
              />
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
