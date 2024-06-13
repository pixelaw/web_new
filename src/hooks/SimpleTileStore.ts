import {produce} from 'immer';
import {useState, useEffect, useRef} from 'react';
import {Bounds, MAX_UINT32, Tile, Tileset, TileStore} from "../types.ts";
import {set as setIdb, get as getIdb, keys} from 'idb-keyval';
import {getWrappedTileCoordinate} from "../utils.ts";

type State = { [key: string]: HTMLImageElement | undefined | "" };

const TILESIZE = 100

export function useSimpleTileStore(baseUrl: string): TileStore {
    const [state, setState] = useState<State>({});
    const tilesLoadedRef = useRef(false); // Add this line
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const fetchCounter = useRef(0);


    const getImage = (key: string) => {
        fetchCounter.current++

        fetchImage(`${window.location.protocol}//${baseUrl}/${key}.png`).then(async base64Img => {
            await setIdb(key, base64Img);
            const img = await loadImage(base64Img);

            // Cannot use immer here because it won't work with HTMLImageElement, which is a read-only type
            setState(prevState => ({...prevState, [key]: img}));
            fetchCounter.current--
            console.log("setState to img")

        }).catch(e => {
            setIdb(key, "").then(() => {
                setState(produce(draftState => {
                    draftState[key] = "";
                }));
                // console.log("setState to ''")
                fetchCounter.current--

            });
            console.info('Error loading image:', key, e);
        });
    }

    useEffect(() => {
        if (tilesLoadedRef.current  ) return

        async function loadFromIdb() {
            setIsLoading(true);
            const keysArray = await keys();
            const tilesObj: Record<string, Tile | undefined | ""> = {};
            // console.log("loading keys", keysArray.length)
            for (const key of keysArray) {
                if (typeof key === 'string') {
                    try {
                        const base64 = await getIdb(key)
                        if(base64.length == 0){
                            tilesObj[key] = ""
                        }else{
                            tilesObj[key] = await loadImage(base64)
                        }

                    } catch (e) {
                        console.log("Error loading", key, e)
                    }
                }
            }
            setState(tilesObj);
            tilesLoadedRef.current = true
            setIsLoading(false);
        }

        loadFromIdb()

    }, []);

    const getTileset = (scaleFactor: number, bounds: Bounds): Tileset | undefined => {

        const [topLeft, bottomRight] = bounds
        if(fetchCounter.current > 0) {
            console.log("skipRender")
            return
        }
        console.debug("getTileset", scaleFactor, JSON.stringify(bounds))
        if(isLoading) return



        // Choose the tileset Scalefactor based on what's requested
        // TODO handle scalefactor 10 later
        const tileScaleFactor = 1 //scaleFactor <= 10 ? 1 : 10

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

        const tileRows = []

        function distance(begin: number, end: number): number{
            return end >= begin
                ? end - begin // not wrapping
                : MAX_UINT32 - begin + end // wrapping
        }

        const width = distance(leftTileCoord, rightTileCoord)
        const height = distance(topTileCoord, bottomTileCoord)

        for (let x = 0; x <= width; x += tileWorldSize) {
            const tileRow: (Tile | undefined | "")[] = []
            for (let y = 0; y <= height; y+=tileWorldSize) {

                const tileX = getWrappedTileCoordinate(leftTileCoord , x, tileWorldSize);
                const tileY = getWrappedTileCoordinate(topTileCoord, y, tileWorldSize);
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

    const getTile = (key: string): Tile | undefined | "" => {

        if (state[key] === undefined) {

            setState(produce(draftState => {
                draftState[key] = "";
            }));
            console.log("setState to ''")

            getImage(key)

        }
        return state[key];
    };

    const setTile = async (key: string, tile: Tile | undefined): Promise<void> => {
        console.log("setTile")
        await setIdb(key, tile);
        setState({...state, [key]: tile});

        getImage(key)
        console.log("setState to tile")

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
        const img = new Image();
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
