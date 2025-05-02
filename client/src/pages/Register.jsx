import { useState, useEffect } from "react";
import { useParallax } from "react-scroll-parallax";
import { useNavigate, useLocation } from "react-router";
import { GoogleLogin, useGoogleLogin } from "@react-oauth/google";
import "../styles/Login.css";
import "../styles/Register.css";

const Register = () => {
  const [fullName, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const returnUrl = location.state?.returnUrl || "/";
  const message = location.state?.message || null;

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      navigate("/");
    }

    if (message) {
      setError(message);
    }
  }, [navigate, message]);

  useEffect(() => {
    if (!password) {
      setPasswordStrength("");
      return;
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);

    if (password.length < 6) {
      setPasswordStrength("weak");
    } else if (password.length >= 8 && hasLetter && hasNumber && hasSpecial) {
      setPasswordStrength("strong");
    } else if (
      password.length >= 6 &&
      ((hasLetter && hasNumber) ||
        (hasLetter && hasSpecial) ||
        (hasNumber && hasSpecial))
    ) {
      setPasswordStrength("medium");
    } else {
      setPasswordStrength("weak");
    }
  }, [password]);

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

    if (!fullName.trim()) {
      setError("Name is required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage("");

    try {
      const response = await fetch("https://ip.dhronz.space/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fullName, email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }

      const data = await response.json();

      setSuccessMessage("Registration successful! Redirecting to login...");

      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("userId", data.id);
        localStorage.setItem("userEmail", data.email);

        setTimeout(() => {
          navigate(returnUrl);
        }, 1500);
      } else {
        setTimeout(() => {
          navigate("/login", {
            state: {
              message: "Registration successful! Please log in.",
            },
          });
        }, 1500);
      }
    } catch (err) {
      setError(err.message || "An error occurred during registration");
      console.error("Registration error:", err);
      setSuccessMessage("");
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
    setError(
      "Google login failed. Please try again or use email registration."
    );
  };

  const goToHome = () => {
    navigate("/");
  };

  const goToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="login-container">
      <div className="login-bg" ref={bgParallax.ref}></div>

      <div className="login-content">
        <div className="login-header" ref={titleParallax.ref}>
          <h1>Cocoding</h1>
          <p>Join our community of learners today!</p>
        </div>

        <div className="login-form-container" ref={formParallax.ref}>
          {message && <div className="login-message">{message}</div>}
          {successMessage && (
            <div className="registration-success">{successMessage}</div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="register-header">
              <h2>Create Account</h2>
              <p>Fill in your details to get started</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                value={fullName}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="text"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="Enter your email"
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
                placeholder="Create a strong password"
              />
              {passwordStrength && (
                <>
                  <div
                    className={`password-strength ${passwordStrength}`}
                  ></div>
                  <p className="password-hint">
                    {passwordStrength === "weak" &&
                      "Consider adding more characters for better security"}
                    {passwordStrength === "medium" &&
                      "Good password! Adding symbols can make it stronger"}
                    {passwordStrength === "strong" &&
                      "Great! Your password is strong"}
                  </p>
                </>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                placeholder="Confirm your password"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="password-hint" style={{ color: "#ef4444" }}>
                  Passwords do not match
                </p>
              )}
            </div>

            <button
              type="submit"
              className="login-button signup-button"
              disabled={loading}
            >
              {loading ? "Signing up..." : "Create Account"}
            </button>

            <div className="google-login-container">
              <p className="or-divider">OR</p>

              <GoogleLogin
                onSuccess={handleGoogleLoginSuccess}
                onError={handleGoogleLoginError}
                useOneTap={false}
                theme="outline"
                text="signup_with"
                shape="pill"
                size="large"
                width="100%"
                locale="en"
              />
            </div>

            <div className="form-footer">
              <p>
                Already have an account?{" "}
                <span className="signup-link" onClick={goToLogin}>
                  Login
                </span>
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

export default Register;
