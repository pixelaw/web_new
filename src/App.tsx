import styles from './App.module.css';

import React, {useEffect, useMemo, useState} from "react";
import {Bounds, Coordinate} from "./webtools/types.ts";
import {useSimpleTileStore} from "./webtools/hooks/SimpleTileStore.ts";
import {useDojoPixelStore} from "@/stores/DojoPixelStore.ts";
import {useUpdateService} from "./webtools/hooks/UpdateService.ts";
import Viewport from "./webtools/components/Viewport";
import SimpleColorPicker from "./webtools/components/ColorPicker/SimpleColorPicker.tsx";
import MenuBar from "./components/MenuBar/MenuBar.tsx";
import Apps from "./components/Apps/Apps.tsx";
import {useDojoAppStore} from "./stores/DojoAppStore.ts";
import {Route, Routes, useLocation} from "react-router-dom";
import Loading from "./components/Loading/Loading.tsx";
import {initializeApp} from "./components/App/setup.ts";
import Settings from "./components/Settings/Settings.tsx";
import {usePixelawProvider} from "./providers/PixelawProvider.tsx";

const ZOOM_PRESETS = {tile: 100, pixel: 3100}
const DEFAULT_ZOOM = ZOOM_PRESETS.pixel
const DEFAULT_CENTER: Coordinate = [4294967294, 0]


function App() {
    //<editor-fold desc="State">
    const [viewportZoom, setViewportZoom] = useState<number>(DEFAULT_ZOOM);
    const [center, setCenter] = useState<Coordinate>(DEFAULT_CENTER);
    const [isLoading, setIsLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);

    //</editor-fold>

    //<editor-fold desc="Hooks">
    const updateService = useUpdateService(`ws://localhost:3001/tiles`)  // TODO url configurable
    const pixelStore = useDojoPixelStore("http://localhost:8080");  // TODO url configurable
    const tileStore = useSimpleTileStore("localhost:3001/tiles");   // TODO url configurable
    const location = useLocation();
    const appStore = useDojoAppStore();

    const {clientState, error} = usePixelawProvider();

    //</editor-fold>

    //<editor-fold desc="Handlers">
    function onCenterChange(_newCenter: number[]) {
        // console.log("onCenterChange", _newCenter)
    }

    function onWorldviewChange(newWorldview: Bounds) {
        updateService.setBounds(newWorldview)
        // console.log("onWorldviewChange", newWorldview)
    }

    function onCellHover(coordinate: Coordinate) {
        // console.log("onCellHover", coordinate)
    }

    function onCellClick(coordinate: Coordinate) {
        console.log("onCellClick", coordinate)
    }

    function onColorSelect(color: string) {
        console.log("onColorSelect", color)
    }

    function onZoomChange(newZoom: number) {
        // console.log("onZoomChange", newZoom)
        setViewportZoom(newZoom)
    }

    //</editor-fold>

    // TODO "slide up" the bottom as the zoomlevel increases
    const zoombasedAdjustment = useMemo(() => {
        if (viewportZoom > 3000) {
            return '1rem';
        }
        return '-100%';
    }, [viewportZoom]);

    // // Loading
    // useEffect(() => {
    //     initializeApp(setIsLoading, createClient)
    // }, [location.search]);

    //<editor-fold desc="Output">
    if (clientState === "loading") {
        document.title = "PixeLAW: Loading";
        return <Loading/>;
    }

    if (clientState === "error") {
        document.title = "PixeLAW: Error";
        const errorMessage = `${error}`
        return (
            <div className={styles.errorContainer}>
                <div className={styles.errorMessage}>
                    <h1 className={styles.errorTitle}>
                        Something went wrong
                    </h1>
                    {errorMessage !== '' &&
                        <p className={styles.errorDetail}>
                            {errorMessage}
                        </p>
                    }
                    <p className={styles.errorSuggestion}>
                        Try to refresh this page. If issue still persists, alert the team at Discord.
                    </p>
                </div>
            </div>
        );
    }

    document.title = "PixeLAW: World";

    return (
        <div className={styles.container}>
            <MenuBar/>

            <div className={styles.main}>

                <Routes>
                    <Route path="/settings" element={<Settings/>}/>
                    <Route path="/" element={
                        <>
                            <Viewport
                                tileStore={tileStore}
                                pixelStore={pixelStore}
                                zoom={viewportZoom}
                                center={center}
                                onWorldviewChange={onWorldviewChange}
                                onCenterChange={onCenterChange}
                                onZoomChange={onZoomChange}
                                onCellClick={onCellClick}
                                onCellHover={onCellHover}
                            />
                            <div className={styles.colorpicker} style={{bottom: zoombasedAdjustment}}>
                                <SimpleColorPicker onColorSelect={onColorSelect}/>
                            </div>

                            <div className={styles.apps} style={{right: zoombasedAdjustment}}>
                                <Apps appStore={appStore}/>
                            </div>
                        </>
                    }/>

                </Routes>
            </div>
        </div>
    )
    //</editor-fold>
}


export default App
