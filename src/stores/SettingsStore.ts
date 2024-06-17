import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import manifest from "../dojo/manifest";

type DojoConfig = {
    rpcUrl: string;
    toriiUrl: string;
    relayUrl?: string;
    masterAddress?: string;
    masterPrivateKey?: string;
    accountClassHash?: string;
    feeTokenAddress?: string;
    manifest: any;
};

interface DojoConfigResult {
    config: DojoConfig;
    isSuccess: boolean;
    error: Error | string | undefined;
}

export interface ISettingsStore {
    config: DojoConfig | undefined;
    configIsValid: boolean;
    configError?: Error | string | undefined;
    worldAddress?: string;
    setDojoConfig(data: Partial<DojoConfig>): Promise<void>;
    setSettings(data: Partial<ISettingsStore>): void; // catch all
    setWorldAddress(address: string): Promise<void>;
}

export const defaultDojoConfig: DojoConfig = {
    relayUrl: "http://localhost:8080",
    rpcUrl: "http://localhost:5050",
    toriiUrl: "http://localhost:8080",
    manifest: manifest(
        "0x308cf899b99ecd34b86ceed1d7ee1c1567cec44cff625bb732732a44c41a1b8"
    ),
    masterAddress:
        "0x003c4dd268780ef738920c801edc3a75b6337bc17558c74795b530c0ff502486",
    masterPrivateKey:
        "0x2bbf4f9fd0bbb2e60b0316c1fe0b76cf7a4d0198bd493ced9b8df2a3a24d68a",
};

const checkUrl = async (url: string) => {
    try {
        await fetch(url);
        return true;
    } catch (e) {
        throw new Error(`Invalid URL: ${url}`);
    }
};

const checkUrls = async (urls: string[]): Promise<boolean> => {
    try {
        const results = await Promise.all(urls.map(checkUrl));
        return results.every((result) => result);
    } catch (e) {
        throw e;
    }
};

const checkDojoConfig = async (
    config: DojoConfig
): Promise<DojoConfigResult> => {
    const result = {
        config,
        isSuccess: true,
        error: undefined,
    } as DojoConfigResult;
    await checkUrls([config.rpcUrl, config.toriiUrl]).catch((e) => {
        result.isSuccess = false;
        result.error = e;
        throw e;
    });
    return result;
};

const useSettingsStore = create<ISettingsStore>()(
    immer((set, get) => ({
        config: undefined,
        configIsValid: true,
        worldAddress:
            "0xfea84b178ab1dc982ef9e369246f8c4d53aea52ea7af08879911f436313e4e",
        setDojoConfig: async (data: Partial<DojoConfig>) => {
            try {
                const newConfig = {
                    ...defaultDojoConfig,
                    ...get().config,
                    ...data,
                } as DojoConfig;
                await checkDojoConfig(newConfig);
                set((state) => {
                    Object.assign(state, { config: newConfig, configIsValid: true });
                });
            } catch (e) {
                set((state) => {
                    state.config = undefined;
                    state.configIsValid = false;
                    state.configError = e as Error;
                });
                throw new Error(`Failed to set dojo config: ${e}`);
            }
        },
        setSettings: (data: Partial<ISettingsStore>) => {
            set((state) => {
                Object.assign(state, data);
            });
        },
        setWorldAddress: async (address: string) => {
            console.warn("unimplemented");
            // TODO: update the world address
        },
    }))
);

const { getState: getSettingsStore } = useSettingsStore;
const setDojoConfig = getSettingsStore().setDojoConfig; // syntactic sugar

// uses the set function to validate the default config
setDojoConfig(defaultDojoConfig);

export { getSettingsStore, useSettingsStore, setDojoConfig };
