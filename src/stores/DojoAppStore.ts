import {App, AppStore} from "@/webtools/types.ts";
import {usePixelawProvider} from "@/providers/PixelawProvider.tsx";
import {shortString} from "starknet";
import {felt252ToUnicode} from "@/webtools/utils.ts";
import {getComponentValue} from "@dojoengine/recs";


export function useDojoAppStore(): AppStore {
    const {gameData} = usePixelawProvider();


    const prepare = (): void => {
        // Not implemented for Dojo
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const getByName = (name: string): App | undefined => {
        // TODO
        return;
    };

    const getAll = (): App[] => {
        if (!gameData) return []

        return gameData.setup.apps.reduce((acc: App[], appComponent) => {
            const app = fromComponent(appComponent)
            if (app) acc.push(app)
            return acc
        }, [])

    };

    return {getByName, getAll, prepare};
}

function fromComponent(appComponent: ReturnType<typeof getComponentValue>): App | undefined {
    if (!appComponent) return undefined
    return {
        name: shortString.decodeShortString(appComponent.name),
        icon: felt252ToUnicode(appComponent.icon),
        action: shortString.decodeShortString(appComponent.action),
        system: appComponent.system,
        manifest: appComponent.manifest,
        entity: {
            id: ""  // For now there's no reason
        }
    }
}