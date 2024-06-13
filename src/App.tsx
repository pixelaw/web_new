
import './App.css'
import Index from "./components/Viewport";
import {useEffect, useState} from "react";
import {Bounds, Coordinate, Dimension} from "./types.ts";
import {useSimpleTileStore} from "./hooks/SimpleTileStore.ts";
import {clearIdb} from "./utils.ts";
import {useToriiPixelStore} from "./hooks/ToriiPixelStore.ts";

import {useUpdateService} from "./hooks/UpdateService.ts";

const ZOOM_PRESETS = {tile: 100, pixel: 3000}


const DEFAULT_ZOOM = ZOOM_PRESETS.tile

const DEFAULT_CENTER: Coordinate = [4294967294,0]
const DEFAULT_DIMENSIONS: Dimension =  [300, 300]


function App() {
    const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM);
    const [center, setCenter] = useState<Coordinate>(DEFAULT_CENTER);
    const updateService = useUpdateService(`ws://localhost:3001/tiles`)  // TODO url configurable
    const pixelStore = useToriiPixelStore("http://localhost:8080");  // TODO url configurable
    const tileStore = useSimpleTileStore("localhost:3001/tiles");   // TODO url configurable

    const resetViewport = () => {
        setZoom(DEFAULT_ZOOM);
        setCenter(DEFAULT_CENTER);
    };

    const centerUp = () => {
        setCenter([center[0], center[1]+1000]);
    };

    useEffect(() => {
        console.log("App rerender")


    }, []);

    function onWorldviewChange(newWorldview: Bounds) {
        updateService.setBounds(newWorldview)
        // console.log("onWorldviewChange", newWorldview)
    }

    function onCellClick(coordinate: Coordinate) {
        console.log("onCellClick", coordinate)
    }

    return (
        <>
            <button onClick={centerUp}>centerUp</button>
            <button onClick={resetViewport}>reset</button>
            <button onClick={clearIdb}>Clear IndexedDB</button>
            <Index
                tileStore={tileStore}
                pixelStore={pixelStore}
                dimensions={DEFAULT_DIMENSIONS}
                zoom={zoom}
                center={center}
                onWorldviewChange={onWorldviewChange}
                onCenterChange={onCenterChange}
                onZoomChange={onZoomChange}
                onCellClick={onCellClick}
            />
        </>
    )
}



function onZoomChange(_newZoom: number) {
    // console.log("onZoomChange", _newZoom)
}



function onCenterChange(_newCenter: number[]) {
    // console.log("onCenterChange", _newCenter)

}

export default App
