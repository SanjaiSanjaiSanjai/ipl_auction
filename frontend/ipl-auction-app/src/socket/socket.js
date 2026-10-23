import { io } from "socket.io-client";
import { getLocalStorage } from "../service/storage/localstorage";

const ACCESS_TOKEN_KEY = import.meta.env.VITE_ACCESS_TOKEN_KEY;
const socket = io(import.meta.env.VITE_BASE_URL, {
  transports: ["websocket"],
  autoConnect: false,
  withCredentials: true,
  // Do not force WebSocket only: polling supports proxies, then upgrades when possible.
  transports: ["polling", "websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 750,
  reconnectionDelayMax: 4000,
  auth: (callback) => callback({ token: ACCESS_TOKEN_KEY ? getLocalStorage(ACCESS_TOKEN_KEY) : null }),
});

export const connectSocket = () => {
  const token = ACCESS_TOKEN_KEY ? getLocalStorage(ACCESS_TOKEN_KEY) : null;
  if (!token || socket.connected || socket.active) return socket;

  socket.connect();
  return socket;
};

export const waitForSocketConnection = (timeout = 5000) => {
  if (socket.connected) return Promise.resolve();

  connectSocket();
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error("Socket connection timed out."));
    }, timeout);

    const cleanup = () => {
      window.clearTimeout(timer);
      socket.off("connect", onConnect);
      socket.off("connect_error", onError);
    };
    const onConnect = () => {
      cleanup();
      resolve();
    };
    const onError = (error) => {
      cleanup();
      reject(error);
    };

    socket.once("connect", onConnect);
    socket.once("connect_error", onError);
  });
};

socket.on("connect", () => {
  console.info("Socket connected", socket.id);
});

socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error.message);
});

socket.on("disconnect", (reason) => {
  console.info("Socket disconnected:", reason);
});

export default socket;
