import React, { useState } from "react";
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
  onEnterSpace 
}) => {
  const isViewMode = mode === "view";

  const mapOptions = [
    {
      id: "office",
      name: "Office Space",
      image: "/maps/map_office.png", 
      description: "Your key to navigating the daily grind from the coffee nexus to collab zones."
    },
    {
      id: "spacestation",
      name: "Space-Station",
      image: "/maps/spacestation.png",
      description: "Chart your course through Aetheria Station's celestial sprawl."
    }
  ];

   const [selectedMap, setSelectedMap] = useState(isViewMode ? space.mapKey || mapOptions[0].id : mapOptions[0].id);


  const handleMapSelect = (mapId) => {
    if (!isViewMode) {
      setSelectedMap(mapId);
    }
  };

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

            <div className="map-selection">
            <h3 className="map-title">{isViewMode ? "Your World" : "Choose Your World"}</h3>
            <div className={`map-options ${isViewMode ? 'view-mode' : ''}`}>
              {mapOptions
                .filter(map => isViewMode ? map.id === selectedMap : true)
                .map((map) => (
                <div
                  key={map.id}
                  className={`map-option ${selectedMap === map.id ? 'selected' : ''} ${isViewMode ? 'disabled' : ''}`}
                  onClick={() => handleMapSelect(map.id)}
                >
                  <div className="map-image-container">
                    <img src={map.image} alt={map.name} className="map-image" />
                    <div className="map-overlay">
                      <div className="map-name">{map.name}</div>
                      <div className="map-description">{map.description}</div>
                    </div>
                  </div>
                  {selectedMap === map.id && (
                    <div className="selected-indicator">
                      <div className="selected-dot"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="modal-buttons">
            {isViewMode ? (
              <button
                onClick={() => onEnterSpace(space)}
                className="create-btn"
              >
                <img
                  src="icon4.gif"
                  alt="Enter Icon"
                  className="logout-icon-1"
                />
                Enter
              </button>
            ) : (
              <button
                onClick={() => handleCreate({ selectedMap })}
                className="create-btn"
              >
                <img
                  src="icon5.gif"
                  alt="Boom Icon"
                  className="logout-icon-1"
                />
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