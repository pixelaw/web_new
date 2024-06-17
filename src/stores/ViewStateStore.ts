import {useEffect} from "react";
import {create} from 'zustand';
import {useLocation, useNavigate} from 'react-router-dom';
import {Coordinate} from "@/webtools/types.ts";

const ZOOM_PRESETS = {tile: 100, pixel: 3100}
const DEFAULT_ZOOM = ZOOM_PRESETS.pixel
const DEFAULT_CENTER: Coordinate = [4294967294, 0]

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
    const navigate = useNavigate();
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

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const appInQuery = queryParams.get('app');
        const centerInQuery = queryParams.get('center')?.split(',').map(Number) as Coordinate;
        const zoomInQuery = Number(queryParams.get('zoom'));
        const colorInQuery = queryParams.get('color');

        let shouldUpdateURL = false;

        if (appInQuery !== selectedApp) {
            queryParams.set('app', selectedApp);
            shouldUpdateURL = true;
        }

        if (!centerInQuery || centerInQuery[0] !== center[0] || centerInQuery[1] !== center[1]) {
            queryParams.set('center', `${center[0]},${center[1]}`);
            shouldUpdateURL = true;
        }

        if (zoomInQuery !== zoom) {
            queryParams.set('zoom', zoom.toString());
            shouldUpdateURL = true;
        }

        if (colorInQuery !== selectedColor) {
            queryParams.set('color', selectedColor);
            shouldUpdateURL = true;
        }

        if (shouldUpdateURL) {
            navigate(`?${queryParams.toString()}`, {replace: true});
        }
    }, [selectedApp, center, zoom, selectedColor, navigate]);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const appInQuery = queryParams.get('app');
        const centerInQuery = queryParams.get('center')?.split(',').map(Number) as Coordinate;
        const zoomInQuery = Number(queryParams.get('zoom'));
        const colorInQuery = queryParams.get('color');

        if (appInQuery && appInQuery !== selectedApp) {
            setSelectedApp(appInQuery);
        }

        if (centerInQuery && (centerInQuery[0] !== center[0] || centerInQuery[1] !== center[1])) {
            setCenter(centerInQuery);
        }

        if (!isNaN(zoomInQuery) && zoomInQuery !== zoom) {
            setZoom(zoomInQuery);
        }

        if (colorInQuery && colorInQuery !== selectedColor) {
            setSelectedColor(colorInQuery);
        }
    }, [location.search, setSelectedApp, setCenter, setZoom, setSelectedColor, selectedApp, center, zoom, selectedColor]);
}
