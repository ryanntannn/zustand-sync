import { create } from "zustand";
import { syncStoreMiddleware, WebSocketTransportProvider } from "zustand-sync";

type ExampleStore = {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
};

export const useExampleStore = create(
  syncStoreMiddleware(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
      decrement: () => set((state) => ({ count: state.count - 1 })),
      reset: () => set({ count: 0 }),
    }),
    {
      transport: WebSocketTransportProvider<ExampleStore>({
        projectId: "your-project-id",
      }),
    }
  )
);
