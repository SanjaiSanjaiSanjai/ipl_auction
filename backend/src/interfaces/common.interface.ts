import { Document, Types } from "mongoose";
import { GameType, RoomStatus } from "../models/room.models.ts";

export interface LoginUserdetailsType {
  email: string;
  password: string;
}

export interface SignupUserDetails {
  username: string;
  email: string;
  password: string;
}

export interface ErrorDetails {
  field: string;
  issue: string;
  message: string;
}

export interface AppErrorOption {
  code: string;
  message: string;
  statusCode: number;
  details?: ErrorDetails[];
}

export interface IUser {
  username: string;
  email: string;
  password: string;
  role: "user" | "admin";
  isActive: boolean;
  otp: string;
  otpExpiresAt: Date;
  isOtpVerified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PlayerRole = "batter" | "bowler" | "allrounder" | "wicketkeeper";

export interface ITeam extends Document {
  code: string;
  name: string;
  color?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuctionPlayer extends Document {
  playerCode: string;
  name: string;
  role: PlayerRole;
  nationality: string;
  basePrice: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRoomPlayer {
  userId: Types.ObjectId;
  username: string;
  joinedAt: Date;
  teamCode?: string | null;
  connected: boolean;
}

export interface ISoldLot {
  playerId: string;
  playerName: string;
  role: string;
  nationality: string;
  teamCode: string;
  soldPrice: number;
  buyerUserId: Types.ObjectId;
}

export interface IRoom extends Document {
  roomId: string;
  name: string;
  gameType: GameType;
  isPrivate: boolean;
  passwordHash?: string;
  maxPlayers: number;
  status: RoomStatus;
  createdBy: Types.ObjectId;
  players: IRoomPlayer[];
  soldLots: ISoldLot[];
  auctionState?: AuctionState;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRoomInput {
  name: string;
  gameType: "cricket";
  isPrivate: boolean;
  maxPlayers: number;
  password?: string;
}

export interface userTokenType {
  id: Types.ObjectId;
  username: string;
  email: string;
  role: string;
}

export interface RoomPlayerState {
  userId: string;
  username: string;
  joinedAt: string;
  teamCode: string | null;
  connected: boolean;
}

export interface RoomPublicState {
  roomId: string;
  name: string;
  gameType: string;
  isPrivate: boolean;
  maxPlayers: number;
  status: RoomStatus;
  createdBy: string;
  players: RoomPlayerState[];
  claimedTeams: Record<string, string>;
  availableTeams: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamPurseState {
  userId: string;
  teamCode: string;
  purseRemaining: number;
  slotsFilled: number;
  overseasCount: number;
  squad: Array<{
    playerId: string;
    playerName: string;
    role: string;
    nationality: string;
    soldPrice: number;
  }>;
}

export interface AuctionLotState {
  playerId: string;
  playerName: string;
  role: string;
  nationality: string;
  basePrice: number;
  currentBid: number;
  highestBidderUserId: string | null;
  highestBidderTeamCode: string | null;
  lotEndsAt: number;
  isAccelerated: boolean;
  pass: 1 | 2;
}

export interface AuctionPlayerSnapshot {
  playerId: string;
  playerName: string;
  role: PlayerRole;
  nationality: string;
  basePrice: number;
}

export interface AuctionState {
  status: "running" | "complete";
  lotIndex: number;
  queue: string[];
  acceleratedQueue: string[];
  playerPool: AuctionPlayerSnapshot[];
  currentLot: AuctionLotState | null;
  teams: Record<string, TeamPurseState>;
  sold: Array<{
    playerId: string;
    playerName: string;
    role: string;
    nationality: string;
    teamCode: string;
    soldPrice: number;
    buyerUserId: string;
  }>;
  unsold: string[];
}
