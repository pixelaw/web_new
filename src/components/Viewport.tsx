import React, {useRef, useEffect, useState} from 'react';

export type Dimensions = {
    width: number;
    height: number;
};


export type Pixel = {
    id: string
    color: string
    text: string
    owner: string
    action: string
}

export type PixelData = {
    data: Map<string, Pixel>;
    color: Map<string, number>;
}

interface ViewportProps {
    pixelData: PixelData;
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

function drawPixels(context: CanvasRenderingContext2D, zoom: number, pixelOffset: number[], dimensions: Dimensions, worldTranslation: number[], pixelData: PixelData, hoveredCell: number[] | undefined) {

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
            if (!pixelData.color.has(`${worldCoords[0]},${worldCoords[1]}`)) continue

            // @ts-ignore
            context.fillStyle = numRGBAToHex(pixelData.color.get(`${worldCoords[0]},${worldCoords[1]}`));


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
        // Draw the hovered cell a bit bigger :-)
        const worldCoords = [
            hoveredCell[0] - worldTranslation[0],
            hoveredCell[1] - worldTranslation[1]
        ]
        context.fillStyle = numRGBAToHex(pixelData.color.get(`${worldCoords[0]},${worldCoords[1]}`));

        context.fillRect(
            (pixelOffset[0] - cellSize) + (hoveredCell[0] * cellSize) - 10,
            (pixelOffset[1] - cellSize) + (hoveredCell[1] * cellSize) - 10,
            cellSize + 20,
            cellSize + 20
        );
        context.stroke()
    }
}

export const numRGBAToHex = (rgba: number | undefined) => {
    if(rgba==undefined) return "#0000EE"    // TODO Maybe return default color?
    let color = rgba >>> 8
    return '#' + (color).toString(16).padStart(6, "0")
}

function drawGrid(context: CanvasRenderingContext2D, zoom: number, pixelOffset: number[], dimensions: { width: any; height: any; }) {
    console.log("drawGrid")
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
        pixelData,
        dimensions,
        zoom: initialZoom,
        center: initialCenter,
        onCenterChange,
        onWorldviewChange
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

        if (zoom > 4) drawGrid(context, zoom, pixelOffset, dimensions)
        const cellSize = getCellSize(dimensions, zoom)

        const gridDimensions = [
            Math.ceil(dimensions.width / cellSize),
            Math.ceil(dimensions.height / cellSize)
        ]

        setCenter([
            Math.floor(gridDimensions[0] / 2),
            Math.floor(gridDimensions[1] / 2)
        ])
        drawPixels(context, zoom, pixelOffset, dimensions, worldTranslation, pixelData, hoveredCell)

        if (zoom > 2) drawGrid(context, zoom, pixelOffset, dimensions)
        drawOutline(context, dimensions)

        onCenterChange(center)
        // TODO
        onWorldviewChange([[]])
    }, [dimensions, zoom, pixelOffset, hoveredCell]);

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
        } else {
            const rect = e.currentTarget.getBoundingClientRect();

            const viewportCell = cellForPosition(zoom, pixelOffset, dimensions, [e.clientX - rect.left, e.clientY - rect.top])

            let worldCell = viewToWorld(worldTranslation, viewportCell)

            console.log(
                "hovering: ",
                viewportCell,
                "world:",
                worldCell
            )
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

