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

export interface ColorPickerProps {
    onColorSelect: (color: string) => void;
    color: string;
}

const SimpleColorPicker: React.FC<ColorPickerProps> = ({onColorSelect, color: selectedColor}) => {
    return (
        <div className={styles.inner}>
            {colors.map((color, index) => (
                <button
                    key={index}
                    style={{backgroundColor: color, outline: selectedColor === color ? '4px solid black' : 'none'}}
                    className={`${styles.button} ${color === '#FFFFFF' ? styles['button-white'] : ''}`}
                    aria-label={`Color ${color}`}
                    onClick={() => onColorSelect(color)}
                ></button>
            ))}
        </div>
    );
};

export default SimpleColorPicker;
