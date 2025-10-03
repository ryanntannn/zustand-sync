import { describe, it, expect } from "vitest";
import { create } from "zustand";
import { syncStoreMiddleware } from "../src/middleware";
import { MockTransportProvider } from "../src/transport/mock.transport";
describe("zustand-sync-middleware", () => {
  it("should not affect underlying store functionality", () => {
    type State = {
      count: number;
      increment: () => void;
      decrement: () => void;
      reset: () => void;
    };
    const useStore = create(
      syncStoreMiddleware<State>(
        (set) => ({
          count: 0,
          increment: () => set((state) => ({ count: state.count + 1 })),
          decrement: () => set((state) => ({ count: state.count - 1 })),
          reset: () => set({ count: 0 }),
        }),
        {
          transport: MockTransportProvider({ count: 0 }),
          user: {
            id: "1",
          },
        }
      )
    );

    const { increment } = useStore.getState();
    increment();
    expect(useStore.getState().count).toBe(1);
    useStore.getState().increment();
    expect(useStore.getState().count).toBe(2);
    useStore.getState().decrement();
    expect(useStore.getState().count).toBe(1);
    useStore.getState().reset();
    expect(useStore.getState().count).toBe(0);
  });

  it("should sync state between two stores", () => {
    type State = {
      count: number;
      increment: () => void;
      decrement: () => void;
      reset: () => void;
    };
    const useStoreA = create(
      syncStoreMiddleware<State>(
        (set) => ({
          count: 0,
          increment: () => set((state) => ({ count: state.count + 1 })),
          decrement: () => set((state) => ({ count: state.count - 1 })),
          reset: () => set({ count: 0 }),
        }),
        { transport: MockTransportProvider({ count: 0 }), user: { id: "1" } }
      )
    );
    const useStoreB = create(
      syncStoreMiddleware<State>(
        (set) => ({
          count: 0,
          increment: () => set((state) => ({ count: state.count + 1 })),
          decrement: () => set((state) => ({ count: state.count - 1 })),
          reset: () => set({ count: 0 }),
        }),
        { transport: MockTransportProvider({ count: 0 }), user: { id: "2" } }
      )
    );

    console.log("Initial state A:", useStoreA.getState());
    console.log("Initial state B:", useStoreB.getState());

    expect(useStoreA.getState().isReady).toBe(true);
    expect(useStoreB.getState().isReady).toBe(true);

    // Simulate mutation in state A, should sync to B
    useStoreA.getState().increment();
    expect(useStoreA.getState().count).toBe(1);
    expect(useStoreB.getState().count).toBe(1);
    // Simulate mutation in state B, should sync to A
    useStoreB.getState().increment();
    expect(useStoreA.getState().count).toBe(2);
    expect(useStoreB.getState().count).toBe(2);
    // Simulate mutation in state A, should sync to B
    useStoreA.getState().decrement();
    expect(useStoreA.getState().count).toBe(1);
    expect(useStoreB.getState().count).toBe(1);
    // Simulate race condition by incrementing both stores nearly simultaneously
    useStoreA.getState().increment();
    useStoreB.getState().increment();
    expect(useStoreA.getState().count).toBe(3);
    expect(useStoreB.getState().count).toBe(3);
    // Simulate mutation in state B, should sync to A
    useStoreB.getState().reset();
    expect(useStoreB.getState().count).toBe(0);
    expect(useStoreA.getState().count).toBe(0);
  });
});
