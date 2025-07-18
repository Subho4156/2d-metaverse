import React, { useEffect, useState } from 'react';
import './login.css'; // For styling
import { Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { login } from "../api"; 

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const togglePassword = () => setShowPassword(prev => !prev);

   const [credentials, setCredentials] = useState({
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

    useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/home"); 
    }
  }, []);

  const handleChange = (e) => {
    setCredentials(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login(credentials);
      localStorage.setItem("token", res.data.token); // store JWT
       setTimeout(() => {
      setLoading(false);
      navigate("/home");
    }, 1500);
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container" style={{
          width: "125vw", // 100 / 0.8
          height: "125vh",
          overflow: "hidden",
          transform: "scale(0.8)", 
          transformOrigin: "top left",
        }}>
      <div className="login-card">
        <h1 className="logo-title">AetherVerse</h1>
        {/* Or your actual SVG Logo component */}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              name="email"
              onChange={handleChange}
              type="text"
              id="email"
              placeholder="Enter email"
              autoComplete="off"
            />
            {/* Optional: Add a user icon here */}
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div class="pass-group">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                onChange={handleChange}
                id="password"
                placeholder="Enter your password"
              />
              <span className="toggle-icon" onClick={togglePassword}>
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </span>
            </div>
          </div>

          {error && <p className="form-error">* {error}</p>}

          <button type="submit" className="login-button">
            {loading && !error ? (
              <div className="spinner"></div> // or inline loader text/icon
            ) : (
              "Enter AetherVerse"
            )}
          </button>

          <div className="links-group">
            <a href="#" className="forgot-password-link">
              Forgot Password?
            </a>
            <span className="separator">|</span>
            New to AetherVerse?{" "}
            <Link to="/signup" className="signup-link">
              Sign Up
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

export default Login;