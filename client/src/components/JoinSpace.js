import React, { useState } from "react";
import { FaTimes, FaArrowRight } from "react-icons/fa";
import "./JoinSpace.css";

const JoinSpace = ({ setShowJoinModal, onJoinSpace }) => {
  const [spaceId, setSpaceId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    if (!spaceId.trim()) return;
    
    setIsLoading(true);
    try {
      // You can add validation here if needed
      // For now, directly navigate to the space
      onJoinSpace(spaceId.trim());
      setShowJoinModal(false);
    } catch (err) {
      console.error("Failed to join space:", err);
      // You can add error handling here
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleJoin();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="modal-title">Join Space</h2>
          <button
            onClick={() => setShowJoinModal(false)}
            className="modal-close-button"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="modal-content">
          <div className="space-form">
            <div className="form-group">
              <label htmlFor="spaceId" className="form-label">
                Space ID
              </label>
              <input
                id="spaceId"
                type="text"
                value={spaceId}
                onChange={(e) => setSpaceId(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter the space ID to join"
                className="form-input"
                autoFocus
              />
              <p className="form-helper-text">
                Paste the space ID shared with you to join the space
              </p>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            onClick={() => setShowJoinModal(false)}
            className="modal-cancel-button"
          >
            Cancel
          </button>
          <button
            onClick={handleJoin}
            disabled={!spaceId.trim() || isLoading}
            className="modal-action-button"
          >
            {isLoading ? (
              "Joining..."
            ) : (
              <>
                Join Space
                <FaArrowRight style={{ marginLeft: "8px" }} size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinSpace;