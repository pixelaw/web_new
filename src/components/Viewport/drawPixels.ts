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
    const cellSize = getCellSize(zoom);
    const gridDimensions = [
        Math.ceil(dimensions[0] / cellSize),
        Math.ceil(dimensions[1] / cellSize)
    ];
    context.beginPath();
    const doBorder = zoom <= ZOOM_TILEMODE ? 1 : 0;

    // How many pixels a cell extends offscreen
    const offsets = calculateOffsets(pixelOffset, cellSize);

    const drawPixel = (cellX: number, cellY: number, sizeAdjustment: number = 0) => {

        const worldCoords = viewToWorld(worldTranslation, [cellX, cellY])

        const pixel = getPixel(worldCoords);
        if (!pixel) return;

        context.fillStyle = numRGBAToHex(pixel.color);

        const [x, y, w, h] = getRect(offsets, cellX,cellY,cellSize,doBorder,sizeAdjustment)

        context.fillRect(x, y, w, h);
    };

    // const worldCoords = viewToWorld(worldTranslation, [0, 0])

    // console.log(
    //     "worldCoords", worldCoords[0],
    //     "offsets", offsets[0],
    //     "pixelOffset", pixelOffset[0],
    //     "wt", worldTranslation[0]
    // )

    for (let x = 0; x <= gridDimensions[0]; x++) {
        for (let y = 0; y <= gridDimensions[1]; y++) {
            drawPixel(x, y);
        }
    }

    if (hoveredCell && zoom > ZOOM_TILEMODE) {
        drawPixel(hoveredCell[0], hoveredCell[1], 5);
    }
}

function getRect(
    [offsetX, offsetY]: Coordinate,
    x: number,
    y: number,
    cellSize: number,
    doBorder: number,
    sizeAdjustment: number
): number[] {
    const startDrawingAtX = offsetX + (x * cellSize);
    const startDrawingAtY = offsetY + (y * cellSize);

    return [
        startDrawingAtX + doBorder - sizeAdjustment,
        startDrawingAtY + doBorder - sizeAdjustment,
        cellSize - doBorder + sizeAdjustment * 2,
        cellSize - doBorder + sizeAdjustment * 2
    ]

}

// Given a pixelOffset, how much of a tile extends beyond the left/top viewport border?
// Tricky: 0 should yield 0
function calculateOffsets([x,y]: Coordinate, cellSize: number): [number, number] {
    /*
    PROBLEM: viewport changes to "1" and worldcoord changes, without changing offset!

    true viewport 0 worldcoord 0 offset 0 pixeloffset 0 wt 0
    true viewport 1 worldcoord 1 offset 0 pixeloffset 0 wt 0

    Only solution i can think of now is to simply always do
        offset = pos - cellsize

    But this starts to draw the cells fully offscreen
     */

    const offsetX = /*x == 0 ? 0 :*/ x - cellSize;
    const offsetY = /*y == 0 ? 0 :*/ y - cellSize;
    return [offsetX, offsetY];
}


if (import.meta.vitest) {
    const {it, expect, describe} = import.meta.vitest


    describe('calculateOffsets', () => {
        it('should return [0, 0] when pixelOffset is [0, 0]', () => {
            const result = calculateOffsets([0, 0], 10);
            expect(result).toEqual([0, 0]);
        });

        it('should return correct offsets when pixelOffset is not [0, 0]', () => {
            const result = calculateOffsets([20, 30], 10);
            expect(result).toEqual([10, 20]);
        });

        it('should handle negative offsets correctly', () => {
            const result = calculateOffsets([-10, -20], 10);
            expect(result).toEqual([-20, -30]);
        });
    });

    describe('getRect', () => {
        it('should return correct rectangle dimensions without border and size adjustment', () => {
            const result = getRect([0, 0], 1, 1, 10, 0, 0);
            expect(result).toEqual([10, 10, 10, 10]);
        });

        it('should return correct rectangle dimensions with border', () => {
            const result = getRect([0, 0], 1, 1, 10, 1, 0);
            expect(result).toEqual([11, 11, 9, 9]);
        });

        it('should return correct rectangle dimensions with size adjustment', () => {
            const result = getRect([0, 0], 1, 1, 10, 0, 2);
            expect(result).toEqual([8, 8, 14, 14]);
        });

        it('should return correct rectangle dimensions with both border and size adjustment', () => {
            const result = getRect([0, 0], 1, 1, 10, 1, 2);
            expect(result).toEqual([9, 9, 13, 13]);
        });

        it('should handle negative offsets correctly', () => {
            const result = getRect([-10, -20], 1, 1, 10, 0, 0);
            expect(result).toEqual([0, -10, 10, 10]);
        });
    });
}