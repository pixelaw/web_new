export type Pixel = {
    action: string
    color: number
    owner: string
    text: string
    timestamp: string
    x: number
    y: number
}

export type Tile = HTMLImageElement

export interface PixelStore  {
    getPixel: (coordinate: Coordinate) => Pixel | undefined;
    loadPixels: (bounds: Bounds) => void;
    setPixel: (key: string, pixel: Pixel) => void;
    setPixels: (pixels: {key: string, pixel: Pixel}[]) => void;
}

export interface TileStore {
    getTile: (key: string) => Tile | undefined | "";
    setTile: (key: string, tile: Tile) => Promise<void>;
    setBaseURL: (value: string) => void;
    setTiles: (tiles: { key: string, tile: Tile }[]) => Promise<void>;
    getTileset : (scaleFactor:number, bounds: Bounds, isDragging: boolean) => Tileset | undefined;
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
