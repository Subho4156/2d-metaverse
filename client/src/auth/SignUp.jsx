import React, {useEffect, useState} from 'react';
import './signup.css'; // For styling
import { Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { signup } from "../api";
import { useNavigate } from "react-router-dom";

const SignUp = () => {
    const [showPassword, setShowPassword] = useState(false);
    const togglePassword = () => setShowPassword(prev => !prev);

    const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

      useEffect(() => {
      const token = localStorage.getItem("token");
      if (token) {
        navigate("/home"); 
      }
    }, []);

  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signup(formData);   
      localStorage.setItem("otpEmail", formData.email);
      setTimeout(() => {
      setLoading(false);
      navigate("/otp");
    }, 1500);  
    } catch (err) {
       const msg = err.response?.data?.message || "Signup failed";
       setError(msg);
       setLoading(false);
    }
  };


  return (
    <div className="signup-page-container" style={{
          width: "125vw", // 100 / 0.8
          height: "125vh",
          overflow: "hidden",
          transform: "scale(0.8)", 
          transformOrigin: "top left",
        }}>
      <div className="signup-card">
        <h1 className="logo-title-signup">AetherVerse</h1>
        {/* Or your actual SVG Logo component */}

        <form className="signup-form" onSubmit={handleSubmit}>
          <div className="input-group-su">
            <label htmlFor="username">Username</label>
            <input
              style={{ marginBottom: "25px" }}
              name="username"
              type="text"
              id="username"
              placeholder="Enter username"
              autoComplete="off"
              onChange={handleChange}
            />
            <label htmlFor="email">Email</label>
            <input
              name="email"
              type="text"
              id="email"
              placeholder="Enter email"
              autoComplete="off"
              onChange={handleChange}
            />
            {/* Optional: Add a user icon here */}
          </div>

          <div className="input-group-su">
            <label htmlFor="password">Password</label>
            <div class="pass-group">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Enter your password"
                onChange={handleChange}
              />
              <span className="toggle-icon" onClick={togglePassword}>
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </span>
            </div>
          </div>

          {error && <p className="form-error">* {error}</p>}

          <button type="submit" className="signup-button" disabled={loading}>
            {loading && !error ? (
              <div className="spinner"></div> // or inline loader text/icon
            ) : (
              "Join AetherVerse"
            )}
          </button>

          <div className="links-group">
            Already have an account?{" "}
            <Link to="/" className="signup-link">
              Login
            </Link>
          </div>

          {/* Optional: Social Login */}
          <div className="social-login">
            <p>Or connect with:</p>
            <div className="social-icons">
              {/* <GoogleLoginButton /> */}
              {/* <DiscordLoginButton /> */}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;