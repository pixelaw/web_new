import {useState, useEffect, useRef} from 'react';
import {Bounds, MAX_UINT32, Tile, Tileset, TileStore} from "../types.ts";
import {set as setIdb, get as getIdb, keys} from 'idb-keyval';

type State = { [key: string]: HTMLImageElement | undefined };

const TILESIZE = 100

function createPlaceholder(){
    const result = new Image();
    result.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXYzh8+PB/AAffA0nNPuCLAAAAAElFTkSuQmCC';
    result.width = TILESIZE
    result.height = TILESIZE
    return result
}

export function useSimpleTileStore(): TileStore {
    const [state, setState] = useState<State>({});
    const tilesLoadedRef = useRef(false); // Add this line
    const placeholder = useRef<HTMLImageElement | undefined>(undefined); // Add this line
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        if (tilesLoadedRef.current) return

        placeholder.current = createPlaceholder(); // Assign the created image to the ref

        (async () => {
            setIsLoading(true);
            const keysArray = await keys();
            const tilesObj: Record<string, Tile | undefined> = {};
            for (const key of keysArray) {
                console.log("loading keys from idb: ", key)
                if (typeof key === 'string') {
                    try {
                        const base64 = await getIdb(key)
                        tilesObj[key] = await loadImage(base64);
                    } catch (e) {
                        console.log("Error loading", key, e)
                    }
                }
            }
            setState(tilesObj);
            tilesLoadedRef.current = true
            setIsLoading(false);
        })();
    }, []);


    const getTileset = (scaleFactor: number, bounds: Bounds): Tileset | undefined => {
        const [topLeft, bottomRight] = bounds
        if(isLoading) return
        console.log("getTileset", scaleFactor, topLeft, bottomRight)


        // Choose the tileset Scalefactor based on what's requested
        let tileScaleFactor = scaleFactor < 10 ? 1 : 10

        // Determine the world coordinate size of each tile
        // Example, when tilesize is 100 and tileScaleFactor is 10, there will be 1000 world coordinates in one tile's width/height
        // and, when tilesize is 100 and tileScaleFactor is 1, there will be 100 world coordinates in one tile's width/height
        const tileWorldSize = TILESIZE * tileScaleFactor

        // snap the left/top borders to tilesizes to find the tile names
        // Simple example: if requested left world coord is 523 and tileWorldsize is 100, we "snap" to 500
        const [left, top] = topLeft
        const leftTileCoord = left - (left % tileWorldSize)
        const topTileCoord = top - (top % tileWorldSize)

        const [right, bottom] = bottomRight
        const rightTileCoord = right + (tileWorldSize - right % tileWorldSize)
        const bottomTileCoord = bottom + (tileWorldSize - bottom % tileWorldSize)

        const tileBounds: Bounds = [[leftTileCoord, topTileCoord], [rightTileCoord, bottomTileCoord]]

        let tileRows = []
        function incrementWrapped(nr: number, increment: number){
            let result = nr + increment
            if(result > MAX_UINT32) return (result % (MAX_UINT32 + 1))
            else return result
        }
        function distance(left: number, right: number): number{
            return right >= left
                ? right - left // not wrapping
                : MAX_UINT32 - left + right // wrapping
        }

        const width = distance(leftTileCoord, rightTileCoord)
        const height = distance(topTileCoord, bottomTileCoord)

        for (let x = 0; x <= width; x += tileWorldSize) {
            let tileRow: (Tile | undefined)[] = []
            for (let y = 0; y <= height; y+=tileWorldSize) {
                const tileX = incrementWrapped(leftTileCoord , x);
                const tileY = incrementWrapped(topTileCoord, y);
                tileRow.push(
                    getTile(`${tileScaleFactor}_${TILESIZE}_${tileX}_${tileY}`)
                )
            }
            tileRows.push(tileRow)
        }

        return {
            tileSize: TILESIZE,
            bounds: tileBounds,
            scaleFactor: tileScaleFactor,
            tileRows
        }
    };

    const getTile = (key: string): Tile | undefined => {

        if (!state[key]) {

            // TODO performance can be improved by using immer or something
            setState(prevState => ({...prevState, [key]: placeholder.current}));
            fetchImage(`http://localhost:3000/tiles/${key}.png`).then(async base64Img => {
                await setIdb(key, base64Img);
                const img = await loadImage(base64Img);

                setState(prevState => ({...prevState, [key]: img}));

            }).catch(e => {
                console.error('Error loading image:', e);
            });
        }
        return state[key];
    };

    const setTile = async (key: string, tile: Tile): Promise<void> => {
        await setIdb(key, tile);
        setState({...state, [key]: tile});
    };

    const setTiles = async (tiles: { key: string, tile: Tile }[]): Promise<void> => {
        const newTiles = {...state};
        for (const {key, tile} of tiles) {
            await setIdb(key, tile);
            newTiles[key] = tile;
        }
        setState(newTiles);
    };

    return {getTile, setTile, setTiles, getTileset};
}

const loadImage = (base64: string): Promise<HTMLImageElement> => {

    return new Promise((resolve, reject) => {
        let img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = base64;
    });
};

const fetchImage = async (src: string): Promise<string> => {
    const response = await fetch(src);

    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};
