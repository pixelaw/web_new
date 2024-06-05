import {Coordinate, Dimension, Pixel} from "../../types.ts";
import {getCellSize, numRGBAToHex, viewToWorld} from "../../utils.ts";
import {ZOOM_TILEMODE} from "./constants.ts";

export function drawPixels(
    context: CanvasRenderingContext2D,
    zoom: number,
    pixelOffset: Coordinate,
    dimensions: Dimension,
    worldTranslation: Coordinate,
    hoveredCell: Coordinate | undefined,
    getPixel: (coord: Coordinate) => Pixel | undefined
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

            const worldCoords: Coordinate = [
                x - worldTranslation[0],
                y - worldTranslation[1]
            ]

            // Don't draw if there is no data
            let pixel = getPixel(worldCoords)
            if (!pixel) continue

            context.fillStyle = numRGBAToHex(pixel.color);

            const offsetX = pixelOffset[0] == 0 ? 0 : pixelOffset[0] - cellSize
            const offsetY = pixelOffset[1] == 0 ? 0 : pixelOffset[1] - cellSize

            const startDrawingAtX = offsetX + (x * cellSize);
            const startDrawingAtY =offsetY + (y * cellSize) ;

            // Draw a filled rectangle
            context.fillRect(
                startDrawingAtX + doBorder,
                startDrawingAtY  + doBorder,
                cellSize - doBorder,
                cellSize - doBorder
            );
        }
    }
    if (hoveredCell && zoom > ZOOM_TILEMODE) {

        const worldCoords = viewToWorld(worldTranslation, hoveredCell)
        let pixel = getPixel(worldCoords)

        context.fillStyle = numRGBAToHex(
            pixel ? pixel.color : 0
        );

        const startDrawingAtX = Math.max(0, pixelOffset[0] - cellSize);
        const startDrawingAtY = Math.max(0, pixelOffset[1] - cellSize);


        // Draw the hovered cell a bit bigger :-)
        context.fillRect(
            startDrawingAtX + (hoveredCell[0] * cellSize) - 5,
            startDrawingAtY + (hoveredCell[1] * cellSize) - 5,
            cellSize + 10,
            cellSize + 10
        );
        context.stroke()
    }
}