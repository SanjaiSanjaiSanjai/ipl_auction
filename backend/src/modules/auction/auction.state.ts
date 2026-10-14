import { AUCTION_RULES } from "../../constants/auction.ts";
import { AuctionState, IRoom, TeamPurseState } from "../../interfaces/common.interface.ts";
import { getPlayerSnapshot, snapshotPlayer } from "./auction.player.ts";

export const buildInitialTeams = (room: IRoom): Record<string, TeamPurseState> => {
  const teams: Record<string, TeamPurseState> = {};
  for (const player of room.players) {
    if (player.teamCode) {
      teams[player.teamCode] = {
        userId: String(player.userId),
        teamCode: player.teamCode,
        purseRemaining: AUCTION_RULES.purseLakhs,
        slotsFilled: 0,
        overseasCount: 0,
        squad: [],
      };
    }
  }
  return teams;
};


export const completeAuction = (state: AuctionState) => {
  state.status = "complete";
  state.currentLot = null;
};

export const prepareNextLot = async (
  state: AuctionState,
): Promise<AuctionState> => {
  const nextPlayerId = state.queue.shift();
  if (!nextPlayerId) {
    completeAuction(state);
    return state;
  }
  const player = await getPlayerSnapshot(state, nextPlayerId);
  state.currentLot = snapshotPlayer(player);
  state.lotIndex += 1;
  return state;
};