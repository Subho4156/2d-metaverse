// src/components/LoadingScreen.jsx
import React from 'react';
import './LoadingScreen.css';

const LoadingScreen = () => {
  return (
    <div className="loading-overlay"  >
      <img src="/load-gf.gif" alt="Loading..." className="loading-gif" />
    </div>
  );
};

export default LoadingScreen;
