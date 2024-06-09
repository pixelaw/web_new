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

// TODO check if this works with negative change
export function getWrappedTileCoordinate(startingWorldCoordinate: number, index: number, tileRenderSize: number) {
    startingWorldCoordinate >>>= 0;
    let result = ((startingWorldCoordinate >>> 0) + index) >>> 0
    if (startingWorldCoordinate > result) {
        result -= result % tileRenderSize
    }
    return result
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
export function applyWorldOffset(worldTranslation: Coordinate, viewportCoord: Coordinate): Coordinate {

    return [
        (viewportCoord[0] - worldTranslation[0]) >>> 0,
        (viewportCoord[1] - worldTranslation[1]) >>> 0
    ];
}

export function worldToView(
    worldOffset: number,
    worldCoord: number,
    scaleFactor: number,
    tileSize: number
): number {
    const MAX_VIEW_SIZE = 1_000_000
    const tileRenderSize = tileSize * scaleFactor

    // Apply the transform (without scaling yet)
    // It is possible the worldCoord overflows the uint32, and we wrap it around immediately

    const rawTranslation = worldCoord + worldOffset

    // So MAX_UINT +1 (4294967296) needs to become 0
    const unwrappedTranslation = rawTranslation > MAX_UINT32
        ? 1 - rawTranslation - MAX_UINT32
        : rawTranslation


    // We're expecting x to be related to viewport pixels now, which definitely
    // won't be any more than 100k (8k display is ~8k pixels)
    //  The range should be -1000 to 1920 (full hd pixel width)
    // If the x value is higher than 100k, we need to wrap it around uint32
    // So for example, 4294967294 becomes -2
    // So for example, 4294967201 becomes -94
    const negativeTranslation = (unwrappedTranslation > MAX_VIEW_SIZE)
        ? unwrappedTranslation - MAX_UINT32
        : unwrappedTranslation;


    // Scale
    const scaledCoord = (negativeTranslation * scaleFactor) % tileRenderSize;


    return scaledCoord;
}

export function worldToView2(
    worldOffset: Coordinate,
    worldCoord: Coordinate,
    scaleFactor: number,
    tileSize: number
): Coordinate {
    const MAX_VIEW_SIZE = 1_000_000
    const tileRenderSize = tileSize * scaleFactor
    const [worldX, worldY] = worldCoord
    const [transX, transY] = worldOffset

    // Apply the transform (without scaling yet)
    const x = (worldX + transX) >>> 0
    let y = (worldY + transY) >>> 0
    // console.log(x)

    // We're expecting x to be related to viewport pixels now, which definitely
    // won't be any more than 100k (8k display is ~8k pixels)
    // If the x value is higher than 100k, we need to wrap it around uint32
    // So for example, 4294967294 becomes -2
    if (x > MAX_VIEW_SIZE) {
        x = -1 * (1 + (MAX_UINT32 % x))
    }
    if (y > MAX_VIEW_SIZE) y = -1 * (1 + (MAX_UINT32 % y))

    // Adjust in case the tile is on the border
    // Because tiles that cross the border are not rendered tileSize, but actually a bit shorter
    // This is because MAX_UINT32 ends in 295 and our tilesizes are typically multiples of 100
    // So in case of a zoom = 100 (1 to 1)
    //      if tileserver gives MAX_UINT32-95 = 4294967200 for the tile coord
    //      then we want to translate that to -95 in the viewport, because the tile should start 5 pixels offscreen only
    //      It will be drawn, but the last 5 pixels (if tilesize 100) will be overwritten by the next iteration

    // if (worldX + tileSize >= MAX_UINT32) {
    //     console.log("gapX", (tileSize - MAX_UINT32 % tileSize))
    // }

    // Apply the gap if this is a border coordinate (move left a little less)
    x = (worldX + tileSize >= MAX_UINT32) ? x - (tileSize - MAX_UINT32 % tileSize) : x
    y = (worldY + tileSize >= MAX_UINT32) ? y - (tileSize - MAX_UINT32 % tileSize) : y

    // Scale
    x = (x * scaleFactor) % tileRenderSize;
    y = (y * scaleFactor) % tileRenderSize;
    // console.log(x)
    return [x, y];
}

if (import.meta.vitest) {
    const {it, expect, describe} = import.meta.vitest
    describe("worldToView should correctly return view coordinates", () => {

        it('all 0, should return all 0 too', () =>
            expect(worldToView(0, 0, 10, 100))
                .toEqual(0)
        );

        it('shifting 2 right from origin', () =>
            expect(worldToView(2, 0, 10, 100))
                .toEqual(20)
        );

        it('shifting 1 right from origin', () =>
            expect(worldToView(1, 0, 10, 100))
                .toEqual(10)
        );

        it('shifting 2 left from origin', () =>
            expect(worldToView(-2, 0, 10, 100))
                .toEqual(-20)
        );

        it('shifting 1 left from origin', () =>
            expect(worldToView(-1, 0, 10, 100))
                .toEqual(-10)
        );

        it('all 0, should return all 0 too', () =>
            expect(worldToView(1, 4294967200, 10, 100))
                .toEqual(-940)
        );
    })

    describe("viewToWorld should correctly return world coordinates", () => {

        it('all 0, should return all 0 too', () =>
            expect(applyWorldOffset([0, 0], [0, 0]))
                .toEqual([0, 0])
        );

        it('No translation should result in same as input', () =>
            expect(applyWorldOffset([0, 0], [1, 1]))
                .toEqual([1, 1])
        );

        it('Translation by negative 1 of 0 should give -1 (max_uint)', () =>
            expect(applyWorldOffset([1, 1], [0, 0]))
                .toEqual([4_294_967_295, 4_294_967_295])
        );

        it('Moving [-1,-1] by 2 to rightbottom', () =>
            expect(applyWorldOffset([4_294_967_294, 4_294_967_294], [4_294_967_295, 4_294_967_295]))
                .toEqual([1, 1])
        );

        it('Moving [1,1] by 2 into the topleft', () =>
            expect(applyWorldOffset([2, 2], [1, 1]))
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
                .toEqual([MAX_UINT32, MAX_UINT32])
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