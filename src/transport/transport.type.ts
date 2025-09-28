import type { JsonPatchOperation } from "../patch.type";

export type TransportProvider<TState extends Object> = {
  broadcastPatches: (patches: JsonPatchOperation[]) => Promise<void>;
  onPatches: (callback: (patches: JsonPatchOperation[]) => void) => void;
  onInitState(callback: (initialState: Partial<TState>) => void): void;
  onDisconnect(callback: () => void): void;
};
