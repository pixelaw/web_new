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
    /*
    Need to know while tiles for
    - zoomlevel
    - worldCoords box

    Math is based on
    - zoomlevel
    - tilesize

    We have tiles for 2 "factors". The factor is how many pixels are included in 1
    - zoomlevel to zoomfactor is a 1/4 division TODO: not sure if this is gonna work
    - 1: zoomlevel 4 (1 pixel to 1 cell)
    - 4: zoomlevel 1 (4 pixels to 1 cell)

    Tiles are organized as files with [factor]_[x]_[y].png

    DrawTile can determine with tiles to retrieve by
    - Determining factor from zoom
    - getting leftmost world coordinate (floored to nearest tilesize multiple)
    - getting rightmost world coordinate (ceilinged to nearest tilesize multiple)
    - getting topmost world coordinate (floored to nearest tilesize multiple)
    - getting bottom-most world coordinate (ceilinged to nearest tilesize multiple)
    - TODO if we're wrapping around u32 also need to do some modulo stuff here
    - From factor and world coords get the tile indexes (for factor 1 its the same, for factor 4 multiply)

     */
    // const cellSize = getCellSize(zoom)

    /*    const _gridDimensions = [
            Math.ceil(dimensions[0] / cellSize),
            Math.ceil(dimensions[1] / cellSize)
        ]*/

    const topleft = viewToWorld(worldTranslation, [0, 0])
    const br = cellForPosition(zoom, pixelOffset, [dimensions[0], dimensions[1]])
    const bottomright = viewToWorld(worldTranslation, br)

    /*
        // TODO we want to also request offscreen coords - or should we send cellSize so the tile engine can decide?
        // If tilesize > cellSize, always giving one extra tile around the requested area is okay

        // Figure out the number of columns we received
        // const width = tileset.tileSize

        // ZOOM_FACTOR=100
        // with zoom=1, cellPerPixel is 100, pixelPerCell is 0.01 -> very compressed
        // Zoom can go up to 1000 or as needed depending on the screen pixel density
        // with zoom = 100, its 1 pixel per cell, and zoom 1000 is 10 pixels per cell
        // const scaleFactor = zoom / ZOOM_FACTOR

        // zoomed out 100x (zoom=1): coordPerPixel = 100
        // zoomed in 100x (zoom=100) : coordPerPixel = 0.1 (so 10 pixelPerCoord)
        // const cellPerPixel = ZOOM_FACTOR / zoom
    */
const scaleFactor = zoom / ZOOM_FACTOR

    const tileset = tileStore.getTileset(
        zoom / ZOOM_FACTOR,
        [topleft, bottomright]
    )
    if (!tileset) return

    const {tileRows, tileSize, scaleFactor: tileScaleFactor, bounds: [tileTopLeft, tileBottomRight]} = tileset

    // TODO deal with tileScaleFactor other than 1 (when zoomed out very far)

    const tileRenderSize = tileSize * (zoom / ZOOM_FACTOR)

    const TMP_TILE_GAPS = 0 //during dev, to see the tiles

    const [rawLeftOffset, rawTopOffset] = worldToView(worldTranslation, tileTopLeft);
    const leftOffset = (rawLeftOffset * scaleFactor) % tileRenderSize;
    const topOffset = (rawTopOffset * scaleFactor) % tileRenderSize;

    console.log("tileRenderSize", tileRenderSize)

    console.log("raw offsets", rawLeftOffset, rawTopOffset)
    console.log("offsets", leftOffset, topOffset)


    /*
    # Issue with "jumping tiles" when panning
    - when moving to the left, offset goes from 0 to -100
    - when it reaches -100, it rolls over to 0
    - at the same time, the tile returned switches to one more to the left
        - the "jump" is not an entire tile's width
        - the jump is not happening at zoom=100
    - it seems dependent on zoomlevel, but why?
     */

    // Draw
    for (let y = 0; y < tileset.tileRows[0].length; y++) {
        for (let x = 0; x < tileset.tileRows.length; x++) {

            const tile = tileset.tileRows[x][y]
            if (tile == null || tile == undefined) continue
            // console.log("--------", leftOffset, x)
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