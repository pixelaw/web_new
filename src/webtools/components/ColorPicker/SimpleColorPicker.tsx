import {ColorPickerProps} from "../../types.ts";
import './SimpleColorPicker.css';

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
    return (
        <div className="palette-container">
            <div className="palette-inner">
                {colors.map((color, index) => (
                    <button
                        key={index}
                        style={{ backgroundColor: color }}
                        className={`palette-button ${color === '#FFFFFF' ? 'palette-button-white' : ''}`}
                        aria-label={`Color ${color}`}
                        onClick={() => onColorSelect(color)}
                    ></button>
                ))}
            </div>
        </div>
    );
};

export default SimpleColorPicker;
