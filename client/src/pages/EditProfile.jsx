import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import "../styles/EditProfile.css";

function EditProfile() {
  const navigate = useNavigate();
  
  // State for form fields
  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    address: "",
    phone: "",
    about: ""
  });
  
  // State for loading, error and success messages
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Load existing profile data when component mounts
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("access_token");
      
      if (!token) {
        navigate("/login");
        return;
      }
      
      try {
        setLoading(true);
        const response = await fetch("https://ip.dhronz.space/profile", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch profile data");
        }
        
        const profileData = await response.json();
        
        // Update form data with existing profile information
        setFormData({
          fullName: profileData.fullName || "",
          age: profileData.age || "",
          address: profileData.address || "",
          phone: profileData.phone || "",
          about: profileData.about || ""
        });
      } catch (err) {
        setError(err.message || "An error occurred while fetching your profile");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [navigate]);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      
      const response = await fetch("https://ip.dhronz.space/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          age: formData.age === "" ? null : Number(formData.age),
          address: formData.address,
          phone: formData.phone,
          about: formData.about
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }
      
      const data = await response.json();
      setSuccess("Profile updated successfully!");
      
      // Navigate back to home after successful update
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      setError(err.message || "An error occurred while updating your profile");
    } finally {
      setLoading(false);
    }
  };
  
  // Return to previous page
  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="edit-profile-container">
      <h1>Edit Profile</h1>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="age">Age</label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              min="0"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="address">Address</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="2"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="about">About</label>
            <textarea
              id="about"
              name="about"
              value={formData.about}
              onChange={handleChange}
              rows="4"
            />
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={handleCancel} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Updating..." : "Update Profile"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default EditProfile;