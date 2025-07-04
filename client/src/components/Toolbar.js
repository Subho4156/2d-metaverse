import React, { useState, useEffect } from "react";
import { updateSpace } from "../api";
import { set } from "mongoose";
const LeftToolbar = ({ space, playerName = "Player", gameStateRef, onTeleport, changeSpeed, wallHackEnabled,
  setWallHackEnabled, triggerEmote }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [selectedSpeed, setSelectedSpeed] = useState(2); // Default speed
  const [speedOpen, setSpeedOpen] = useState(false);
  const [spaceName, setSpaceName] = useState(space?.name || "My Space");
  const [teleportOpen, setTeleportOpen] = useState(false);
  const [wallhackwindowOpen, setWallhackwindowOpen] = useState(false);
  const [spaceDescription, setSpaceDescription] = useState(space?.description || "A beautiful metaverse world");
  const [isWallHackEnabled, setIsWallHackEnabled] = useState(false);
  const [openemote, setOpenEmote] = useState(false);
  const [selectedEmote, setSelectedEmote] = useState(null);
  const [hoveredEmote, setHoveredEmote] = useState(null);


  const teleportLocations = [
  { label: "Meeting Room", x: 400, y: 300 },
  { label: "Library", x: 1200, y: 300 },
  { label: "Conference Room", x: 600, y: 800 },
  { label: "Game Room", x: 1200, y: 800 },
];

  const speedOptions = [
    { value: 2, label: "SLOW", color: "#10b981", icon: "🐌" },
    { value: 4, label: "NORMAL", color: "#3b82f6", icon: "🚶" },
    { value: 6, label: "FAST", color: "#ef4444", icon: "🏃" }
  ];

  const emoteCategories = [
    {
      name: "Happy",
      emotes: [
        { emoji: "😀", name: "Grinning" },
        { emoji: "😊", name: "Smiling" },
        { emoji: "😄", name: "Laughing" },
        { emoji: "🤣", name: "ROFL" },
        { emoji: "😍", name: "Heart Eyes" },
        { emoji: "🥳", name: "Party" }
      ]
    },
    {
      name: "Cool",
      emotes: [
        { emoji: "😎", name: "Cool" },
        { emoji: "🤔", name: "Thinking" },
        { emoji: "😏", name: "Smirk" },
        { emoji: "🔥", name: "Fire" },
        { emoji: "💯", name: "100" },
        { emoji: "⚡", name: "Lightning" }
      ]
    },
    {
      name: "Actions",
      emotes: [
        { emoji: "👋", name: "Wave" },
        { emoji: "👍", name: "Thumbs Up" },
        { emoji: "✌️", name: "Peace" },
        { emoji: "🖕", name: "Fork u" },
        { emoji: "👏", name: "Clap" },
        { emoji: "🤝", name: "Handshake" }
      ]
    }
  ];

  const handleEmoteSelect = (emote) => {
    setSelectedEmote(emote);
    triggerEmote(emote.emoji);
    setTimeout(() => {
       setOpenEmote(false);
    }, 600);
  };



  const pixelFont = {
    fontFamily: "'Pixelify Sans', cursive",
    fontWeight: "normal",
    imageRendering: "pixelated",
    textRendering: "geometricPrecision",
  };

const handleSave = async (type, value) => {
  try {
    let updatedData = {};
    if (type === "name") {
      updatedData.name = value;
      setSpaceName(value);
      setIsEditingName(false);
    } else if (type === "description") {
      updatedData.description = value;
      setSpaceDescription(value);
      setIsEditingDescription(false);
    }
    await updateSpace(space._id, updatedData); // send to backend
  } catch (err) {
    console.error("Failed to update space:", err);
  }
};

  const handleSpeedSelect = (newspeed) => {
    setSelectedSpeed(newspeed);
    changeSpeed(newspeed)
    setSpeedOpen(false);
  };

   const handleToggle = () => {
    const newState = !isWallHackEnabled;
    setIsWallHackEnabled(newState);
    setWallHackEnabled(!wallHackEnabled)
    
    // Auto-close after a short delay to show the change
    setTimeout(() => {
      setWallhackwindowOpen(false);
    }, 800);
  };



  const EditableField = ({
    value,
    isEditing,
    onEdit,
    onSave,
    multiline = false,
    placeholder,
    textColor = "#ffffff",
    fieldBackground = "transparent",
  }) => {
    const [tempValue, setTempValue] = useState(value);

    useEffect(() => {
      if (!isEditing) {
        setTempValue(value);
      }
    }, [value, isEditing]);

    const inputStyles = {
      ...pixelFont,
      width: "100%",
      padding: "10px",
      border: "2px solid #60a5fa",
      borderRadius: "8px",
      background: "rgba(30, 41, 59, 0.7)",
      color: textColor,
      fontSize: multiline ? "13px" : "14px",
      outline: "none",
      boxShadow: "0 2px 8px rgba(0,0,0,0.2) inset",
      transition: "border-color 0.2s ease, box-shadow 0.2s ease",
      resize: multiline ? "vertical" : "none",
    };

    const buttonBaseStyles = {
      ...pixelFont,
      padding: "8px 16px",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: "bold",
      transition: "all 0.2s ease",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    };

    if (isEditing) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {multiline ? (
            <textarea
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              placeholder={placeholder}
              style={{ ...inputStyles, minHeight: "120px" }}
            />
          ) : (
            <input
              type="text"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              placeholder={placeholder}
              style={inputStyles}
            />
          )}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => onSave(tempValue)}
              style={{
                ...buttonBaseStyles,
                background: "#10b981",
                color: "white",
                boxShadow: "0 4px 10px rgba(16, 185, 129, 0.3)",
              }}
              onMouseEnter={(e) => { e.target.style.background = "#059669"; e.target.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.target.style.background = "#10b981"; e.target.style.transform = "translateY(0)"; }}
            >
              Save
            </button>
            <button
              onClick={() => onEdit(false)}
              style={{
                ...buttonBaseStyles,
                background: "#ef4444",
                color: "white",
                boxShadow: "0 4px 10px rgba(239, 68, 68, 0.3)",
              }}
              onMouseEnter={(e) => { e.target.style.background = "#dc2626"; e.target.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.target.style.background = "#ef4444"; e.target.style.transform = "translateY(0)"; }}
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    const textDisplayStyles = {
      ...pixelFont,
      flex: 1,
      color: textColor,
      whiteSpace: multiline ? 'normal' : 'nowrap', // Allow wrapping for multiline descriptions
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      lineHeight: multiline ? '1.6' : 'inherit', // Adjust line height for multiline
    };

    return (
      <div
        style={{
          display: "flex",
          alignItems: multiline ? 'flex-start' : 'center', // Align top for multiline
          justifyContent: "space-between",
          gap: "10px",
          padding: "10px 12px",
          borderRadius: "8px",
          background: fieldBackground,
          border: fieldBackground !== "transparent" ? "1px solid rgba(255,255,255,0.1)" : "none",
          transition: "background 0.2s ease",
        }}
      >
        <div style={textDisplayStyles}>{value}</div>
        <button
          onClick={() => onEdit(true)}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "50%",
            width: "30px",
            height: "30px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#94a3b8",
            fontSize: "14px",
            transition: "all 0.2s ease",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(255,255,255,0.15)";
            e.target.style.color = "#ffffff";
            e.target.style.borderColor = "rgba(255,255,255,0.4)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "rgba(255,255,255,0.1)";
            e.target.style.color = "#94a3b8";
            e.target.style.borderColor = "rgba(255,255,255,0.2)";
          }}
        >
          ✏️
        </button>
      </div>
    );
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "45%",
        transform: "translateY(-50%)",
        width: "300px",
        background:
          "linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%)",
        backdropFilter: "blur(25px)",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        color: "#e2e8f0",
        padding: "0",
        boxShadow:
          "0 25px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08)",
        pointerEvents: "auto",
        zIndex: 101,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(90deg, #3b82f6 0%, #4f46e5 100%)",
          padding: "18px 25px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            ...pixelFont,
            fontSize: "18px",
            color: "#ffffff",
            textShadow: "0 2px 6px rgba(0, 0, 0, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          TOOLBAR
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "25px" }}>
        {/* Space Name Section */}
        <div style={{ marginBottom: "25px" }}>
          <div
            style={{
              ...pixelFont,
              fontSize: "13px",
              color: "#94a3b8",
              marginBottom: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
            }}
          >
            Space Name
          </div>
          <div
            style={{
              ...pixelFont,
              fontSize: "13px",
              color: "#ffffff",
              fontWeight: "bold",
            }}
          >
            <EditableField
              value={spaceName}
              isEditing={isEditingName}
              onEdit={setIsEditingName}
              onSave={(value) => handleSave("name", value)}
              placeholder="Enter space name"
              textColor="#ffffff"
              fieldBackground="rgba(255,255,255,0.08)"
            />
          </div>
        </div>

        {/* Space Description Section */}
        <div style={{ marginBottom: "25px" }}>
          <div
            style={{
              ...pixelFont,
              fontSize: "13px",
              color: "#94a3b8",
              marginBottom: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
            }}
          >
            Description
          </div>
          <div
            style={{
              ...pixelFont,
              fontSize: "14px",
              color: "#e2e8f0",
              lineHeight: "1.6",
            }}
          >
            <EditableField
              value={spaceDescription}
              isEditing={isEditingDescription}
              onEdit={setIsEditingDescription}
              onSave={(value) => handleSave("description", value)}
              multiline={true}
              placeholder="Describe your space"
              textColor="#e2e8f0"
              fieldBackground="rgba(255,255,255,0.08)"
            />
          </div>
        </div>
        <div
          style={{
            ...pixelFont,
            fontSize: "13px",
            color: "#94a3b8",
            marginBottom: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.8px",
          }}
        >
          Hacks
        </div>

        {/* Teleport Button */}
        <button
          onClick={() => setTeleportOpen(true)}
          style={{
            ...pixelFont,
            width: "48%",
            height: "fit-content",
            padding: "15px",
            backgroundColor: "rgb(223, 223, 223)",
            borderLeft: "3px solid white",
            borderTop: "3px solid white",
            borderRight: "3px solid gray",
            borderBottom: "3px solid gray",
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: "1.1rem",
            fontWeight: "900",
            outline: "2px solid black",
            cursor: "pointer",
            transition: "all 0.2s ease",
            marginBottom: "15px",
            marginRight: "9px",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "rgb(0, 197, 0)";
            e.target.style.color = "white";
            e.target.style.outlineColor = "white";
            e.target.style.borderLeft = "3px solid rgb(0, 255, 0)";
            e.target.style.borderTop = "3px solid rgb(0, 255, 0)";
            e.target.style.borderRight = "3px solid green";
            e.target.style.borderBottom = "3px solid green";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "rgb(223, 223, 223)";
            e.target.style.color = "black";
            e.target.style.outlineColor = "black";
            e.target.style.borderLeft = "3px solid white";
            e.target.style.borderTop = "3px solid white";
            e.target.style.borderRight = "3px solid gray";
            e.target.style.borderBottom = "3px solid gray";
          }}
          onMouseDown={(e) => {
            e.target.style.borderLeft = "3px solid green";
            e.target.style.borderTop = "3px solid green";
            e.target.style.borderRight = "3px solid rgb(0, 255, 0)";
            e.target.style.borderBottom = "3px solid rgb(0, 255, 0)";
          }}
          onMouseUp={(e) => {
            e.target.style.borderLeft = "3px solid rgb(0, 255, 0)";
            e.target.style.borderTop = "3px solid rgb(0, 255, 0)";
            e.target.style.borderRight = "3px solid green";
            e.target.style.borderBottom = "3px solid green";
          }}
        >
          Teleport
        </button>
        {teleportOpen && (
          <div
            style={{
              position: "absolute",
              top: "45%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "rgba(17,24,39,0.95)",
              padding: "20px",
              borderRadius: "12px",
              zIndex: 999,
              border: "2px solid #60a5fa",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              minWidth: "260px",
            }}
          >
            <div
              style={{
                ...pixelFont,
                fontSize: "16px",
                marginBottom: "10px",
                color: "#ffffff",
              }}
            >
              Choose a location to teleport:
            </div>
            {teleportLocations.map((loc) => (
              <button
                key={loc.label}
                className="button"
                style={{ ...pixelFont, width: "100%", marginBottom: "10px" }}
                onClick={() => {
                  onTeleport(loc);
                  setTeleportOpen(false); // close modal
                }}
              >
                {loc.label}
              </button>
            ))}
            <button
              className="button"
              style={{
                ...pixelFont,
                width: "100%",
                backgroundColor: "#ef4444",
                color: "white",
              }}
              onClick={() => setTeleportOpen(false)}
            >
              Cancel
            </button>
          </div>
        )}

        <button
          onClick={() => setSpeedOpen(true)}
          style={{
            ...pixelFont,
            width: "48%",
            height: "fit-content",
            padding: "15px",
            backgroundColor: "rgb(223, 223, 223)",
            borderLeft: "3px solid white",
            borderTop: "3px solid white",
            borderRight: "3px solid gray",
            borderBottom: "3px solid gray",
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: "1.1rem",
            fontWeight: "900",
            outline: "2px solid black",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "rgb(0, 197, 0)";
            e.target.style.color = "white";
            e.target.style.outlineColor = "white";
            e.target.style.borderLeft = "3px solid rgb(0, 255, 0)";
            e.target.style.borderTop = "3px solid rgb(0, 255, 0)";
            e.target.style.borderRight = "3px solid green";
            e.target.style.borderBottom = "3px solid green";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "rgb(223, 223, 223)";
            e.target.style.color = "black";
            e.target.style.outlineColor = "black";
            e.target.style.borderLeft = "3px solid white";
            e.target.style.borderTop = "3px solid white";
            e.target.style.borderRight = "3px solid gray";
            e.target.style.borderBottom = "3px solid gray";
          }}
          onMouseDown={(e) => {
            e.target.style.borderLeft = "3px solid green";
            e.target.style.borderTop = "3px solid green";
            e.target.style.borderRight = "3px solid rgb(0, 255, 0)";
            e.target.style.borderBottom = "3px solid rgb(0, 255, 0)";
          }}
          onMouseUp={(e) => {
            e.target.style.borderLeft = "3px solid rgb(0, 255, 0)";
            e.target.style.borderTop = "3px solid rgb(0, 255, 0)";
            e.target.style.borderRight = "3px solid green";
            e.target.style.borderBottom = "3px solid green";
          }}
        >
          Speed
        </button>
        {speedOpen && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background:
                "linear-gradient(135deg, rgba(17, 24, 39, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)",
              backdropFilter: "blur(20px)",
              padding: "24px",
              borderRadius: "16px",
              zIndex: 999,
              border: "1px solid rgba(96, 165, 250, 0.3)",
              boxShadow:
                "0 25px 50px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)",
              minWidth: "280px",
              maxWidth: "320px",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  ...pixelFont,
                  fontSize: "16px",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>⚡</span>
                Movement Speed
              </div>
              <button
                onClick={() => setSpeedOpen(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "50%",
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#94a3b8",
                  fontSize: "14px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(239, 68, 68, 0.2)";
                  e.target.style.color = "#ef4444";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.1)";
                  e.target.style.color = "#94a3b8";
                }}
              >
                ×
              </button>
            </div>

            {/* Speed Options */}
            <div style={{ marginBottom: "20px" }}>
              {speedOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleSpeedSelect(option.value)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "16px",
                    marginBottom: "12px",
                    background:
                      selectedSpeed === option.value
                        ? `linear-gradient(90deg, ${option.color}20, ${option.color}10)`
                        : "rgba(255, 255, 255, 0.05)",
                    border:
                      selectedSpeed === option.value
                        ? `2px solid ${option.color}`
                        : "2px solid transparent",
                    borderRadius: "12px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedSpeed !== option.value) {
                      e.target.style.background = "rgba(255, 255, 255, 0.08)";
                      e.target.style.border =
                        "2px solid rgba(255, 255, 255, 0.1)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedSpeed !== option.value) {
                      e.target.style.background = "rgba(255, 255, 255, 0.05)";
                      e.target.style.border = "2px solid transparent";
                    }
                  }}
                >
                  {/* Speed Icon */}
                  <div
                    style={{
                      fontSize: "24px",
                      marginRight: "16px",
                      filter:
                        selectedSpeed === option.value
                          ? "brightness(1.2)"
                          : "brightness(0.8)",
                    }}
                  >
                    {option.icon}
                  </div>

                  {/* Speed Info */}
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        ...pixelFont,
                        fontSize: "14px",
                        color:
                          selectedSpeed === option.value
                            ? option.color
                            : "#ffffff",
                        marginBottom: "4px",
                        fontWeight: "bold",
                      }}
                    >
                      {option.label}
                    </div>
                    <div
                      style={{
                        ...pixelFont,
                        fontSize: "12px",
                        color: "#94a3b8",
                      }}
                    >
                      Speed: {option.value}x
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  {selectedSpeed === option.value && (
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        background: option.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#ffffff",
                        fontSize: "12px",
                        boxShadow: `0 0 10px ${option.color}40`,
                      }}
                    >
                      ✓
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Current Speed Display */}
            <div
              style={{
                background: "rgba(59, 130, 246, 0.1)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "16px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  ...pixelFont,
                  fontSize: "12px",
                  color: "#94a3b8",
                  marginBottom: "4px",
                }}
              >
                Current Speed
              </div>
              <div
                style={{
                  ...pixelFont,
                  fontSize: "16px",
                  color: "#3b82f6",
                  fontWeight: "bold",
                }}
              >
                {selectedSpeed}x
              </div>
            </div>

            {/* Cancel Button */}
            <button
              onClick={() => setSpeedOpen(false)}
              style={{
                ...pixelFont,
                width: "100%",
                padding: "12px",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "8px",
                color: "#ef4444",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(239, 68, 68, 0.2)";
                e.target.style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "rgba(239, 68, 68, 0.1)";
                e.target.style.color = "#ef4444";
              }}
            >
              Cancel
            </button>
          </div>
        )}
        <button
          onClick={() => setWallhackwindowOpen(true)}
          style={{
            ...pixelFont,
            width: "48%",
            height: "fit-content",
            padding: "15px",
            backgroundColor: "rgb(223, 223, 223)",
            borderLeft: "3px solid white",
            borderTop: "3px solid white",
            borderRight: "3px solid gray",
            borderBottom: "3px solid gray",
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: "1.1rem",
            fontWeight: "900",
            outline: "2px solid black",
            cursor: "pointer",
            transition: "all 0.2s ease",
            marginRight: "9px",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "rgb(0, 197, 0)";
            e.target.style.color = "white";
            e.target.style.outlineColor = "white";
            e.target.style.borderLeft = "3px solid rgb(0, 255, 0)";
            e.target.style.borderTop = "3px solid rgb(0, 255, 0)";
            e.target.style.borderRight = "3px solid green";
            e.target.style.borderBottom = "3px solid green";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "rgb(223, 223, 223)";
            e.target.style.color = "black";
            e.target.style.outlineColor = "black";
            e.target.style.borderLeft = "3px solid white";
            e.target.style.borderTop = "3px solid white";
            e.target.style.borderRight = "3px solid gray";
            e.target.style.borderBottom = "3px solid gray";
          }}
          onMouseDown={(e) => {
            e.target.style.borderLeft = "3px solid green";
            e.target.style.borderTop = "3px solid green";
            e.target.style.borderRight = "3px solid rgb(0, 255, 0)";
            e.target.style.borderBottom = "3px solid rgb(0, 255, 0)";
          }}
          onMouseUp={(e) => {
            e.target.style.borderLeft = "3px solid rgb(0, 255, 0)";
            e.target.style.borderTop = "3px solid rgb(0, 255, 0)";
            e.target.style.borderRight = "3px solid green";
            e.target.style.borderBottom = "3px solid green";
          }}
        >
          Wallhack
        </button>
        {wallhackwindowOpen && (
          <div
            style={{
              position: "absolute",
              top: "45%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background:
                "linear-gradient(135deg, rgba(17, 24, 39, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)",
              backdropFilter: "blur(20px)",
              padding: "24px",
              borderRadius: "16px",
              zIndex: 999,
              border: "1px solid rgba(168, 85, 247, 0.3)",
              boxShadow:
                "0 25px 50px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)",
              minWidth: "280px",
              maxWidth: "320px",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  ...pixelFont,
                  fontSize: "16px",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>👁️</span>
                Wall Hack
              </div>
              <button
                onClick={() => setWallhackwindowOpen(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "50%",
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#94a3b8",
                  fontSize: "14px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(239, 68, 68, 0.2)";
                  e.target.style.color = "#ef4444";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.1)";
                  e.target.style.color = "#94a3b8";
                }}
              >
                ×
              </button>
            </div>

            {/* Toggle Section */}
            <div style={{ marginBottom: "20px" }}>
              <div
                onClick={handleToggle}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "20px",
                  background: isWallHackEnabled
                    ? "linear-gradient(90deg, rgba(168, 85, 247, 0.2), rgba(168, 85, 247, 0.1))"
                    : "rgba(255, 255, 255, 0.05)",
                  border: isWallHackEnabled
                    ? "2px solid #a855f7"
                    : "2px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  if (!isWallHackEnabled) {
                    e.target.style.background = "rgba(255, 255, 255, 0.08)";
                    e.target.style.border =
                      "2px solid rgba(255, 255, 255, 0.15)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isWallHackEnabled) {
                    e.target.style.background = "rgba(255, 255, 255, 0.05)";
                    e.target.style.border =
                      "2px solid rgba(255, 255, 255, 0.1)";
                  }
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    fontSize: "32px",
                    marginRight: "16px",
                    filter: isWallHackEnabled
                      ? "brightness(1.2)"
                      : "brightness(0.7)",
                    transition: "all 0.3s ease",
                  }}
                >
                  {isWallHackEnabled ? "🔓" : "🔒"}
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      ...pixelFont,
                      fontSize: "16px",
                      color: isWallHackEnabled ? "#a855f7" : "#ffffff",
                      marginBottom: "4px",
                      fontWeight: "bold",
                    }}
                  >
                    {isWallHackEnabled ? "ENABLED" : "DISABLED"}
                  </div>
                  <div
                    style={{
                      ...pixelFont,
                      fontSize: "12px",
                      color: "#94a3b8",
                    }}
                  >
                    {isWallHackEnabled ? "See through walls" : "Normal vision"}
                  </div>
                </div>

                {/* Toggle Switch */}
                <div
                  style={{
                    width: "60px",
                    height: "30px",
                    background: isWallHackEnabled
                      ? "#a855f7"
                      : "rgba(255, 255, 255, 0.2)",
                    borderRadius: "15px",
                    position: "relative",
                    transition: "all 0.3s ease",
                    boxShadow: isWallHackEnabled
                      ? "0 0 15px rgba(168, 85, 247, 0.5)"
                      : "inset 0 2px 4px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  <div
                    style={{
                      width: "26px",
                      height: "26px",
                      background: "#ffffff",
                      borderRadius: "50%",
                      position: "absolute",
                      top: "2px",
                      left: isWallHackEnabled ? "32px" : "2px",
                      transition: "all 0.3s ease",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Status Display */}
            <div
              style={{
                background: isWallHackEnabled
                  ? "rgba(168, 85, 247, 0.1)"
                  : "rgba(107, 114, 128, 0.1)",
                border: isWallHackEnabled
                  ? "1px solid rgba(168, 85, 247, 0.3)"
                  : "1px solid rgba(107, 114, 128, 0.3)",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "16px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  ...pixelFont,
                  fontSize: "12px",
                  color: "#94a3b8",
                  marginBottom: "4px",
                }}
              >
                Current Status
              </div>
              <div
                style={{
                  ...pixelFont,
                  fontSize: "16px",
                  color: isWallHackEnabled ? "#a855f7" : "#6b7280",
                  fontWeight: "bold",
                }}
              >
                {isWallHackEnabled ? "ACTIVE" : "INACTIVE"}
              </div>
            </div>

            {/* Warning Message */}
            {isWallHackEnabled && (
              <div
                style={{
                  background: "rgba(245, 158, 11, 0.1)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  borderRadius: "8px",
                  padding: "12px",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "16px" }}>⚠️</span>
                <div
                  style={{
                    ...pixelFont,
                    fontSize: "11px",
                    color: "#f59e0b",
                    lineHeight: "1.3",
                  }}
                >
                  Wall hack is active. Use responsibly!
                </div>
              </div>
            )}

            {/* Cancel Button */}
            <button
              onClick={() => setWallhackwindowOpen(false)}
              style={{
                ...pixelFont,
                width: "100%",
                padding: "12px",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "8px",
                color: "#ef4444",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(239, 68, 68, 0.2)";
                e.target.style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "rgba(239, 68, 68, 0.1)";
                e.target.style.color = "#ef4444";
              }}
            >
              Close
            </button>
          </div>
        )}
        <button
        onClick= {() => setOpenEmote(true)}
          style={{
            ...pixelFont,
            width: "48%",
            height: "fit-content",
            padding: "15px",
            backgroundColor: "rgb(223, 223, 223)",
            borderLeft: "3px solid white",
            borderTop: "3px solid white",
            borderRight: "3px solid gray",
            borderBottom: "3px solid gray",
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: "1.1rem",
            fontWeight: "900",
            outline: "2px solid black",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "rgb(0, 197, 0)";
            e.target.style.color = "white";
            e.target.style.outlineColor = "white";
            e.target.style.borderLeft = "3px solid rgb(0, 255, 0)";
            e.target.style.borderTop = "3px solid rgb(0, 255, 0)";
            e.target.style.borderRight = "3px solid green";
            e.target.style.borderBottom = "3px solid green";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "rgb(223, 223, 223)";
            e.target.style.color = "black";
            e.target.style.outlineColor = "black";
            e.target.style.borderLeft = "3px solid white";
            e.target.style.borderTop = "3px solid white";
            e.target.style.borderRight = "3px solid gray";
            e.target.style.borderBottom = "3px solid gray";
          }}
          onMouseDown={(e) => {
            e.target.style.borderLeft = "3px solid green";
            e.target.style.borderTop = "3px solid green";
            e.target.style.borderRight = "3px solid rgb(0, 255, 0)";
            e.target.style.borderBottom = "3px solid rgb(0, 255, 0)";
          }}
          onMouseUp={(e) => {
            e.target.style.borderLeft = "3px solid rgb(0, 255, 0)";
            e.target.style.borderTop = "3px solid rgb(0, 255, 0)";
            e.target.style.borderRight = "3px solid green";
            e.target.style.borderBottom = "3px solid green";
          }}
        >
          Emote
        </button>
        {openemote && (
             <div
      style={{
        position: "absolute",
        top: "45%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "linear-gradient(135deg, rgba(17, 24, 39, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)",
        backdropFilter: "blur(20px)",
        padding: "24px",
        borderRadius: "16px",
        zIndex: 999,
        border: "1px solid rgba(251, 191, 36, 0.3)",
        boxShadow: "0 25px 50px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)",
        minWidth: "280px",
        maxWidth: "320px",
        maxHeight: "400px",
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            ...pixelFont,
            fontSize: "16px",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>😊</span>
          Emote Picker
        </div>
        <button
          onClick={() => setOpenEmote(false)}
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "50%",
            width: "28px",
            height: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#94a3b8",
            fontSize: "14px",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(239, 68, 68, 0.2)";
            e.target.style.color = "#ef4444";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "rgba(255, 255, 255, 0.1)";
            e.target.style.color = "#94a3b8";
          }}
        >
          ×
        </button>
      </div>

      {/* Selected Emote Display */}
      {selectedEmote && (
        <div
          style={{
            background: "rgba(251, 191, 36, 0.1)",
            border: "1px solid rgba(251, 191, 36, 0.3)",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "16px",
            textAlign: "center",
            animation: "pulse 0.5s ease-in-out",
          }}
        >
          <div style={{ fontSize: "24px", marginBottom: "4px" }}>
            {selectedEmote.emoji}
          </div>
          <div
            style={{
              ...pixelFont,
              fontSize: "12px",
              color: "#fbbf24",
            }}
          >
            {selectedEmote.name} selected!
          </div>
        </div>
      )}

      {/* Emote Categories */}
      {emoteCategories.map((category, categoryIndex) => (
        <div key={category.name} style={{ marginBottom: "20px" }}>
          <div
            style={{
              ...pixelFont,
              fontSize: "12px",
              color: "#94a3b8",
              marginBottom: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {category.name}
          </div>
          
          {/* Emote Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "8px",
            }}
          >
            {category.emotes.map((emote, emoteIndex) => (
              <div
                key={emote.name}
                onClick={() => handleEmoteSelect(emote)}
                onMouseEnter={() => setHoveredEmote(emote)}
                onMouseLeave={() => setHoveredEmote(null)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "12px 8px",
                  background: hoveredEmote === emote 
                    ? "rgba(251, 191, 36, 0.2)"
                    : "rgba(255, 255, 255, 0.05)",
                  border: hoveredEmote === emote 
                    ? "2px solid #fbbf24"
                    : "2px solid transparent",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  transform: hoveredEmote === emote ? "scale(1.05)" : "scale(1)",
                }}
              >
                <div
                  style={{
                    fontSize: "24px",
                    marginBottom: "4px",
                    filter: hoveredEmote === emote ? "brightness(1.2)" : "brightness(1)",
                  }}
                >
                  {emote.emoji}
                </div>
                <div
                  style={{
                    ...pixelFont,
                    fontSize: "10px",
                    color: hoveredEmote === emote ? "#fbbf24" : "#94a3b8",
                    textAlign: "center",
                    lineHeight: "1.2",
                  }}
                >
                  {emote.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Instructions */}
      <div
        style={{
          background: "rgba(59, 130, 246, 0.1)",
          border: "1px solid rgba(59, 130, 246, 0.3)",
          borderRadius: "8px",
          padding: "10px",
          marginBottom: "16px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            ...pixelFont,
            fontSize: "11px",
            color: "#60a5fa",
            lineHeight: "1.3",
          }}
        >
          Click an emoji to display it as your emote
        </div>
      </div>

      {/* Cancel Button */}
      <button
        onClick={() => setOpenEmote(false)}
        style={{
          ...pixelFont,
          width: "100%",
          padding: "12px",
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "8px",
          color: "#ef4444",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "bold",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.target.style.background = "rgba(239, 68, 68, 0.2)";
          e.target.style.color = "#ffffff";
        }}
        onMouseLeave={(e) => {
          e.target.style.background = "rgba(239, 68, 68, 0.1)";
          e.target.style.color = "#ef4444";
        }}
      >
        Cancel
      </button>

      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
        )}
        <div
          style={{
            ...pixelFont,
            fontSize: "13px",
            color: "#94a3b8",
            marginTop: "30px",
            letterSpacing: "0.8px",
            marginLeft: "10px",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          Thanks for trying our work{" "}
          <img
            src="/icon2.gif"
            alt="icon"
            style={{ width: "20px", height: "20px", marginBottom: "5px" }}
          />
        </div>

        <a
          href="https://github.com/sinster23/2d-metaverse"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            marginTop: "12px",
            textDecoration: "none",
            color: "#60a5fa",
            fontSize: "13px",
            fontWeight: "bold",
            ...pixelFont,
          }}
        >
          <img
            src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg"
            alt="GitHub"
            width="20"
            height="20"
            style={{ filter: "invert(1)" }}
          />
          View on GitHub
        </a>
      </div>
    </div>
  );
};

export default LeftToolbar;