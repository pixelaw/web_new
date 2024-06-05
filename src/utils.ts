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

export function updateWorldTranslation(worldTranslation: Coordinate, cellDelta: Coordinate): Coordinate {

    const x = (worldTranslation[0] + cellDelta[0] + MAX_UINT32) % MAX_UINT32;
    const y = (worldTranslation[1] + cellDelta[1] + MAX_UINT32) % MAX_UINT32;

    return [x, y];
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

export function viewToWorld(worldTranslation: Coordinate, viewportCoord: Coordinate): Coordinate {

    let x = viewportCoord[0] - worldTranslation[0]
    let y = viewportCoord[1] - worldTranslation[1]

    x = x >= 0 ? x : 0xFFFFFFFF + x;
    y = y >= 0 ? y : 0xFFFFFFFF + y;

    return [x, y];
}




if (import.meta.vitest) {
    const { it, expect } = import.meta.vitest

    it('updateWorldTranslation should correctly update world coordinates', () => {
            expect(updateWorldTranslation([0, 0], [0, 0]))
                .toEqual([0, 0]);

            expect(updateWorldTranslation([-1, -1], [-1, -1]))
                .toEqual([MAX_UINT32 - 2, MAX_UINT32 - 2]);

            expect(updateWorldTranslation([1, 1], [-2, -2]))
                .toEqual([MAX_UINT32 - 1, MAX_UINT32 - 1]);

            expect(updateWorldTranslation([MAX_UINT32 - 1, MAX_UINT32 - 1], [2, 2]))
                .toEqual([1, 1]);

    })

    it('cellForPosition should return correct cell coordinates', () => {

        // 1 pixel onscreen is 1 in the world, and pos is topleft
        expect(cellForPosition(1000, [0, 0], [0, 0]))
            .toEqual([0, 0])

        // 1 pixel onscreen is 10 in the world, and pos is topleft
        expect(cellForPosition(1000, [0, 0], [0, 0]))
            .toEqual([0, 0])

        // 1 pixel onscreen is 10 in the world, and pos is topleft
        // There is an offset though, always positive 0-cellSize
        expect(cellForPosition(1000, [5, 5], [0, 0]))
            .toEqual([0, 0])

        // 1 pixel onscreen is 10 in the world, and pos is topleft
        // There is an offset though, always positive 0-cellSize
        expect(cellForPosition(
            1000,              // 10 onscreen pixels for a cell
            [5, 5],          // offset is less than half a cell size
            [4, 4])           // at pixel 9,9 effectively
        )
            .toEqual([0, 0])


        // 1 pixel onscreen is 10 in the world, and pos is topleft
        // There is an offset though, always positive 0-cellSize
        expect(cellForPosition(
            1000,              // 10 onscreen pixels for a cell
            [1, 1],          // offset is less than half a cell size
            [4, 4])           // at pixel 9,9 effectively
        )
            .toEqual([1, 1])

        // 1 pixel onscreen is 100 in the world, and pos is topleft
        // There is an offset though, always positive 0-cellSize
        expect(cellForPosition(
            1000,
            [98, 98],
            [200, 200])
        )
            .toEqual([11, 11])
    })

}