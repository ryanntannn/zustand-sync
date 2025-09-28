import type { JsonPatchOperation } from "../patch.type";
import type { TransportProvider } from "./transport.type";

type WebSocketTransportConfig = {
  projectId: string;
  baseUrl?: string;
};

const websocketTransportProvider = <TState extends Object>(
  config: WebSocketTransportConfig
): TransportProvider<TState> => {
  const url = new URL(config.baseUrl ?? "ws://localhost:8080/ws");
  // append projectId as a new path segment
  url.pathname = `${url.pathname.replace(/\/$/, "")}/${config.projectId}`;

  let socket: WebSocket | null = null;
  let isConnected = false;
  let hasReceivedInitialState = false;
  let onInitStateCallback: ((initialState: Partial<TState>) => void) | null =
    null;

  const connect = () => {
    if (
      socket &&
      (socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING)
    ) {
      return; // Already connected or in the process of connecting
    }
    socket = new WebSocket(url.toString());
  };

  if (!isConnected) {
    connect();
  }

  return {
    broadcastPatches: async (patches) => {
      socket?.send(JSON.stringify(patches));
    },
    onPatches: (callback) => {
      socket!.onmessage = (event) => {
        if (!hasReceivedInitialState && onInitStateCallback) {
          try {
            onInitStateCallback(JSON.parse(event.data));
            hasReceivedInitialState = true;
          } catch (error) {
            socket!.close();
          }
          return;
        }
        try {
          const patches: JsonPatchOperation[] = JSON.parse(event.data);
          callback(patches);
        } catch (error) {
          console.error("Failed to parse incoming message", error);
        }
      };
      return () => {
        socket!.onmessage = null;
      };
    },
    onInitState: (callback) => {
      onInitStateCallback = callback;
    },
    onDisconnect: (callback) => {
      socket!.onclose = () => {
        isConnected = false;
        callback();
      };
    },
  };
};

export { websocketTransportProvider as WebSocketTransportProvider };
