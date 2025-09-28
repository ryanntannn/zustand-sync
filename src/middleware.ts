import type { InnerState } from "./middleware.type";
import { applyJSONPatch, generateJSONPatch } from "./patch";
import type { JsonPatchOperation } from "./patch.type";
import * as R from "ramda";

// Explicitly type the object to help TypeScript infer the property
const setIsReady = R.set(R.lensProp<any>("isReady"));

const middlewareImpl: InnerState = (config, options) => {
  const transportProvider = options.transport;
  return (set, get, api) => {
    const onPatch = (incomingPatch: JsonPatchOperation[]) => {
      set((currentState) => applyJSONPatch(currentState, incomingPatch));
    };

    const innerStore = config(
      (...args) => {
        const { ...oldState } = get();
        // @ts-expect-error Not worth the type gymnastics
        set(...args);
        const { ...newState } = get();
        const patch = generateJSONPatch(oldState, newState);
        // broadcast this patch to the server
        if (patch.length > 0 && get().isReady) {
          transportProvider.broadcastPatches(patch);
        }
      },
      () => get(),
      api
    );

    transportProvider.onPatches(onPatch);

    transportProvider.onInitState((initialState) => {
      console.log("Received initial state:", initialState);
      set((state) => setIsReady(true, { ...state, ...initialState }));
      console.log("State after init:", get());
    });

    transportProvider.onDisconnect(() => {
      set((state) => setIsReady(false, state));
    });

    return { ...innerStore, isReady: get()?.isReady };
  };
};

export { middlewareImpl as syncStoreMiddleware };
