import React, { useState } from 'react';

const AdminPanel = ({ isOwner, onPermissionsChange }) => {
  const [hackPermissions, setHackPermissions] = useState({
    wallhack: false,
    speedup: false,
    teleport: false
  });

  const [isMinimized, setIsMinimized] = useState(false);

  const togglePermission = (hackType) => {
    const newPermissions = {
      ...hackPermissions,
      [hackType]: !hackPermissions[hackType]
    };
    setHackPermissions(newPermissions);
    onPermissionsChange(newPermissions);
  };

  if (!isOwner) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: "20px",
        right: "20px",
        background: "rgba(0,0,0,0.85)",
        borderRadius: "10px",
        padding: isMinimized ? "8px 12px" : "16px",
        border: "2px solid rgba(255,255,255,0.2)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
        pointerEvents: "auto",
        minWidth: isMinimized ? "auto" : "250px",
        transition: "all 0.3s ease",
      }}
    >
      {/* Header */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between",
        marginBottom: isMinimized ? "0" : "12px"
      }}>
        <div style={{
          color: "#3498DB",
          fontWeight: "bold",
          fontSize: "14px",
          fontFamily: "Arial, sans-serif",
          display: "flex",
          alignItems: "center",
          gap: "6px"
        }}>
          <span style={{ fontSize: "16px" }}>👑</span>
          {!isMinimized && "Admin Panel"}
        </div>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          style={{
            background: "transparent",
            border: "none",
            color: "white",
            cursor: "pointer",
            fontSize: "14px",
            padding: "2px 6px",
            borderRadius: "4px",
            transition: "background 0.2s ease"
          }}
          onMouseOver={(e) => e.target.style.background = "rgba(255,255,255,0.1)"}
          onMouseOut={(e) => e.target.style.background = "transparent"}
        >
          {isMinimized ? "⬆" : "⬇"}
        </button>
      </div>

      {!isMinimized && (
        <>
          {/* Permissions Title */}
          <div style={{
            color: "white",
            fontSize: "12px",
            fontWeight: "bold",
            marginBottom: "10px",
            opacity: 0.8,
            fontFamily: "Arial, sans-serif"
          }}>
            🔧 Hack Permissions
          </div>

          {/* Permission Controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {/* Wallhack */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 10px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "6px",
              border: hackPermissions.wallhack ? "1px solid #27AE60" : "1px solid rgba(255,255,255,0.1)"
            }}>
              <div style={{
                color: "white",
                fontSize: "12px",
                fontFamily: "Arial, sans-serif",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                <span>👻</span>
                Wallhack
              </div>
              <button
                onClick={() => togglePermission('wallhack')}
                style={{
                  background: hackPermissions.wallhack ? "#27AE60" : "#E74C3C",
                  color: "white",
                  border: "none",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "10px",
                  fontWeight: "bold",
                  transition: "all 0.2s ease"
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = "scale(1.05)";
                  e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,0.4)";
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = "scale(1)";
                  e.target.style.boxShadow = "none";
                }}
              >
                {hackPermissions.wallhack ? "ON" : "OFF"}
              </button>
            </div>

            {/* Speed Up */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 10px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "6px",
              border: hackPermissions.speedup ? "1px solid #27AE60" : "1px solid rgba(255,255,255,0.1)"
            }}>
              <div style={{
                color: "white",
                fontSize: "12px",
                fontFamily: "Arial, sans-serif",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                <span>⚡</span>
                Speed Up
              </div>
              <button
                onClick={() => togglePermission('speedup')}
                style={{
                  background: hackPermissions.speedup ? "#27AE60" : "#E74C3C",
                  color: "white",
                  border: "none",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "10px",
                  fontWeight: "bold",
                  transition: "all 0.2s ease"
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = "scale(1.05)";
                  e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,0.4)";
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = "scale(1)";
                  e.target.style.boxShadow = "none";
                }}
              >
                {hackPermissions.speedup ? "ON" : "OFF"}
              </button>
            </div>

            {/* Teleport */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 10px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "6px",
              border: hackPermissions.teleport ? "1px solid #27AE60" : "1px solid rgba(255,255,255,0.1)"
            }}>
              <div style={{
                color: "white",
                fontSize: "12px",
                fontFamily: "Arial, sans-serif",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                <span>🌀</span>
                Teleport
              </div>
              <button
                onClick={() => togglePermission('teleport')}
                style={{
                  background: hackPermissions.teleport ? "#27AE60" : "#E74C3C",
                  color: "white",
                  border: "none",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "10px",
                  fontWeight: "bold",
                  transition: "all 0.2s ease"
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = "scale(1.05)";
                  e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,0.4)";
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = "scale(1)";
                  e.target.style.boxShadow = "none";
                }}
              >
                {hackPermissions.teleport ? "ON" : "OFF"}
              </button>
            </div>
          </div>

          {/* Status Info */}
          <div style={{
            marginTop: "12px",
            padding: "8px 10px",
            background: "rgba(52, 152, 219, 0.1)",
            borderRadius: "6px",
            border: "1px solid rgba(52, 152, 219, 0.3)"
          }}>
            <div style={{
              color: "#3498DB",
              fontSize: "10px",
              fontFamily: "Arial, sans-serif",
              textAlign: "center",
              opacity: 0.9
            }}>
              ℹ️ Controls what hacks are available to all users
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminPanel;