import {useEffect} from 'react';
import {useViewStateStore} from '@/stores/ViewStateStore.ts';
import {useDojoAppStore} from "@/stores/DojoAppStore.ts";
import {PixelStore} from "@/webtools/types.ts";
import {IPixelawGameData} from "@/dojo/setupPixelaw.ts";
import getParamsDef from "@/dojo/utils/paramsDef.ts";
import {coordinateToPosition, hexRGBtoNumber} from "@/global/utils.ts";
import {DojoCall} from "@dojoengine/core";
import {Manifest, Position} from "@/global/types.ts";
import {generateDojoCall} from "@/dojo/utils/call.ts";

// TODO maybe cleaner to directly use the Dojo hook here, but its not working.
// For now passing the pixelStore
export const useDojoInteractHandler = (pixelStore: PixelStore, gameData: IPixelawGameData) => {
    const {clickedCell, selectedApp, color} = useViewStateStore();
    const {getByName} = useDojoAppStore()


    useEffect(() => {
        if (!clickedCell || !selectedApp) return;

        console.log(`Clicked cell ${clickedCell} with app: ${selectedApp}`);

        // Retrieve behavior for the app
        const app = getByName(selectedApp)

        // Retrieve info of the pixel
        const pixel = pixelStore.getPixel(clickedCell);

        // If the pixel is not set, or the action is not overridden, use the default "interact"
        const action = pixel && pixel.action !== "0x0"
            ? pixel.action
            : "interact"

        // Retrieve the signature of the action function from the manifest
        const p = getParamsDef(
            gameData.setup.manifest,
            `${selectedApp}_actions`,
            action,
            clickedCell,
            false
        )

        // Generate the DojoCall
        const dojoCall: DojoCall = generateDojoCall(
            gameData.setup.manifest,
            selectedApp,
            action,
            coordinateToPosition(clickedCell),
            hexRGBtoNumber(color),
        )
        console.log("dojoCall", dojoCall)
        // Execute the call
        gameData.dojoProvider.execute(gameData.account.account!, dojoCall).then(res => {
            console.log("dojocall", res)
            // Do something with the UI?
        })

    }, [clickedCell]);
};
