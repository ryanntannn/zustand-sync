import type { JsonPatchOperation } from "../patch.type";
import type { TransportProvider } from "./transport.type";

type WebSocketTransportConfig = {
  projectId: string;
  baseUrl?: string;
};

const websocketTransportProvider = <TState, TUser extends { id: string }>(
  config: WebSocketTransportConfig
): TransportProvider<TState, TUser> => {
  const url = new URL(config.baseUrl ?? "ws://localhost:8080/ws");
  // append projectId as a new path segment
  url.pathname = `${url.pathname.replace(/\/$/, "")}/${config.projectId}`;

  let socket: WebSocket | null = null;
  let isConnected = false;
  let hasReceivedInitialState = false;
  let onInitStateCallback: ((initialState: Partial<TState>) => void) | null =
    null;
  let onUserUpdateCallback: ((user: TUser) => void) | null = null;
  let onUserJoinCallback: ((user: TUser) => void) | null = null;
  let onUserDisconnectCallback: ((userId: string) => void) | null = null;
  let onPatchesCallback: ((patches: JsonPatchOperation[]) => void) | null =
    null;
  let onDisconnectCallback: (() => void) | null = null;

  const connect = (self: TUser) => {
    if (
      socket &&
      (socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING)
    ) {
      return; // Already connected or in the process of connecting
    }
    // encode user id as a query parameter
    url.searchParams.set("user", encodeURIComponent(JSON.stringify(self)));
    socket = new WebSocket(url.toString());
    socket.onmessage = (event) => {
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
        // check if the message is a user update
        const message = JSON.parse(event.data);
        switch (message.type) {
          case "USER_UPDATE":
            if (onUserUpdateCallback) {
              onUserUpdateCallback(message.payload);
            }
            return;
          case "USER_JOIN":
            if (onUserJoinCallback) {
              onUserJoinCallback(message.payload);
            }
            return;
          case "USER_DISCONNECT":
            if (onUserDisconnectCallback) {
              onUserDisconnectCallback(message.payload);
            }
            return;
        }
        // otherwise treat it as a patch
        const patches: JsonPatchOperation[] = JSON.parse(event.data);
        onPatchesCallback?.(patches);
      } catch (error) {
        console.error("Failed to parse incoming message", error);
      }
    };

    socket!.onclose = () => {
      isConnected = false;
      onDisconnectCallback?.();
    };
  };

  return {
    broadcastPatches: async (patches) => {
      socket?.send(JSON.stringify(patches));
    },
    onPatches: (callback) => {
      onPatchesCallback = callback;
    },
    onInitState: (callback) => {
      onInitStateCallback = callback;
    },
    onDisconnect: (callback) => {
      onDisconnectCallback = callback;
    },

    connect: (self: TUser) => {
      if (!isConnected) {
        connect(self);
      }
    },

    updateSelf: (user: TUser) => {
      socket?.send(JSON.stringify({ type: "USER_UPDATE", payload: user }));
    },

    onUserUpdate: (callback) => {
      onUserUpdateCallback = callback;
    },

    onUserJoin: (callback) => {
      onUserJoinCallback = callback;
    },

    onUserDisconnect: (callback) => {
      onUserDisconnectCallback = callback;
    },
  };
};

export { websocketTransportProvider as WebSocketTransportProvider };
