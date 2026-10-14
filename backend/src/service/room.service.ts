import { CreateRoomInput, userTokenType } from "../interfaces/common.interface.ts";
import { User } from "../models/user.models.ts";
import { NotFound } from "../errors/notfound.error.ts";
import { generateRoomId } from "../utils/room-id.ts";
import { Room } from "../models/room.models.ts";
import bcrypt from "bcrypt";
import { buildRoomPublicState } from "./room-state.service.ts";

export const roomService = async (
  userInput: CreateRoomInput,
  userTokenDetails: userTokenType,
) => {
  const userdetailsDB = await User.findById(userTokenDetails.id);
  if (!userdetailsDB) {
    throw new NotFound("User not found", [
      {
        field: "User ID",
        message: "User not found in the database",
        issue: `No user found with ID: ${userTokenDetails.id}`,
      },
    ]);
  }
  if (!userInput.maxPlayers || userInput.maxPlayers < 2 || userInput.maxPlayers > 10) {
    throw new NotFound("Invalid maxPlayers value", [
      {
        field: "maxPlayers",
        message: "maxPlayers must be between 2 and 10",
        issue: `Provided maxPlayers value: ${userInput.maxPlayers}`,
      },
    ]);
  }
  if (userInput.isPrivate && !userInput.password) {
    throw new NotFound("Password required for private rooms", [
      {
        field: "password",
        message: "Password is required for private rooms",
        issue: "Private room creation attempted without a password",
      },
    ]);
  }
  if (!userInput.isPrivate && userInput.password) {
    throw new NotFound("Password should not be provided for public rooms", [
      {
        field: "password",
        message: "Password should not be provided for public rooms",
        issue: "Public room creation attempted with a password",
      },
    ]);
  }

  let roomId: string;
  while (true) {
    const candidateRoomId = generateRoomId();
    const existingRoom = await Room.exists({ roomId: candidateRoomId });
    if (!existingRoom) {
      roomId = candidateRoomId;
      break;
    }
  }

  let passwordHash: string | undefined;
  if (userInput.isPrivate && userInput.password) {
    passwordHash = await bcrypt.hash(userInput.password, 10);
  }

  const newRoom = await Room.create({
    roomId,
    name: userInput.name,
    gameType: userInput.gameType,
    isPrivate: userInput.isPrivate,
    passwordHash,
    maxPlayers: userInput.maxPlayers,
    createdBy: userdetailsDB._id,
    players: [
      {
        userId: userdetailsDB._id,
        username: userdetailsDB.username,
        joinedAt: new Date(),
        teamCode: null,
        connected: true,
      },
    ],
  });

  return await buildRoomPublicState(newRoom);
};

export const getRoomDetailsService = async (roomId: string) => {
  const room = await Room.findOne({ roomId: roomId.toUpperCase() });
  if (!room) {
    throw new NotFound("Room not found", [
      {
        field: "roomId",
        message: "Room not found",
        issue: `No room found with ID: ${roomId}`,
      },
    ]);
  }
  return await buildRoomPublicState(room);
};
