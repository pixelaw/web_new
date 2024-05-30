import React, {useRef, useEffect, useState} from 'react';
import {numRGBAToHex} from '../utils.ts'
import {Pixel, Tile} from "../types.ts";

export type Dimensions = {
    width: number;
    height: number;
};

interface ViewportProps {
    getTile: (key: string) => HTMLImageElement | undefined;
    getPixel: (key: string) => Pixel | undefined;
    dimensions: Dimensions;
    zoom: number;
    center: number[];
    onCenterChange: (newCenter: number[]) => void;
    onWorldviewChange: (newWorldview: number[][]) => void;
}

function getCellSize(dimensions: Dimensions, zoom: number) {
    return dimensions.width > dimensions.height
        ? zoom == 0 ? 1 : dimensions.height * (zoom / 100)
        : zoom == 0 ? 1 : dimensions.width * (zoom / 100)

}

function drawOutline(context:CanvasRenderingContext2D, dimensions:Dimensions) {
    // Draw outline
    context.beginPath();
    context.rect(0, 0, dimensions.width, dimensions.height);
    context.lineWidth = 2;
    context.strokeStyle = 'black';
    context.stroke();
}

function cellForPosition(zoom: number, pixelOffset: number[], dimensions: Dimensions, position: number[]): number[] {
    const cellSize = getCellSize(dimensions, zoom)

    const startDrawingAtX = pixelOffset[0] - cellSize
    // const endDrawingAtX = dimensions.width + pixelOffset[0]

    const startDrawingAtY = pixelOffset[1] - cellSize
    // const endDrawingAtY = dimensions.height + pixelOffset[1]

    const x = Math.floor((position[0] - startDrawingAtX) / cellSize)
    const y = Math.floor((position[1] - startDrawingAtY) / cellSize)

    return [
        x,
        y
    ]
}

async function drawTiles(
    context: CanvasRenderingContext2D,
    zoom: number,
    pixelOffset: number[],
    dimensions: Dimensions,
    worldTranslation: number[],
    getTile: (key: string) => Tile | undefined
) {
    const img = getTile("0_0")
    if(!img) return

    context.drawImage(img,0,0,400, 400)
}

function drawPixels(
    context: CanvasRenderingContext2D,
    zoom: number,
    pixelOffset: number[],
    dimensions: Dimensions,
    worldTranslation: number[],
    hoveredCell: number[] | undefined,
    getPixel: (key: string) => Pixel | undefined
) {
    const cellSize = getCellSize(dimensions, zoom)

    const gridDimensions = [
        Math.ceil(dimensions.width / cellSize),
        Math.ceil(dimensions.height / cellSize)
    ]
    context.beginPath();
    const doBorder = zoom > 2 ? 1 : 0

    for (let x = 0; x <= gridDimensions[0]; x++) {
        for (let y = 0; y <= gridDimensions[1]; y++) {

            const worldCoords = [
                x - worldTranslation[0],
                y - worldTranslation[1]
            ]

            // Don't draw if there is no data
            let pixel = getPixel(`${worldCoords[0]},${worldCoords[1]}`)
            if (!pixel) continue

            // @ts-ignore
            context.fillStyle = numRGBAToHex(pixel.color);


            // Draw a filled rectangle
            context.fillRect(
                (pixelOffset[0] - cellSize) + (x * cellSize) + doBorder,
                (pixelOffset[1] - cellSize) + (y * cellSize) + doBorder,
                cellSize - doBorder,
                cellSize - doBorder
            );
        }
    }
    if (hoveredCell && zoom > 2) {

        const worldCoords = viewToWorld(worldTranslation, hoveredCell)
        let pixel = getPixel(`${worldCoords[0]},${worldCoords[1]}`)

        context.fillStyle = numRGBAToHex(
            pixel ? pixel.color : 0
        );

        // Draw the hovered cell a bit bigger :-)
        context.fillRect(
            (pixelOffset[0] - cellSize) + (hoveredCell[0] * cellSize) - 10,
            (pixelOffset[1] - cellSize) + (hoveredCell[1] * cellSize) - 10,
            cellSize + 20,
            cellSize + 20
        );
        context.stroke()
    }
}

function drawGrid(context: CanvasRenderingContext2D, zoom: number, pixelOffset: number[], dimensions: { width: any; height: any; }) {

    const cellSize = getCellSize(dimensions, zoom)

    const startDrawingAtX = pixelOffset[0] - cellSize
    const endDrawingAtX = dimensions.width + pixelOffset[0]

    const startDrawingAtY = pixelOffset[1] % cellSize
    const endDrawingAtY = dimensions.height + pixelOffset[1] % cellSize

    context.beginPath();

    for (let i = startDrawingAtX; i <= endDrawingAtX; i += cellSize) {
        context.moveTo(i, 0);
        context.lineTo(i, dimensions.height);
    }
    for (let j = startDrawingAtY; j <= endDrawingAtY; j += cellSize) {
        context.moveTo(0, j);
        context.lineTo(dimensions.width, j);
    }
    context.strokeStyle = "#ddd";
    context.stroke();


}

function viewToWorld(worldTranslation: number[], viewportCoord: number[]): number[] {

    let x = viewportCoord[0] - worldTranslation[0]
    let y = viewportCoord[1] - worldTranslation[1]

    x = x >= 0 ? x : 0xFFFFFFFF + x;
    y = y >= 0 ? y : 0xFFFFFFFF + y;

    return [x, y];
}

