import {useState, useEffect, useRef} from 'react';
import { Tile } from "../types.ts";
import {set as setIdb, get as getIdb, keys} from 'idb-keyval';

type State = { [key: string]: HTMLImageElement | undefined };


export function useSimpleTileStore() {
    const [state, setState] = useState<State>({});
    const tilesLoadedRef = useRef(false); // Add this line

    useEffect(() => {
        if (tilesLoadedRef.current) return
        (async () => {
            const keysArray = await keys();
            const tilesObj:Record<string, Tile | undefined> = {};
            for (const key of keysArray) {
                if (typeof key === 'string') {
                    const base64 = await getIdb(key)
                    tilesObj[key] = await loadImage(base64);
                }
            }
            setState(tilesObj);
            tilesLoadedRef.current = true
        })();
    }, []);

    const getTile = (key: string): Tile | undefined => {
        if (!state[key]) {

            fetchImage(`${key}.png`).then(async base64Img => {
                await setIdb(key, base64Img);
                const img = await loadImage(base64Img);
                setState(prevState => ({ ...prevState, [key]: img }));

            }).catch(e => {
                console.error('Error loading image:', e);
            });
        }
        return state[key];
    };

    const setTile = async (key: string, tile: Tile): Promise<void> => {
        await setIdb(key, tile);
        setState({ ...state, [key]: tile });
    };

    const setTiles = async (tiles: { key: string, tile: Tile }[]): Promise<void> => {
        const newTiles = { ...state };
        for (const { key, tile } of tiles) {
            await setIdb(key, tile);
            newTiles[key] = tile;
        }
        setState(newTiles);
    };

    return { getTile, setTile, setTiles };
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