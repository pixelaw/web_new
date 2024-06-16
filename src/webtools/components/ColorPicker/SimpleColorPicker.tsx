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
    return (
        <div className={styles.inner}>
            {colors.map((color, index) => (
                <button
                    key={index}
                    style={{ backgroundColor: color }}
                    className={`${styles.button} ${color === '#FFFFFF' ? styles['button-white'] : ''}`}
                    aria-label={`Color ${color}`}
                    onClick={() => onColorSelect(color)}
                >
                    <span className={styles.number}>{index + 1}</span>
                </button>
            ))}
        </div>
    );
};

export default SimpleColorPicker;
