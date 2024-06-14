import React from 'react';
import './Palette.css';

const colors = [
  "#FF0000",
  "#FF7F00",
  "#FFFF00",
  "#00FF00",
  "#0000FF",
  "#4B0082",
  "#9400D3",
  "#FFFFFF", // white
  "#000000"  // black
];

const Palette: React.FC = () => {
  return (
    <div className="palette-container">
      <div className="palette-inner">
        {colors.map((color, index) => (
          <button
            key={index}
            style={{ backgroundColor: color }}
            className={`palette-button ${color === '#FFFFFF' ? 'palette-button-white' : ''}`}
            aria-label={`Color ${color}`}
          ></button>
        ))}
      </div>
    </div>
  );
};

export default Palette;
