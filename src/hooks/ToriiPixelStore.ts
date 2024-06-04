import { useState } from 'react';
import {Bounds, Pixel, PixelStore} from "../types.ts";
import {produce} from 'immer';
import GET_PIXELS_QUERY from "../../graphql/GetPixels.graphql";
import {ApolloClient, InMemoryCache, useQuery} from "@apollo/client";

type State = { [key: string]: Pixel };


const gqlClient = new ApolloClient({
    uri: 'http://localhost:8080/graphql',
    cache: new InMemoryCache()
});

async function fetchData([[left, top],[right, bottom]]: Bounds) {
    const { data } = await gqlClient.query(GET_PIXELS_QUERY, params)
}

export function useToriiPixelStore(): PixelStore {
    const [state, setState] = useState<State>({});



    const loadPixels = ([[left, top],[right, bottom]]: Bounds): void => {

        // Determine if the coords wrap
        const xWraps = right - left < 0
        const yWraps = bottom - top < 0

        if(xWraps && yWraps){
            // We need to do 4 queries, each quadrant
            fetchData([[left, top],[0,0]])  // top-left quad
            fetchData([[left, 0],[0,bottom]])  // bottom-left quad
            fetchData([[0, top],[right,0]])  // top-right quad
            fetchData([[0, 0],[right,bottom]])  // bottom-right quad
        }else if(xWraps){
            fetchData([[left, top],[0,bottom]])  // left half
            fetchData([[0, top],[right,bottom]])  // right half
        }else if(yWraps){
            fetchData([[left, top],[right,0]])  // top half
            fetchData([[left, 0],[right,bottom]])  // bottom half
        }else{
            fetchData([[left, top],[right,bottom]])  // all
        }

        const where = {
            "xGTE": 0,
            "xLTE": 100,
            "yGTE": 0,
            "yLTE": 100
        }

        const {loading, error, data} = useQuery(GET_PIXELS_QUERY, {
            variables: {first: 0, where, order: {}},
        });
    };

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

    return { getPixel, setPixel, setPixels, loadPixels };
}
