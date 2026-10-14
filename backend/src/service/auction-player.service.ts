import { ValidationError } from "../errors/validation.error.ts";
import { PlayerRole } from "../interfaces/common.interface.ts";
import { AuctionPlayer } from "../models/auction-player.models.ts";

const playerRoles: PlayerRole[] = [
  "batter",
  "bowler",
  "allrounder",
  "wicketkeeper",
];

export interface CreateAuctionPlayerInput {
  playerCode: unknown;
  name: unknown;
  role: unknown;
  nationality: unknown;
  basePrice: unknown;
  isActive?: unknown;
}

export const createAuctionPlayerService = async (
  input: CreateAuctionPlayerInput,
) => {
  const playerCode = String(input.playerCode || "").trim().toUpperCase();
  const name = String(input.name || "").trim();
  const role = String(input.role || "").trim().toLowerCase() as PlayerRole;
  const nationality = String(input.nationality || "").trim();
  const basePrice = Number(input.basePrice);

  if (!playerCode || !name || !nationality || !Number.isFinite(basePrice) || basePrice < 1) {
    throw new ValidationError("Valid player details are required", [
      {
        field: "player",
        issue: "INVALID_PLAYER_DETAILS",
        message: "Player code, name, nationality, and a base price of at least 1 are required.",
      },
    ]);
  }

  if (!playerRoles.includes(role)) {
    throw new ValidationError("Invalid player role", [
      {
        field: "role",
        issue: "INVALID_ROLE",
        message: "Role must be batter, bowler, allrounder, or wicketkeeper.",
      },
    ]);
  }

  const existingPlayer = await AuctionPlayer.findOne({ playerCode });
  if (existingPlayer) {
    throw new ValidationError(`Player with code ${playerCode} already exists`, [
      {
        field: "playerCode",
        issue: "ALREADY_EXISTS",
        message: `Player with code ${playerCode} already exists`,
      },
    ]);
  }

  return AuctionPlayer.create({
    playerCode,
    name,
    role,
    nationality,
    basePrice,
    isActive: input.isActive !== false,
  });
};
