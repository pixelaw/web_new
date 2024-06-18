import {useState} from 'react';
import {Bounds, Coordinate, MAX_UINT32, Pixel, PixelStore} from "@/webtools/types.ts";
import {produce} from 'immer';
import GET_PIXELS_QUERY from "@/../graphql/GetPixels.graphql";
import {ApolloClient, InMemoryCache} from "@apollo/client";
import {MAX_VIEW_SIZE} from "@/webtools/utils.ts";
import {usePixelawProvider} from "@/providers/PixelawProvider.tsx";
import {shortString} from "starknet";


type State = { [key: string]: Pixel | undefined };

export function useDojoPixelStore(): PixelStore {
    const {gameData} = usePixelawProvider();
    const [state, setState] = useState<State>({});

    const baseUrl = gameData?.setup.config.toriiUrl

    // Initialize ApolloClient with dynamic baseUrl
    const gqlClient = new ApolloClient({
        uri: `${baseUrl}/graphql`,
        cache: new InMemoryCache(),
        connectToDevTools: false,
    });

    // Kick off data fetching. It will write the retrieved Pixel data to the state by itself, and report errors in console.
    function fetchData(bounds: Bounds): void {
        // eslint-disable-next-line prefer-const
        let [[left, top], [right, bottom]] = bounds

        // Adjust to wrapping
        if (left > MAX_VIEW_SIZE && left > right) right = MAX_UINT32
        if (top > MAX_VIEW_SIZE && top > bottom) bottom = MAX_UINT32
        // console.log("fetchData", left,top,right,bottom )

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
        }).then((data) => {
            data.data.pixelModels.edges.map(({node}: { node: Pixel }) => {
                // Write the retrieved Pixel to state
                // TODO, we may run out of memory in State if the user retrieves too many?
                const pixel: Pixel = {
                    ...node,
                    text: shortString.decodeShortString(node.text),
                    action: shortString.decodeShortString(node.action),
                    timestamp: parseInt(node.timestamp as string, 16),
                }

                setState(produce(draftState => {
                    draftState[`${node.x}_${node.y}`] = pixel;
                }));
            })
        }).catch((e) => {
            console.error("Error retrieving pixels from torii for", bounds, e.message)
        })
    }

    const prepare = ([[left, top], [right, bottom]]: Bounds): void => {

        console.log("prepare")
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

    return {getPixel, setPixel, setPixels, prepare};
}
