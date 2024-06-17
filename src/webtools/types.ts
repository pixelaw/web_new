export type Pixel = {
    action: string
    color: number
    owner: string
    text: string
    timestamp: string
    x: number
    y: number
}

export type App = {
    "system": string,
    "name": string,
    "manifest": string,
    "icon": string,
    "action": string,
    "entity": {
        "id": string
    }
}

export type Tile = HTMLImageElement

export type TileChangedMessage = {
    tileName: string, timestamp: number
}

export interface UpdateService {
    isReady: boolean
    tileChanged: TileChangedMessage | null
    setBounds: (newBounds: Bounds) => void
}

export interface PixelStore {
    getPixel: (coordinate: Coordinate) => Pixel | undefined;
    prepare: (bounds: Bounds) => void;
    setPixel: (key: string, pixel: Pixel) => void;
    setPixels: (pixels: { key: string, pixel: Pixel }[]) => void;
}

export interface AppStore {
    getByName: (name: string) => App | undefined;
    getAll: () => App[]
    prepare: () => void;
}

export interface TileStore {
    prepare: (bounds: Bounds) => void;
    getTile: (key: string) => Tile | undefined | "";
    setTile: (key: string, tile: Tile) => Promise<void>;
    setTiles: (tiles: { key: string, tile: Tile }[]) => Promise<void>;
    getTileset: (scaleFactor: number, bounds: Bounds) => Tileset | undefined;
}

export interface Tileset {
    tileSize: number,
    scaleFactor: number,
    bounds: Bounds,
    tileRows: (Tile | undefined | "")[][]
}

export type Dimension = [width: number, height: number];
export type Coordinate = [number, number];
export type Bounds = [topLeft: Coordinate, bottomRight: Coordinate];

export const MAX_UINT32: number = 4_294_967_295

export interface ColorPickerProps {
    onColorSelect: (color: string) => void; // Callback function to return the selected color
}