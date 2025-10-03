import type { JsonPatchOperation } from "../patch.type";

export type TransportProvider<TState, TUser extends { id: string }> = {
  broadcastPatches: (patches: JsonPatchOperation[]) => Promise<void>;
  onPatches: (callback: (patches: JsonPatchOperation[]) => void) => void;
  onInitState(callback: (initialState: Partial<TState>) => void): void;
  onDisconnect(callback: () => void): void;
  connect(self: TUser): void;
  updateSelf(user: TUser): void;
  onUserJoin(callback: (user: TUser) => void): void;
  onUserUpdate(callback: (user: TUser) => void): void;
  onUserDisconnect(callback: (userId: string) => void): void;
};
