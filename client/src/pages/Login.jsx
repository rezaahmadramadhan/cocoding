import { useState } from "react";
import { useParallax } from "react-scroll-parallax";
import { useNavigate } from "react-router";
import "../styles/Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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

      // Store token if returned from API
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      // Redirect to home page or dashboard
      navigate("/");
    } catch (err) {
      setError(err.message || "An error occurred during login");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const goToHome = () => {
    navigate("/");
  };

  return (
    <div className="login-container">
      <div className="login-bg" ref={bgParallax.ref}></div>

      <div className="login-content">
        <div className="login-header" ref={titleParallax.ref}>
          <h1>CoCoding</h1>
          <p>Welcome back, let's continue learning!</p>
        </div>

        <div className="login-form-container" ref={formParallax.ref}>
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

            <div className="form-footer">
              <p>
                Don't have an account?{" "}
                <span className="signup-link">Sign up</span>
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
