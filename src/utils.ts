import {Coordinate, MAX_UINT32} from "./types.ts";
import {ZOOM_FACTOR} from "./components/Viewport/constants.ts";

export function randomColor(): number {
    // Generate random RGB color
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);

    // Encode RGB color to int
    return (r << 24) + (g << 16) + (b << 8);
}

export const numRGBAToHex = (rgba: number | undefined) => {
    if (rgba == undefined) return "#0000EE"    // TODO Maybe return default color?
    const color = rgba >>> 8
    return '#' + (color).toString(16).padStart(6, "0")
}

export async function clearIdb() {
    const DB_NAME = 'keyval-store'; // replace with your database name
    const DB_STORE_NAME = 'keyval'; // replace with your store name

    const request = indexedDB.open(DB_NAME);

    request.onsuccess = function () {
        const db = request.result;
        const transaction = db.transaction([DB_STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(DB_STORE_NAME);
        objectStore.clear();
    };
}

export function updateWorldTranslation([worldX, worldY]: Coordinate, [cellX, cellY]: Coordinate): Coordinate {
    return [
        (cellX + worldX) >>> 0,
        (cellY + worldY) >>> 0,
    ]

}


// Returns viewport cell for the given relative viewport position
export function cellForPosition(
    zoom: number,
    pixelOffset: Coordinate,
    position: Coordinate
): Coordinate {

    const cellSize = getCellSize(zoom)

    const [offsetLeft, offsetTop] = pixelOffset
    const [posX, posY] = position

    // Determine where the topleft cell would start drawing (offscreen because of the scrolling offset)
    const startDrawingAtX = offsetLeft == 0 ? 0 : offsetLeft - cellSize
    const startDrawingAtY = offsetTop == 0 ? 0 : offsetTop - cellSize

    const x = Math.floor((posX - startDrawingAtX) / cellSize)
    const y = Math.floor((posY - startDrawingAtY) / cellSize)

    return [x, y]
}


export function getCellSize(zoom: number) {
    return zoom / ZOOM_FACTOR
}

// Apply worldTranslation to viewport coordinates
// Worldtranslation means "number to add to world to get view"
export function viewToWorld(worldTranslation: Coordinate, viewportCoord: Coordinate): Coordinate {

    return [
        (viewportCoord[0] - worldTranslation[0]) >>> 0,
        (viewportCoord[1] - worldTranslation[1]) >>> 0
    ];
}


if (import.meta.vitest) {
    const {it, expect, describe} = import.meta.vitest


    describe("viewToWorld should correctly return world coordinates", () => {

        it('all 0, should return all 0 too', () =>
            expect(viewToWorld([0, 0], [0, 0]))
                .toEqual([0, 0])
        );

        it('No translation should result in same as input', () =>
            expect(viewToWorld([0, 0], [1, 1]))
                .toEqual([1, 1])
        );

        it('Translation by negative 1 of 0 should give -1 (max_uint)', () =>
            expect(viewToWorld([1, 1], [0, 0]))
                .toEqual([4_294_967_295, 4_294_967_295])
        );

        it('Moving [-1,-1] by 2 to rightbottom', () =>
            expect(viewToWorld([4_294_967_294, 4_294_967_294], [4_294_967_295, 4_294_967_295]))
                .toEqual([1, 1])
        );

        it('Moving [1,1] by 2 into the topleft', () =>
            expect(viewToWorld([2, 2], [1, 1]))
                .toEqual([4_294_967_295, 4_294_967_295])
        );
    });

    describe("updateWorldTranslation should correctly update world coordinates", () => {

        it('should return [0, 0] for input [0, 0], [0, 0]', () =>
            expect(updateWorldTranslation([0, 0], [0, 0]))
                .toEqual([0, 0])
        );

        it('should handle negative translation correctly', () =>
            expect(updateWorldTranslation([-1, -1], [-1, -1]))
                .toEqual([MAX_UINT32 - 1, MAX_UINT32 - 1])
        );

        it('should handle mixed positive and negative translation', () =>
            expect(updateWorldTranslation([1, 1], [-2, -2]))
                .toEqual([MAX_UINT32 , MAX_UINT32 ])
        );

        it('should wrap around correctly', () =>
            expect(updateWorldTranslation([MAX_UINT32 - 1, MAX_UINT32 - 1], [2, 2]))
                .toEqual([0, 0])
        );

        it('should wrap around correctly', () =>
            expect(updateWorldTranslation([0, 0], [-1, -1]))
                .toEqual([MAX_UINT32, MAX_UINT32])
        );
    });

    describe("cellForPosition should return correct cell coordinates", () => {

        it('should return [0, 0] for 1 pixel onscreen is 1 in the world, and pos is topleft', () =>
            expect(cellForPosition(1000, [0, 0], [0, 0]))
                .toEqual([0, 0])
        );

        it('should return [0, 0] for 1 pixel onscreen is 10 in the world, and pos is topleft', () =>
            expect(cellForPosition(1000, [0, 0], [0, 0]))
                .toEqual([0, 0])
        );

        it('should handle offset correctly for 1 pixel onscreen is 10 in the world, and pos is topleft', () =>
            expect(cellForPosition(1000, [5, 5], [0, 0]))
                .toEqual([0, 0])
        );

        it('should handle offset correctly for 1 pixel onscreen is 10 in the world, and pos is topleft with specific offset', () =>
            expect(cellForPosition(1000, [5, 5], [4, 4]))
                .toEqual([0, 0])
        );

        it('should handle offset correctly for 1 pixel onscreen is 10 in the world, and pos is topleft with another specific offset', () =>
            expect(cellForPosition(1000, [1, 1], [4, 4]))
                .toEqual([1, 1])
        );

        it('should handle larger world coordinates correctly', () =>
            expect(cellForPosition(1000, [98, 98], [200, 200]))
                .toEqual([11, 11])
        );
    });

}