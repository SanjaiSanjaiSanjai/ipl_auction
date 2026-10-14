import { AUCTION_RULES } from "../../constants/auction.ts";
import { AuctionLotState, AuctionPlayerSnapshot, AuctionState } from "../../interfaces/common.interface.ts";
import { AuctionPlayer } from "../../models/auction-player.models.ts";

export const snapshotPlayer = (
  player: AuctionPlayerSnapshot,
): AuctionLotState => ({
  ...player,
  currentBid: player.basePrice,
  highestBidderUserId: null,
  highestBidderTeamCode: null,
  lotEndsAt: Date.now() + AUCTION_RULES.lotDurationMs,
  isAccelerated: false,
  pass: 1,
});

export const getPlayerSnapshot = async (
  state: AuctionState,
  playerId: string,
): Promise<AuctionPlayerSnapshot> => {
  const snapshot = state.playerPool?.find((player) => player.playerId === playerId);
  if (snapshot) return snapshot;

  // Older room auctions did not persist their player catalog snapshot.
  const player = await AuctionPlayer.findOne({ playerCode: playerId }).lean();
  if (!player) {
    throw new Error(`Auction player ${playerId} is missing from the room snapshot and catalog`);
  }
  return {
    playerId: player.playerCode,
    playerName: player.name,
    role: player.role,
    nationality: player.nationality,
    basePrice: player.basePrice,
  };
};

export const shuffle = <T>(items: T[]): T[] => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
};