import React, {useRef, useEffect, useState} from 'react';
import {numRGBAToHex} from '../utils.ts'
import {Bounds, Coordinate, Dimension, Pixel, PixelStore, Tile, Tileset, TileStore} from "../types.ts";


const ZOOM_TILEMODE = 300
const ZOOM_FACTOR = 100
const ZOOM_STEP = 50
const ZOOM_MAX = 4000

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

function getCellSize(zoom: number) {
    return zoom / ZOOM_FACTOR
}

function drawOutline(context: CanvasRenderingContext2D, dimensions: Dimension) {
    // Draw outline
    context.beginPath();
    context.rect(0, 0, dimensions[0], dimensions[1]);
    context.lineWidth = 2;
    context.strokeStyle = 'black';
    context.stroke();
}

function cellForPosition(zoom: number, pixelOffset: Coordinate, _dimensions: Dimension, position: Coordinate): Coordinate {
    const cellSize = getCellSize(zoom)

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
    pixelOffset: Coordinate,
    dimensions: Dimension,
    worldTranslation: Coordinate,
    tileStore: TileStore
) {
    /*
    Need to know while tiles for
    - zoomlevel
    - worldCoords box

    Math is based on
    - zoomlevel
    - tilesize

    We have tiles for 2 "factors". The factor is how many pixels are included in 1
    - zoomlevel to zoomfactor is a 1/4 division TODO: not sure if this is gonna work
    - 1: zoomlevel 4 (1 pixel to 1 cell)
    - 4: zoomlevel 1 (4 pixels to 1 cell)

    Tiles are organized as files with [factor]_[x]_[y].png

    DrawTile can determine with tiles to retrieve by
    - Determining factor from zoom
    - getting leftmost world coordinate (floored to nearest tilesize multiple)
    - getting rightmost world coordinate (ceilinged to nearest tilesize multiple)
    - getting topmost world coordinate (floored to nearest tilesize multiple)
    - getting bottom-most world coordinate (ceilinged to nearest tilesize multiple)
    - TODO if we're wrapping around u32 also need to do some modulo stuff here
    - From factor and world coords get the tile indexes (for factor 1 its the same, for factor 4 multiply)

     */
    const cellSize = getCellSize(zoom)

    const gridDimensions = [
        Math.ceil(dimensions[0] / cellSize),
        Math.ceil(dimensions[1] / cellSize)
    ]

    const topleft = viewToWorld(worldTranslation, [0, 0])
    const bottomright = viewToWorld(worldTranslation, cellForPosition(
        zoom,
        pixelOffset,
        dimensions,
        [0, dimensions[1]]
    ))

    // TODO we want to also request offscreen coords - or should we send cellSize so the tile engine can decide?
    // If tilesize > cellSize, always giving one extra tile around the requested area is okay

    // Figure out the number of columns we received
    // const width = tileset.tileSize

    // ZOOM_FACTOR=100
    // with zoom=1, cellPerPixel is 100, pixelPerCell is 0.01 -> very compressed
    // Zoom can go up to 1000 or as needed depending on the screen pixel density
    // with zoom = 100, its 1 pixel per cell, and zoom 1000 is 10 pixels per cell
    // const scaleFactor = zoom / ZOOM_FACTOR

    // zoomed out 100x (zoom=1): coordPerPixel = 100
    // zoomed in 100x (zoom=100) : coordPerPixel = 0.1 (so 10 pixelPerCoord)
    // const cellPerPixel = ZOOM_FACTOR / zoom

    const tileset = tileStore.getTileset(
        zoom / ZOOM_FACTOR,
        [topleft, bottomright]
    )
    if (!tileset) return

    const {tileRows, tileSize, scaleFactor, bounds: [tileTopLeft, tileBottomRight]} = tileset
    // Based on the size of the tiles and the zoomlevel (pixels per cell divided by ZOOMFACTOR), figure out where to draw

    console.log("tileRows", tileset.tileRows)
    console.log("tilebounds", tileTopLeft, tileBottomRight)

    if (!tileset.tileRows[0][0]) return
    context.drawImage(tileset.tileRows[0][0], 0, 0, 600, 600)
}

function drawPixels(
    context: CanvasRenderingContext2D,
    zoom: number,
    pixelOffset: Coordinate,
    dimensions: Dimension,
    worldTranslation: Coordinate,
    hoveredCell: Coordinate | undefined,
    getPixel: (key: string) => Pixel | undefined
) {
    const cellSize = getCellSize(zoom)

    const gridDimensions = [
        Math.ceil(dimensions[0] / cellSize),
        Math.ceil(dimensions[1] / cellSize)
    ]
    context.beginPath();
    const doBorder = zoom <= ZOOM_TILEMODE ? 1 : 0

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
    if (hoveredCell && zoom > ZOOM_TILEMODE) {

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

function drawGrid(context: CanvasRenderingContext2D, zoom: number, pixelOffset: Coordinate, dimensions: Dimension) {

    const [width, height]  =dimensions
    const cellSize = getCellSize(zoom)

    const startDrawingAtX = pixelOffset[0] - cellSize
    const endDrawingAtX = width + pixelOffset[0]

    const startDrawingAtY = pixelOffset[1] % cellSize
    const endDrawingAtY = height + pixelOffset[1] % cellSize

    context.beginPath();

    for (let i = startDrawingAtX; i <= endDrawingAtX; i += cellSize) {
        context.moveTo(i, 0);
        context.lineTo(i, height);
    }
    for (let j = startDrawingAtY; j <= endDrawingAtY; j += cellSize) {
        context.moveTo(0, j);
        context.lineTo(width, j);
    }
    context.strokeStyle = "#ddd";
    context.stroke();


}

function viewToWorld(worldTranslation: Coordinate, viewportCoord: Coordinate): Coordinate {

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
                if (zoom > 0) newZoom -= ZOOM_STEP
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

    const handleMouseUp = (e: React.MouseEvent) => {
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

export default Viewport;

