import type { JsonPatchOperation } from "../patch.type";
import type { TransportProvider } from "./transport.type";

// Mock transport provider assumes that clients run in the same process. This should only be used for testing or demos
const subscribers = new Set<(patches: JsonPatchOperation[]) => void>();

const mockTransportProviderImpl = <TState, TUser extends { id: string }>(
  initialState: TState
): TransportProvider<TState, TUser> => {
  return {
    broadcastPatches: async (patches) => {
      for (const subscriber of subscribers) {
        subscriber(patches);
      }
    },
    onPatches: (callback) => {
      subscribers.add(callback);
      return () => {
        subscribers.delete(callback);
      };
    },
    onInitState: async (callback) => {
      callback(initialState);
    },
    onDisconnect: () => {
      // No-op for mock transport
    },
    connect: () => {
      // No-op for mock transport
    },
    updateSelf: () => {
      // No-op for mock transport
    },
    onUserUpdate: () => {
      // No-op for mock transport
    },
    onUserJoin: () => {
      // No-op for mock transport
    },
    onUserDisconnect: () => {
      // No-op for mock transport
    },
  };
};

export { mockTransportProviderImpl as MockTransportProvider };
