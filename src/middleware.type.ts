import type { StateCreator } from "zustand";
import type { TransportProvider } from "./transport/transport.type";

export type Options<TState extends Object> = {
  transport: TransportProvider<TState>;
};

export type InnerState = <TState extends Object>(
  config: StateCreator<TState, [], []>,
  options: Options<TState>
) => StateCreator<
  TState & {
    isReady?: boolean;
  },
  [],
  []
>;
