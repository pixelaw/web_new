import React, {useRef, useEffect, useState} from 'react';
import {Bounds, Coordinate, Dimension, MAX_UINT32, PixelStore, TileStore} from "../../types.ts";
import {cellForPosition, getCellSize, viewToWorld} from "../../utils.ts";
import {ZOOM_MAX, ZOOM_STEP, ZOOM_TILEMODE} from "./constants.ts";
import {drawPixels} from "./drawPixels.ts";
import {drawOutline} from "./drawOutline.ts";
import {drawTiles} from "./drawTiles.ts";
import {drawGrid} from "./drawGrid.ts";

const bufferCanvas = document.createElement('canvas');
const bufferContext = bufferCanvas.getContext('2d');


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

    // Render when in pixel mode
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;
        if (!bufferContext) return;

        const [width, height] = dimensions

        // Set canvas
        canvas.width = width;
        canvas.height = height;
        context.imageSmoothingEnabled = false

        bufferContext.canvas.width = width
        bufferContext.canvas.height = height
        bufferContext.imageSmoothingEnabled = false

        bufferContext!.clearRect(0, 0, bufferCanvas.width, bufferCanvas.height);

        const cellSize = getCellSize(zoom)

        const gridDimensions = [
            Math.ceil(width / cellSize),
            Math.ceil(height / cellSize)
        ]

        setCenter([
            Math.floor(gridDimensions[0] / 2),
            Math.floor(gridDimensions[1] / 2)
        ])
        // console.log("zoom", zoom)
        if (zoom > ZOOM_TILEMODE) {

            drawGrid(bufferContext, zoom, pixelOffset, dimensions)

            drawPixels(bufferContext, zoom, pixelOffset, dimensions, worldTranslation, hoveredCell, pixelStore.getPixel)

            drawTiles(bufferContext, zoom, pixelOffset, dimensions, worldTranslation, tileStore)

            drawOutline(bufferContext, dimensions)


            context.drawImage(bufferCanvas, 0, 0);
        }


    }, [dimensions, zoom, pixelOffset, hoveredCell, pixelStore.getPixel]);


    // Render when in Tile mode
    useEffect(() => {
        if (zoom <= ZOOM_TILEMODE) {
            const canvas = canvasRef.current;
            if (!canvas) return;
            if (!bufferContext) return;

            const context = canvas.getContext('2d');
            if (!context) return;
            const [width, height] = dimensions

            bufferContext.canvas.width = width
            bufferContext.canvas.height = height
            bufferContext.imageSmoothingEnabled = false

            // bufferContext!.clearRect(0, 0, bufferCanvas.width, bufferCanvas.height);

            drawTiles(bufferContext, zoom, pixelOffset, dimensions, worldTranslation, tileStore)
            drawOutline(bufferContext, dimensions)

            context.drawImage(bufferCanvas, 0, 0);
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
                    const mouse = cellForPosition(zoom, pixelOffset, [e.clientX - rect.left, e.clientY - rect.top])
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
                } else if (zoom - 5 > 25) {
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

    // TODO
    useEffect(() => {
        setCenter(initialCenter);
    }, [initialCenter]);

    // TODO
    useEffect(() => {
        if (!hoveredCell) return
        console.log("hoveredCell changed to ", hoveredCell, pixelStore.getPixel(hoveredCell))

    }, [hoveredCell]);

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
            const cellDelta: Coordinate = [
                Math.floor(pixelDelta[0] / cellWidth),
                Math.floor(pixelDelta[1] / cellWidth)
            ]


            function updateWorldTranslation(worldTranslation: Coordinate, cellDelta: Coordinate): Coordinate {

                let x = (worldTranslation[0] + cellDelta[0] + MAX_UINT32) % MAX_UINT32;
                let y = (worldTranslation[1] + cellDelta[1] + MAX_UINT32) % MAX_UINT32;

                return [x, y];
            }

            let newWorldTranslation = updateWorldTranslation(worldTranslation, cellDelta)

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

                const viewportCell = cellForPosition(zoom, pixelOffset, [e.clientX - rect.left, e.clientY - rect.top])

                // console.log(
                //     "hovering: ",
                //     viewportCell,
                //     "world:",
                //     viewToWorld(worldTranslation, viewportCell)
                // )
                if (
                    (!hoveredCell && viewportCell) ||
                    hoveredCell && (hoveredCell[0] !== viewportCell[0] || hoveredCell[1] !== viewportCell[1])
                ) {
                    setHoveredCell(viewportCell);
                }

            }
        }

    };

    const handleMouseUp = (_e: React.MouseEvent) => {
        // const rect = e.currentTarget.getBoundingClientRect();
        // const viewportCell = cellForPosition(zoom, pixelOffset, dimensions, [e.clientX - rect.left, e.clientY - rect.top])
        //

        //
        // console.log(
        //     "clicked cell viewport: ",
        //     viewportCell,
        //     "world:",
        //     worldCell
        // )
        const topleft = viewToWorld(worldTranslation, [0, 0])
        const br = cellForPosition(zoom, pixelOffset, [dimensions[0], dimensions[1]])
        const bottomright = viewToWorld(worldTranslation, br)


        pixelStore.loadPixels([topleft, bottomright])
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

