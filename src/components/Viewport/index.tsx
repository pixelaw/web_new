import React, {useRef, useEffect, useState} from 'react';
import {Bounds, Coordinate, Dimension, PixelStore, TileStore} from "../../types.ts";
import {drawGrid, drawOutline, drawPixels, drawTiles} from "./draw.ts";
import {cellForPosition, getCellSize} from "../../utils.ts";
import {ZOOM_MAX, ZOOM_STEP, ZOOM_TILEMODE} from "./constants.ts";

interface ViewportProps {
    pixelStore: PixelStore;
    tileStore: TileStore;
    dimensions: Dimension;
    zoom: number;
    center: Coordinate;
    onZoomChange: (newZoom: number) => void;
    onCenterChange: (newCenter: Coordinate) => void;
    onWorldviewChange: (newWorldview: Bounds) => void;
}

const Index: React.FC<ViewportProps> = (
    {
        dimensions,
        zoom: initialZoom,
        center: initialCenter,
        onCenterChange,
        onWorldviewChange,
        onZoomChange,
        pixelStore,
        tileStore
    }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [pixelOffset, setPixelOffset] = useState<Coordinate>([0, 0]);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [lastDragPoint, setLastDragPoint] = useState<Coordinate>([0, 0]);
    const [zoom, setZoom] = useState<number>(initialZoom);
    const [center, setCenter] = useState<Coordinate>(initialCenter);
    const [worldTranslation, setWorldTranslation] = useState<Coordinate>([0, 0]);
    const [hoveredCell, setHoveredCell] = useState<Coordinate | undefined>(undefined);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        // Set canvas
        canvas.width = dimensions[0];
        canvas.height = dimensions[1];
        context.imageSmoothingEnabled = false

        if (zoom > 500) drawGrid(context, zoom, pixelOffset, dimensions)
        const cellSize = getCellSize(zoom)

        const gridDimensions = [
            Math.ceil(dimensions[0] / cellSize),
            Math.ceil(dimensions[1] / cellSize)
        ]

        setCenter([
            Math.floor(gridDimensions[0] / 2),
            Math.floor(gridDimensions[1] / 2)
        ])
        // console.log("zoom", zoom)
        if (zoom > ZOOM_TILEMODE) {

            drawPixels(context, zoom, pixelOffset, dimensions, worldTranslation, hoveredCell, pixelStore.getPixel)
            console.log("cellSize", cellSize)
            drawOutline(context, dimensions)

        }


    }, [dimensions, zoom, pixelOffset, hoveredCell, pixelStore.getPixel]);

    // TODO
    useEffect(() => {
        setCenter(initialCenter);
    }, [initialCenter]);


    useEffect(() => {
        console.log("tileRender triggered")
        if (zoom <= ZOOM_TILEMODE) {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const context = canvas.getContext('2d');
            if (!context) return;

            drawTiles(context, zoom, pixelOffset, dimensions, worldTranslation, tileStore)
            drawOutline(context, dimensions)
        }
    }, [dimensions, zoom, pixelOffset, tileStore.getTileset]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();

            const rect = canvas.getBoundingClientRect();


            // adjust the world translate here?
            let newZoom = zoom
            if (e.deltaY <= 0) {
                if (zoom < ZOOM_MAX) {
                    newZoom += ZOOM_STEP

                    // Adjust world transform
                    const mouse = cellForPosition(
                        zoom,
                        pixelOffset,
                        dimensions,
                        [e.clientX - rect.left, e.clientY - rect.top]
                    )
                    const cellSize = getCellSize(zoom)

                    const gridDimensions = [
                        Math.ceil(dimensions[0] / cellSize),
                        Math.ceil(dimensions[1] / cellSize)
                    ]

                    const center = [
                        Math.floor(gridDimensions[0] / 2),
                        Math.floor(gridDimensions[1] / 2)
                    ]
                    console.log(mouse, center)
                    const worldTranslate: Coordinate = [
                        worldTranslation[0] + (center[0] - mouse[0]),
                        worldTranslation[1] + (center[1] - mouse[1]),
                    ]
                    console.log(worldTranslate)
                    setWorldTranslation(worldTranslate)
                }
            } else {
                // TODO deal with minimum zoom and scalefactor
                if (zoom > 60) {
                    newZoom -= ZOOM_STEP
                }else if(zoom - 5 > 25){
                    newZoom -= 5
                }
            }


            setZoom(newZoom);
        };

        canvas.addEventListener('wheel', handleWheel, {passive: false});

        onCenterChange(center)
        onWorldviewChange([[0, 0], [0, 0]])//TODO
        onZoomChange(zoom)
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
            const cellWidth = getCellSize(zoom)

            const pixelDelta = [
                pixelOffset[0] + e.clientX - lastDragPoint[0],
                pixelOffset[1] + e.clientY - lastDragPoint[1]
            ]

            // Difference in cells, negative or positive
            const cellDelta = [
                Math.floor(pixelDelta[0] / cellWidth),
                Math.floor(pixelDelta[1] / cellWidth)
            ]

            let newWorldTranslation: Coordinate = [
                worldTranslation[0] + cellDelta[0],
                worldTranslation[1] + cellDelta[1],
            ]

            const newOffset: Coordinate = [
                (pixelOffset[0] + e.clientX - lastDragPoint[0] + cellWidth) % cellWidth,
                (pixelOffset[1] + e.clientY - lastDragPoint[1] + cellWidth) % cellWidth
            ];

            setPixelOffset(newOffset);
            setWorldTranslation(newWorldTranslation)
            setLastDragPoint([e.clientX, e.clientY]);
            onWorldviewChange([[0, 0], [0, 0]])//TODO
            onCenterChange(center)
        } else {
            if (zoom > ZOOM_TILEMODE) {
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
        }

    };

    const handleMouseUp = (_e: React.MouseEvent) => {
        // const rect = e.currentTarget.getBoundingClientRect();
        // const viewportCell = cellForPosition(zoom, pixelOffset, dimensions, [e.clientX - rect.left, e.clientY - rect.top])
        //
        // let worldCell = viewToWorld(worldTranslation, viewportCell)
        //
        // console.log(
        //     "clicked cell viewport: ",
        //     viewportCell,
        //     "world:",
        //     worldCell
        // )

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

export default Index;

