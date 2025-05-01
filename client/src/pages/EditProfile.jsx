import { useState, useEffect } from "react";
import { useParallax } from "react-scroll-parallax";
import { useNavigate } from "react-router";
import "../styles/Login.css";

const EditProfile = () => {
  const [userData, setUserData] = useState({
    fullName: "",
    age: "",
    address: "",
    phone: "",
    about: ""
  });
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login", {
        state: { 
          returnUrl: "/edit-profile", 
          message: "Anda harus login terlebih dahulu untuk mengedit profil" 
        }
      });
    } else {
      fetchUserProfile();
    }
  }, [navigate]);

  // Fetch user profile data
  const fetchUserProfile = async () => {
    setFetchingData(true);
    
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("https://ip.dhronz.space/profile", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("access_token");
          navigate("/login", {
            state: { 
              returnUrl: "/edit-profile", 
              message: "Sesi Anda telah berakhir. Silakan login kembali." 
            }
          });
          return;
        }
        throw new Error("Failed to fetch profile data");
      }

      const data = await response.json();
      setUserData({
        fullName: data.fullName || "",
        age: data.age || "",
        address: data.address || "",
        phone: data.phone || "",
        about: data.about || ""
      });
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setError("Failed to load your profile data. Please try again later.");
    } finally {
      setFetchingData(false);
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("https://ip.dhronz.space/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("access_token");
          navigate("/login", {
            state: { 
              returnUrl: "/edit-profile", 
              message: "Sesi Anda telah berakhir. Silakan login kembali." 
            }
          });
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      setSuccess("Profile updated successfully!");
      
      // Scroll to top to make sure user sees success message
      window.scrollTo(0, 0);
    } catch (err) {
      setError(err.message || "An error occurred while updating your profile");
      console.error("Update profile error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Parallax effects
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

  const goToHome = () => {
    navigate("/");
  };

  if (fetchingData) {
    return (
      <div className="login-container">
        <div className="login-bg"></div>
        <div className="login-content">
          <div className="login-form-container">
            <div className="loading-message">Loading your profile data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-bg" ref={bgParallax.ref}></div>

      <div className="login-content">
        <div className="login-header" ref={titleParallax.ref}>
          <h1>Cocoding</h1>
          <p>Update your profile information</p>
        </div>

        <div className="login-form-container edit-profile-container" ref={formParallax.ref}>
          <form className="login-form" onSubmit={handleSubmit}>
            <h2>Edit Profile</h2>
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={userData.fullName}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="age">Age</label>
              <input
                type="number"
                id="age"
                name="age"
                value={userData.age}
                onChange={handleChange}
                disabled={loading}
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={userData.phone}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                name="address"
                value={userData.address}
                onChange={handleChange}
                disabled={loading}
                rows="3"
              />
            </div>

            <div className="form-group">
              <label htmlFor="about">About Me</label>
              <textarea
                id="about"
                name="about"
                value={userData.about}
                onChange={handleChange}
                disabled={loading}
                rows="4"
              />
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Updating..." : "Update Profile"}
            </button>

            <div className="form-footer">
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

export default EditProfile;