
import styles from './App.module.css';

import React, {useEffect, useMemo, useRef, useState} from "react";
import {Bounds, Coordinate} from "./webtools/types.ts";
import {useSimpleTileStore} from "./webtools/hooks/SimpleTileStore.ts";
import {clearIdb} from "./webtools/utils.ts";
import {useToriiPixelStore} from "./webtools/hooks/ToriiPixelStore.ts";
import {useUpdateService} from "./webtools/hooks/UpdateService.ts";
import Viewport from "./webtools/components/Viewport";
import SimpleColorPicker from "./webtools/components/ColorPicker/SimpleColorPicker.tsx";
import MenuBar from "./components/MenuBar.tsx";
import AppsContainer from "./components/AppsContainer.tsx";

const ZOOM_PRESETS = {tile: 100, pixel: 3100}
const DEFAULT_ZOOM = ZOOM_PRESETS.pixel
const DEFAULT_CENTER: Coordinate = [4294967294,0]


function App() {
    const [viewportZoom, setViewportZoom] = useState<number>(DEFAULT_ZOOM);
    const [center, setCenter] = useState<Coordinate>(DEFAULT_CENTER);
    const updateService = useUpdateService(`ws://localhost:3001/tiles`)  // TODO url configurable
    const pixelStore = useToriiPixelStore("http://localhost:8080");  // TODO url configurable
    const tileStore = useSimpleTileStore("localhost:3001/tiles");   // TODO url configurable


    useEffect(() => {
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 1000);
    }, []);

    function onWorldviewChange(newWorldview: Bounds) {
        updateService.setBounds(newWorldview)
        // console.log("onWorldviewChange", newWorldview)
    }

    function onCellClick(coordinate: Coordinate) {
        console.log("onCellClick", coordinate)
    }
    function onColorSelect(color: string) {
        console.log("onColorSelect", color)
    }
    function onZoomChange(newZoom: number) {
        console.log("onZoomChange", newZoom)
        setViewportZoom(newZoom)
    }

    // TODO "slide up" the bottom as the zoomlevel increases
    const colorPickerBottom = useMemo(() => {
        if (viewportZoom > 3000) {
            return '1rem';
        }
        return '-100%';
    }, [viewportZoom]);

    return (
        <div className='bg-bg-primary min-h-screen flex flex-col'>
            <MenuBar/>

            <div className={styles.viewport}>
                <Viewport
                    tileStore={tileStore}
                    pixelStore={pixelStore}
                    zoom={viewportZoom}
                    center={center}
                    onWorldviewChange={onWorldviewChange}
                    onCenterChange={onCenterChange}
                    onZoomChange={onZoomChange}
                    onCellClick={onCellClick}
                />
            </div>

            <div className={styles.colorpicker} style={{bottom: colorPickerBottom}}>
                <SimpleColorPicker onColorSelect={onColorSelect}/>
            </div>

            <div className={styles.apps} style={{right: colorPickerBottom}}>
                <AppsContainer/>
            </div>

        </div>
    )
}


function onCenterChange(_newCenter: number[]) {
    // console.log("onCenterChange", _newCenter)
}

export default App
