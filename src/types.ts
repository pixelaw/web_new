export type Pixel = {
    id: string
    color: number
    text: string
    owner: string
    action: string
}

export type Tile = HTMLImageElement

export interface PixelStore  {
    pixels: { [key: string]: Pixel };
    getPixel: (key: string) => Pixel | undefined;
    setPixel: (key: string, pixel: Pixel) => void;
    setPixels: (pixels: {key: string, pixel: Pixel}[]) => void;
};

export interface TileStore {
    tiles: { [key: string]: Tile };
    getTile: (key: string) => Promise<Tile | undefined>;
};
