import {Coordinate, Dimension} from "./types.ts";
import {ZOOM_FACTOR} from "./components/Viewport/constants.ts";

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

export async function clearIdb() {
    const DB_NAME = 'keyval-store'; // replace with your database name
    const DB_STORE_NAME = 'keyval'; // replace with your store name

    const request = indexedDB.open(DB_NAME);

    request.onsuccess = function(_event) {
        const db = request.result;
        const transaction = db.transaction([DB_STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(DB_STORE_NAME);
        objectStore.clear();
    };
}
export function cellForPosition(zoom: number, pixelOffset: Coordinate, _dimensions: Dimension, position: Coordinate): Coordinate {
    const cellSize = getCellSize(zoom)

    const startDrawingAtX = pixelOffset[0] - cellSize
    // const endDrawingAtX = dimensions.width + pixelOffset[0]

    const startDrawingAtY = pixelOffset[1] - cellSize
    // const endDrawingAtY = dimensions.height + pixelOffset[1]

    const x = Math.floor((position[0] - startDrawingAtX) / cellSize)
    const y = Math.floor((position[1] - startDrawingAtY) / cellSize)

    return [
        x,
        y
    ]
}

export function getCellSize(zoom: number) {
    return zoom / ZOOM_FACTOR
}

export function worldToView(worldTranslation: Coordinate, worldCoord: Coordinate): Coordinate {

    let x = worldCoord[0] + worldTranslation[0]
    let y = worldCoord[1] + worldTranslation[1]

    x = x < 0xFFFFFFFF ? x : x - 0xFFFFFFFF;
    y = y < 0xFFFFFFFF ? y : y - 0xFFFFFFFF;

    return [x, y];
}

export function viewToWorld(worldTranslation: Coordinate, viewportCoord: Coordinate): Coordinate {

    let x = viewportCoord[0] - worldTranslation[0]
    let y = viewportCoord[1] - worldTranslation[1]

    x = x >= 0 ? x : 0xFFFFFFFF + x;
    y = y >= 0 ? y : 0xFFFFFFFF + y;

    return [x, y];
}
