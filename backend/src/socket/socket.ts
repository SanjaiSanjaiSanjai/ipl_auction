import { Server } from "socket.io";

let io: Server;

export const setSocketServerInstance = (server: Server) => {
    io = server;
}

export const getSocketServerInstance = (): Server => {
    if(!io){
        throw new Error("Socket.IO server instance is not set. please call setSocketServerInstance() first.");
    }
    else{
        return io;
    }
}