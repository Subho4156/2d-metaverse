import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const OTPVerification = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
    const [timer, setTimer] = useState(600); // 5 minutes in seconds
  const [error, setError] = useState('');
  const inputRefs = useRef([]);

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer,isSuccess]);

  // Auto-focus and handle input
  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

    const navigate = useNavigate();

const handleVerify = async () => {
  const otpValue = otp.join('');
  if (otpValue.length === 6) {
    setIsVerifying(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: localStorage.getItem("otpEmail"),
          otp: otpValue
        })
      });

      const data = await res.json();

      if (res.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          localStorage.removeItem("otpEmail");
          navigate("/"); 
        }, 1500);
      } else {
        setError('Invalid or expired OTP. Please try again later.');
        setIsVerifying(false);
      }
    } catch (err) {
      console.error("OTP verification failed", err);
       setError('Server error. Please try again later.');
      setIsVerifying(false);
    }
  }
};

const handleResend = async () => {
  try {
    const email = localStorage.getItem("otpEmail");

    // 🔄 Trigger resend OTP API
    const res = await fetch("http://localhost:5000/api/auth/resend-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });

    const data = await res.json();

    if (res.ok) {
      // ⏳ Reset timer and OTP fields
      setTimer(600); // 10 minutes
      setOtp(['', '', '', '', '', '']);
      setError('');
      inputRefs.current[0]?.focus(); // focus first input
    } else {
      setError(data?.message || "Failed to resend OTP. Please try again later.");
    }
  } catch (err) {
    console.error("Resend OTP failed", err);
    setError("Server error while resending OTP.");
  }
};


 const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
<div className="otp-container">
    <style jsx>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
      @import url('https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400..700&family=Source+Sans+3:ital,wght@0,200..900;1,200..900&display=swap');

      .otp-container {
        min-height: 100vh;
        background: radial-gradient(circle at 20% 80%, #1a1a2e 0%, #16213e 40%, #0f172a 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        position: relative;
        overflow: hidden;
        font-family: 'Pixelify Sans', sans-serif;
      }

      /* Enhanced animated background with floating GIFs */
      .animated-bg {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 1;
      }

      /* Replace particles with floating GIF icons */
      .floating-icon {
        position: absolute;
        width: 32px;
        height: 32px;
        opacity: 0.7;
        animation: iconFloat 12s ease-in-out infinite;
        filter: drop-shadow(0 0 8px rgba(96, 165, 250, 0.5));
        transition: all 0.3s ease;
      }

      .floating-icon img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      /* Different sizes for variety */
      .floating-icon.small {
        width: 24px;
        height: 24px;
        animation-duration: 10s;
      }

      .floating-icon.medium {
        width: 32px;
        height: 32px;
        animation-duration: 14s;
      }

      .floating-icon.large {
        width: 40px;
        height: 40px;
        animation-duration: 16s;
      }

      /* Positioning for different icons */
      .floating-icon:nth-child(1) { 
        top: 10%; 
        left: 10%; 
        animation-delay: 0s; 
      }
      .floating-icon:nth-child(2) { 
        top: 20%; 
        left: 80%; 
        animation-delay: 2s; 
      }
      .floating-icon:nth-child(3) { 
        top: 60%; 
        left: 15%; 
        animation-delay: 4s; 
      }
      .floating-icon:nth-child(4) { 
        top: 80%; 
        left: 70%; 
        animation-delay: 6s; 
      }
      .floating-icon:nth-child(5) { 
        top: 30%; 
        left: 50%; 
        animation-delay: 8s; 
      }
      .floating-icon:nth-child(6) { 
        top: 70%; 
        left: 30%; 
        animation-delay: 10s; 
      }
      .floating-icon:nth-child(7) { 
        top: 40%; 
        left: 90%; 
        animation-delay: 12s; 
      }
      .floating-icon:nth-child(8) { 
        top: 90%; 
        left: 50%; 
        animation-delay: 14s; 
      }
      .floating-icon:nth-child(9) { 
        top: 25%; 
        left: 35%; 
        animation-delay: 16s; 
      }
      .floating-icon:nth-child(10) { 
        top: 65%; 
        left: 85%; 
        animation-delay: 18s; 
      }

      @keyframes iconFloat {
        0% { 
          transform: translate(0, 0) rotate(0deg) scale(1); 
          opacity: 0.4; 
        }
        25% { 
          transform: translate(30px, -40px) rotate(90deg) scale(1.2); 
          opacity: 0.8; 
        }
        50% { 
          transform: translate(-20px, -80px) rotate(180deg) scale(0.9); 
          opacity: 1; 
        }
        75% { 
          transform: translate(40px, -40px) rotate(270deg) scale(1.1); 
          opacity: 0.6; 
        }
        100% { 
          transform: translate(0, 0) rotate(360deg) scale(1); 
          opacity: 0.4; 
        }
      }

      /* Hover effect for icons */
      .floating-icon:hover {
        transform: scale(1.3) !important;
        opacity: 1 !important;
        filter: drop-shadow(0 0 15px rgba(96, 165, 250, 0.8));
      }

      /* Floating orbs - keeping these for additional ambiance */
      .orb {
        position: absolute;
        border-radius: 50%;
        background: radial-gradient(circle at 30% 30%, rgba(139, 92, 246, 0.6), rgba(79, 70, 229, 0.3));
        filter: blur(3px);
        animation: orbFloat 8s ease-in-out infinite;
        box-shadow: 0 0 40px rgba(139, 92, 246, 0.4);
      }

      .orb:nth-child(11) {
        top: 15%;
        left: 20%;
        width: 80px;
        height: 80px;
        animation-delay: 0s;
      }

      .orb:nth-child(12) {
        top: 60%;
        right: 15%;
        width: 60px;
        height: 60px;
        animation-delay: 3s;
      }

      .orb:nth-child(13) {
        bottom: 20%;
        left: 30%;
        width: 50px;
        height: 50px;
        animation-delay: 6s;
      }

      @keyframes orbFloat {
        0%, 100% { transform: translateY(0px) scale(1); opacity: 0.4; }
        33% { transform: translateY(-30px) scale(1.1); opacity: 0.6; }
        66% { transform: translateY(15px) scale(0.9); opacity: 0.5; }
      }

      /* Main container with glassmorphism */
      .main-container {
        position: relative;
        background: rgba(15, 23, 42, 0.8);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(139, 92, 246, 0.3);
        border-radius: 24px;
        padding: 48px;
        width: 100%;
        max-width: 520px;
        box-shadow: 
          0 25px 50px rgba(139, 92, 246, 0.15),
          0 0 0 1px rgba(139, 92, 246, 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.1);
        z-index: 100;
      }

      .main-container::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, 
          rgba(139, 92, 246, 0.1) 0%,
          rgba(79, 70, 229, 0.05) 50%,
          rgba(16, 185, 129, 0.1) 100%);
        border-radius: 24px;
        z-index: -1;
      }

      .header {
        display: flex;
        align-items: center;
        margin-bottom: 20px;
        background: none;
        box-shadow: none;
        padding-left: 43px;
      }
      
      .header img{
        width: 45px;
        height: 45px;
        position: relative;
        bottom: 15px
      }

      .subtitle {
        color: #cbd5e1;
        font-size: 16px;
        font-weight: 400;
        font-family: 'JetBrains Mono', monospace;
      }

      /* Enhanced OTP inputs */
      .otp-inputs {
        display: flex;
        justify-content: center;
        gap: 16px;
        margin-bottom: 32px;
      }

      .otp-input {
        width: 56px;
        height: 56px;
        text-align: center;
        font-size: 24px;
        font-weight: 700;
        color: #ffffff;
        background: rgba(30, 41, 59, 0.8);
        border: 2px solid rgba(139, 92, 246, 0.3);
        border-radius: 16px;
        outline: none;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: 'Orbitron', monospace;
        position: relative;
        backdrop-filter: blur(10px);
      }

      .otp-input:focus {
        border-color: #8b5cf6;
        box-shadow: 
          0 0 0 4px rgba(139, 92, 246, 0.25),
          0 0 30px rgba(139, 92, 246, 0.4),
          inset 0 1px 0 rgba(255, 255, 255, 0.1);
        transform: scale(1.05);
        background: rgba(30, 41, 59, 0.9);
      }

      .otp-input:hover:not(:focus) {
        border-color: rgba(139, 92, 246, 0.5);
        background: rgba(30, 41, 59, 0.9);
      }

      .otp-input:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      /* Error state */
      .otp-input.error {
        border-color: #ef4444;
        box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.25);
        animation: shake 0.5s ease-in-out;
      }

      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-4px); }
        75% { transform: translateX(4px); }
      }

      /* Timer section */
      .timer-section {
        text-align: center;
        margin-bottom: 32px;
      }

      .timer-label {
        color: #94a3b8;
        font-size: 14px;
        margin-bottom: 8px;
        font-family: 'JetBrains Mono', monospace;
      }

      .timer-display {
        color: #60a5fa;
        font-family: 'Orbitron', monospace;
        font-size: 28px;
        font-weight: 700;
        text-shadow: 0 0 20px rgba(96, 165, 250, 0.6);
        background: linear-gradient(135deg, #60a5fa, #3b82f6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      /* Enhanced button */
      .verify-button {
        width: 100%;
        padding: 18px;
        border-radius: 16px;
        font-weight: 700;
        color: #ffffff;
        border: none;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: 'Orbitron', monospace;
        font-size: 16px;
        letter-spacing: 2px;
        position: relative;
        overflow: hidden;
        margin-bottom: 24px;
      }

      .verify-button:not(:disabled) {
        background: linear-gradient(135deg, #8b5cf6, #6366f1);
        box-shadow: 
          0 10px 30px rgba(139, 92, 246, 0.4),
          inset 0 1px 0 rgba(255, 255, 255, 0.2);
      }

      .verify-button:not(:disabled):hover {
        transform: translateY(-2px);
        box-shadow: 
          0 20px 40px rgba(139, 92, 246, 0.6),
          inset 0 1px 0 rgba(255, 255, 255, 0.2);
      }

      .verify-button:not(:disabled):active {
        transform: translateY(0);
      }

      .verify-button:disabled {
        background: rgba(71, 85, 105, 0.8);
        cursor: not-allowed;
      }

      .verify-button.success {
        background: linear-gradient(135deg, #10b981, #059669);
      }

      .verify-button.error {
        background: linear-gradient(135deg, #ef4444, #dc2626);
      }

      /* Button ripple effect */
      .verify-button::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
        transform: scale(0);
        transition: transform 0.3s ease-out;
      }

      .verify-button:active::before {
        transform: scale(1);
      }

      .button-content {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        position: relative;
        z-index: 1;
      }

      .spinner {
        width: 24px;
        height: 24px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top: 2px solid #ffffff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .success-icon {
        width: 24px;
        height: 24px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        color: #ffffff;
        font-weight: 900;
      }

      /* Error message */
      .error-message {
        color: #ef4444;
        font-size: 14px;
        text-align: center;
        margin-bottom: 20px;
        font-family: 'JetBrains Mono', monospace;
        animation: errorSlide 0.3s ease-out;
      }

      @keyframes errorSlide {
        0% { opacity: 0; transform: translateY(-10px); }
        100% { opacity: 1; transform: translateY(0); }
      }

      /* Resend section */
      .resend-section {
        text-align: center;
        margin-top: 32px;
      }

      .resend-text {
        color: #94a3b8;
        font-size: 14px;
        font-family: 'JetBrains Mono', monospace;
      }

      .resend-button {
        font-size: 14px;
        font-weight: 700;
        background: none;
        border: none;
        cursor: pointer;
        transition: all 0.3s ease;
        font-family: 'Orbitron', monospace;
        letter-spacing: 1px;
      }

      .resend-button:not(:disabled) {
        color: #60a5fa;
        text-decoration: underline;
      }

      .resend-button:not(:disabled):hover {
        color: #3b82f6;
        text-shadow: 0 0 10px rgba(96, 165, 250, 0.5);
      }

      .resend-button:disabled {
        color: #64748b;
        cursor: not-allowed;
        text-decoration: none;
      }

      /* Success message */
      .success-message {
        margin-top: 32px;
        padding: 24px;
        background: rgba(16, 185, 129, 0.1);
        border: 1px solid rgba(16, 185, 129, 0.3);
        border-radius: 16px;
        text-align: center;
        animation: successSlideIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        backdrop-filter: blur(10px);
      }

      @keyframes successSlideIn {
        0% { opacity: 0; transform: translateY(30px) scale(0.95); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }

      .success-title {
        color: #10b981;
        font-weight: 700;
        font-size: 18px;
        margin-bottom: 8px;
        font-family: 'Orbitron', monospace;
      }

      .success-subtitle {
        color: #6ee7b7;
        font-size: 14px;
        font-family: 'JetBrains Mono', monospace;
      }

      /* Responsive design */
      @media (max-width: 480px) {
        .main-container {
          padding: 32px 24px;
        }
        
        .otp-inputs {
          gap: 12px;
        }
        
        .otp-input {
          width: 48px;
          height: 48px;
          font-size: 20px;
        }
        
        .timer-display {
          font-size: 24px;
        }

        .floating-icon {
          width: 24px;
          height: 24px;
        }

        .floating-icon.small {
          width: 20px;
          height: 20px;
        }

        .floating-icon.large {
          width: 28px;
          height: 28px;
        }
      }
    `}</style>

    {/* Enhanced animated background with floating GIFs */}
    <div className="animated-bg">
      {/* Floating GIF Icons */}
      <div className="floating-icon small">
        <img src="/icon3.gif" alt="Security" />
      </div>
      <div className="floating-icon medium">
        <img src="/icon3.gif" alt="Lock" />
      </div>
      <div className="floating-icon large">
        <img src="/icon3.gif" alt="Shield" />
      </div>
      <div className="floating-icon small">
        <img src="/icon3.gif" alt="Key" />
      </div>
      <div className="floating-icon medium">
        <img src="/icon3.gif" alt="Code" />
      </div>
      <div className="floating-icon large">
        <img src="/icon3.gif" alt="WiFi" />
      </div>
      <div className="floating-icon small">
        <img src="/icon3.gif" alt="Star" />
      </div>
      <div className="floating-icon medium">
        <img src="/icon3.gif" alt="Gear" />
      </div>
      <div className="floating-icon large">
        <img src="/icon3.gif" alt="Diamond" />
      </div>
      <div className="floating-icon small">
        <img src="/icon3.gif" alt="Rocket" />
      </div>
      
      {/* Keep some orbs for additional ambiance */}
      <div className="orb"></div>
      <div className="orb"></div>
      <div className="orb"></div>
    </div>

    {/* Main container */}
    <div className="main-container">
      {/* Header */}
      <div className="header">
        <p className="subtitle">Enter the 6-digit verification code</p>
        <img src="/icon6.gif" alt="Logo" className="logo-img" />
      </div>

      {/* OTP Input */}
      <div className="otp-inputs">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={el => inputRefs.current[index] = el}
            type="text"
            maxLength="1"
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className={`otp-input ${error ? 'error' : ''}`}
            disabled={isVerifying || isSuccess}
          />
        ))}
      </div>

      {/* Timer */}
      <div className="timer-section">
        <div className="timer-label">CODE EXPIRES IN</div>
        <div className="timer-display">
          {formatTime(timer)}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Verify Button */}
      <button
        onClick={handleVerify}
        disabled={otp.join('').length !== 6 || isVerifying || isSuccess}
        className={`verify-button ${isSuccess ? 'success' : error ? 'error' : ''}`}
      >
        <div className="button-content">
          {isVerifying ? (
            <>
              <div className="spinner"></div>
              VERIFYING...
            </>
          ) : isSuccess ? (
            <>
              <div className="success-icon">✓</div>
              ACCESS GRANTED
            </>
          ) : (
            'VERIFY CODE'
          )}
        </div>
      </button>

      {/* Resend */}
      <div className="resend-section">
        <span className="resend-text">Didn't receive a code? </span>
        <button
          onClick={handleResend}
          disabled={timer > 0}
          className="resend-button"
        >
          RESEND CODE
        </button>
      </div>

      {/* Success message */}
      {isSuccess && (
        <div className="success-message">
          <div className="success-title">AUTHENTICATION SUCCESSFUL</div>
          <div className="success-subtitle">Welcome to AetherVerse</div>
        </div>
      )}
    </div>
  </div>
);
};

export default OTPVerification;