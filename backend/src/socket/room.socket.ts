import { Server, Socket } from "socket.io";
import {
  buildRoomPublicState,
  getRoomByRoomId,
} from "../service/room-state.service.ts";
import { startAuction } from "../service/auction.service.ts";
import { ValidationError } from "../errors/validation.error.ts";

export const RegisterRoomSocket = (io: Server, socket: Socket) => {
  // This runs once when Socket.IO accepts a new connection in server.ts.
  console.log(`[socket] connected: ${socket.id}`);

  // Frontend trigger: RoomPages.jsx emits ROOM_JOIN after the user enters a room.
  // Backend action: put this socket in the room so room-scoped events reach it.
  socket.on("ROOM_JOIN", async ({ roomId }: { roomId?: string } = {}) => {
    const normalizedRoomId = String(roomId || "")
      .trim()
      .toUpperCase();
    if (!normalizedRoomId) {
      console.warn(`[socket] ROOM_JOIN ignored: missing roomId (${socket.id})`);
      return;
    }
    try {
      const room = await getRoomByRoomId(normalizedRoomId, true);
      const userId = String(socket.data.userId || "");
      if (!room || !room.players.some((player) => String(player.userId) === userId)) {
        socket.emit("ROOM_ACCESS_REJECTED", { message: "You are not a member of this room." });
        return;
      }
      await socket.join(normalizedRoomId);
      console.log(`[socket] ROOM_JOIN -> ${normalizedRoomId} (${socket.id})`);
      const publicState = await buildRoomPublicState(room);
      socket.emit("ROOM_UPDATED", {
        roomId: room.roomId,
        state: publicState,
      });
      console.log(
        `[socket] ROOM_UPDATED sent to ${socket.id} for "${normalizedRoomId}"`,
      );
    } catch (err) {
      console.error(`[socket] Failed to fetch room ${normalizedRoomId}:`, err);
    }
  });

  // Frontend trigger: RoomPages.jsx emits ROOM_LEAVE before leaving/switching rooms.
  // Backend action: remove this socket so it stops receiving old-room updates.
  socket.on("ROOM_LEAVE", ({ roomId }: { roomId?: string } = {}) => {
    const normalizedRoomId = String(roomId || "")
      .trim()
      .toUpperCase();
    if (!normalizedRoomId) {
      console.warn(
        `[socket] ROOM_LEAVE ignored: missing roomId (${socket.id})`,
      );
      return;
    }
    void socket.leave(normalizedRoomId);
    console.log(`[socket] ROOM_LEAVE -> ${normalizedRoomId} (${socket.id})`);
  });

  // Socket.IO automatically removes all room memberships after disconnect.
  socket.on("disconnect", (reason) => {
    console.log(`[socket] disconnected: ${socket.id}; reason=${reason}`);
  });

  socket.on(
    "ROOM_START",
    async (
      { roomId }: { roomId?: string } = {},
      acknowledge?: (response: { ok: boolean; message?: string }) => void,
    ) => {
      console.log(`[socket] ROOM_START received for room ${roomId} (${socket.id})`);
      const rejectStart = (message: string) => {
        socket.emit("ROOM_START_REJECTED", { roomId, message });
        acknowledge?.({ ok: false, message });
      };

    const normalizedRoomId = String(roomId || "")
      .trim()
      .toUpperCase();
    if (!normalizedRoomId) {
      rejectStart("Room ID is required.");
      return;
    }
    try {
      const room = await getRoomByRoomId(normalizedRoomId, true);
      if (!room) {
        rejectStart("Room not found.");
        return;
      }
      const public_state = await buildRoomPublicState(room);
      const authenticatedUserId = String(socket.data.userId || "");
      if (!authenticatedUserId || authenticatedUserId !== public_state.createdBy) {
        rejectStart("Only the room host can start team selection.");
        return;
      }
      if (public_state.maxPlayers !== public_state.players.length) {
        rejectStart("Wait until every player has joined the room.");
        return;
      }
      if (public_state.status !== "team_selection") {
        rejectStart(
          public_state.status === "waiting"
            ? "The room is not full yet."
            : "Team selection has already started or this room is no longer available.",
        );
        return;
      }

      acknowledge?.({ ok: true });
      io.to(normalizedRoomId).emit("ROOM_STARTED", {
        roomId: normalizedRoomId,
      });
    } catch (error) {
      console.error(
        `[socket] Failed to start team selection for room ${normalizedRoomId}:`,
        error,
      );
      rejectStart("Could not start team selection. Please try again.");
    }
    },
  );

  socket.on(
    "AUCTION_START_PLAYING",
    async ({ roomId }: { roomId?: string; userId?: string } = {}) => {
      const normalizedRoomId = String(roomId || "")
        .trim()
        .toUpperCase();
      const rejectStart = (message: string) => {
        socket.emit("AUCTION_START_REJECTED", { message });
      };

      if (!normalizedRoomId) {
        rejectStart("Room ID is required to start playing.");
        return;
      }

      try {
        const room = await getRoomByRoomId(normalizedRoomId);
        console.log("current room details",room);
        if (!room) {
          rejectStart("Room not found.");
          return;
        }

        const publicState = await buildRoomPublicState(room);
        const authenticatedUserId = String(socket.data.userId || "");
        if (publicState.createdBy !== authenticatedUserId) {
          rejectStart("Only the room host can start playing.");
          return;
        }
        if (!publicState.players.some((player) => player.userId === authenticatedUserId)) {
          rejectStart("Only a room member can start playing.");
          return;
        }
        const onlineUserIds = new Set(
          (await io.in(normalizedRoomId).fetchSockets())
            .map((roomSocket) => String(roomSocket.data.userId || "")),
        );
        if (
          publicState.players.length !== publicState.maxPlayers ||
          !publicState.players.every((player) => onlineUserIds.has(player.userId))
        ) {
          rejectStart("All room members must be present before playing can start.");
          return;
        }
        if (
          room.status !== "team_selection" ||
          !publicState.players.every((player) => Boolean(player.teamCode))
        ) {
          rejectStart("All room members must select a team before playing can start.");
          return;
        }

        const state = await startAuction(room);
        if (state.status !== "running" || !state.currentLot) {
          rejectStart("The auction could not create its first player lot.");
          return;
        }
        io.to(normalizedRoomId).emit("AUCTION_PLAYING_STARTED", {
          roomId: normalizedRoomId,
        });
      } catch (error) {
        console.error(
          `[socket] Failed to start auction play for room ${normalizedRoomId}:`,
          error,
        );
        rejectStart(
          error instanceof ValidationError
            ? error.message
            : "The auction could not be started. Please try again.",
        );
      }
    },
  );
};
