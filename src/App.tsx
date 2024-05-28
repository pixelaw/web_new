import UPNG from 'upng-js';

import './App.css'
import Viewport, { PixelData} from "./components/Viewport.tsx";
import {useEffect, useState} from "react";

function randomColor(): number{
    // Generate random RGB color
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);

    // Encode RGB color to int
    return (r << 24) + (g << 16) + (b << 8);
}

async function fillPixelData(imageUrl: string, colorMap: Map<string, number>){
    // Fetch PNG file
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();

    // Decode PNG file
    const decodedImage = UPNG.decode(arrayBuffer);
    const rgbaValues: Uint8Array = new Uint8Array(UPNG.toRGBA8(decodedImage)[0]);


    for (let y = 0; y < decodedImage.height; y++) {
        for (let x = 0; x < decodedImage.width; x++) {
            const idx = (decodedImage.width * y + x) << 2;

            // Get RGB color from PNG
            const r = rgbaValues[idx];
            const g = rgbaValues[idx+1];
            const b = rgbaValues[idx+2];
            const a = rgbaValues[idx+3];
            // Encode RGB color to int
            const color = (r << 24) | (g << 16) | (b << 8) | a;

            const key = `${x},${y}`;
            colorMap.set(key, color);
        }
    }
}

function App() {
    const [pixelData, setPixelData] = useState<PixelData>({
        data: new Map(),
        color: new Map()
    });

    useEffect(() => {
        const fetchData = async () => {
            const newColorMap = new Map(pixelData.color);
            await fillPixelData("/kq3.png", newColorMap);
            setPixelData(prevState => ({
                ...prevState,
                color: newColorMap
            }));
        };
        fetchData();
    }, []);

  return (
    <>
        <Viewport
            dimensions={{width: 1000, height: 400}}
            zoom={0.2}
            center={[10,10]}
            pixelData={pixelData}
            onWorldviewChange={onWorldviewChange}
            onCenterChange={onCenterChange}
        />
    </>
  )
}

function onWorldviewChange (newWorldview: number[][]){
    console.log("onWorldviewChange", newWorldview)
}
function onCenterChange (newCenter: number[]){
    console.log("onCenterChange", newCenter)

}

export default App
