import {useEffect, useRef} from "react";
import {create} from 'zustand';
import {useLocation, useNavigate} from 'react-router-dom';
import {Coordinate} from "@/webtools/types.ts";

const ZOOM_PRESETS = {tile: 100, pixel: 3100}
const DEFAULT_ZOOM = ZOOM_PRESETS.pixel
const DEFAULT_CENTER: Coordinate = [4294967194, 0]

interface AppState {
    selectedApp: string;
    center: Coordinate;
    zoom: number;
    selectedColor: string;
    setSelectedApp: (appName: string) => void;
    setCenter: (center: Coordinate) => void;
    setZoom: (zoom: number) => void;
    setSelectedColor: (color: string) => void;
}

export const useViewStateStore = create<AppState>((set) => ({
    selectedApp: '',
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    selectedColor: '#000000',
    setSelectedApp: (appName: string) => set({selectedApp: appName}),
    setCenter: (center: Coordinate) => set({center}),
    setZoom: (zoom: number) => set({zoom}),
    setSelectedColor: (color: string) => set({selectedColor: color}),
}));

export function useSyncedViewStateStore() {

    const location = useLocation();
    const {
        selectedApp,
        setSelectedApp,
        center,
        setCenter,
        zoom,
        setZoom,
        selectedColor,
        setSelectedColor
    } = useViewStateStore();

    const initialLoad = useRef(true);

    useEffect(() => {
        if (initialLoad.current) {
            initialLoad.current = false;
            const queryParams = new URLSearchParams(location.search);
            const appInQuery = queryParams.get('app');
            const centerInQuery = queryParams.get('center')?.split(',').map(Number) as Coordinate;
            const zoomInQuery = Number(queryParams.get('zoom'));
            const colorInQuery = queryParams.get('color');

            if (appInQuery && appInQuery.length > 0) setSelectedApp(appInQuery)
            if (centerInQuery) setCenter(centerInQuery);
            if (zoomInQuery) setZoom(zoomInQuery);
            if (colorInQuery) setSelectedColor(colorInQuery);

        }
    }, []);

    useEffect(() => {
        const updateURL = () => {
            const queryParams = new URLSearchParams();
            queryParams.set('app', selectedApp);
            queryParams.set('center', `${center[0]},${center[1]}`);
            queryParams.set('zoom', zoom.toString());
            queryParams.set('color', selectedColor);
            const newSearch = `?${queryParams.toString()}`;

            if (window.location.search !== newSearch) {
                window.history.replaceState(null, '', newSearch);
            }
        };
        console.log("u", center)
        updateURL();
    }, [selectedApp, center, zoom, selectedColor]);
}
