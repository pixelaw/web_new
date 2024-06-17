import {useState} from 'react';
import { AppStore} from "../types.ts";
import {produce} from 'immer';
import {felt252ToString, felt252ToUnicode} from "../utils.ts";

import { useComponentValue, useEntityQuery } from "@dojoengine/react";
import { Has, getComponentValue } from "@dojoengine/recs";
import {Client} from "@dojoengine/torii-wasm";
import useDojoStore from "../../stores/DojoStore.ts";
import {shortString} from "starknet";

// type State = { [key: string]: App | undefined };



export function useToriiAppStore(): AppStore {
    // const [state, setState] = useState<State>({});

    const {client} = useDojoStore()


    function fetchData() : void {
        if(!client) return
        // client.getAllEntities(100,0).then((apps) => {
        //
        //     console.log(apps)
        // })
        const apps = useEntityQuery([Has(App)]);

        client.getEntities({
            clause: {
                Member: {
                    model: "App",
                    member: '',
                    operator: 'Eq'
                }
            },
            limit: 0,
            offset: 0

        }).then((apps) => {

            console.log(apps)
        })
    }

    const prepare = (): void => {
        fetchData()
    }

    const getByName = (name: string): App | undefined => {
        return state[name];
    };

    const getAll = (): App[] => {
        return Object.values(state).filter((app): app is App => app !== undefined);
    };

    return {getByName, getAll, prepare};
}
