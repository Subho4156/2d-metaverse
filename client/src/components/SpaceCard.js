import React, { useMemo } from "react";
import "./SpaceCard.css";
import { FaArrowRight } from "react-icons/fa";
// src/utils/gifList.js
const gifs = [
  "space1.gif",
  "space2.gif",
  "space3.gif",
  "space4.gif",
  "space5.gif",
];

const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};


const SpaceCard = ({ space , onClick }) => {
   const gifIndex = hashString(space._id) % gifs.length;
   const bgGif = gifs[gifIndex];

  return (
    <div className="space-card" onClick= {onClick}>
      <img src={bgGif} alt="Space Background" className="space-bg" />
      <div className="space-overlay">
        <div className="space-title">{space.name}</div>
        <button className="enter-btn">
          Enter <FaArrowRight />
        </button>
      </div>
    </div>
  );
};

export default SpaceCard;
