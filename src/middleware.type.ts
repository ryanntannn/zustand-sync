import type { StateCreator } from "zustand";
import type { TransportProvider } from "./transport/transport.type";
import type { StateFilter } from "./util/state-filter";

export type Options<TState, TUser extends { id: string }> = {
  transport: TransportProvider<TState, TUser>;
  storageKey?: StateFilter;
  user: TUser;
};

export type InnerState = <
  TState,
  TUser extends { id: string } = { id: string }
>(
  config: StateCreator<TState, [], []>,
  options: Options<TState, TUser>
) => StateCreator<
  TState & {
    isReady?: boolean;
    users: TUser[];
    self: TUser;
  },
  [],
  []
>;
