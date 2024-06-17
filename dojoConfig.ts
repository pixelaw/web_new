import manifest from "./public/assets/manifest.json";
import { createDojoConfig } from "@dojoengine/core";

export const dojoConfig = createDojoConfig({
  manifest,
  masterAddress: '0x003c4dd268780ef738920c801edc3a75b6337bc17558c74795b530c0ff502486',
  masterPrivateKey: '0x2bbf4f9fd0bbb2e60b0316c1fe0b76cf7a4d0198bd493ced9b8df2a3a24d68a'
});