import type { Request, Response, NextFunction } from "express";
import { NotFound } from "../errors/notfound.error.ts";
import {
  getRoomDetailsService,
  roomService,
} from "../service/room.service.ts";
import { Room } from "../models/room.models.ts";
import { getSocketServerInstance } from "../socket/socket.ts";


export const roomController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userdetails = req.user;
    if (!userdetails) {
      throw new NotFound("Unauthorized: User details not found", [
        {
          field: "Authorization",
          message: "User details not found",
          issue: "User details are missing in the request",
        },
      ]);
    }

    if (userdetails.role != "user" && userdetails.role != 'admin') {
      throw new NotFound("Unauthorized Invalid Role", [
        { field: "userdetails.role", message: "Invalid role", issue: "Invalid role in the request" }
      ])
    }
    const { name, isPrivate, maxPlayers, password } = req.body;
    // Cricket-only product: default gameType when the client omits it.
    const gameType = req.body.gameType || "cricket";

    if (!name || isPrivate === undefined || !maxPlayers) {
      throw new NotFound("Bad Request: Missing required fields", [
        {
          field: "Request Body",
          message: "Missing required fields",
          issue:
            "One or more required fields are missing in the request body",
        },
      ]);
    }

    const roomServiceResult = await roomService(
      { name, gameType, isPrivate, maxPlayers, password },
      userdetails,
    );
    // Emit the "room:created" event to all connected clients when a new room is created.
   const socketServerIo = getSocketServerInstance();

   if (!roomServiceResult.isPrivate) {
    socketServerIo.emit("room:created", roomServiceResult);
   } 
  return res.status(201).json({
      message: "Room created successfully",
      data: roomServiceResult,
    });
  } catch (err) {
    next(err);
  }
};

export const getRoomController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { roomId } = req.params;
    if (!roomId || typeof roomId !== "string") {
      throw new NotFound("Bad Request: Missing roomId", [
        {
          field: "roomId",
          message: "roomId is required",
          issue: "roomId path parameter is missing",
        },
      ]);
    }

    const room = await getRoomDetailsService(roomId);
    return res.status(200).json({
      message: "Room fetched successfully",
      data: room,
    });
  } catch (err) {
    next(err);
  }
};

export const listRoomsController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const rooms = await Room.find({
      status: { $ne: "finished" },
      isPrivate: false,
    })
      .sort({ createdAt: -1 })
      .select("-passwordHash -auctionState")
      .lean();
    res.json(rooms);
  } catch (error) {
    next(error);
  }
};
