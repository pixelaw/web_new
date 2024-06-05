import { updateWorldTranslation, cellForPosition, getCellSize, viewToWorld } from '../src/utils.ts';
import { Coordinate } from '../src/types.ts';
import { expect, test, describe } from 'vitest'

describe('Utils Tests', () => {

    test('updateWorldTranslation should correctly update world coordinates', () => {
        const worldTranslation: Coordinate = [100, 200];
        const cellDelta: Coordinate = [10, -20];
        const result = updateWorldTranslation(worldTranslation, cellDelta);
        expect(result).toEqual([110, 180]);
    });

    test('cellForPosition should return correct cell coordinates', () => {
        const zoom = 2;
        const pixelOffset: Coordinate = [10, 10];
        const position: Coordinate = [50, 50];
        const result = cellForPosition(zoom, pixelOffset, position);
        expect(result).toEqual([20, 20]); // Adjust expected values based on your logic
    });

    test('getCellSize should return correct cell size', () => {
        const zoom = 4;
        const result = getCellSize(zoom);
        expect(result).toBe(zoom / 2); // Adjust based on ZOOM_FACTOR
    });

    test('viewToWorld should convert viewport coordinates to world coordinates', () => {
        const worldTranslation: Coordinate = [100, 200];
        const viewportCoord: Coordinate = [150, 250];
        const result = viewToWorld(worldTranslation, viewportCoord);
        expect(result).toEqual([50, 50]); // Adjust expected values based on your logic
    });

});
