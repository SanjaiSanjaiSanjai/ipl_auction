import { AuctionState } from "../../interfaces/common.interface.ts";
import { io } from "../../server.ts";

export const emitAuctionUpdate = (roomId: string, state: AuctionState) => {
  io.to(roomId).emit("AUCTION_UPDATED", { roomId, state });
};


export const emitResolvedState = (roomId: string, roomStatus: string, state: AuctionState) => {
  if (roomStatus === "finished") {
    io.to(roomId).emit("ROOM_STATUS_CHANGED", { roomId, status: roomStatus });
  }
  emitAuctionUpdate(roomId, state);
};