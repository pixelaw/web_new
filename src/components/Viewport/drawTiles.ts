import {Coordinate, Dimension, MAX_UINT32, TileStore} from "../../types.ts";
import {cellForPosition, applyWorldOffset, getWrappedTileCoordinate, worldToView} from "../../utils.ts";
import {ZOOM_FACTOR} from "./constants.ts";


export function drawTiles(
    context: CanvasRenderingContext2D,
    zoom: number,
    cellOffset: Coordinate,
    dimensions: Dimension,
    worldOffset: Coordinate,
    tileStore: TileStore
) {

    // moved one tile and 5 pixels to the right
    worldOffset = [105, 0]

    // console.log("worldOffset",worldOffset[0])
    // Cells are not offset
    // cellOffset = [5, 0]

    const topleftWorld = applyWorldOffset(worldOffset, [0, 0])
    const bottomrightView = cellForPosition(zoom, cellOffset, [dimensions[0], dimensions[1]])
    const bottomrightWorld = applyWorldOffset(worldOffset, bottomrightView)

    const scaleFactor = zoom / ZOOM_FACTOR
    const [cellOffsetX, cellOffsetY] = cellOffset

    const tileset = tileStore.getTileset(
        zoom / ZOOM_FACTOR,
        [topleftWorld, bottomrightWorld]
    )
    if (!tileset) return

    // tileTopLeft is the world position of the topleft tile returned
    // for the given world coord (which is not "snapped" to a tile yet)
    const {tileRows, tileSize, bounds: [tileTopLeft]} = tileset
    const tileRenderSize = tileSize * scaleFactor

    // TODO deal with tileScaleFactor other than 1 (when zoomed out very far)

    const rawTileCoordinates: Coordinate = [
        getWrappedTileCoordinate(tileTopLeft[0], 0, tileRenderSize),
        getWrappedTileCoordinate(tileTopLeft[1], 0, tileRenderSize)
    ]

    const viewCoord = [
        worldToView(worldOffset[0], rawTileCoordinates[0], scaleFactor, tileSize),
        worldToView(worldOffset[1], rawTileCoordinates[1], scaleFactor, tileSize)
        ]

    function getBorderAdjustment(tileCoord: number): number {
        const isTileLeftOfBorder = (tileCoord + tileSize >= MAX_UINT32)
        if(isTileLeftOfBorder){
            const gap = 0 - (tileSize - MAX_UINT32 % tileSize)
            return gap
        }else{
            return 0
        }
    }

    let borderAdjustments: Coordinate = [
        getBorderAdjustment(tileTopLeft[0]),
        getBorderAdjustment(tileTopLeft[0])
    ]

    let destWidth = tileRenderSize + (borderAdjustments[0] * scaleFactor)
    let destHeight = tileRenderSize + (borderAdjustments[1] * scaleFactor)

    let destY = cellOffsetY + viewCoord[1]

    // Draw
    for (let y = 0; y < tileRows[0].length; y++) {

        let destX = cellOffsetX  + viewCoord[0]// - (borderAdjustments[0] * scaleFactor)

        for (let x = 0; x < tileRows.length; x++) {


            // if(x==1) break
            const tile = tileRows[x][y]
            if (!tile) continue

            // the coords the tiles are at, from the tileserver
            const rawTileCoordinates: Coordinate = [
                getWrappedTileCoordinate(tileTopLeft[0], x * tileRenderSize, tileRenderSize),
                getWrappedTileCoordinate(tileTopLeft[0], x * tileRenderSize, tileRenderSize)
                ]


            borderAdjustments = [
                getBorderAdjustment(rawTileCoordinates[0]),
                getBorderAdjustment(rawTileCoordinates[0])
            ]


            // sources are tileSize unless we're at the left/topmost border tile (negative from 0)
            const sourceWidth = tileSize + borderAdjustments[0]
            const sourceHeight = tileSize + borderAdjustments[1]


            destWidth = tileRenderSize + (borderAdjustments[0] * scaleFactor)
            destHeight = tileRenderSize + (borderAdjustments[1] * scaleFactor)


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
            destX += destWidth

        }
        destY += destHeight
    }
    console.groupEnd()
}