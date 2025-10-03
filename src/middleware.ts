import type { InnerState } from "./middleware.type";
import { applyJSONPatch, generateJSONPatch } from "./patch";
import type { JsonPatchOperation } from "./patch.type";
import * as R from "ramda";
import { applyStateFilter } from "./util/state-filter";

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
        const oldState = applyStateFilter(options.storageKey ?? true, get());
        const oldSelf = get().self;
        // @ts-expect-error Not worth the type gymnastics
        set(...args);
        const newState = applyStateFilter(options.storageKey ?? true, get());
        const newSelf = get().self;
        const patch = generateJSONPatch(oldState, newState);
        // broadcast this patch to the server
        if (patch.length > 0 && get().isReady) {
          transportProvider.broadcastPatches(patch);
        }
        // detect state changes to the "self" key
        if (R.equals(oldSelf, newSelf)) {
          transportProvider.updateSelf(newSelf);
        }
      },
      () => get(),
      api
    );

    transportProvider.onPatches(onPatch);

    transportProvider.onInitState((initialState) => {
      set((state) => setIsReady(true, { ...state, ...initialState }));
    });

    transportProvider.onDisconnect(() => {
      set((state) => setIsReady(false, state));
    });

    transportProvider.onUserJoin((user) =>
      set(R.over(R.lensProp<any>("users"), R.append(user)))
    );

    transportProvider.onUserDisconnect((id) =>
      set(
        R.over(
          R.lensProp("users"),
          R.reject((user: { id: string }) => user.id === id)
        )
      )
    );

    transportProvider.onUserUpdate((user) => {
      set((state) => {
        const index = state.users.indexOf(user);
        if (index >= 0) {
          return R.set(R.lensPath<any>(["users", index]), user, state);
        } else {
          return state;
        }
      });
    });

    transportProvider.connect(options.user);

    return {
      ...innerStore,
      isReady: get()?.isReady,
      users: get()?.users ?? [],
      self: get()?.self ?? options.user,
    };
  };
};

export { middlewareImpl as syncStoreMiddleware };
