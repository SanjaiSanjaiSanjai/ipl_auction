import { io } from "socket.io-client";
import { getLocalStorage } from "../service/storage/localstorage";

const ACCESS_TOKEN_KEY = import.meta.env.VITE_ACCESS_TOKEN_KEY;
const socket = io("http://localhost:4000", {
  transports: ["websocket"],
  autoConnect: false,
  withCredentials: true,
  auth: (callback) => {
    callback({ token: getLocalStorage(ACCESS_TOKEN_KEY) });
  },
});

// Connection test
socket.on("connect", () => {
    console.log("✅ SOCKET CONNECTED");
    console.log("Socket ID:", socket.id);
});

// Connection error
socket.on("connect_error", (error) => {
    console.error("❌ SOCKET CONNECTION ERROR:", error.message);
});

// Disconnect
socket.on("disconnect", (reason) => {
    console.log("❌ SOCKET DISCONNECTED:", reason);
});

// Receive ANY Socket.IO event
socket.onAny((event, ...args) => {
    console.log("📥 SOCKET EVENT RECEIVED:", event, args);
});

socket.on("ROOM_STARTED", (data) => {
    console.log("🔥 ROOM_STARTED:", data);
});
export default socket;