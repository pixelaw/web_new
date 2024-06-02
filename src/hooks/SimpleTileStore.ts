import {produce} from 'immer';
import {useState, useEffect, useRef} from 'react';
import {Bounds, MAX_UINT32, Tile, Tileset, TileStore} from "../types.ts";
import {set as setIdb, get as getIdb, keys} from 'idb-keyval';

type State = { [key: string]: HTMLImageElement | undefined | null };

const TILESIZE = 100


export function useSimpleTileStore(): TileStore {
    const [state, setState] = useState<State>({});
    const tilesLoadedRef = useRef(false); // Add this line
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        if (tilesLoadedRef.current) return

        (async () => {
            setIsLoading(true);
            const keysArray = await keys();
            const tilesObj: Record<string, Tile | undefined> = {};
            for (const key of keysArray) {
                if (typeof key === 'string') {
                    try {
                        const base64 = await getIdb(key)
                        if(base64.length == 0) continue
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
        // console.log("getTileset", scaleFactor, topLeft, bottomRight)


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

        // TODO check if this works with negative change
        function changeWrapped(nr: number, change: number){
            nr >>>= 0;
            let result=((nr >>> 0) + change) >>> 0
            if(nr > result){
                result -= result % tileWorldSize
            }
            return result
        }

        function distance(begin: number, end: number): number{
            return end >= begin
                ? end - begin // not wrapping
                : MAX_UINT32 - begin + end // wrapping
        }

        const width = distance(leftTileCoord, rightTileCoord)
        const height = distance(topTileCoord, bottomTileCoord)

        for (let x = 0; x <= width; x += tileWorldSize) {
            let tileRow: (Tile | undefined | null)[] = []
            for (let y = 0; y <= height; y+=tileWorldSize) {

                const tileX = changeWrapped(leftTileCoord , x);
                const tileY = changeWrapped(topTileCoord, y);
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

    const getTile = (key: string): Tile | undefined | null => {

        if (state[key] === undefined) {

            setState(produce(draftState => {
                draftState[key] = null;
            }));

            fetchImage(`http://localhost:3000/tiles/${key}.png`).then(async base64Img => {
                await setIdb(key, base64Img);
                const img = await loadImage(base64Img);

                // Cannot use immer here because it won't work with HTMLImageElement, which is a read-only type
                setState(prevState => ({...prevState, [key]: img}));

            }).catch(_e => {
                setIdb(key, "").then(() => {
                    setState(produce(draftState => {
                        draftState[key] = null;
                    }));
                });
                // console.info('Error loading image:', key, e);
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
