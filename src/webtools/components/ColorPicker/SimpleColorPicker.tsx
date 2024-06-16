import React, { useState } from "react";
import { ColorPickerProps } from "../../types.ts";
import styles from './SimpleColorPicker.module.css';

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

const SimpleColorPicker: React.FC<ColorPickerProps> = ({ onColorSelect }) => {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    onColorSelect(color);
  };

  return (
    <div className={styles.inner}>
      {colors.map((color, index) => (
        <button
          key={index}
          style={{ backgroundColor: color }}
          className={`${styles.button} ${color === '#FFFFFF' ? styles['button-white'] : ''} ${color === selectedColor ? styles.selected : ''}`}
          aria-label={`Color ${color}`}
          onClick={() => handleColorSelect(color)}
        >
          <span className={styles.label}>
            {index === 0 ? 'New' : index === 8 ? 'Old' : ''}
          </span>
        </button>
      ))}
    </div>
  );
};

export default SimpleColorPicker;
