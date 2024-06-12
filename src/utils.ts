import {Coordinate, MAX_UINT32} from "./types.ts";
import {ZOOM_FACTOR} from "./components/Viewport/constants.ts";
export const MAX_VIEW_SIZE = 1_000_000

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

export function getInitialOffset( tileCoord: number,worldCoord: number, offset: number) {
    // offset = uint2relative(offset)
    let result = worldCoord - tileCoord

    if(result > 0 && offset > 0) result -= 1
    return result
}

export function nextTileCoord(tileCoord: number, tileSize: number) {
    let result = tileCoord + tileSize
    if(result > MAX_UINT32) result = 0
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

export function uint2relative(nr: number): number {
    if (
        nr > MAX_UINT32
        || nr / MAX_UINT32 > 0.5
    ) {
        return nr - MAX_UINT32 - 1;
    }
    return nr;
}


export function relative2uint(nr: number): number {
    if (nr < 0) {
        return MAX_UINT32 + nr + 1;
    }
    return nr;
}


// Apply WorldOffset to viewport coordinates
// WorldOffset means "number to add to world to get view"
// So it returns "viewport - WorldOffset"
// Negative WO means the result increases
export function applyWorldOffset(worldOffset: Coordinate, viewportCoord: Coordinate): Coordinate {

    function fn(viewport: number, world: number): number{

        // const nor = world % 4294967295
        // Convert world to a relative value
        const rel = uint2relative(world)
        const raw  = viewport - rel
        const uint = relative2uint(raw)

        return uint
    }
    // Convert 4294967295 to -1
    // maxuint - 4294967295 -1

    // TODO properly handle input 4294967295
    /// 1 - raw - MAX_UINT32
    return [
        fn(viewportCoord[0] , worldOffset[0]) ,
        fn(viewportCoord[1] , worldOffset[1])
    ];
}

export function worldToView(
    worldOffset: number,
    worldCoord: number,
    scaleFactor: number,
    tileSize: number
): number {
    const tileRenderSize = tileSize * scaleFactor

    const tileWrapDiff = (MAX_UINT32 % tileSize)

    const startOfBorderTile = MAX_UINT32 - tileWrapDiff

    const isBorder = worldCoord >= startOfBorderTile

    const raw = worldCoord + uint2relative( worldOffset)

    const didCrossBorder = raw > MAX_UINT32

    // So MAX_UINT +1 (4294967296) needs to become 0
    const unwrapped = didCrossBorder
        ? 1 - raw - MAX_UINT32
        : raw


    let relative = unwrapped

    if((unwrapped > MAX_VIEW_SIZE && isBorder)){
        // example: 4294967294 (is -1)
        relative = unwrapped - MAX_UINT32

    }else if((unwrapped > MAX_VIEW_SIZE && !isBorder)){
        // example: 4294967205 (is -95)
        relative = unwrapped - MAX_UINT32 - (tileSize - tileWrapDiff)
    }


    // Scale
    const scaled = (relative * scaleFactor) % tileRenderSize;


    return scaled;
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

        it('crossing boundary: all 0, should return all 0 too', () =>
            expect(worldToView(1, 4294967200, 10, 100))
                .toEqual(-940)
        );

        it('not crossing boundary: 105 left of 4294967100', () =>
            // raw: 4294967205
            //
            expect(worldToView(105, 4294967100, 10, 100))
                .toEqual(-950)
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

    describe("applyWorldOffset should return correct cell coordinates", () => {

        it('zeroes', () =>
            expect(applyWorldOffset([0,0], [0, 0]))
                .toEqual([0, 0])
        );

        it('0 minus one', () =>
            expect(applyWorldOffset([4294967295,0], [0, 0]))
                .toEqual([1, 0])
        );

        it('160 minus 1', () =>
            expect(applyWorldOffset([4294967295,0], [160, 0]))
                .toEqual([161, 0])
        );

        it('-1 plus 1', () =>
            expect(applyWorldOffset([-1,0], [-1, 0]))
                .toEqual([0, 0])
        );

        it('plus 1', () =>
            expect(applyWorldOffset([1,0], [0, 0]))
                .toEqual([4294967295, 0])
        );
        it('plus 95', () =>
            expect(applyWorldOffset([95,0], [0, 0]))
                .toEqual([4294967201, 0])
        );
    })

    describe("uint2relative", () => {

        it('1', () => {
                expect(uint2relative(4294967200))
                    .toEqual(-96)
                expect(uint2relative(4294967295))
                    .toEqual(-1)
                expect(uint2relative(500))
                    .toEqual(500)
                expect(uint2relative(0))
                    .toEqual(0)

        }
        );
    })
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