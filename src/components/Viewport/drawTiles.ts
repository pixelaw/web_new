import {Coordinate, Dimension, TileStore} from "../../types.ts";
import {cellForPosition, viewToWorld, worldToView} from "../../utils.ts";
import {ZOOM_FACTOR} from "./constants.ts";

export async function drawTiles(
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

    // TODO deal with tileScaleFactor other than 1 (when zoomed out very far)

    const tileRenderSize = tileSize * (zoom / ZOOM_FACTOR)

    const TMP_TILE_GAPS = 0 //during dev, to see the tiles

    const [rawLeftOffset, rawTopOffset] = worldToView(worldTranslation, tileTopLeft);
    const leftOffset = (rawLeftOffset * scaleFactor) % tileRenderSize;
    const topOffset = (rawTopOffset * scaleFactor) % tileRenderSize;

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