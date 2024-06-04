import {Coordinate, Dimension, MAX_UINT32, TileStore} from "../../types.ts";
import {cellForPosition, viewToWorld} from "../../utils.ts";
import {ZOOM_FACTOR} from "./constants.ts";

export function worldToView(worldTranslation: Coordinate, worldCoord: Coordinate, scaleFactor, tileSize): Coordinate {
    const MAX_VIEW_SIZE = 1000000
    const tileRenderSize = tileSize * scaleFactor

    const [worldX, worldY] = worldCoord
    const [transX, transY] = worldTranslation

    // Apply the transform
    let x = worldX + transX
    let y = worldY + transY

    // Properly "Wrap" around MAX_UINT32
    if (x > MAX_VIEW_SIZE) x = 1 - MAX_UINT32 % x
    if (y > MAX_VIEW_SIZE) y = 1 - MAX_UINT32 % y

    // Adjust to the tile scaling
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
    const topleft = viewToWorld(worldTranslation, [0, 0])
    const br = cellForPosition(zoom, pixelOffset, [dimensions[0], dimensions[1]])
    const bottomright = viewToWorld(worldTranslation, br)


    const scaleFactor = zoom / ZOOM_FACTOR

    const tileset = tileStore.getTileset(
        zoom / ZOOM_FACTOR,
        [topleft, bottomright]
    )
    if (!tileset) return

    const {tileSize, bounds: [tileTopLeft]} = tileset
    const [tileLeft, tileTop] = tileTopLeft
    // TODO deal with tileScaleFactor other than 1 (when zoomed out very far)

    const tileRenderSize = tileSize * scaleFactor

    const TMP_TILE_GAPS = 0 //during dev, to see the tiles
    console.log("TRS", tileRenderSize)
    console.log("SF", scaleFactor)
    console.log("tile", tileLeft, tileTop)

    const [leftOffset, topOffset] = worldToView(worldTranslation, tileTopLeft, scaleFactor, tileSize);



    console.log("res", leftOffset, topOffset)

    // Draw
    for (let y = 0; y < tileset.tileRows[0].length; y++) {
        for (let x = 0; x < tileset.tileRows.length; x++) {

            const tile = tileset.tileRows[x][y]

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
}