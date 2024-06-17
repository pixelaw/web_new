import React, {useRef, useEffect, useState} from 'react';
import {Bounds, Coordinate, PixelStore, TileStore} from "../../types.ts";
import {
    cellForPosition,
    getCellSize,
    applyWorldOffset,
    handlePixelChanges, areBoundsEqual
} from "../../utils.ts";
import {ZOOM_MAX, ZOOM_MIN, ZOOM_SCALEFACTOR, ZOOM_TILEMODE} from "./constants.ts";
import {drawPixels} from "./drawPixels.ts";
import {drawOutline} from "./drawOutline.ts";
import {drawTiles} from "./drawTiles.ts";
import {drawGrid} from "./drawGrid.ts";
import useDimensions from "../../hooks/useDimensions.ts";

const bufferCanvas = document.createElement('canvas');
const bufferContext = bufferCanvas.getContext('2d');


interface ViewportProps {
    pixelStore: PixelStore;
    tileStore: TileStore;
    zoom: number;
    center: Coordinate;
    setCenter: (newCenter: Coordinate) => void;
    setZoom: (newZoom: number) => void;
    // onCenterChange: (newCenter: Coordinate) => void;
    onWorldviewChange: (newWorldview: Bounds) => void;
    onCellClick: (coordinate: Coordinate) => void;
    onCellHover: (coordinate: Coordinate | undefined) => void;
}

const Viewport: React.FC<ViewportProps> = (
    {
        zoom, setZoom,
        center, setCenter,
        onWorldviewChange,
        pixelStore,
        tileStore,
        onCellClick,
        onCellHover
    }) => {
    const wrapperRef = useRef(null);
    const dimensions = useDimensions(wrapperRef);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [pixelOffset, setPixelOffset] = useState<Coordinate>([0, 0]);
    const [dragStart, setDragStart] = useState<number>(0);
    const dragStartPoint = useRef<Coordinate | null>(null);
    const [lastDragPoint, setLastDragPoint] = useState<Coordinate>([0, 0]);
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

        // pixelStore.loadPixels(wv)
        isLoaded.current = true


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

        if (zoom > ZOOM_TILEMODE) {

            drawGrid(bufferContext, zoom, pixelOffset, dimensions)

            drawTiles(bufferContext, zoom, pixelOffset, dimensions, worldOffset, tileStore)

            drawPixels(bufferContext, zoom, pixelOffset, dimensions, worldOffset, hoveredCell, pixelStore.getPixel)

            drawOutline(bufferContext, dimensions)


            context.drawImage(bufferCanvas, 0, 0);
        }


    }, [dimensions, zoom, pixelOffset, hoveredCell, pixelStore.getPixel]);

    const calculateCenter = () => {
        const [width, height] = dimensions;
        // Calculate the viewport's center point in pixels
        const viewportCenter: Coordinate = [width / 2, height / 2];
        // Adjust by pixelOffset to get the center in "world" pixels
        const adjustedCenter: Coordinate = [
            viewportCenter[0] + pixelOffset[0],
            viewportCenter[1] + pixelOffset[1],
        ];
        // Convert to world coordinates (cells)
        const centerCell = cellForPosition(zoom, [0, 0], adjustedCenter);
        const worldCenterCell = applyWorldOffset(worldOffset, centerCell)
        return worldCenterCell;
    };

    // Render when in Tile mode
    useEffect(() => {
        if (zoom <= ZOOM_TILEMODE && zoom > ZOOM_MIN) {
            const canvas = canvasRef.current;
            if (!canvas) return;
            if (!bufferContext) return;

            const context = canvas.getContext('2d');
            if (!context) return;
            const [width, height] = dimensions

            bufferContext.canvas.width = width
            bufferContext.canvas.height = height
            bufferContext.imageSmoothingEnabled = false

            drawTiles(bufferContext, zoom, pixelOffset, dimensions, worldOffset, tileStore)
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
            newZoom = Math.round(Math.min(Math.max(newZoom, ZOOM_MIN), ZOOM_MAX))

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
            setCenter(center)

        };

        canvas.addEventListener('wheel', handleWheel, {passive: false});

        const newWorldview = getWorldViewBounds()
        if (!areBoundsEqual(newWorldview, worldView)) {
            setWorldView(getWorldViewBounds())
            onWorldviewChange(newWorldview)
        }

        return () => {
            canvas.removeEventListener('wheel', handleWheel);
        };
    }, [zoom]);


    const handleMouseDown = (e: React.MouseEvent) => {
        setDragStart(Date.now());
        setHoveredCell(undefined);
        dragStartPoint.current = [e.clientX, e.clientY] as Coordinate
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

        setPixelOffset(newPixelOffset);
        setWorldOffset(newWorldOffset)
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (dragStart) {
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
                    const hoveredWorldCell = applyWorldOffset(worldOffset, viewportCell)
                    setHoveredCell(hoveredWorldCell);
                    onCellHover(hoveredWorldCell)
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

    const handleMouseUp = (e: React.MouseEvent) => {
        let distance = 0
        if (dragStartPoint.current !== null) {
            const startPos = dragStartPoint.current;
            const endPos: Coordinate = [e.clientX, e.clientY];
            distance = Math.sqrt(Math.pow(endPos[0] - startPos[0], 2) + Math.pow(endPos[1] - startPos[1], 2));
        }

        const timeDiff = Date.now() - dragStart;

        if (timeDiff < 500 && distance < 10) {
            const rect = e.currentTarget.getBoundingClientRect();
            const viewportCell = cellForPosition(zoom, pixelOffset, [e.clientX - rect.left, e.clientY - rect.top])
            const worldClicked = applyWorldOffset(worldOffset, viewportCell)
            onCellClick(worldClicked)
        }

        setCenter(calculateCenter())
        if (e.type == "mouseleave") {
            setHoveredCell(undefined);
            onCellHover(undefined);
        }

        const newWorldview = getWorldViewBounds()
        if (!areBoundsEqual(newWorldview, worldView)) {
            setWorldView(getWorldViewBounds())
            onWorldviewChange(newWorldview)
        }

        setDragStart(0);
        dragStartPoint.current = null
    };

    return (
        <div ref={wrapperRef} style={{width: '100%', height: '100%'}}>
            <canvas width={dimensions[0]} height={dimensions[1]}
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
            />
        </div>
    );
};

export default Viewport