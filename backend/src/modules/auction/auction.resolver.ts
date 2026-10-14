import { Types } from "mongoose";
import { AuctionLotState, AuctionState } from "../../interfaces/common.interface.ts";
import { Room } from "../../models/room.models.ts";
import { prepareNextLot } from "./auction.state.ts";
import { emitResolvedState } from "./auction.socket.ts";

export const isSameLotFilter = (roomId: string, lot: AuctionLotState) => ({
  roomId,
  status: "playing",
  "auctionState.status": "running",
  "auctionState.currentLot.playerId": lot.playerId,
  "auctionState.currentLot.lotEndsAt": lot.lotEndsAt,
  "auctionState.currentLot.currentBid": lot.currentBid,
  "auctionState.currentLot.highestBidderUserId": lot.highestBidderUserId,
});


export const resolveExpiredLot = async (
  roomId: string,
): Promise<AuctionState | null> => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const room = await Room.findOne({ roomId });
    const state = room?.auctionState as AuctionState | undefined;
    const lot = state?.currentLot;
    if (!room || !state || state.status !== "running" || !lot) return state ?? null;
    if (lot.lotEndsAt > Date.now()) return state;

    const nextState: AuctionState = structuredClone(state);
    if (lot.highestBidderUserId && lot.highestBidderTeamCode) {
      const team = nextState.teams[lot.highestBidderTeamCode];
      if (!team) throw new Error(`Winning team ${lot.highestBidderTeamCode} is missing`);
      team.purseRemaining -= lot.currentBid;
      team.slotsFilled += 1;
      if (lot.nationality !== "India") team.overseasCount += 1;
      team.squad.push({
        playerId: lot.playerId,
        playerName: lot.playerName,
        role: lot.role,
        nationality: lot.nationality,
        soldPrice: lot.currentBid,
      });
      nextState.sold.push({
        playerId: lot.playerId,
        playerName: lot.playerName,
        role: lot.role,
        nationality: lot.nationality,
        teamCode: lot.highestBidderTeamCode,
        soldPrice: lot.currentBid,
        buyerUserId: lot.highestBidderUserId,
      });
    } else {
      nextState.unsold.push(lot.playerId);
    }

    nextState.currentLot = null;
    await prepareNextLot(nextState);
    const isComplete = nextState.status === "complete";
    const updateResult = await Room.updateOne(
      {
        ...isSameLotFilter(roomId, lot),
        "auctionState.currentLot.lotEndsAt": { $lte: Date.now(), $eq: lot.lotEndsAt },
      },
      {
        $set: {
          auctionState: nextState,
          ...(isComplete ? { status: "finished" } : {}),
          soldLots: nextState.sold.map((sold) => ({
            ...sold,
            buyerUserId: new Types.ObjectId(sold.buyerUserId),
          })),
        },
      },
    );
    if (updateResult.modifiedCount === 1) {
      emitResolvedState(roomId, isComplete ? "finished" : "playing", nextState);
      return nextState;
    }
  }

  return (await Room.findOne({ roomId }))?.auctionState as AuctionState | null;
};