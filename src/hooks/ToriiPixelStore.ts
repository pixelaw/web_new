import {useState} from 'react';
import {Bounds, Coordinate, Pixel, PixelStore} from "../types.ts";
import {produce} from 'immer';
import GET_PIXELS_QUERY from "../../graphql/GetPixels.graphql";
import {ApolloClient, InMemoryCache} from "@apollo/client";


type State = { [key: string]: Pixel | undefined };


const gqlClient = new ApolloClient({
    uri: 'http://localhost:8080/graphql',
    cache: new InMemoryCache(),
    connectToDevTools: false,
});



export function useToriiPixelStore(): PixelStore {
    const [state, setState] = useState<State>({});

    // Kick off data fetching. It will write the retrieved Pixel data to the state by itself, and report errors in console.
    function fetchData(bounds: Bounds) : void {
        const [[left, top], [right, bottom]] = bounds
        console.log("fetchData", left,top,right,bottom )
        gqlClient.query({
            query: GET_PIXELS_QUERY,
            variables: {
                first: 50000,
                where: {
                    "xGTE": left,
                    "xLTE": right,
                    "yGTE": top,
                    "yLTE": bottom
                }
            }
        }).then((data)=> {
            data.data.pixelModels.edges.map(({node}: {node: Pixel}) => {
                // Write the retrieved Pixel to state
                // TODO, we may run out of memory in State if the user retrieves too many?
                setState(produce(draftState => {
                    draftState[`${node.x}_${node.y}`] = node;
                }));
            })

        }).catch((e) => {
            console.error("Error retrieving pixels from torii for", bounds, e.message )
        })
    }

    const loadPixels = ([[left, top], [right, bottom]]: Bounds): void => {

        console.log("loadPixels")
        // Determine if the coords wrap
        const xWraps = right - left < 0
        const yWraps = bottom - top < 0

        if (xWraps && yWraps) {
            // We need to do 4 queries, each quadrant
            fetchData([[left, top], [0, 0]])  // top-left quad
            fetchData([[left, 0], [0, bottom]])  // bottom-left quad
            fetchData([[0, top], [right, 0]])  // top-right quad
            fetchData([[0, 0], [right, bottom]])  // bottom-right quad
        } else if (xWraps) {
            fetchData([[left, top], [0, bottom]])  // left half
            fetchData([[0, top], [right, bottom]])  // right half
        } else if (yWraps) {
            fetchData([[left, top], [right, 0]])  // top half
            fetchData([[left, 0], [right, bottom]])  // bottom half
        } else {
            fetchData([[left, top], [right, bottom]])  // all
        }
    };

    const getPixel = (coord: Coordinate): Pixel | undefined => {
        const key = `${coord[0]}_${coord[1]}`
        return state[key];
    };

    const setPixel = (key: string, pixel: Pixel): void => {
        setState(produce(draft => {
            draft[key] = pixel;
        }));
    };

    const setPixels = (pixels: { key: string, pixel: Pixel }[]): void => {
        setState(produce(draft => {
            pixels.forEach(({key, pixel}) => {
                draft[key] = pixel;
            });
        }));
    };

    return {getPixel, setPixel, setPixels, loadPixels};
}