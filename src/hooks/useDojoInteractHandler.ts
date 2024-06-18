import {useEffect} from 'react';
import {useViewStateStore} from '@/stores/ViewStateStore.ts';
import {useDojoAppStore} from "@/stores/DojoAppStore.ts";
import {PixelStore} from "@/webtools/types.ts";
import {IPixelawGameData} from "@/dojo/setupPixelaw.ts";
import getParamsDef from "@/dojo/utils/paramsDef.ts";

// TODO maybe cleaner to directly use the Dojo hook here, but its not working.
// For now passing the pixelStore
export const useDojoInteractHandler = (pixelStore: PixelStore, gameData: IPixelawGameData) => {
    const {clickedCell, selectedApp} = useViewStateStore();
    const {getByName} = useDojoAppStore()


    useEffect(() => {
        if (!clickedCell || !selectedApp) return;

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


        console.log(p)
        console.log(`Clicked cell ${clickedCell} in ${app}`);
    }, [clickedCell]);
};
