import React from "react";
import "./CreateSpace.css";
import { FaArrowRight } from "react-icons/fa";

const CreateSpace = ({
  mode = "create", // default mode
  space = {},
  name,
  setName,
  desc,
  setDesc,
  handleCreate,
  setShowModal,
  onEnterSpace // new function for "Enter"
}) => {
  const isViewMode = mode === "view";

  return (
    <div className="modal-overlay">
      <div className="modal modal-large">
        <button className="modal-close-btn" onClick={() => setShowModal(false)}>
          <FaArrowRight />
        </button>
        <div className="modal-left">
          <img src="home_bg.gif" alt="Space Creation" className="modal-gif" />
        </div>
        <div className="modal-right">
          <h2>{isViewMode ? "Enter Space" : "Create Space"}</h2>

          <input
            type="text"
            placeholder="Enter space name"
            value={isViewMode ? space.name : name}
            onChange={(e) => !isViewMode && setName(e.target.value)}
            className="modal-input"
            disabled={isViewMode}
          />
          <textarea
            placeholder="Enter description..."
            value={isViewMode ? space.description : desc}
            onChange={(e) => !isViewMode && setDesc(e.target.value)}
            className="modal-textarea"
            disabled={isViewMode}
          />

          <div className="modal-buttons">
            {isViewMode ? (
              <button onClick={() => onEnterSpace(space)} className="create-btn">
                <img src="icon4.gif" alt="Enter Icon" className="logout-icon-1" />
                Enter
              </button>
            ) : (
              <button onClick={handleCreate} className="create-btn">
                <img src="icon5.gif" alt="Boom Icon" className="logout-icon-1" />
                Boom
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSpace;
