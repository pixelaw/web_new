import {Coordinate, Dimension, MAX_UINT32, TileStore} from "../../types.ts";
import {
    cellForPosition,
    applyWorldOffset,
    getWrappedTileCoordinate,
    worldToView,
    nextTileCoord,
    getInitialOffset
} from "../../utils.ts";
import {ZOOM_FACTOR} from "./constants.ts";



export function drawTiles(
    context: CanvasRenderingContext2D,
    zoom: number,
    pixelOffset: Coordinate,
    dimensions: Dimension,
    worldOffset: Coordinate,
    tileStore: TileStore
) {

    // moved one tile and 5 pixels to the right
    // worldOffset = [4294967295, 0]
    // worldOffset = [0, 0]

    console.log("worldOffset",worldOffset[0])
    // Cells are not offset
    // cellOffset = [0, 0]


    const topleftWorld = applyWorldOffset(worldOffset, [0, 0])
    const bottomrightView = cellForPosition(zoom, pixelOffset, [dimensions[0], dimensions[1]])
    const bottomrightWorld = applyWorldOffset(worldOffset, bottomrightView)

    console.log("topleftWorld", topleftWorld[0])

    const scaleFactor = zoom / ZOOM_FACTOR
    const [cellOffsetX, cellOffsetY] = pixelOffset

    const tileset = tileStore.getTileset(
        zoom / ZOOM_FACTOR,
        [topleftWorld, bottomrightWorld]
    )
    if (!tileset) return

    // tileTopLeft is the world position of the topleft tile returned for the given world coord (which is not "snapped" to a tile yet)
    const {tileRows, tileSize, bounds: [tileTopLeft]} = tileset

    // TODO deal with tileScaleFactor other than 1 (when zoomed out very far)

    let tileCoords = tileTopLeft

    let tileSizes = [
        (tileTopLeft[0] + tileSize > MAX_UINT32)?MAX_UINT32 % tileSize:tileSize,
        (tileTopLeft[1] + tileSize > MAX_UINT32)?MAX_UINT32 % tileSize:tileSize
    ]

    if(!tileRows.length) {
        console.log("norows");
        return
    }

    const initialOffsets: Coordinate = [
        getInitialOffset(tileTopLeft[0] , topleftWorld[0], worldOffset[0]),
        getInitialOffset(tileTopLeft[1] , topleftWorld[1],worldOffset[1])
    ]

    let destX = cellOffsetX - (initialOffsets[0] * scaleFactor)
    let destY = cellOffsetY + (initialOffsets[1] * scaleFactor)

    // Draw
    for (let y = 0; y < tileRows[0].length; y++) {


        for (let x = 0; x < tileRows.length; x++) {


            const tile = tileRows[x][y]
            if (!tile) continue


            const sourceWidth = tileSizes[0]
            const sourceHeight = tileSizes[1]

            const destWidth = tileSizes[0] * scaleFactor
            const destHeight = tileSizes[1] * scaleFactor

            context.drawImage(
                tile,       // source image
                0,      // source x
                0,      // source y
                sourceWidth,
                sourceHeight,
                destX,
                destY,
                destWidth,
                destHeight
            )

            // Set the next destX and destY based on the current tile widths
            destX += tileSizes[0] * scaleFactor

            // Next TileCoords
            tileCoords = [
                nextTileCoord(tileCoords[0], tileSizes[0]),
                nextTileCoord(tileCoords[1], tileSizes[1])
            ]

            // Next tilesize
            tileSizes = [
                (tileCoords[0] + tileSize > MAX_UINT32)?MAX_UINT32 % tileSize:tileSize,
                (tileCoords[1] + tileSize > MAX_UINT32)?MAX_UINT32 % tileSize:tileSize
            ]


        }
        destY += tileSizes[1] * scaleFactor
    }
    console.groupEnd()
}