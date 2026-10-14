import {AuctionPlayerSnapshot,AuctionState,IRoom,} from "../interfaces/common.interface.ts";
import { AUCTION_RULES, nextMinimumBid } from "../constants/auction.ts";
import { AuctionPlayer } from "../models/auction-player.models.ts";
import { Room } from "../models/room.models.ts";
import { ValidationError } from "../errors/validation.error.ts";
import { io } from "../server.ts";
import { buildInitialTeams, prepareNextLot } from "../modules/auction/auction.state.ts";
import { shuffle } from "../modules/auction/auction.player.ts";
import { isSameLotFilter, resolveExpiredLot } from "../modules/auction/auction.resolver.ts";
import { emitAuctionUpdate } from "../modules/auction/auction.socket.ts";


export const getAuctionState = async (roomId: string): Promise<AuctionState | null> => {
  const normalizedRoomId = roomId.toUpperCase();
  const room = await Room.findOne({ roomId: normalizedRoomId });
  const state = room?.auctionState as AuctionState | undefined;
  if (!state) return null;
  if (state.currentLot && state.currentLot.lotEndsAt <= Date.now()) {
    return resolveExpiredLot(normalizedRoomId);
  }
  return state;
};

export const startAuction = async (room: IRoom): Promise<AuctionState> => {
  const activePlayers = await AuctionPlayer.find({ isActive: true })
    .select("playerCode name role nationality basePrice")
    .lean();
  const playerPool: AuctionPlayerSnapshot[] = activePlayers.map((player) => ({
    playerId: player.playerCode,
    playerName: player.name,
    role: player.role,
    nationality: player.nationality,
    basePrice: player.basePrice,
  }));
  if (playerPool.length === 0) {
    throw new ValidationError("Cannot start auction: no active auction players are available.", [
      {
        field: "auctionPlayers",
        issue: "EMPTY_PLAYER_POOL",
        message: "Add at least one active auction player before starting.",
      },
    ]);
  }

  const state: AuctionState = {
    status: "running",
    lotIndex: 0,
    queue: shuffle(playerPool.map((player) => player.playerId)),
    acceleratedQueue: [],
    playerPool,
    currentLot: null,
    teams: buildInitialTeams(room),
    sold: [],
    unsold: [],
  };
  await prepareNextLot(state);

  const roomStatus = state.status === "complete" ? "finished" : "playing";
  const result = await Room.updateOne(
    { _id: room._id, status: "team_selection", auctionState: null },
    {
      $set: {
        status: roomStatus,
        auctionState: state,
        soldLots: [],
      },
    },
  );
  if (result.modifiedCount !== 1) {
    const currentRoom = await Room.findById(room._id);
    if (currentRoom?.auctionState) return currentRoom.auctionState as AuctionState;
    throw new Error(`Auction for room ${room.roomId} could not be initialized`);
  }

  if (roomStatus === "finished") {
    io.to(room.roomId).emit("ROOM_STATUS_CHANGED", {
      roomId: room.roomId,
      status: roomStatus,
    });
  }
  emitAuctionUpdate(room.roomId, state);
  return state;
};

export const placeBid = async (
  roomId: string,
  userId: string,
  teamCode: string,
  expectedPlayerId: string,
): Promise<{ ok: true; state: AuctionState } | { ok: false; error: string }> => {
  const normalizedRoomId = roomId.toUpperCase();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const room = await Room.findOne({ roomId: normalizedRoomId });
    const currentState = room?.auctionState as AuctionState | undefined;
    if (!room || !currentState || room.status !== "playing") {
      return { ok: false, error: "Auction is not active" };
    }

    if (currentState.currentLot && currentState.currentLot.lotEndsAt <= Date.now()) {
      await resolveExpiredLot(normalizedRoomId);
      return { ok: false, error: "The bidding window for this player has ended." };
    }
    const lot = currentState.currentLot;
    if (!lot || currentState.status !== "running") {
      return { ok: false, error: "No active lot" };
    }
    if (lot.playerId !== expectedPlayerId) {
      return { ok: false, error: "This player lot has ended." };
    }

    const team = currentState.teams[teamCode];
    if (!team || team.userId !== userId) {
      return { ok: false, error: "You are not assigned this franchise" };
    }
    if (team.slotsFilled >= AUCTION_RULES.slotsToFill) {
      return { ok: false, error: "Your squad slots are full" };
    }
    if (lot.highestBidderUserId === userId) {
      return { ok: false, error: "You are already the highest bidder" };
    }
    if (lot.nationality !== "India" && team.overseasCount >= AUCTION_RULES.overseasCap) {
      return { ok: false, error: "Overseas cap reached" };
    }

    const nextBid = lot.highestBidderUserId === null
      ? lot.basePrice
      : nextMinimumBid(lot.currentBid);
    if (nextBid > team.purseRemaining) {
      return { ok: false, error: "Insufficient purse" };
    }

    const nextState: AuctionState = structuredClone(currentState);
    const nextLot = nextState.currentLot;
    if (!nextLot) return { ok: false, error: "No active lot" };
    nextLot.currentBid = nextBid;
    nextLot.highestBidderUserId = userId;
    nextLot.highestBidderTeamCode = teamCode;
    nextLot.lotEndsAt = Date.now() + AUCTION_RULES.lotDurationMs;

    const result = await Room.updateOne(
      {
        ...isSameLotFilter(normalizedRoomId, lot),
        "auctionState.currentLot.lotEndsAt": { $gt: Date.now(), $eq: lot.lotEndsAt },
      },
      { $set: { auctionState: nextState } },
    );
    if (result.modifiedCount === 1) {
      emitAuctionUpdate(normalizedRoomId, nextState);
      return { ok: true, state: nextState };
    }
  }

  return { ok: false, error: "The auction changed while placing your bid. Please try again." };
};

let expiryWorker: NodeJS.Timeout | null = null;
let expirySweepRunning = false;

export const startAuctionExpiryWorker = (intervalMs = 1_000) => {
  if (expiryWorker) return;
  const sweep = async () => {
    if (expirySweepRunning) return;
    expirySweepRunning = true;
    try {
      const expiredRooms = await Room.find({
        status: "playing",
        "auctionState.status": "running",
        "auctionState.currentLot.lotEndsAt": { $lte: Date.now() },
      }).select("roomId").lean();
      await Promise.all(
        expiredRooms.map(async ({ roomId }) => {
          try {
            await resolveExpiredLot(roomId);
          } catch (error) {
            console.error(`[auction] Failed to resolve expired lot for ${roomId}:`, error);
          }
        }),
      );
    } catch (error) {
      console.error("[auction] Failed to scan for expired lots:", error);
    } finally {
      expirySweepRunning = false;
    }
  };

  expiryWorker = setInterval(() => void sweep(), intervalMs);
  expiryWorker.unref();
  void sweep();
};
