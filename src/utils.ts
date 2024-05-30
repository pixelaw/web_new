export function randomColor(): number{
    // Generate random RGB color
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);

    // Encode RGB color to int
    return (r << 24) + (g << 16) + (b << 8);
}

export const numRGBAToHex = (rgba: number | undefined) => {
    if(rgba==undefined) return "#0000EE"    // TODO Maybe return default color?
    let color = rgba >>> 8
    return '#' + (color).toString(16).padStart(6, "0")
}
