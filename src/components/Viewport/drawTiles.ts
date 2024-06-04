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

    // transX is a uint32

    const [worldX, worldY] = worldCoord
    const [transX, transY] = worldTranslation

    // Apply the transform (without scaling yet)
    let x = (worldX + transX) >>> 0
    let y = (worldY + transY) >>> 0

    // We're expecting x to be related to viewport pixels now, which definitely
    // won't be any more than 100k (8k display is ~8k pixels)
    // If the x value is higher than 100k, we need to wrap it around uint32
    if (x > MAX_VIEW_SIZE) x = 1 - MAX_UINT32 % x
    if (y > MAX_VIEW_SIZE) y = 1 - MAX_UINT32 % y

    // Adjust in case the tile is on the border
    // Because tiles that cross the border are not rendered tileSize, but actually a bit shorter
    // This is because MAX_UINT32 ends in 295 and our tilesizes are typically multiples of 100
    x = (worldX + tileSize > MAX_UINT32) ? x - (tileSize - MAX_UINT32 % tileSize) : x
    y = (worldY + tileSize > MAX_UINT32) ? y - (tileSize - MAX_UINT32 % tileSize) : y

    // Scale
    x = (x * scaleFactor) % tileRenderSize;
    y = (y * scaleFactor) % tileRenderSize;

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
    console.group("drawTiles")
    const topleft = viewToWorld(worldTranslation, [0, 0])
    const br = cellForPosition(zoom, pixelOffset, [dimensions[0], dimensions[1]])
    const bottomright = viewToWorld(worldTranslation, br)


    const scaleFactor = zoom / ZOOM_FACTOR

    const tileset = tileStore.getTileset(
        zoom / ZOOM_FACTOR,
        [topleft, bottomright]
    )
    if (!tileset) return

    const {tileRows, tileSize, bounds: [tileTopLeft]} = tileset

    const [tileLeft, tileTop] = tileTopLeft
    // TODO deal with tileScaleFactor other than 1 (when zoomed out very far)

    const tileRenderSize = tileSize * scaleFactor

    const TMP_TILE_GAPS = 0 //during dev, to see the tiles
    // console.log("TRS", tileRenderSize)
    // console.log("SF", scaleFactor)

    console.log("tile", tileLeft, tileTop)

    const [leftOffset, topOffset] = worldToView(worldTranslation, tileTopLeft, scaleFactor, tileSize);


    // Draw
    for (let y = 0; y < tileRows[0].length; y++) {
        for (let x = 0; x < tileRows.length; x++) {

            const tile = tileRows[x][y]

            // tile can be null (still loading) or undefined (never loaded)
            if (!tile) continue

            context.drawImage(
                tile,
                leftOffset + (x * tileRenderSize + TMP_TILE_GAPS),
                topOffset + (y * tileRenderSize + TMP_TILE_GAPS),
                tileRenderSize - (TMP_TILE_GAPS * 2),
                tileRenderSize - (TMP_TILE_GAPS * 2)
            )
        }
    }
    console.groupEnd()
}