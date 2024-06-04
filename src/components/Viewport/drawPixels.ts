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
        let pixel = getPixel(worldCoords)

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