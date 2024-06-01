import { useState } from 'react';
import {Pixel, PixelStore} from "../types.ts";
import {produce} from 'immer';

type State = { [key: string]: Pixel };

export function useSimplePixelStore(): PixelStore {
    const [state, setState] = useState<State>({});

    const getPixel = (key: string): Pixel | undefined => {
        return state[key];
    };

    const setPixel = (key: string, pixel: Pixel): void => {
        setState(produce(draft => {
            draft[key] = pixel;
        }));
    };

    const setPixels = (pixels: { key: string, pixel: Pixel }[]): void => {
        setState(produce(draft => {
            pixels.forEach(({ key, pixel }) => {
                draft[key] = pixel;
            });
        }));
    };

    return { getPixel, setPixel, setPixels };
}
