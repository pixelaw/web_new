import {Coordinate, Dimension, MAX_UINT32, TileStore} from "../../types.ts";
import {cellForPosition, viewToWorld} from "../../utils.ts";
import {ZOOM_FACTOR} from "./constants.ts";

export function worldToView(
    worldTranslation: Coordinate,
    worldCoord: Coordinate,
    scaleFactor: number,
    tileSize: number
): Coordinate {
    const MAX_VIEW_SIZE = 1_000_000
    const tileRenderSize = tileSize * scaleFactor
    const [worldX, worldY] = worldCoord
    const [transX, transY] = worldTranslation
    // console.log(worldX, transX)

    // Apply the transform (without scaling yet)
    let x = (worldX + transX) >>> 0
    let y = (worldY + transY) >>> 0
    // console.log(x)

    // We're expecting x to be related to viewport pixels now, which definitely
    // won't be any more than 100k (8k display is ~8k pixels)
    // If the x value is higher than 100k, we need to wrap it around uint32
    if (x > MAX_VIEW_SIZE) x = 0 - MAX_UINT32 % x
    if (y > MAX_VIEW_SIZE) y = 0 - MAX_UINT32 % y

    // Adjust in case the tile is on the border
    // Because tiles that cross the border are not rendered tileSize, but actually a bit shorter
    // This is because MAX_UINT32 ends in 295 and our tilesizes are typically multiples of 100
    // So in case of a zoom = 100 (1 to 1)
    //      if tileserver gives MAX_UINT32-95 = 4294967200 for the tile coord
    //      then we want to translate that to -95 in the viewport, because the tile should start 5 pixels offscreen only
    //      It will be drawn, but the last 5 pixels (if tilesize 100) will be overwritten by the next iteration
    if (worldX + tileSize >= MAX_UINT32) {
        console.log("a", worldX, (tileSize - MAX_UINT32 % tileSize))
    }
    // x = (worldX + tileSize >= MAX_UINT32) ? x - (tileSize - MAX_UINT32 % tileSize) : x
    // y = (worldY + tileSize >= MAX_UINT32) ? y - (tileSize - MAX_UINT32 % tileSize) : y

    // Scale
    x = (x * scaleFactor) % tileRenderSize;
    y = (y * scaleFactor) % tileRenderSize;
    // console.log(x)
    return [x, y];
}

export function drawTiles(
    context: CanvasRenderingContext2D,
    zoom: number,
    pixelOffset: Coordinate,
    dimensions: Dimension,
    worldTranslation: Coordinate,
    tileStore: TileStore
) {

    const topleft = viewToWorld(worldTranslation, [0, 0])
    const br = cellForPosition(zoom, pixelOffset, [dimensions[0], dimensions[1]])
    const bottomright = viewToWorld(worldTranslation, br)

    // Rendering is weird for topleft=0


    const scaleFactor = zoom / ZOOM_FACTOR

    const tileset = tileStore.getTileset(
        zoom / ZOOM_FACTOR,
        [topleft, bottomright]
    )
    if (!tileset) return

    const {tileRows, tileSize, bounds: [tileTopLeft]} = tileset


    // TODO deal with tileScaleFactor other than 1 (when zoomed out very far)

    const tileRenderSize = tileSize * scaleFactor


    /*
     Bouncing problem:
        LeftOffset stays at 0 while viewX makes another cycle
        So worldToView gets "stuck" in one cycle it seems


     Also,
        The rightmost tile needs an offset  (uint-tilesize .. ) to the left, so its cut of the remainder
        right now the tile is not cut properly
     */
    function getBorderAdjustment(tileCoord: number) {
        let result = (tileCoord + tileSize >= MAX_UINT32) ? 0 - (tileSize - MAX_UINT32 % tileSize) : 0
        // result = (result * scaleFactor) % tileRenderSize
        return result
    }

    const [cellOffsetX, cellOffsetY] = pixelOffset

    const [tileOffsetX, tileOffsetY] = worldToView(worldTranslation, tileTopLeft, scaleFactor, tileSize);
    const borderAdjustmentX = getBorderAdjustment(tileTopLeft[0])
    const borderAdjustmentY = getBorderAdjustment(tileTopLeft[1])
    console.log("borderAdjustmentX", borderAdjustmentX,"borderAdjustmentY", borderAdjustmentY)

    // Draw
    for (let y = 0; y < tileRows[0].length; y++) {
        for (let x = 0; x < tileRows.length; x++) {

            // const bax = (x===1) ? borderAdjustmentX:0
            // const bay = (y===1) ? borderAdjustmentY:0

            const tile = tileRows[x][y]


            // tile can be null (still loading) or undefined (never loaded)
            // if(x==0) console.log(viewX , leftOffset , (x * tileRenderSize))
            if (!tile) continue

            /*
                        context.drawImage(
                            tile,
                            cellOffsetX + tileOffsetX + (x * tileRenderSize) + bax,
                            cellOffsetY + tileOffsetY + (y * tileRenderSize),
                            tileRenderSize ,
                            tileRenderSize
                        )
            */

            // sources are tileSize unless we're at the left/topmost border tile (negative from 0)
            let sourceWidth = tileSize
            if (x===0) sourceWidth -= borderAdjustmentX

            let sourceHeight = tileSize
            if (y===0) sourceHeight -= borderAdjustmentY

            let destX = cellOffsetX + tileOffsetX + (x * tileRenderSize)
            if(x===1) destX -= (borderAdjustmentX * scaleFactor) % tileRenderSize

            let destY = cellOffsetY + tileOffsetY + (y * tileRenderSize)
            if(y===1) destY -= (borderAdjustmentY * scaleFactor) % tileRenderSize

            let destWidth = tileRenderSize
            if (x === 0)  destWidth += (borderAdjustmentX * scaleFactor) % tileRenderSize

            let destHeight = tileRenderSize
            if (y === 0)  destHeight += (borderAdjustmentY * scaleFactor) % tileRenderSize

            console.log("sourceWidth", destWidth)
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
        }
    }
    console.groupEnd()
}