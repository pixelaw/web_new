import React, {useRef, useEffect, useState} from 'react';
import {Bounds, Coordinate, Dimension, PixelStore, TileStore} from "../../types.ts";
import {
    cellForPosition,
    getCellSize,
    applyWorldOffset,
    handlePixelChanges
} from "../../utils.ts";
import {ZOOM_MAX, ZOOM_MIN, ZOOM_SCALEFACTOR, ZOOM_TILEMODE} from "./constants.ts";
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
    const [worldOffset, setWorldOffset] = useState<Coordinate>([0, 0]);
    const [hoveredCell, setHoveredCell] = useState<Coordinate | undefined>(undefined);
    const [worldView, setWorldView] = useState<Bounds>([[0, 0], [0, 0]]);
    const isLoaded = useRef<boolean>(false);

    useEffect(() => {
        if (isLoaded.current) return
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;
        if (!bufferContext) return;

        const wv = getWorldViewBounds()
        setWorldView(wv)
        console.log("Initial Viewport render")

        pixelStore.loadPixels(wv)
        isLoaded.current = true


        // TODO remove drag for testing
        drag(lastDragPoint, [lastDragPoint[0] , lastDragPoint[1] + 75])
    }, [])

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

        if (zoom > ZOOM_TILEMODE) {

            drawGrid(bufferContext, zoom, pixelOffset, dimensions)

            drawTiles(bufferContext, zoom, pixelOffset, dimensions, worldOffset, tileStore, isDragging)

            drawPixels(bufferContext, zoom, pixelOffset, dimensions, worldOffset, hoveredCell, pixelStore.getPixel)

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
            // drawGrid(bufferContext, zoom, pixelOffset, dimensions)

            drawTiles(bufferContext, zoom, pixelOffset, dimensions, worldOffset, tileStore, isDragging)
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
            let newZoom = zoom;

            if (e.deltaY < 0 && zoom < ZOOM_MAX) { // Zoom in
                newZoom *= ZOOM_SCALEFACTOR;
            } else if (e.deltaY > 0 && zoom > ZOOM_MIN) { // Zoom out
                newZoom /= ZOOM_SCALEFACTOR;
            }

            // Ensure newZoom is within bounds
            newZoom = Math.min(Math.max(newZoom, ZOOM_MIN), ZOOM_MAX);

            // Calculate the mouse position relative to the canvas
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Convert mouse position to cell coordinates at the current zoom level
            const mouseCellBeforeZoom = cellForPosition(zoom, pixelOffset, [mouseX, mouseY]);

            // Calculate expected mouse cell position after zoom to keep it under the same world point
            const mouseCellAfterZoom = cellForPosition(newZoom, pixelOffset, [mouseX, mouseY]);

            // Calculate the difference in cell positions due to zooming
            const cellDiffX = mouseCellAfterZoom[0] - mouseCellBeforeZoom[0];
            const cellDiffY = mouseCellAfterZoom[1] - mouseCellBeforeZoom[1];

            // Adjust the worldOffset by the difference in cell positions
            // This keeps the content under the mouse stationary by adjusting the world offset
            setWorldOffset((currentWorldOffset) => [
                currentWorldOffset[0] + cellDiffX,
                currentWorldOffset[1] + cellDiffY,
            ]);

            // Update state with new zoom and world offset
            setZoom(newZoom);

            // Optionally, call your onZoomChange handler
            onZoomChange(newZoom);
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

        console.log(
            "hoveredCell ", hoveredCell,
            "offset", pixelOffset,
            "worldOffset", worldOffset
        )

    }, [hoveredCell]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setHoveredCell(undefined);
        setLastDragPoint([e.clientX, e.clientY]);
    };

    function drag(lastDragPoint: Coordinate, mouse: Coordinate) {
        const cellWidth = getCellSize(zoom)

        const [newPixelOffset, newWorldOffset] = handlePixelChanges(
            [...pixelOffset],
            [...worldOffset],
            [
                lastDragPoint[0] - mouse[0],
                lastDragPoint[1] - mouse[1]
            ],
            cellWidth
        )
        // console.log("newPixelOffset", newPixelOffset[0], "newWorldOffset", newWorldOffset[0])

        // console.log("newOffset",newOffset)
        setPixelOffset(newPixelOffset);
        setWorldOffset(newWorldOffset)
        onWorldviewChange([[0, 0], [0, 0]])//TODO
        onCenterChange(center)
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            const mouse: Coordinate = [e.clientX, e.clientY]
            drag(lastDragPoint, mouse)

            setLastDragPoint(mouse);
        } else {
            if (zoom > ZOOM_TILEMODE) {
                const rect = e.currentTarget.getBoundingClientRect();

                const viewportCell = cellForPosition(zoom, pixelOffset, [
                    e.clientX - rect.left,
                    e.clientY - rect.top
                ])
                if (
                    (!hoveredCell && viewportCell) ||
                    hoveredCell && (hoveredCell[0] !== viewportCell[0] || hoveredCell[1] !== viewportCell[1])
                ) {
                    setHoveredCell(viewportCell);
                }

            }
        }

    };

    const getWorldViewBounds = (): Bounds => {
        const [width, height] = dimensions
        const topLeft = applyWorldOffset(worldOffset, [0, 0])
        const bottomRightCell = cellForPosition(zoom, pixelOffset, [width, height])
        const bottomRight = applyWorldOffset(worldOffset, bottomRightCell)
        return [topLeft, bottomRight]
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleMouseUp = (e: React.MouseEvent) => {
        // const rect = e.currentTarget.getBoundingClientRect();
        // const viewportCell = cellForPosition(zoom, pixelOffset, dimensions, [e.clientX - rect.left, e.clientY - rect.top])

        // console.log(
        //     "clicked cell viewport: ",
        //     viewportCell,
        //     "world:",
        //     worldCell
        // )
        if (e.type !== "mouseleave") {
            setWorldView(getWorldViewBounds())
            pixelStore.loadPixels(worldView)
        }

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