const Viewport: React.FC<ViewportProps> = (
    {
        dimensions,
        zoom: initialZoom,
        center: initialCenter,
        onCenterChange,
        onWorldviewChange,
        getPixel,
        getTile
    }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [pixelOffset, setPixelOffset] = useState<number[]>([0, 0]);
    const [isDragging, setIsDragging] = useState(false);
    const [lastDragPoint, setLastDragPoint] = useState<number[]>([0, 0]);
    const [zoom, setZoom] = useState(initialZoom);
    const [center, setCenter] = useState(initialCenter);
    const [worldTranslation, setWorldTranslation] = useState([0, 0]);
    const [hoveredCell, setHoveredCell] = useState<number[] | undefined>(undefined);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        // Set canvas dimensions
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;

        // if (zoom > 4) drawGrid(context, zoom, pixelOffset, dimensions)
        const cellSize = getCellSize(dimensions, zoom)

        const gridDimensions = [
            Math.ceil(dimensions.width / cellSize),
            Math.ceil(dimensions.height / cellSize)
        ]

        setCenter([
            Math.floor(gridDimensions[0] / 2),
            Math.floor(gridDimensions[1] / 2)
        ])

        if (zoom > 1) {
            drawGrid(context, zoom, pixelOffset, dimensions)
            drawPixels(context, zoom, pixelOffset, dimensions, worldTranslation, hoveredCell, getPixel)

        }else{
            drawTiles(context, zoom, pixelOffset, dimensions, worldTranslation, getTile)
        }

        drawOutline(context, dimensions)

    }, [dimensions, zoom, pixelOffset, hoveredCell, getPixel]);

    // useEffect(() => {
    //     console.log("Viewport getPixel changed")
    //
    // }, [getPixel]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();

            const rect = canvas.getBoundingClientRect();

            const zoomStep = 0.1

            // adjust the world translate here?
            let newZoom = zoom
            if (e.deltaY <= 0) {
                if (zoom < 100) {
                    newZoom += zoomStep

                    // Adjust world transform
                    const mouse = cellForPosition(
                        zoom,
                        pixelOffset,
                        dimensions,
                        [e.clientX - rect.left, e.clientY - rect.top]
                    )
                    const cellSize = getCellSize(dimensions, zoom)

                    const gridDimensions = [
                        Math.ceil(dimensions.width / cellSize),
                        Math.ceil(dimensions.height / cellSize)
                    ]

                    const center = [
                        Math.floor(gridDimensions[0] / 2),
                        Math.floor(gridDimensions[1] / 2)
                    ]
                    console.log(mouse, center)
                    const worldTranslate = [
                        worldTranslation[0] + (center[0] - mouse[0]),
                        worldTranslation[1] + (center[1] - mouse[1]),
                    ]
                    console.log(worldTranslate)
                    setWorldTranslation(worldTranslate)
                }
            } else {
                if (zoom > 0) newZoom -= zoomStep
            }


            setZoom(newZoom);
        };

        canvas.addEventListener('wheel', handleWheel, {passive: false});

        onCenterChange(center)
        onWorldviewChange([[]])
        return () => {
            canvas.removeEventListener('wheel', handleWheel);
        };
    }, [zoom]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setHoveredCell(undefined);
        setLastDragPoint([e.clientX, e.clientY]);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            const cellWidth = getCellSize(dimensions, zoom)

            const pixelDelta = [
                pixelOffset[0] + e.clientX - lastDragPoint[0],
                pixelOffset[1] + e.clientY - lastDragPoint[1]
            ]

            // Difference in cells, negative or positive
            const cellDelta = [
                Math.floor(pixelDelta[0] / cellWidth),
                Math.floor(pixelDelta[1] / cellWidth)
            ]

            let newWorldTranslation = [
                worldTranslation[0] + cellDelta[0],
                worldTranslation[1] + cellDelta[1],
            ]

            const newOffset = [
                (pixelOffset[0] + e.clientX - lastDragPoint[0] + cellWidth) % cellWidth,
                (pixelOffset[1] + e.clientY - lastDragPoint[1] + cellWidth) % cellWidth
            ];

            setPixelOffset(newOffset);
            setWorldTranslation(newWorldTranslation)
            setLastDragPoint([e.clientX, e.clientY]);
            onWorldviewChange([[]])
            onCenterChange(center)
        } else {
            const rect = e.currentTarget.getBoundingClientRect();

            const viewportCell = cellForPosition(zoom, pixelOffset, dimensions, [e.clientX - rect.left, e.clientY - rect.top])

            // console.log(
            //     "hovering: ",
            //     viewportCell,
            //     "world:",
            //     viewToWorld(worldTranslation, viewportCell)
            // )
            setHoveredCell(viewportCell);
        }

    };

    const handleMouseUp = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const viewportCell = cellForPosition(zoom, pixelOffset, dimensions, [e.clientX - rect.left, e.clientY - rect.top])

        let worldCell = viewToWorld(worldTranslation, viewportCell)

        console.log(
            "clicked cell viewport: ",
            viewportCell,
            "world:",
            worldCell
        )

        setIsDragging(false);
    };

    return (
        <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        />
    );
};

export default Viewport;

