import {App, AppStore} from "@/webtools/types.ts";
import {usePixelawProvider} from "@/providers/PixelawProvider.tsx";
import {getEntityIdFromKeys} from "@dojoengine/utils";
import {shortString} from "starknet";
import {felt252ToUnicode} from "@/webtools/utils.ts";

// type State = { [key: string]: App | undefined };


export function useDojoAppStore(): AppStore {
    const {gameData} = usePixelawProvider();


    const prepare = (): void => {
        // Not implemented for Dojo
    }

    const getByName = (name: string): App | undefined => {
        // TODO
        return;
    };

    const getAll = (): App[] => {
        if (!gameData) return []

        const all = gameData.setup.apps.map((appComponent): App => {
            return fromComponent(appComponent)
        })
        return all;
    };

    return {getByName, getAll, prepare};
}

function fromComponent(appComponent): App {
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