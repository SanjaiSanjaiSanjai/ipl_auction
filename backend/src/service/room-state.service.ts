import { Room, RoomStatus } from "../models/room.models.ts";
import { IRoom, RoomPublicState } from "../interfaces/common.interface.ts";
import { Team } from "../models/team.models.ts";
import { io } from "../server.ts";

export const buildRoomPublicState = async (
  room: IRoom,
): Promise<RoomPublicState> => {
  const claimedTeams: Record<string, string> = {};
  for (const player of room.players) {
    if (player.teamCode) claimedTeams[player.teamCode] = String(player.userId);
  }
  const claimedCodes = new Set(Object.keys(claimedTeams));
  const teams = await Team.find({ isActive: true }).select("code").lean();
  const availableTeams = teams
    .map((team) => team.code)
    .filter((code) => !claimedCodes.has(code));

  return {
    roomId: room.roomId,
    name: room.name,
    gameType: room.gameType,
    isPrivate: room.isPrivate,
    maxPlayers: room.maxPlayers,
    status: room.status,
    createdBy: String(room.createdBy),
    players: room.players.map((p) => ({
      userId: String(p.userId),
      username: p.username,
      joinedAt: p.joinedAt.toISOString(),
      teamCode: p.teamCode ?? null,
      connected: p.connected !== false,
    })),
    claimedTeams,
    availableTeams,
    createdAt: room.createdAt.toISOString(),
    updatedAt: room.updatedAt.toISOString(),
  };
};

export const persistRoomState = async (room: IRoom): Promise<RoomPublicState> => {
  return buildRoomPublicState(room);
};

export const getRoomByRoomId = async (
  roomId: string,
  withPassword = false,
): Promise<IRoom | null> => {
  const query = Room.findOne({ roomId: roomId.toUpperCase() });
  if (withPassword) {
    query.select("+passwordHash");
  }
  return query.exec();
};

export const toRoomResponse = (room: IRoom) => ({
  roomId: room.roomId,
  name: room.name,
  gameType: room.gameType,
  isPrivate: room.isPrivate,
  maxPlayers: room.maxPlayers,
  status: room.status,
  createdBy: room.createdBy,
  players: room.players.map((player) => ({
    userId: player.userId,
    username: player.username,
    joinedAt: player.joinedAt,
    teamCode: player.teamCode ?? null,
    connected: player.connected !== false,
  })),
  soldLots: room.soldLots ?? [],
  auctionState: room.auctionState ?? null,
  createdAt: room.createdAt,
  updatedAt: room.updatedAt,
});


export const updateRoomStatus = async (roomId: string, status: RoomStatus) => {
  try{
    const room = await Room.findOneAndUpdate({roomId},{$set: {status}},{new: true});
    if(!room){
      throw new Error("Room not found");
    }
    // Socket trigger: broadcast a room status change to clients that joined roomId.
    io.to(roomId).emit("ROOM_STATUS_CHANGED",{ roomId: room.roomId, status: room.status });
    return room;
  } catch (error) {
    console.error("Error updating room state:", error);
    throw error;
  }
}